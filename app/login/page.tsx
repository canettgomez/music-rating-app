// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const registered = searchParams.get('registered');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Usamos el signIn de NextAuth pasando el proveedor 'credentials'
        const result = await signIn('credentials', {
            redirect: false, // Evitamos que NextAuth recargue la página automáticamente si hay error
            email,
            password,
        });

        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
        } else {
            router.push('/');
            router.refresh(); // Actualizamos la app para que detecte la sesión
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 text-white">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-lg p-8 shadow-2xl">
                <h1 className="text-3xl font-bold mb-2 text-center">Bienvenido de vuelta</h1>
                <p className="text-zinc-400 text-sm text-center mb-6">Inicia sesión en tu cuenta</p>

                {registered && <div className="bg-green-500/10 border border-green-500 text-green-500 text-sm p-3 rounded mb-4">¡Cuenta creada con éxito! Ahora puedes iniciar sesión.</div>}
                {error && <div className="bg-red-500/10 border border-red-500 text-red-500 text-sm p-3 rounded mb-4">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">Correo Electrónico</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-white text-black font-bold py-2 px-4 rounded transition-colors hover:bg-zinc-200 disabled:opacity-50 mt-4"
                    >
                        {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="mt-6 flex items-center justify-center gap-2">
                    <div className="h-px bg-zinc-800 flex-1"></div>
                    <span className="text-zinc-500 text-xs uppercase">O continúa con</span>
                    <div className="h-px bg-zinc-800 flex-1"></div>
                </div>

                <button
                    onClick={() => signIn('github', { callbackUrl: '/' })}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white font-bold py-2 px-4 rounded mt-4 hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                >
                    GitHub
                </button>

                <p className="text-center text-zinc-400 text-sm mt-6">
                    ¿No tienes cuenta? <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium">Regístrate aquí</Link>
                </p>
            </div>
        </main>
    );
}