'use client';

import { useState } from 'react';
import { followUser } from '@/actions/follow';
import { useSession } from 'next-auth/react';

interface Props {
    targetUserId: string;
    initialIsFollowing: boolean;
}

export default function FollowButton({ targetUserId, initialIsFollowing }: Props) {
    const { data: session } = useSession();
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [isLoading, setIsLoading] = useState(false);

    if (!session || session.user.id === targetUserId) return null;

    const handleToggle = async () => {
        setIsLoading(true);
        const result = await followUser(targetUserId);
        if (result.success && result.isFollowing !== undefined) {
            setIsFollowing(result.isFollowing);
        }
        setIsLoading(false);
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-colors disabled:opacity-50 ${isFollowing
                    ? 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                    : 'bg-white text-black hover:bg-zinc-200'
                }`}
        >
            {isLoading ? '...' : isFollowing ? 'Siguiendo' : 'Seguir'}
        </button>
    );
}
