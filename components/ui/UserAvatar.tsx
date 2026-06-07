const AVATAR_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
  '#F97316', '#6366F1',
];

function getColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface Props {
  name: string | null | undefined;
  image?: string | null | undefined;
  id?: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-10 h-10 text-base',
  lg: 'w-20 h-20 text-3xl',
};

export default function UserAvatar({ name, image, id, size = 'sm', className = '' }: Props) {
  const seed = id || name || '?';
  const initial = (name || '?').charAt(0).toUpperCase();
  const color = getColor(seed);

  if (image) {
    return (
      <img
        src={image}
        alt={name || ''}
        className={`${SIZE_MAP[size]} rounded-full border border-zinc-700 shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${SIZE_MAP[size]} rounded-full flex items-center justify-center font-bold shrink-0 ${className}`}
      style={{ backgroundColor: color }}
    >
      {initial}
    </div>
  );
}
