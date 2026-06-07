import { prisma } from '@/lib/prisma';
import { lookupAlbums } from '@/lib/api';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PlaylistControls from './PlaylistControls';
import AddAlbumSearch from './AddAlbumSearch';

export default async function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const currentUser = session?.user?.email
    ? await prisma.user.findUnique({ where: { email: session.user.email } })
    : null;

  const playlist = await prisma.playlist.findUnique({
    where: { id },
    include: {
      albums: { orderBy: { order: 'asc' } },
      user: { select: { id: true, name: true, image: true } },
    },
  });
  if (!playlist) notFound();
  if (!playlist.isPublic && playlist.userId !== currentUser?.id) notFound();

  const albumIds = playlist.albums.map(a => a.albumId);
  const albumsMap = await lookupAlbums(albumIds);
  const isOwner = currentUser?.id === playlist.userId;

  return (
    <main className="min-h-screen p-8 bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold">{playlist.name}</h1>
              {!playlist.isPublic && <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">Privada</span>}
            </div>
            {playlist.description && <p className="text-zinc-400">{playlist.description}</p>}
            <div className="flex items-center gap-2 mt-2 text-sm text-zinc-500">
              <Link href={`/users/${playlist.user.id}`} className="hover:text-blue-400 transition-colors">
                {playlist.user.name}
              </Link>
              <span>·</span>
              <span>{playlist.albums.length} álbumes</span>
            </div>
          </div>
          {isOwner && <PlaylistControls playlistId={id} isPublic={playlist.isPublic} />}
        </div>

        {isOwner && <AddAlbumSearch playlistId={id} />}

        {playlist.albums.length === 0 ? (
          <p className="text-zinc-500">Esta lista está vacía. Usa el buscador de arriba para agregar álbumes.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {playlist.albums.map((entry, i) => {
              const album = albumsMap.get(entry.albumId);
              return (
                <Link key={entry.id} href={`/album/${entry.albumId}`} className="bg-zinc-900/50 border border-zinc-800/50 rounded-md p-4 flex gap-4 hover:bg-zinc-800 transition-colors group">
                  <span className="text-zinc-600 text-sm w-6 shrink-0 mt-1">{i + 1}</span>
                  {album && (
                    <img src={album.artworkUrl100.replace('100x100bb', '200x200bb')} alt={album.collectionName} className="w-16 h-16 rounded shadow-md shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white truncate">{album?.collectionName || 'Disco desconocido'}</p>
                    <p className="text-xs text-zinc-400 truncate">{album?.artistName || ''}</p>
                    {entry.notes && <p className="text-xs text-zinc-500 mt-1 italic">{entry.notes}</p>}
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
