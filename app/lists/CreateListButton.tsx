'use client';

import { useState } from 'react';
import { createPlaylist } from '@/actions/playlist';
import { useRouter } from 'next/navigation';

export default function CreateListButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    const result = await createPlaylist(name.trim(), description.trim() || undefined, isPublic);
    if (result.success && result.playlist) {
      router.push(`/list/${result.playlist.id}`);
      router.refresh();
    } else {
      setError(result.error || 'Error al crear');
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-blue-700 transition-colors">
        + Nueva lista
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setOpen(false)}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-white">Nueva lista</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Nombre</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Descripción (opcional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-zinc-500" />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)}
              className="accent-blue-500" />
            Lista pública
          </label>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Cancelar</button>
            <button type="submit" disabled={loading || !name.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Creando...' : 'Crear lista'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
