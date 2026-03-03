import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function DiaryPage() {
    // 1. Verificamos quién está logueado
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return (
            <main className="min-h-screen p-8 bg-zinc-950 text-white flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold mb-4">Tu Diario Musical</h1>
                <p className="text-zinc-400">Debes iniciar sesión para ver tu diario.</p>
                <Link href="/" className="mt-4 text-blue-400 hover:text-blue-300">← Volver al inicio</Link>
            </main>
        );
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user) return null;

    // 2. Traemos todas TUS reseñas, ordenadas de la más reciente a la más antigua
    const reviews = await prisma.review.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
    });

    if (reviews.length === 0) {
        return (
            <main className="min-h-screen p-8 bg-zinc-950 text-white">
                <div className="max-w-3xl mx-auto">
                    <Link href="/" className="text-zinc-500 hover:text-white text-sm mb-6 inline-block">← Volver al inicio</Link>
                    <h1 className="text-3xl font-bold mb-8">Mi Diario Musical 📖</h1>
                    <p className="text-zinc-400">Aún no has registrado ningún disco. ¡Ve a buscar algunos!</p>
                </div>
            </main>
        );
    }

    // 3. Extraemos los IDs de los discos y los buscamos TODOS a la vez en Apple Music
    // Esto crea un texto tipo: "12345,67890,112233"
    const albumIds = [...new Set(reviews.map((r) => r.albumId))].join(',');
    const res = await fetch(`https://itunes.apple.com/lookup?id=${albumIds}`, { cache: 'no-store' });
    const data = await res.json();

    // Convertimos la respuesta de Apple en un diccionario para buscar rápido por ID
    const albumsMap = new Map();
    data.results?.forEach((album: any) => {
        albumsMap.set(album.collectionId.toString(), album);
    });

    return (
        <main className="min-h-screen p-8 bg-zinc-950 text-white">
            <div className="max-w-4xl mx-auto">

                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Mi Diario Musical 📖</h1>
                    <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
                        ← Volver al inicio
                    </Link>
                </div>

                {/* Lista del diario */}
                <div className="flex flex-col gap-4">
                    {reviews.map((review) => {
                        const album = albumsMap.get(review.albumId);
                        if (!album) return null;

                        // Formateamos la fecha para que se vea bonita (ej: 2 de marzo de 2026)
                        const date = new Date(review.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });

                        return (
                            <Link href={`/album/${review.albumId}`} key={review.id}>
                                <div className="bg-zinc-900 border border-zinc-800 rounded-md p-4 flex flex-col md:flex-row gap-6 hover:bg-zinc-800 transition-colors group cursor-pointer">

                                    {/* Portada del disco */}
                                    <img
                                        src={album.artworkUrl100.replace('100x100bb', '200x200bb')}
                                        alt={album.collectionName}
                                        className="w-24 h-24 rounded shadow-md md:group-hover:scale-105 transition-transform shrink-0"
                                    />

                                    {/* Detalles de la entrada del diario */}
                                    <div className="flex-1 flex flex-col justify-center">
                                        <h2 className="text-xl font-bold text-white mb-1">{album.collectionName}</h2>
                                        <p className="text-sm text-zinc-400 mb-2">{album.artistName}</p>

                                        <div className="flex items-center gap-3">
                                            <span className="text-yellow-400 text-sm tracking-widest">
                                                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                            </span>
                                            <span className="text-xs text-zinc-500">• Escuchado el {date}</span>
                                        </div>

                                        {/* Si escribiste reseña, la mostramos */}
                                        {review.text && (
                                            <p className="text-sm text-zinc-300 mt-3 italic border-l-2 border-zinc-700 pl-3">
                                                "{review.text}"
                                            </p>
                                        )}
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