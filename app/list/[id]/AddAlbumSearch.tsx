'use client';

import { useState } from 'react';
import { addToPlaylist } from '@/actions/playlist';

interface SearchResult {
  collectionId: number;
  collectionName: string;
  artistName: string;
  artworkUrl100: string;
}

export default function AddAlbumSearch({ playlistId }: { playlistId: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setMsg('');
    try {
      const q = query.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '+');
      const res = await fetch(`https://itunes.apple.com/search?term=${q}&entity=album&limit=10&explicit=Yes`);
      const data = await res.json();
      setResults((data.results ?? []).filter((r: { wrapperType: string }) => r.wrapperType === 'collection'));
    } catch { setResults([]); }
    setLoading(false);
  };

  const handleAdd = async (albumId: number) => {
    setMsg('');
    const result = await addToPlaylist(playlistId, albumId.toString());
    if (result.success) {
      setQuery('');
      setResults([]);
      setSearched(false);
    } else {
      setMsg(result.error || 'Error');
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-md p-4 mb-8">
      <form onSubmit={handleSearch} className="flex gap-2 mb-3">
        <input value={query} onChange={e => { setQuery(e.target.value); if (!e.target.value) { setResults([]); setSearched(false); } }}
          placeholder="Buscar álbum para agregar..."
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500" />
        <button type="submit" disabled={loading || !query.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
          {loading ? '...' : 'Buscar'}
        </button>
        {searched && <button type="button" onClick={() => { setQuery(''); setResults([]); setSearched(false); }}
          className="text-zinc-500 hover:text-white px-2 text-sm">✕</button>}
      </form>

      {msg && <p className="text-sm text-zinc-400 mb-2">{msg}</p>}

      {searched && results.length === 0 && !loading && (
        <p className="text-sm text-zinc-500">No se encontraron resultados.</p>
      )}

      {results.length > 0 && (
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {results.map(album => (
            <div key={album.collectionId}
              className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded p-2 hover:bg-zinc-800 transition-colors">
              <img src={album.artworkUrl100?.replace('100x100bb', '200x200bb') || ''}
                alt={album.collectionName} className="w-10 h-10 rounded shadow-sm shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate font-medium">{album.collectionName}</p>
                <p className="text-xs text-zinc-500 truncate">{album.artistName}</p>
              </div>
              <button onClick={() => handleAdd(album.collectionId)}
                className="text-xs bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded hover:bg-blue-600 hover:text-white transition-colors shrink-0">
                + Agregar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
