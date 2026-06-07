'use client';

import { useState } from 'react';
import Link from 'next/link';
import UserAvatar from '@/components/ui/UserAvatar';
import { useRouter } from 'next/navigation';

interface Props {
  users: { id: string; name: string | null; image: string | null }[];
  title: string;
  userId: string;
}

export default function FollowListModal({ users, title, userId }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filtered = search
    ? users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()))
    : users;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => router.push(`/users/${userId}`)}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-md max-h-[70vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">{title} ({users.length})</h2>
          <button onClick={() => router.push(`/users/${userId}`)} className="text-zinc-500 hover:text-white text-lg">✕</button>
        </div>
        <div className="p-4 border-b border-zinc-800">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500" />
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {filtered.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">No se encontraron usuarios.</p>
          ) : (
            filtered.map(u => (
              <Link key={u.id} href={`/users/${u.id}`} onClick={() => router.push(`/users/${u.id}`)}
                className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-zinc-800 transition-colors">
                <UserAvatar name={u.name} image={u.image} id={u.id} size="md" />
                <span className="font-medium text-sm text-white">{u.name}</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
