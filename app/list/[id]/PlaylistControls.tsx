'use client';

import { togglePlaylistVisibility } from '@/actions/playlist';
import { useState } from 'react';

export default function PlaylistControls({ playlistId, isPublic }: { playlistId: string; isPublic: boolean }) {
  const [visibility, setVisibility] = useState(isPublic);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    const result = await togglePlaylistVisibility(playlistId);
    if (result.success && result.isPublic !== undefined) setVisibility(result.isPublic);
    setLoading(false);
  };

  return (
    <button onClick={handleToggle} disabled={loading}
      className={`text-sm px-3 py-1.5 rounded-md transition-colors ${visibility ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
      {loading ? '...' : visibility ? 'Hacer privada' : 'Hacer pública'}
    </button>
  );
}
