// src/app/album/[id]/page.tsx

import StarRating from '@/components/music/StarRating';

// Interfaz rápida para los datos que nos devuelve Apple
interface ITunesResult {
    wrapperType: string;
    collectionId: number;
    collectionName: string;
    artistName: string;
    artworkUrl100: string;
    releaseDate: string;
    primaryGenreName: string;
    trackName?: string;
    trackNumber?: number;
    trackTimeMillis?: number;
}

async function getAlbumDetails(id: string) {
    // El endpoint de "lookup" nos permite buscar un ID específico.
    // Al agregar entity=song, nos devuelve primero el disco y luego las canciones.
    const res = await fetch(`https://itunes.apple.com/lookup?id=${id}&entity=song`);

    if (!res.ok) return null;
    const data = await res.json();

    if (data.resultCount === 0) return null;

    // El primer resultado siempre es el disco (collection)
    const albumInfo = data.results.find((r: ITunesResult) => r.wrapperType === 'collection');

    // Los demás resultados son las canciones (track)
    const tracks = data.results.filter((r: ITunesResult) => r.wrapperType === 'track');

    return { albumInfo, tracks };
}

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
    // En Next.js moderno, los params son una promesa
    const resolvedParams = await params;
    const data = await getAlbumDetails(resolvedParams.id);

    if (!data || !data.albumInfo) {
        return (
            <main className="min-h-screen p-8 bg-zinc-950 text-white flex items-center justify-center">
                <h1 className="text-2xl">Disco no encontrado.</h1>
            </main>
        );
    }

    const { albumInfo, tracks } = data;

    // Truco para tener la portada en alta resolución (600x600)
    const coverUrl = albumInfo.artworkUrl100.replace('100x100bb', '600x600bb');

    return (
        <main className="min-h-screen p-8 bg-zinc-950 text-white">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[300px_1fr] gap-10">

                {/* Columna Izquierda: Portada y Calificación */}
                <section>
                    <img
                        src={coverUrl}
                        alt={albumInfo.collectionName}
                        className="w-full rounded-md shadow-2xl mb-6"
                    />

                    {/* Aquí irá nuestro componente interactivo de estrellas */}
                    <StarRating albumId={albumInfo.collectionId.toString()} />
                </section>

                {/* Columna Derecha: Información y Canciones */}
                <section>
                    <h1 className="text-4xl font-bold mb-2">{albumInfo.collectionName}</h1>
                    <h2 className="text-xl text-zinc-400 mb-6">{albumInfo.artistName} • {albumInfo.primaryGenreName}</h2>

                    <h3 className="text-lg font-semibold mb-4 border-b border-zinc-800 pb-2">Lista de Canciones</h3>
                    <ul className="space-y-2">
                        {tracks.map((track: ITunesResult) => {
                            // Convertimos los milisegundos de Apple a formato mm:ss
                            const minutes = Math.floor((track.trackTimeMillis || 0) / 60000);
                            const seconds = ((track.trackTimeMillis || 0) % 60000 / 1000).toFixed(0);

                            return (
                                <li key={track.trackName} className="flex justify-between text-zinc-300 text-sm hover:bg-zinc-900 p-2 rounded">
                                    <span>
                                        <span className="text-zinc-600 mr-4">{track.trackNumber}</span>
                                        {track.trackName}
                                    </span>
                                    <span className="text-zinc-500">
                                        {minutes}:{parseInt(seconds) < 10 ? '0' : ''}{seconds}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </section>

            </div>
        </main>
    );
}