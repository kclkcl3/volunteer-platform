import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

interface BadgeProps {
	children: React.ReactNode;
	className?: string;
	variant?: BadgeVariant;
	onClick?: () => void;
}

const variantClasses: Record<BadgeVariant, string> = {
	default: 'bg-primary text-primary-foreground border-primary',
	secondary: 'bg-secondary text-secondary-foreground border-secondary',
	outline:
		'bg-transparent border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-400',
	destructive: 'bg-destructive text-destructive-foreground border-destructive',
};

export function Badge({
	children,
	className,
	variant = 'default',
}: BadgeProps) {
	return (
		<span
			className={cn(
				'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
				variantClasses[variant],
				className,
			)}
		>
			{children}
		</span>
	);
}
