'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';

export async function getMyPlaylists() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return [];
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return [];
  return prisma.playlist.findMany({
    where: { userId: user.id },
    include: { _count: { select: { albums: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createPlaylist(name: string, description?: string, isPublic = true) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return { error: 'Debes iniciar sesión.' };
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { error: 'Usuario no encontrado.' };

    const playlist = await prisma.playlist.create({
      data: { name, description, isPublic, userId: user.id }
    });
    revalidatePath(`/users/${user.id}`);
    return { success: true, playlist };
  } catch (e) {
    console.error(e);
    return { error: 'Error al crear la lista.' };
  }
}

export async function addToPlaylist(playlistId: string, albumId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return { error: 'Debes iniciar sesión.' };

    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist) return { error: 'Lista no encontrada.' };

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user || playlist.userId !== user.id) return { error: 'No tienes permiso.' };

    const existing = await prisma.playlistAlbum.findUnique({
      where: { playlistId_albumId: { playlistId, albumId } }
    });
    if (existing) return { error: 'Este álbum ya está en la lista.' };

    const maxOrder = await prisma.playlistAlbum.aggregate({
      where: { playlistId },
      _max: { order: true }
    });

    await prisma.playlistAlbum.create({
      data: { playlistId, albumId, order: (maxOrder._max.order ?? -1) + 1 }
    });
    revalidatePath(`/list/${playlistId}`);
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: 'Error al agregar álbum.' };
  }
}

export async function removeFromPlaylist(playlistId: string, albumId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return { error: 'Debes iniciar sesión.' };
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { error: 'Usuario no encontrado.' };

    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist || playlist.userId !== user.id) return { error: 'No tienes permiso.' };

    await prisma.playlistAlbum.deleteMany({ where: { playlistId, albumId } });
    revalidatePath(`/list/${playlistId}`);
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: 'Error al eliminar álbum.' };
  }
}

export async function togglePlaylistVisibility(playlistId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return { error: 'Debes iniciar sesión.' };
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { error: 'Usuario no encontrado.' };

    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist || playlist.userId !== user.id) return { error: 'No tienes permiso.' };

    const updated = await prisma.playlist.update({
      where: { id: playlistId },
      data: { isPublic: !playlist.isPublic }
    });
    revalidatePath(`/list/${playlistId}`);
    return { success: true, isPublic: updated.isPublic };
  } catch (e) {
    console.error(e);
    return { error: 'Error al cambiar visibilidad.' };
  }
}
