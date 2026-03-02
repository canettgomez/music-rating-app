// src/actions/rating.ts
'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function saveRating(albumId: string, rating: number) {
    try {
        // Buscamos a tu usuario base temporal, si no existe lo creamos
        let user = await prisma.user.findUnique({
            where: { username: 'leojc' }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    username: 'leojc',
                    email: 'leojc@app.com',
                }
            });
        }

        // Guardamos la reseña en la base de datos
        await prisma.review.create({
            data: {
                rating,
                albumId: albumId.toString(),
                userId: user.id
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Error guardando calificación:", error);
        return { success: false };
    }
}