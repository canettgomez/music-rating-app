// src/app/page.tsx
import { Album } from '@/types/itunes';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import SearchBar from '../components/music/SearchBar';
import AuthButton from '@/components/auth/AuthButton';

// Función para obtener los discos de iTunes/Apple
async function getTopAlbums(): Promise<Album[]> {
  // Usamos el feed de discos más populares/nuevos. 
  // Limit = 20 para traer 20 discos.
  const response = await fetch('https://itunes.apple.com/us/rss/topalbums/limit=20/json', {
    next: { revalidate: 3600 } // Revalida el caché cada hora
  });

  if (!response.ok) {
    console.error("Error conectando con Apple:", response.status);
    return [];
  }

  const data = await response.json();

  // Mapeamos la respuesta extraña de Apple a nuestra interfaz limpia
  const albums: Album[] = data.feed.entry.map((entry: any) => ({
    id: entry.id.attributes['im:id'],
    name: entry['im:name'].label,
    artist: entry['im:artist'].label,
    // Apple manda un arreglo de imágenes. Tomamos la última y le subimos la resolución.
    coverUrl: entry['im:image'][2].label.replace('170x170', '600x600')
  }));

  return albums;
}

export default async function Home() {
  const albums = await getTopAlbums();
  const groupedReviews = await prisma.review.groupBy({
    by: ['albumId'],
    _avg: {
      rating: true
    }
  });

  const ratingsMap = groupedReviews.reduce((acc, review) => {
    if (review._avg.rating) {
      acc[review.albumId] = review._avg.rating;
    }
    return acc;
  }, {} as Record<string, number>);

  if (albums.length === 0) {
    return (
      <main className="min-h-screen p-8 bg-zinc-950 text-white">
        <h1>Error al cargar la música. Revisa tu conexión.</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-zinc-950 text-white">
      <header className="mb-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Discos Populares</h1>
          <AuthButton />
        </div>
        <SearchBar />
        <p className="text-zinc-400">Los discos más populares de la semana.</p>
      </header>

      {/* Grid para mostrar los discos */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {albums.map((album) => {
          const albumId = album.id.toString();
          const averageRating = ratingsMap[albumId];
          return (
            <Link href={`/album/${album.id}`} key={album.id} className="group cursor-pointer">
              <div className="relative aspect-square overflow-hidden rounded-md bg-zinc-800 mb-3 shadow-lg">
                <img
                  src={album.coverUrl}
                  alt={album.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {averageRating && (
                  <div className="absolute bottom-2 right-2 bg-black/80 text-yellow-400 px-2 py-1 rounded text-xs font-bold">
                    ⭐ {averageRating.toFixed(1)}
                  </div>
                )}
              </div>
              <h2 className="font-semibold text-sm truncate" title={album.name}>
                {album.name}
              </h2>
              <p className="text-zinc-400 text-xs truncate" title={album.artist}>
                {album.artist}
              </p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}