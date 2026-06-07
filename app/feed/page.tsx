import { prisma } from "@/lib/prisma";
import { lookupAlbums } from "@/lib/api";
import ReviewCard from "@/components/music/ReviewCard";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Link from 'next/link';

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
    const session = await getServerSession(authOptions);
    const resolvedParams = await searchParams;
    const filter = resolvedParams.filter;

    let followedIds: string[] | undefined;
    let currentUserId: string | undefined;

    if (filter === 'siguiendo' && session?.user?.email) {
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { following: { select: { id: true } } },
        });
        if (currentUser) {
            currentUserId = currentUser.id;
            followedIds = currentUser.following.map((u) => u.id);
        }
    }

    const where = filter === 'siguiendo' && followedIds && currentUserId
        ? { userId: { in: [...followedIds, currentUserId] } }
        : undefined;

    const reviews = await prisma.review.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });

    const albumIds = [...new Set(reviews.map((review) => review.albumId))];
    const albumsMap = albumIds.length > 0
        ? await lookupAlbums(albumIds, 'album')
        : new Map();

    return (
        <main className="min-h-screen p-8 bg-zinc-950 text-white">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Actividad reciente</h1>
                    {session && (
                        <div className="flex gap-2 text-sm">
                            <Link
                                href="/feed"
                                className={`px-3 py-1.5 rounded-md transition-colors ${!filter || filter !== 'siguiendo'
                                        ? 'bg-white text-black font-bold'
                                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                    }`}
                            >
                                Todos
                            </Link>
                            <Link
                                href="/feed?filter=siguiendo"
                                className={`px-3 py-1.5 rounded-md transition-colors ${filter === 'siguiendo'
                                        ? 'bg-white text-black font-bold'
                                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                    }`}
                            >
                                Siguiendo
                            </Link>
                        </div>
                    )}
                </div>
                {reviews.length === 0 ? (
                    <p className="text-zinc-500">
                        {filter === 'siguiendo'
                            ? 'No hay actividad de los usuarios que sigues. ¡Sigue a más usuarios para ver su actividad aquí!'
                            : 'Aún no hay reseñas. ¡Sé el primero en reseñar un disco!'}
                    </p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {reviews.map((review) => {
                            const album = albumsMap.get(review.albumId);
                            return (
                                <ReviewCard
                                    key={review.id}
                                    review={{
                                        ...review,
                                        user: { ...review.user, id: review.user.id },
                                        albumId: review.albumId,
                                        albumName: album?.collectionName || 'Disco desconocido',
                                        albumArtist: album?.artistName,
                                        albumImage: album?.artworkUrl100?.replace('100x100bb', '200x200bb'),
                                    }}
                                />
                            )
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
