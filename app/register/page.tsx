// src/app/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerUser } from '../../actions/auth';

export default function RegisterPage() {
    const router = useRouter();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const result = await registerUser(formData);

        if (result.error) {
            setError(result.error);
            setIsLoading(false);
        } else {
            // Si el registro es exitoso, lo mandamos a iniciar sesión
            router.push('/login?registered=true');
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 text-white">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-lg p-8 shadow-2xl">
                <h1 className="text-3xl font-bold mb-2 text-center">Crear Cuenta</h1>
                <p className="text-zinc-400 text-sm text-center mb-6">Únete para calificar tus discos favoritos</p>

                {error && <div className="bg-red-500/10 border border-red-500 text-red-500 text-sm p-3 rounded mb-4">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">Nombre</label>
                        <input
                            name="name"
                            type="text"
                            required
                            className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">Correo Electrónico</label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">Contraseña</label>
                        <input
                            name="password"
                            type="password"
                            required
                            minLength={6}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 mt-4"
                    >
                        {isLoading ? 'Registrando...' : 'Registrarse'}
                    </button>
                </form>

                <p className="text-center text-zinc-400 text-sm mt-6">
                    ¿Ya tienes cuenta? <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">Inicia sesión aquí</Link>
                </p>
            </div>
        </main>
    );
}