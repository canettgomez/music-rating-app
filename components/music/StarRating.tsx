// src/components/music/StarRating.tsx
'use client';

import { useState } from 'react';
import { saveRating } from '../../actions/rating';

export default function StarRating({ albumId }: { albumId: string }) {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    const handleRating = async (value: number) => {
        setIsSaving(true);
        setRating(value);

        // Llamamos a la función del servidor directamente
        const result = await saveRating(albumId, value);

        if (result.success) {
            alert('¡Calificación guardada en tu diario!');
        } else {
            alert('Hubo un error al guardar.');
            setRating(0); // Reiniciamos si falló
        }
        setIsSaving(false);
    };

    return (
        <div className="bg-zinc-900 p-4 rounded-md text-center border border-zinc-800">
            <p className="text-zinc-400 text-sm mb-2">
                {isSaving ? 'Guardando...' : 'Califica este disco'}
            </p>

            <div className="flex justify-center gap-1 text-4xl cursor-pointer">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        disabled={isSaving}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                        onClick={() => handleRating(star)}
                        className={`transition-colors duration-200 ${star <= (hover || rating) ? 'text-yellow-400 drop-shadow-md' : 'text-zinc-700'
                            }`}
                    >
                        ★
                    </button>
                ))}
            </div>
        </div>
    );
}