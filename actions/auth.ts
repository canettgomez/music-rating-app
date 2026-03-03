// src/actions/auth.ts
'use server';

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function registerUser(formData: FormData) {
    // Sacamos los datos del formulario que haremos en el siguiente paso
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!name || !email || !password) {
        return { error: "Por favor llena todos los campos." };
    }

    try {
        // Revisamos que el correo no esté usado ya
        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser) {
            return { error: "Este correo ya está registrado." };
        }

        // ENCRIPTAMOS LA CONTRASEÑA (salt de 10 rondas, el estándar seguro)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Guardamos al usuario en MySQL
        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            }
        });

        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Hubo un error del servidor al registrar tu cuenta." };
    }
}