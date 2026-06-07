import { prisma } from '@/lib/prisma';
import { lookupAlbumWithTracks } from '@/lib/api';
import StarRating from '@/components/music/StarRating';
import ToListenButton from '@/components/music/ToListenButton';
import AddToPlaylistButton from '@/components/music/AddToPlaylistButton';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import ReviewCard from '@/components/music/ReviewCard';

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const session = await getServerSession(authOptions);
    let isSavedToListen = false;
    let initialRating = 0;
    let initialText = '';
    let initialListenedAt: Date | undefined;

    const data = await lookupAlbumWithTracks(id);

    const reviews = await prisma.review.findMany({
        where: { albumId: id },
        include: { user: true },
        orderBy: { createdAt: 'desc' }
    });

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1)
        : '0.0';

    if (!data || !data.albumInfo) {
        return <main className="min-h-screen p-8 bg-zinc-950 text-white flex items-center justify-center"><h1>Disco no encontrado.</h1></main>;
    }

    const { albumInfo, tracks } = data;
    const coverUrl = albumInfo.artworkUrl100.replace('100x100bb', '600x600bb');

    if (session?.user?.email) {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (user) {
            const savedAlbum = await prisma.toListen.findUnique({
                where: { userId_albumId: { userId: user.id, albumId: id } }
            });
            isSavedToListen = !!savedAlbum;

            const myReview = await prisma.review.findFirst({
                where: { userId: user.id, albumId: id }
            });

            if (myReview) {
                initialRating = myReview.rating;
                initialText = myReview.text || '';
                initialListenedAt = myReview.listenedAt;
            }
        }
    }

    return (
        <main className="min-h-screen p-8 bg-zinc-950 text-white">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[300px_1fr] gap-10">

                {/* Columna Izquierda */}
                <section>
                    <img src={coverUrl} alt={albumInfo.collectionName} className="w-full rounded-md shadow-2xl mb-6" />

                    {/* Promedio General */}
                    <div className="mb-6 text-center">
                        <span className="text-5xl font-bold text-white">{averageRating}</span>
                        <span className="text-zinc-500 text-xl"> / 5</span>
                        <p className="text-zinc-500 text-sm mt-1">Basado en {reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'}</p>
                    </div>

                    <StarRating
                        albumId={albumInfo.collectionId.toString()}
                        initialRating={initialRating}
                        initialText={initialText}
                        initialListenedAt={initialListenedAt}
                    />
                </section>

                {/* Columna Derecha */}
                <section>
                    <h1 className="text-4xl font-bold mb-2">{albumInfo.collectionName}</h1>
                    <h2 className="text-xl text-zinc-400 mb-6">
                        {albumInfo.artistId ? (
                            <Link href={`/artist/${albumInfo.artistId}`} className="hover:text-blue-400 transition-colors">
                                {albumInfo.artistName}
                            </Link>
                        ) : albumInfo.artistName}
                        {albumInfo.primaryGenreName && <span> • {albumInfo.primaryGenreName}</span>}
                    </h2>

                    <div className="mb-10 flex gap-3">
                        <ToListenButton albumId={id} initialIsSaved={isSavedToListen} />
                        <AddToPlaylistButton albumId={id} />
                    </div>

                    <h3 className="text-lg font-semibold mb-4 border-b border-zinc-800 pb-2">Lista de Canciones</h3>
                    <ul className="space-y-2 mb-10">
                        {tracks.map((track) => {
                            const minutes = Math.floor((track.trackTimeMillis || 0) / 60000);
                            const seconds = ((track.trackTimeMillis || 0) % 60000 / 1000).toFixed(0);
                            return (
                                <li key={track.trackName} className="flex justify-between text-zinc-300 text-sm hover:bg-zinc-900 p-2 rounded">
                                    <span><span className="text-zinc-600 mr-4">{track.trackNumber}</span>{track.trackName}</span>
                                    <span className="text-zinc-500">{minutes}:{parseInt(seconds) < 10 ? '0' : ''}{seconds}</span>
                                </li>
                            );
                        })}
                    </ul>

                    {/* Sección de Reseñas de la Comunidad */}
                    <h3 className="text-lg font-semibold mb-4 border-b border-zinc-800 pb-2">Reseñas de la comunidad</h3>
                    {reviews.length === 0 ? (
                        <p className="text-zinc-500 text-sm">Sé el primero en reseñar este disco.</p>
                    ) : (
                        <div className="space-y-4">
                            {reviews.map((review) => (
                                <ReviewCard key={review.id} review={review} />
                            ))}
                        </div>
                    )}
                </section>

            </div>
        </main>
    );
}