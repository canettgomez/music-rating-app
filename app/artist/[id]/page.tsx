import { getArtistAlbums } from '@/lib/api';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const BASE_LOOKUP = 'https://itunes.apple.com/lookup?id=';

async function getArtistInfo(id: number) {
  const res = await fetch(`${BASE_LOOKUP}${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  return data.results?.find((r: { wrapperType: string }) => r.wrapperType === 'artist') || null;
}

export default async function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artistId = parseInt(id);
  if (isNaN(artistId)) notFound();

  const [artistInfo, albums] = await Promise.all([
    getArtistInfo(artistId),
    getArtistAlbums(artistId),
  ]);

  if (!artistInfo) notFound();

  const fullAlbums = albums.filter((a) => !/-\s*(single|ep)\s*$/i.test(a.collectionName));
  const singles = albums.filter((a) => /-\s*(single|ep)\s*$/i.test(a.collectionName));

  return (
    <main className="min-h-screen p-8 bg-zinc-950 text-white">
      <div className="max-w-5xl mx-auto">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 mb-8">
          <div className="flex items-center gap-6">
            {artistInfo.artworkUrl100 ? (
              <img src={artistInfo.artworkUrl100.replace('100x100bb', '400x400bb')} alt={artistInfo.artistName} className="w-24 h-24 rounded-full border-2 border-zinc-700" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center text-4xl font-bold border-2 border-zinc-700">
                {artistInfo.artistName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-4xl font-bold">{artistInfo.artistName}</h1>
              <p className="text-zinc-400 text-sm mt-1">
                {artistInfo.primaryGenreName || 'Artista'}
                {artistInfo.artistType && <span> • {artistInfo.artistType}</span>}
                <span className="ml-3">{albums.length} álbumes</span>
              </p>
            </div>
          </div>
        </div>

        {fullAlbums.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4">Álbumes</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {fullAlbums.map((album) => (
                <Link key={album.collectionId} href={`/album/${album.collectionId}`} className="group cursor-pointer transition-transform hover:scale-105">
                  <img src={album.artworkUrl100.replace('100x100bb', '400x400bb')} alt={album.collectionName} className="w-full rounded-md shadow-lg" />
                  <div className="mt-2">
                    <p className="font-semibold text-sm truncate text-white">{album.collectionName}</p>
                    <p className="text-zinc-500 text-xs">{album.releaseDate?.slice(0, 4)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {singles.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4">Sencillos y EPs</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {singles.map((album) => (
                <Link key={album.collectionId} href={`/album/${album.collectionId}`} className="group cursor-pointer transition-transform hover:scale-105">
                  <img src={album.artworkUrl100.replace('100x100bb', '400x400bb')} alt={album.collectionName} className="w-full rounded-md shadow-lg opacity-80" />
                  <div className="mt-2">
                    <p className="font-semibold text-sm truncate text-zinc-300">{album.collectionName}</p>
                    <p className="text-zinc-500 text-xs">{album.releaseDate?.slice(0, 4)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
