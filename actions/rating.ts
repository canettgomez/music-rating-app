// src/actions/rating.ts
'use server';

import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function saveRating(albumId: string, rating: number, text?: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return { success: false, error: "Debes iniciar sesión." };
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return { success: false, error: "Usuario no encontrado." };

        // Usamos UPSERT: Si ya existe una reseña de este usuario para este álbum, la actualiza.
        // Para que esto funcione perfecto, necesitamos un índice único en Prisma (lo haremos en el siguiente paso).

        // Buscamos si ya existe para decidir si actualizar o crear manualmente por ahora:
        const existingReview = await prisma.review.findFirst({
            where: { userId: user.id, albumId: albumId.toString() }
        });

        if (existingReview) {
            await prisma.review.update({
                where: { id: existingReview.id },
                data: { rating, text: text || null }
            });
        } else {
            await prisma.review.create({
                data: {
                    rating,
                    text: text || null,
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