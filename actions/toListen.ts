// src/actions/toListen.ts
'use server';

import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function toggleToListen(albumId: string) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return { error: "Debes iniciar sesión para guardar discos." };
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) return { error: "Usuario no encontrado." };

        // Buscamos si el disco ya está en tu lista de "Por Escuchar"
        const existing = await prisma.toListen.findUnique({
            where: {
                userId_albumId: {
                    userId: user.id,
                    albumId: albumId.toString()
                }
            }
        });

        if (existing) {
            // Si ya existe, lo quitamos
            await prisma.toListen.delete({
                where: { id: existing.id }
            });
            revalidatePath(`/album/${albumId}`);
            return { success: true, isSaved: false };
        } else {
            // Si no existe, lo agregamos
            await prisma.toListen.create({
                data: {
                    userId: user.id,
                    albumId: albumId.toString()
                }
            });
            revalidatePath(`/album/${albumId}`);
            return { success: true, isSaved: true };
        }
    } catch (error) {
        console.error("Error en toListen:", error);
        return { error: "Hubo un error al actualizar tu lista." };
    }
}