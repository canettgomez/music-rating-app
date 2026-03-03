// src/app/search/page.tsx
import Link from 'next/link';
import SearchBar from '../../components/music/SearchBar';
import { prisma } from '@/lib/prisma';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q: string }> }) {
    const resolvedParams = await searchParams;
    const query = resolvedParams.q;

    const safeQuery = encodeURIComponent(query.trim());

    // Buscamos por álbum directamente — iTunes ya ordena por relevancia/popularidad,
    // así el oficial aparece primero naturalmente.
    const albumRes = await fetch(
        `https://itunes.apple.com/search?term=${safeQuery}&entity=album&attribute=albumTerm&media=music&limit=50`,
        { cache: 'no-store' }
    );
    const albumData = await albumRes.json();

    // Deduplicamos por nombre normalizado: para cada nombre único nos quedamos
    // solo con el primero que devuelve iTunes (el más popular / el oficial).
    const seenNames = new Set<string>();
    const albums = (albumData.results ?? []).filter((album: any) => {
        if (!album.collectionId || !album.collectionName) return false;
        const normalized = album.collectionName
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // sin acentos
            .replace(/\(.*?\)|\[.*?\]/g, '')                     // sin (Deluxe), [feat. X], etc.
            .trim();
        if (seenNames.has(normalized)) return false;
        seenNames.add(normalized);
        return true;
    });

    // Calificaciones de tu base de datos
    const groupedReviews = await prisma.review.groupBy({
        by: ['albumId'],
        _avg: { rating: true },
    });

    const ratingsMap = groupedReviews.reduce((acc, review) => {
        if (review._avg.rating) acc[review.albumId] = review._avg.rating;
        return acc;
    }, {} as Record<string, number>);

    return (
        <main className="min-h-screen p-8 bg-zinc-950 text-white">
            <div className="max-w-5xl mx-auto">
                <Link href="/" className="text-zinc-500 hover:text-white text-sm mb-4 inline-block">
                    ← Volver al inicio
                </Link>

                <SearchBar />

                <h1 className="text-2xl font-bold mb-6">Resultados para: "{query}"</h1>

                {albums.length === 0 ? (
                    <p className="text-zinc-400">No se encontraron discos para esta búsqueda.</p>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {albums.map((album: any) => {
                            const albumIdString = album.collectionId.toString();
                            const averageRating = ratingsMap[albumIdString];

                            return (
                                <Link href={`/album/${album.collectionId}`} key={album.collectionId}>
                                    <div className="relative group cursor-pointer transition-transform hover:scale-105">
                                        <img
                                            src={album.artworkUrl100.replace('100x100bb', '400x400bb')}
                                            alt={album.collectionName}
                                            className="w-full rounded-md shadow-lg"
                                        />

                                        {averageRating && (
                                            <div className="absolute bottom-2 right-2 bg-black/80 text-yellow-400 px-2 py-1 rounded text-xs font-bold">
                                                ⭐ {averageRating.toFixed(1)}
                                            </div>
                                        )}

                                        <div className="mt-2">
                                            <p className="font-semibold text-sm truncate">{album.collectionName}</p>
                                            <p className="text-zinc-400 text-xs truncate">{album.artistName}</p>
                                        </div>
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