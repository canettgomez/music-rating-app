'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import UserAvatar from '@/components/ui/UserAvatar';

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="h-10 w-24 bg-zinc-800 rounded animate-pulse"></div>;
  }

  if (session && session.user) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/diary">
          <button className="bg-zinc-800 text-white px-4 py-2 rounded-md text-sm hover:bg-zinc-700 transition-colors">Mi Diario</button>
        </Link>
        <UserAvatar name={session.user.name} image={session.user?.image} id={session.user.id || undefined} size="md" />
        <div className="hidden md:block">
          <p className="text-sm font-bold text-white">{session.user.name}</p>
          <p className="text-xs text-zinc-400">{session.user.email}</p>
        </div>
        <button onClick={() => signOut()} className="bg-zinc-800 text-white px-4 py-2 rounded-md text-sm hover:bg-zinc-700 transition-colors">Salir</button>
      </div>
    );
  }

  return (
    <Link href="/login" className="bg-white text-black px-6 py-2 rounded-md text-sm font-bold hover:bg-zinc-200 transition-colors">Iniciar sesión</Link>
  );
}
