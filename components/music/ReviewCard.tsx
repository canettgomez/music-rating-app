import Link from "next/link";
import UserAvatar from "@/components/ui/UserAvatar";

interface ReviewProps {
    review: {
        id: string;
        rating: number;
        text: string | null;
        user: {
            id?: string;
            name: string | null;
            image: string | null;
        };
        albumId?: string;
        albumName?: string;
        albumArtist?: string;
        albumImage?: string;
    };
}

export default function ReviewCard({ review }: ReviewProps) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-md p-4 flex gap-4 hover:bg-zinc-800/70 transition-colors group">
            {review.albumImage && review.albumId && (
                <Link href={`/album/${review.albumId}`} className="shrink-0">
                    <img
                        src={review.albumImage}
                        alt={review.albumName || ''}
                        className="w-20 h-20 rounded shadow-md group-hover:scale-105 transition-transform"
                    />
                </Link>
            )}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                        {review.user.id ? (
                            <Link href={`/users/${review.user.id}`}>
                                <UserAvatar name={review.user.name} image={review.user.image} id={review.user.id} size="sm" />
                            </Link>
                        ) : (
                            <UserAvatar name={review.user.name} image={review.user.image} size="sm" />
                        )}
                        {review.user.id ? (
                            <Link href={`/users/${review.user.id}`} className="font-semibold text-sm text-zinc-300 hover:text-blue-400 transition-colors truncate">
                                {review.user.name}
                            </Link>
                        ) : (
                            <span className="font-semibold text-sm text-zinc-300 truncate">{review.user.name}</span>
                        )}
                    </div>
                    <span className="text-yellow-400 text-sm tracking-widest shrink-0 ml-2">
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </span>
                </div>
                {review.albumName && (
                    <p className="text-xs text-zinc-500 mb-1 truncate">
                        <Link href={`/album/${review.albumId}`} className="hover:text-blue-400 transition-colors">
                            {review.albumName}
                        </Link>
                        {review.albumArtist && <span> • {review.albumArtist}</span>}
                    </p>
                )}
                {review.text && (
                    <p className="text-sm text-zinc-400 mt-1 leading-relaxed line-clamp-3">{review.text}</p>
                )}
            </div>
        </div>
    );
}
