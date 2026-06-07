import { Album } from '@/types/itunes';

export interface ITunesAlbum {
  wrapperType: string;
  collectionId: number;
  collectionName: string;
  artistId?: number;
  artistName: string;
  artworkUrl100: string;
  releaseDate?: string;
  primaryGenreName?: string;
  trackName?: string;
  trackNumber?: number;
  trackTimeMillis?: number;
}

const BASE_LOOKUP = 'https://itunes.apple.com/lookup?id=';
const BASE_SEARCH = 'https://itunes.apple.com/search?term=';

export interface ITunesArtist {
  wrapperType: string;
  artistId: number;
  artistName: string;
  artistType: string;
  primaryGenreName?: string;
  amgArtistId?: number;
  artworkUrl100?: string;
}

export async function getTopAlbums(limit = 20): Promise<Album[]> {
  try {
    const response = await fetch(
      `https://itunes.apple.com/us/rss/topalbums/limit=${limit}/json`,
      { next: { revalidate: 3600 } }
    );
    if (!response.ok) {
      console.error("Error conectando con Apple:", response.status);
      return [];
    }
    const data = await response.json();
    return data.feed.entry.map((entry: { id: { attributes: { 'im:id': string } }; 'im:name': { label: string }; 'im:artist': { label: string }; 'im:image': { label: string }[] }) => ({
      id: entry.id.attributes['im:id'],
      name: entry['im:name'].label,
      artist: entry['im:artist'].label,
      coverUrl: entry['im:image'][2].label.replace('170x170', '600x600')
    }));
  } catch (error) {
    console.error("Error en getTopAlbums:", error);
    return [];
  }
}

export async function lookupAlbums(ids: string[], entity?: string): Promise<Map<string, ITunesAlbum>> {
  if (ids.length === 0) return new Map();
  try {
    const url = entity
      ? `${BASE_LOOKUP}${ids.join(',')}&entity=${entity}`
      : `${BASE_LOOKUP}${ids.join(',')}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.error("Error en lookup de iTunes:", res.status);
      return new Map();
    }
    const data = await res.json();
    const map = new Map<string, ITunesAlbum>();
    (data.results ?? []).forEach((album: ITunesAlbum) => {
      map.set(album.collectionId.toString(), album);
    });
    return map;
  } catch (error) {
    console.error("Error en lookupAlbums:", error);
    return new Map();
  }
}

export async function lookupAlbumWithTracks(id: string): Promise<{ albumInfo: ITunesAlbum; tracks: ITunesAlbum[] } | null> {
  try {
    const res = await fetch(`${BASE_LOOKUP}${id}&entity=song`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.resultCount === 0) return null;
    const results: ITunesAlbum[] = data.results ?? [];
    const albumInfo = results.find((r) => r.wrapperType === 'collection');
    const tracks = results.filter((r) => r.wrapperType === 'track');
    return albumInfo ? { albumInfo, tracks } : null;
  } catch (error) {
    console.error("Error en lookupAlbumWithTracks:", error);
    return null;
  }
}

export async function searchAlbums(query: string) {
  try {
    const normalizedQuery = query.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const safeQuery = normalizedQuery.replace(/\s+/g, '+');

    const [resAlbum, resAlbumTerm, resArtist, resSongs] = await Promise.all([
      fetch(
        `https://itunes.apple.com/search?term=${safeQuery}&entity=album&explicit=Yes&limit=50`,
        { cache: 'no-store' }
      ),
      fetch(
        `https://itunes.apple.com/search?term=${safeQuery}&entity=album&attribute=albumTerm&explicit=Yes&limit=50`,
        { cache: 'no-store' }
      ),
      fetch(
        `https://itunes.apple.com/search?term=${safeQuery}&entity=musicArtist&limit=1&explicit=Yes`,
        { cache: 'no-store' }
      ),
      fetch(
        `https://itunes.apple.com/search?term=${safeQuery}&entity=song&limit=25&explicit=Yes`,
        { cache: 'no-store' }
      ),
    ]);

    type Source = 'search' | 'song' | 'artist';
    interface Entry { album: ITunesAlbum; score: number; source: Source; releaseYear: number; artistNameLower: string; }
    const results: Entry[] = [];
    const seenKeys = new Set<string>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function addResults(data: any, source: Source) {
      if (!data.results) return;
      for (const album of data.results) {
        if (album.wrapperType !== 'collection' || !album.collectionId || !album.collectionName) continue;

        const normalized = album.collectionName
          .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/\(.*?\)|\[.*?\]/g, '').trim();
        const artistLower = (album.artistName || '').toLowerCase();

        const key = `${artistLower}|${normalized}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);

        results.push({
          album,
          score: 0,
          source,
          releaseYear: parseInt(album.releaseDate?.slice(0, 4)) || 0,
          artistNameLower: artistLower,
        });
      }
    }

    if (resAlbum.ok) { const d = await resAlbum.json(); addResults(d, 'search'); }
    if (resAlbumTerm.ok) { const d = await resAlbumTerm.json(); addResults(d, 'search'); }

    // From song results, extract album IDs and look them up
    if (resSongs.ok) {
      const songData: { results?: { wrapperType: string; collectionId?: number }[] } = await resSongs.json();
      const albumIds = [...new Set(
        (songData.results ?? [])
          .filter((s) => s.wrapperType === 'track' && s.collectionId)
          .map((s) => s.collectionId!.toString())
      )].slice(0, 10);

      if (albumIds.length > 0) {
        const lookupRes = await fetch(
          `https://itunes.apple.com/lookup?id=${albumIds.join(',')}&explicit=Yes`,
          { cache: 'no-store' }
        );
        if (lookupRes.ok) { const d = await lookupRes.json(); addResults(d, 'song'); }
      }
    }

    let artistName = '';
    if (resArtist.ok) {
      const artistData = await resArtist.json();
      const artist = artistData.results?.[0];
      if (artist?.artistId) {
        artistName = (artist.artistName || '').toLowerCase();
        const lookupRes = await fetch(
          `https://itunes.apple.com/lookup?id=${artist.artistId}&entity=album&limit=50&explicit=Yes`,
          { cache: 'no-store' }
        );
        if (lookupRes.ok) { const d = await lookupRes.json(); addResults(d, 'artist'); }
      }
    }

    const queryWords = normalizedQuery.toLowerCase().split(/\s+/);
    const queryStr = queryWords.join(' ');

    for (const entry of results) {
      const name = entry.album.collectionName.toLowerCase();
      const nameClean = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const artist = entry.artistNameLower;
      let score = 0;

      // Priority by source
      if (entry.source === 'artist' && artistName && artist.includes(artistName)) score += 15;
      if (entry.source === 'song') score += 12;

      // Matches
      if (queryWords.some(w => artist.includes(w))) score += 5;
      if (queryWords.some(w => name.includes(w))) score += 3;
      if (name.includes(queryStr) || nameClean.includes(queryStr)) score += 12;

      // Prefer full albums over singles
      if (!/-\s*(single|ep)\s*$/i.test(entry.album.collectionName)) score += 3;
      else score -= 4;

      // Recency bonus
      score += Math.min(entry.releaseYear - 2000, 5) * 0.5;

      // Full albums (not singles) get a bonus
      if (!/-\s*(single|ep)\s*$/i.test(entry.album.collectionName)) score += 3;
      else score -= 4;

      // Recent albums first
      score += Math.min(entry.releaseYear - 2000, 5) * 0.5;

      entry.score = score;
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 30).map(e => e.album);
  } catch (error) {
    console.error("Error en searchAlbums:", error);
    return [];
  }
}

export async function searchArtists(query: string): Promise<ITunesArtist[]> {
  try {
    const normalized = query.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const q = normalized.replace(/\s+/g, '+');
    const res = await fetch(`${BASE_SEARCH}${q}&entity=musicArtist&limit=10&explicit=Yes`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();

    const artists: ITunesArtist[] = (data.results ?? []).filter((a: ITunesArtist) => {
      if (a.wrapperType !== 'artist') return false;
      const name = (a.artistName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const queryLower = normalized.toLowerCase();

      // Exact match (case-insensitive, no accents) always passes
      if (name === queryLower) return true;

      // All query words must appear somewhere in the artist name
      const qWords = queryLower.split(/\s+/);
      if (!qWords.every(w => name.includes(w))) return false;

      // For multi-word queries, the artist name must start or end with the query phrase
      // This filters out "Dead Bad Bunny" and "Bad Bunny Gang" while keeping "Bad Bunny"
      if (qWords.length >= 2) {
        const startsWith = name.startsWith(queryLower);
        const endsWith = name.endsWith(queryLower);
        if (!startsWith && !endsWith) return false;
      }

      return true;
    });

    artists.sort((a, b) => {
      const aName = a.artistName.toLowerCase();
      const bName = b.artistName.toLowerCase();
      const aExact = aName === normalized.toLowerCase() ? 0 : 1;
      const bExact = bName === normalized.toLowerCase() ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      return aName.length - bName.length;
    });

    return artists.slice(0, 5);
  } catch {
    return [];
  }
}

export async function getArtistAlbums(artistId: number): Promise<ITunesAlbum[]> {
  try {
    const res = await fetch(`${BASE_LOOKUP}${artistId}&entity=album&limit=200&explicit=Yes`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).filter((a: ITunesAlbum) => a.wrapperType === 'collection');
  } catch {
    return [];
  }
}
