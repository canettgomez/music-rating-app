// src/components/music/ToListenButton.tsx
'use client';

import { useState } from 'react';
import { toggleToListen } from '../../actions/toListen';
import { useSession } from 'next-auth/react';

interface Props {
    albumId: string;
    initialIsSaved: boolean;
}

export default function ToListenButton({ albumId, initialIsSaved }: Props) {
    const { data: session } = useSession();
    const [isSaved, setIsSaved] = useState(initialIsSaved);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async () => {
        if (!session) {
            alert("Inicia sesión para guardar discos en tu lista.");
            return;
        }

        setIsLoading(true);
        const result = await toggleToListen(albumId);

        if (result.error) {
            alert(result.error);
        } else if (result.success && result.isSaved !== undefined) {
            setIsSaved(result.isSaved);
        }

        setIsLoading(false);
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-colors ${isSaved
                    ? 'bg-zinc-800 border border-zinc-700 text-green-400 hover:bg-zinc-700'
                    : 'bg-white text-black hover:bg-zinc-200'
                } disabled:opacity-50`}
        >
            {isLoading ? '⏳...' : isSaved ? '✓ En tu lista' : '➕ Por Escuchar'}
        </button>
    );
}