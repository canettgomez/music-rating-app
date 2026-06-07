'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { addToPlaylist, createPlaylist, getMyPlaylists } from '@/actions/playlist';

interface PlaylistInfo { id: string; name: string; _count: { albums: number } }

export default function AddToPlaylistButton({ albumId }: { albumId: string }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [msg, setMsg] = useState('');

  if (!session) return null;

  const handleOpen = async () => {
    setMsg('');
    const lists = await getMyPlaylists();
    setPlaylists(lists as PlaylistInfo[]);
    setOpen(true);
  };

  const handleAdd = async (playlistId: string) => {
    setLoading(true); setMsg('');
    const result = await addToPlaylist(playlistId, albumId);
    setMsg(result.success ? '✓ Agregado' : result.error || 'Error');
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    const result = await createPlaylist(newName.trim());
    if (result.success && result.playlist) {
      await addToPlaylist(result.playlist.id, albumId);
      setPlaylists(prev => [...prev, { id: result.playlist.id, name: result.playlist.name, _count: { albums: 1 } }]);
      setNewName('');
      setMsg('✓ Creada y agregado');
    } else {
      setMsg(result.error || 'Error');
    }
    setLoading(false);
  };

  if (!open) {
    return <button onClick={handleOpen} className="bg-zinc-800 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-zinc-700 transition-colors">+ Agregar a lista</button>;
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-md p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-white">Agregar a lista</p>
        <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white text-sm">✕</button>
      </div>
      {playlists.length > 0 && (
        <div className="flex flex-col gap-1 mb-3">
          {playlists.map(p => (
            <button key={p.id} onClick={() => handleAdd(p.id)} disabled={loading}
              className="text-left text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 px-3 py-2 rounded transition-colors">
              {p.name} <span className="text-zinc-500">({p._count.albums})</span>
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nueva lista..."
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-zinc-500" />
        <button onClick={handleCreate} disabled={loading || !newName.trim()}
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">Crear</button>
      </div>
      {msg && <p className="text-xs text-zinc-400 mt-2">{msg}</p>}
    </div>
  );
}
