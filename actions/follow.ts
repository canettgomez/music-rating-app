'use server';

import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';

export async function followUser(targetUserId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return { error: 'Usuario no autenticado' };
        }
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { following: true },
        });
        if (!currentUser) return { error: 'Usuario no encontrado' };
        if (currentUser.id === targetUserId) return { error: 'No puedes seguirte a ti mismo' };
        const isAlreadyFollowing = currentUser.following.some(
            (user) => user.id === targetUserId
        );
        if (isAlreadyFollowing) {
            await prisma.user.update({
                where: { id: currentUser.id },
                data: {
                    following: {
                        disconnect: { id: targetUserId }
                    }
                }
            });
            revalidatePath(`/feed`);
            return { success: true, isFollowing: false };
        } else {
            await prisma.user.update({
                where: { id: currentUser.id },
                data: {
                    following: {
                        connect: { id: targetUserId }
                    }
                }
            });
            revalidatePath(`/feed`);
            return { success: true, isFollowing: true };
        }
    } catch (error) {
        console.error(error);
        return { error: 'Error al seguir al usuario' };
    }
}