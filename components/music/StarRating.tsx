'use client';

import { useState } from 'react';
import { saveRating } from '../../actions/rating';
import { useRouter } from 'next/navigation';

interface Props {
    albumId: string;
    initialRating?: number;
    initialText?: string;
    initialListenedAt?: Date;
}

function toDateInputValue(date: Date): string {
    return date.toISOString().split('T')[0];
}

export default function StarRating({ albumId, initialRating = 0, initialText = '', initialListenedAt }: Props) {
    const router = useRouter();
    const [rating, setRating] = useState(initialRating);
    const [hover, setHover] = useState(0);
    const [text, setText] = useState(initialText);
    const [listenedAt, setListenedAt] = useState(
        initialListenedAt ? toDateInputValue(initialListenedAt) : toDateInputValue(new Date())
    );
    const [isSaving, setIsSaving] = useState(false);

    const hasChanges = rating !== initialRating || text !== initialText;

    const handleSubmit = async () => {
        if (rating === 0) {
            alert('Por favor, selecciona una estrella');
            return;
        }
        setIsSaving(true);
        const result = await saveRating(albumId, rating, text, listenedAt);

        if (result.success) {
            router.refresh();
        } else {
            alert(result.error || 'Hubo un error al guardar.');
        }
        setIsSaving(false);
    };

    return (
        <div className="bg-zinc-900 p-4 rounded-md border border-zinc-800 flex flex-col gap-4">
            <div>
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
                            className={`transition-colors duration-200 ${star <= (hover || rating) ? 'text-yellow-400 drop-shadow-md' : 'text-zinc-700'}`}
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

            <div className="flex items-center gap-3">
                <label className="text-zinc-400 text-sm">Escuchado el:</label>
                <input
                    type="date"
                    value={listenedAt}
                    onChange={(e) => setListenedAt(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-zinc-500"
                />
            </div>

            <button
                onClick={handleSubmit}
                disabled={isSaving || !hasChanges}
                className="w-full bg-white text-black font-bold py-2 rounded disabled:opacity-50 hover:bg-zinc-200 transition-colors"
            >
                {isSaving
                    ? 'Guardando...'
                    : initialRating > 0 ? 'Actualizar Reseña' : 'Publicar Reseña'}
            </button>
        </div>
    );
}
