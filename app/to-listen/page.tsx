// src/app/to-listen/page.tsx
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function ToListenPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return (
            <main className="min-h-screen p-8 bg-zinc-950 text-white flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold mb-4">Por Escuchar 🎧</h1>
                <p className="text-zinc-400">Debes iniciar sesión para ver tu lista.</p>
                <Link href="/login" className="mt-4 text-blue-400 hover:text-blue-300">Ir a iniciar sesión</Link>
            </main>
        );
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user) return null;

    // Traemos tu lista, ordenada por los guardados más recientemente
    const savedItems = await prisma.toListen.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
    });

    if (savedItems.length === 0) {
        return (
            <main className="min-h-screen p-8 bg-zinc-950 text-white">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-3xl font-bold mb-8">Por Escuchar 🎧</h1>
                    <p className="text-zinc-400">Tu lista está vacía. ¡Ve a buscar algunos discos que te interesen!</p>
                    <Link href="/" className="inline-block mt-4 bg-zinc-800 px-4 py-2 rounded text-sm hover:bg-zinc-700">Explorar discos</Link>
                </div>
            </main>
        );
    }

    // Extraemos los IDs y buscamos los discos en Apple Music
    const albumIds = savedItems.map((item) => item.albumId).join(',');
    const res = await fetch(`https://itunes.apple.com/lookup?id=${albumIds}`, { cache: 'no-store' });
    const data = await res.json();

    const albumsMap = new Map();
    data.results?.forEach((album: any) => {
        albumsMap.set(album.collectionId.toString(), album);
    });

    return (
        <main className="min-h-screen p-8 bg-zinc-950 text-white">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Por Escuchar 🎧</h1>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {savedItems.map((item) => {
                        const album = albumsMap.get(item.albumId);
                        if (!album) return null;

                        return (
                            <Link href={`/album/${item.albumId}`} key={item.id}>
                                <div className="relative group cursor-pointer transition-transform hover:scale-105">
                                    <img
                                        src={album.artworkUrl100.replace('100x100bb', '400x400bb')}
                                        alt={album.collectionName}
                                        className="w-full rounded-md shadow-lg border border-zinc-800"
                                    />
                                    <div className="mt-2">
                                        <p className="font-semibold text-sm truncate text-white">{album.collectionName}</p>
                                        <p className="text-zinc-400 text-xs truncate">{album.artistName}</p>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}