import { prisma } from '@/lib/prisma';
import { lookupAlbums } from '@/lib/api';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import CreateListButton from './CreateListButton';

export default async function ListsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) redirect('/login');

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) redirect('/');

    const playlists = await prisma.playlist.findMany({
        where: { userId: user.id },
        include: {
            _count: { select: { albums: true } },
            albums: { take: 4, orderBy: { order: 'asc' }, select: { albumId: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    const allAlbumIds = [...new Set(playlists.flatMap(p => p.albums.map(a => a.albumId)))];
    const albumsMap = await lookupAlbums(allAlbumIds);

    return (
        <main className="min-h-screen p-8 bg-zinc-950 text-white">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">Mis Listas</h1>
                    <CreateListButton />
                </div>

                {playlists.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-zinc-500 mb-4">No tienes listas aún.</p>
                        <p className="text-sm text-zinc-600">Crea una lista o agrega álbumes desde la página de cada disco.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {playlists.map((list) => {
                            const coverAlbums = list.albums.map(a => albumsMap.get(a.albumId)).filter(Boolean);
                            return (
                                <Link key={list.id} href={`/list/${list.id}`}
                                    className="bg-zinc-900/50 border border-zinc-800/50 rounded-md p-4 hover:bg-zinc-800 transition-colors group flex gap-4">
                                    <div className="grid grid-cols-2 gap-0.5 rounded-md overflow-hidden w-28 h-28 shrink-0">
                                        {[0, 1, 2, 3].map(pos => {
                                            const fillOrder = [0, 3, 2, 1];
                                            const idx = fillOrder[pos];
                                            const album = idx < coverAlbums.length ? coverAlbums[idx] : null;
                                            return (
                                                <div key={pos} className="bg-zinc-800">
                                                    {album?.artworkUrl100 ? (
                                                        <img src={album.artworkUrl100.replace('100x100bb', '200x200bb')}
                                                            alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-zinc-800" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors truncate">{list.name}</h3>
                                            {!list.isPublic && <span className="text-[10px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded shrink-0">Privada</span>}
                                        </div>
                                        {list.description && <p className="text-sm text-zinc-400 mb-2 line-clamp-2">{list.description}</p>}
                                        <p className="text-xs text-zinc-500">{list._count.albums} álbumes</p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
