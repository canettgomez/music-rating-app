import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { lookupAlbums } from '@/lib/api';
import UserAvatar from '@/components/ui/UserAvatar';
import FollowButton from '@/components/user/FollowButton';
import FollowListModal from './FollowListModal';
import Link from 'next/link';
import { notFound } from 'next/navigation';

function formatDateShort(date: Date): string {
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
}
function formatDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
}

const TABS = [
    { key: 'reviews', label: 'Reseñas' },
    { key: 'to-listen', label: 'Por Escuchar' },
    { key: 'diary', label: 'Diario' },
] as const;

export default async function UserProfilePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; show?: string }> }) {
    const { id } = await params;
    const { tab, show } = await searchParams;
    const activeTab = tab || 'reviews';

    const session = await getServerSession(authOptions);
    const currentUser = session?.user?.email
        ? await prisma.user.findUnique({ where: { email: session.user.email } })
        : null;
    const isOwnProfile = currentUser?.id === id;

    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            followers: { select: { id: true, name: true, image: true } },
            following: { select: { id: true, name: true, image: true } },
        },
    });
    if (!user) notFound();

    const isFollowing = currentUser ? user.followers.some((f) => f.id === currentUser.id) : false;

    return (
        <main className="min-h-screen p-8 bg-zinc-950 text-white">
            <div className="max-w-4xl mx-auto">
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 mb-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-6">
                            <UserAvatar name={user.name} image={user.image} id={user.id} size="lg" />
                            <div>
                                <h1 className="text-3xl font-bold">{user.name || 'Usuario'}</h1>
                                <div className="flex items-center gap-4 mt-2 text-zinc-400 text-sm">
                                    <Link href={`/users/${id}?show=following`} scroll={false}
                                        className="hover:text-white transition-colors cursor-pointer">
                                        <strong className="text-white">{user.following.length}</strong> siguiendo
                                    </Link>
                                    <span>·</span>
                                    <Link href={`/users/${id}?show=followers`} scroll={false}
                                        className="hover:text-white transition-colors cursor-pointer">
                                        <strong className="text-white">{user.followers.length}</strong> seguidores
                                    </Link>
                                </div>
                            </div>
                        </div>
                        {!isOwnProfile && <FollowButton targetUserId={id} initialIsFollowing={isFollowing} />}
                    </div>
                </div>

                {show === 'followers' && (
                    <FollowListModal users={user.followers} title="Seguidores" userId={id} />
                )}
                {show === 'following' && (
                    <FollowListModal users={user.following} title="Siguiendo" userId={id} />
                )}

                <div className="flex gap-1 mb-6 border-b border-zinc-800">
                    {TABS.map((t) => {
                        const isActive = activeTab === t.key;
                        const href = t.key === 'reviews' ? `/users/${id}` : `/users/${id}?tab=${t.key}`;
                        return (
                            <Link key={t.key} href={href}
                                className={`px-5 py-3 text-sm font-medium rounded-t-md transition-colors ${isActive ? 'bg-zinc-900 text-white border-b-2 border-blue-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
                                {t.label}
                            </Link>
                        );
                    })}
                </div>

                {activeTab === 'reviews' && <ReviewsTab userId={id} />}
                {activeTab === 'to-listen' && <ToListenTab userId={id} isOwnProfile={isOwnProfile} />}
                {activeTab === 'diary' && <DiaryTab userId={id} isOwnProfile={isOwnProfile} />}
            </div>
        </main>
    );
}

async function ReviewsTab({ userId }: { userId: string }) {
    const reviews = await prisma.review.findMany({
        where: { userId }, orderBy: { createdAt: 'desc' },
    });
    const albumsMap = await lookupAlbums([...new Set(reviews.map((r) => r.albumId))]);
    if (reviews.length === 0) return <p className="text-zinc-500">Este usuario aún no ha reseñado ningún disco.</p>;
    return (
        <div className="space-y-4">
            {reviews.map((review) => {
                const album = albumsMap.get(review.albumId);
                const date = new Date(review.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
                return (
                    <Link key={review.id} href={`/album/${review.albumId}`}>
                        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-md p-4 flex gap-4 hover:bg-zinc-800 transition-colors group">
                            {album && <img src={album.artworkUrl100.replace('100x100bb', '200x200bb')} alt={album.collectionName} className="w-16 h-16 rounded shadow-md shrink-0" />}
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="font-semibold text-sm text-white">{album?.collectionName || 'Disco desconocido'}</p>
                                    <span className="text-yellow-400 text-sm tracking-widest">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                                </div>
                                <p className="text-xs text-zinc-500 mb-2">{album?.artistName} • {date}</p>
                                {review.text && <p className="text-sm text-zinc-300 italic border-l-2 border-zinc-700 pl-3">&quot;{review.text}&quot;</p>}
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}

async function ToListenTab({ userId, isOwnProfile }: { userId: string; isOwnProfile: boolean }) {
    const savedItems = await prisma.toListen.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    const albumsMap = await lookupAlbums(savedItems.map((item) => item.albumId));
    if (savedItems.length === 0) return <p className="text-zinc-500">{isOwnProfile ? 'Tu lista está vacía.' : 'Este usuario no tiene discos guardados.'}</p>;
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {savedItems.map((item) => {
                const album = albumsMap.get(item.albumId);
                if (!album) return null;
                return (
                    <Link key={item.id} href={`/album/${item.albumId}`} className="group cursor-pointer transition-transform hover:scale-105">
                        <img src={album.artworkUrl100.replace('100x100bb', '400x400bb')} alt={album.collectionName} className="w-full rounded-md shadow-lg border border-zinc-800" />
                        <div className="mt-2">
                            <p className="font-semibold text-sm truncate text-white">{album.collectionName}</p>
                            <p className="text-zinc-400 text-xs truncate">{album.artistName}</p>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}

async function DiaryTab({ userId, isOwnProfile }: { userId: string; isOwnProfile: boolean }) {
    const reviews = await prisma.review.findMany({ where: { userId }, orderBy: { listenedAt: 'desc' } });
    if (reviews.length === 0) return <p className="text-zinc-500">{isOwnProfile ? 'Aún no has registrado ningún disco.' : 'Este usuario no tiene entradas en su diario.'}</p>;
    const albumsMap = await lookupAlbums([...new Set(reviews.map((r) => r.albumId))]);
    const grouped = reviews.reduce((groups, review) => {
        const key = formatDateKey(review.listenedAt);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(review);
        return groups;
    }, new Map<string, typeof reviews>());
    return (
        <div className="flex flex-col gap-8">
            {Array.from(grouped.entries()).map(([dateKey, dayReviews]) => (
                <div key={dateKey}>
                    <h2 className="text-lg font-semibold text-zinc-300 mb-4 border-b border-zinc-800 pb-2">
                        {formatDateShort(dayReviews[0].listenedAt)}
                        <span className="text-zinc-500 text-sm font-normal ml-2">({dayReviews.length} {dayReviews.length === 1 ? 'disco' : 'discos'})</span>
                    </h2>
                    <div className="flex flex-col gap-4">
                        {dayReviews.map((review) => {
                            const album = albumsMap.get(review.albumId);
                            if (!album) return null;
                            return (
                                <Link key={review.id} href={`/album/${review.albumId}`}>
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-md p-4 flex gap-6 hover:bg-zinc-800 transition-colors group cursor-pointer">
                                        <img src={album.artworkUrl100.replace('100x100bb', '200x200bb')} alt={album.collectionName} className="w-24 h-24 rounded shadow-md shrink-0" />
                                        <div className="flex-1 flex flex-col justify-center">
                                            <h2 className="text-xl font-bold text-white mb-1">{album.collectionName}</h2>
                                            <p className="text-sm text-zinc-400 mb-2">{album.artistName}</p>
                                            <span className="text-yellow-400 text-sm tracking-widest">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                                            {review.text && <p className="text-sm text-zinc-300 mt-3 italic border-l-2 border-zinc-700 pl-3">&quot;{review.text}&quot;</p>}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
