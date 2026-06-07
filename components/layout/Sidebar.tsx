'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { HomeIcon, FeedIcon, UserIcon, ListIcon } from '@/components/ui/Icons';

const NAV_LINKS = [
    { name: 'Inicio', href: '/', icon: HomeIcon },
    { name: 'Feed', href: '/feed', icon: FeedIcon },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    return (
        <aside className="w-64 bg-zinc-900 border-r border-zinc-800 hidden md:flex flex-col">
            <div className="h-16 flex items-center px-6 border-b border-zinc-800">
                <Link href="/" className="text-xl font-bold text-white tracking-tight">
                    Letterboxd<span className="text-blue-500">Music</span>
                </Link>
            </div>
            <nav className="flex-1 p-4 space-y-1">
                {NAV_LINKS.map((link) => {
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors font-medium ${isActive(link.href)
                                    ? 'bg-blue-600/10 text-blue-500'
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                                }`}
                        >
                            <Icon />
                            {link.name}
                        </Link>
                    );
                })}
                {session && (
                    <>
                        <Link href={`/users/${session.user.id}`}
                            className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors font-medium ${pathname.startsWith('/users/') && !pathname.includes('tab=list')
                                    ? 'bg-blue-600/10 text-blue-500'
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                                }`}>
                            <UserIcon />
                            Mi Perfil
                        </Link>
                        <Link href="/lists"
                            className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors font-medium ${pathname.startsWith('/lists')
                                    ? 'bg-blue-600/10 text-blue-500'
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                                }`}>
                            <ListIcon />
                            Listas
                        </Link>
                    </>
                )}
            </nav>
            <div className="p-4 border-t border-zinc-800 text-xs text-zinc-500 text-center">
                © 2026 LC Music
            </div>
        </aside>
    );
}
