import Link from 'next/link';
import { searchAlbums, searchArtists, ITunesAlbum, ITunesArtist } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import UserAvatar from '@/components/ui/UserAvatar';
import SearchBar from '../components/music/SearchBar';

const ITUNES_TOP_ALBUMS_URL = 'https://itunes.apple.com/us/rss/topalbums/limit=20/json';

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
    const resolvedParams = await searchParams;
    const query = resolvedParams.q;

    if (query) {
        const [albums, artists, users] = await Promise.all([
            searchAlbums(query),
            searchArtists(query),
            prisma.user.findMany({
                where: { name: { contains: query } },
                select: { id: true, name: true, image: true, _count: { select: { reviews: true } } },
            }),
        ]);

        const totalResults = albums.length + artists.length + users.length;

        return (
            <main className="min-h-screen p-8 bg-zinc-950 text-white">
                <div className="max-w-5xl mx-auto">
                    <div className="max-w-xl mx-auto mb-10">
                        <SearchBar />
                    </div>

                    <p className="text-zinc-400 text-sm mb-8 text-center">
                        Resultados para &quot;{query}&quot;
                        <span className="text-zinc-600 ml-2">({totalResults} resultados)</span>
                    </p>

                    {artists.length > 0 && (
                        <section className="mb-10">
                            <h2 className="text-lg font-semibold mb-3 text-zinc-300">Artistas</h2>
                            <div className="flex flex-wrap gap-2">
                                {artists.map((artist) => (
                                    <Link key={artist.artistId} href={`/artist/${artist.artistId}`}
                                        className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800/50 rounded-full px-4 py-2 hover:bg-zinc-800 transition-colors">
                                        {artist.artworkUrl100 ? (
                                            <img src={artist.artworkUrl100.replace('100x100bb', '200x200bb')} alt={artist.artistName} className="w-8 h-8 rounded-full border border-zinc-700" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold border border-zinc-700">
                                                {artist.artistName.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-medium">{artist.artistName}</p>
                                            {artist.primaryGenreName && <p className="text-xs text-zinc-500">{artist.primaryGenreName}</p>}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {users.length > 0 && (
                        <section className="mb-10">
                            <h2 className="text-lg font-semibold mb-3 text-zinc-300">Usuarios</h2>
                            <div className="flex flex-wrap gap-2">
                                {users.map((user) => (
                                    <Link key={user.id} href={`/users/${user.id}`}
                                        className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800/50 rounded-full px-4 py-2 hover:bg-zinc-800 transition-colors">
                                        <UserAvatar name={user.name} image={user.image} id={user.id} size="sm" />
                                        <span className="text-sm font-medium">{user.name}</span>
                                        <span className="text-xs text-zinc-500">{user._count.reviews} reseñas</span>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {albums.length > 0 && (
                        <section>
                            <h2 className="text-lg font-semibold mb-3 text-zinc-300">Álbumes</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {albums.map((album: ITunesAlbum) => (
                                    <Link href={`/album/${album.collectionId}`} key={album.collectionId}
                                        className="group cursor-pointer transition-transform hover:scale-105">
                                        <img src={album.artworkUrl100.replace('100x100bb', '400x400bb')}
                                            alt={album.collectionName} className="w-full rounded-md shadow-lg" />
                                        <div className="mt-2">
                                            <p className="font-semibold text-sm truncate text-white">{album.collectionName}</p>
                                            <p className="text-zinc-400 text-xs truncate">{album.artistName}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {albums.length === 0 && users.length === 0 && (
                        <p className="text-zinc-500 text-center mt-20">No se encontraron resultados para &quot;{query}&quot;.</p>
                    )}
                </div>
            </main>
        );
    }

    const res = await fetch(ITUNES_TOP_ALBUMS_URL, { next: { revalidate: 3600 } });
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const albums: { id: string; name: string; artist: string; coverUrl: string }[] = data?.feed?.entry?.map((e: any) => ({
        id: e.id.attributes['im:id'],
        name: e['im:name'].label,
        artist: e['im:artist'].label,
        coverUrl: e['im:image'][2].label.replace('170x170', '600x600'),
    })) ?? [];

    const recentReviews = await prisma.review.findMany({
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: 'desc' },
        take: 6,
    });

    const recentAlbumIds = [...new Set(recentReviews.map(r => r.albumId))];
    const recentAlbumsMap = recentAlbumIds.length > 0
        ? await (async () => {
            try {
                const res = await fetch(`https://itunes.apple.com/lookup?id=${recentAlbumIds.join(',')}`);
                const d = await res.json();
                const m = new Map();
                for (const a of (d.results ?? [])) {
                    if (a.collectionId) m.set(a.collectionId.toString(), a);
                }
                return m;
            } catch { return new Map(); }
        })()
        : new Map();

    return (
        <main className="min-h-screen p-8 bg-zinc-950 text-white">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-2">
                        Letterboxd<span className="text-blue-500">Music</span>
                    </h1>
                    <p className="text-zinc-400 mb-8">Descubre, califica y comparte tus discos favoritos</p>
                    <div className="max-w-xl mx-auto">
                        <SearchBar />
                    </div>
                </div>

                {recentReviews.length > 0 && (
                    <section className="mb-12">
                        <h2 className="text-lg font-semibold mb-4 text-zinc-300">Últimas reseñas</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {recentReviews.slice(0, 4).map((review) => {
                                const album = recentAlbumsMap.get(review.albumId);
                                return (
                                    <Link key={review.id} href={`/album/${review.albumId}`}
                                        className="bg-zinc-900/50 border border-zinc-800/50 rounded-md p-3 flex gap-3 hover:bg-zinc-800 transition-colors group">
                                        {album && (
                                            <img src={album.artworkUrl100?.replace('100x100bb', '200x200bb')}
                                                alt={album.collectionName} className="w-14 h-14 rounded shadow-md shrink-0" />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <UserAvatar name={review.user.name} image={review.user.image} id={review.user.id} size="sm" />
                                                <span className="text-sm text-zinc-300 truncate">{review.user.name}</span>
                                                <span className="text-yellow-400 text-xs ml-auto shrink-0">{'★'.repeat(review.rating)}</span>
                                            </div>
                                            <p className="text-xs text-zinc-500 mt-1 truncate">
                                                {album?.collectionName || 'Disco'} • {album?.artistName || ''}
                                            </p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}

                <section>
                    <h2 className="text-lg font-semibold mb-4 text-zinc-300">Discos populares esta semana</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {albums.map((album: { id: string; name: string; artist: string; coverUrl: string }) => (
                            <Link href={`/album/${album.id}`} key={album.id} className="group cursor-pointer">
                                <div className="relative aspect-square overflow-hidden rounded-md bg-zinc-800 mb-2 shadow-lg">
                                    <img src={album.coverUrl} alt={album.name}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                </div>
                                <h3 className="font-semibold text-sm truncate text-white">{album.name}</h3>
                                <p className="text-zinc-400 text-xs truncate">{album.artist}</p>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
