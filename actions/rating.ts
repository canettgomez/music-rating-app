'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';

export async function saveRating(albumId: string, rating: number, text?: string, listenedAt?: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return { success: false, error: "Debes iniciar sesión." };
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return { success: false, error: "Usuario no encontrado." };

        const existingReview = await prisma.review.findFirst({
            where: { userId: user.id, albumId: albumId.toString() }
        });

        const data: { rating: number; text: string | null; listenedAt?: Date } = { rating, text: text || null };
        if (listenedAt) {
            data.listenedAt = new Date(listenedAt);
        }

        if (existingReview) {
            await prisma.review.update({
                where: { id: existingReview.id },
                data
            });
        } else {
            await prisma.review.create({
                data: {
                    ...data,
                    albumId: albumId.toString(),
                    userId: user.id
                }
            });
        }

        revalidatePath(`/album/${albumId}`);
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: "Error al procesar la reseña." };
    }
}
