// src/components/music/StarRating.tsx
'use client';

import { useState, useEffect } from 'react'; // 1. Agregamos useEffect
import { saveRating } from '../../actions/rating';
import { useRouter } from 'next/navigation';

interface Props {
    albumId: string;
    initialRating?: number;
    initialText?: string;
}

export default function StarRating({ albumId, initialRating = 0, initialText = '' }: Props) {
    const router = useRouter();
    const [rating, setRating] = useState(initialRating);
    const [hover, setHover] = useState(0);
    const [text, setText] = useState(initialText);
    const [isSaving, setIsSaving] = useState(false);

    // 2. Sincronizar estados si cambian las props (necesario para Next.js)
    useEffect(() => {
        setRating(initialRating);
        setText(initialText);
    }, [initialRating, initialText]);

    const handleSubmit = async () => {
        if (rating === 0) {
            alert('Por favor, selecciona una estrella');
            return;
        }
        setIsSaving(true);
        const result = await saveRating(albumId, rating, text);

        if (result.success) {
            // 3. NO limpiamos el estado aquí para que se vea lo que acabamos de guardar
            router.refresh();
        } else {
            alert(result.error || 'Hubo un error al guardar.');
        }
        setIsSaving(false);
    };

    return (
        <div className="bg-zinc-900 p-4 rounded-md border border-zinc-800 flex flex-col gap-4">
            <div>
                {/* 4. Título Dinámico */}
                <p className="text-zinc-400 text-sm mb-2 text-center">
                    {initialRating > 0 ? 'Tu calificación' : 'Califica este disco'}
                </p>

                <div className="flex justify-center gap-1 text-4xl cursor-pointer">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            disabled={isSaving}
                            onMouseEnter={() => setHover(star)}
                            onMouseLeave={() => setHover(0)}
                            onClick={() => setRating(star)}
                            className={`transition-colors duration-200 ${star <= (hover || rating) ? 'text-yellow-400 drop-shadow-md' : 'text-zinc-700'
                                }`}
                        >
                            ★
                        </button>
                    ))}
                </div>
            </div>

            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escribe tu opinión sobre el disco..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white text-sm resize-none h-24 focus:outline-none focus:border-zinc-500"
            />

            <button
                onClick={handleSubmit}
                disabled={isSaving || (rating === initialRating && text === initialText)} // Deshabilitar si no hay cambios
                className="w-full bg-white text-black font-bold py-2 rounded disabled:opacity-50 hover:bg-zinc-200 transition-colors"
            >
                {isSaving
                    ? 'Guardando...'
                    : initialRating > 0 ? 'Actualizar Reseña' : 'Publicar Reseña'}
            </button>
        </div>
    );
}