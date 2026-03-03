// src/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

// AQUÍ DECLARAS TUS ENLACES (Tu "archivo de rutas" visual)
const NAV_LINKS = [
    { name: 'Inicio', href: '/', icon: '🏠' },
    { name: 'Buscar', href: '/search?q=', icon: '🔍' },
    // Agregaremos más después, como "Mi Perfil" o "Favoritos"
];

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <aside className="w-64 bg-zinc-900 border-r border-zinc-800 hidden md:flex flex-col">
            {/* Logo o Título */}
            <div className="h-16 flex items-center px-6 border-b border-zinc-800">
                <Link href="/" className="text-xl font-bold text-white tracking-tight">
                    Letterboxd<span className="text-blue-500">Music</span>
                </Link>
            </div>

            {/* Enlaces de Navegación */}
            <nav className="flex-1 p-4 space-y-2">
                {NAV_LINKS.map((link) => {
                    const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));

                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors font-medium ${isActive
                                ? 'bg-blue-600/10 text-blue-500'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                                }`}
                        >
                            <span>{link.icon}</span>
                            {link.name}
                        </Link>
                    );
                })}

                {/* El enlace del Diario solo se muestra si hay sesión iniciada */}
                {session && (
                    <>
                        <Link
                            href="/to-listen"
                            className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors font-medium ${pathname === '/to-listen'
                                ? 'bg-blue-600/10 text-blue-500'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                                }`}
                        >
                            <span>🎧</span>
                            Por Escuchar
                        </Link>
                        <Link
                            href="/diary"
                            className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors font-medium ${pathname === '/diary'
                                ? 'bg-blue-600/10 text-blue-500'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                                }`}
                        >
                            <span>📖</span>
                            Mi Diario
                        </Link>
                    </>
                )}
            </nav>

            {/* Espacio inferior (puedes poner info del usuario aquí después si quieres) */}
            <div className="p-4 border-t border-zinc-800 text-xs text-zinc-500 text-center">
                © 2026 LC Music
            </div>
        </aside>
    );
}