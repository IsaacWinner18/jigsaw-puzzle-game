import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold font-poppins transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 select-none',
  {
    variants: {
      variant: {
        default:
          'border border-slate-700 bg-slate-800 text-slate-200',
        amber:
          'border border-amber-500/30 bg-amber-500/10 text-amber-300 font-bold',
        emerald:
          'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-semibold',
        blue:
          'border border-blue-500/30 bg-blue-500/10 text-blue-300 font-semibold',
        purple:
          'border border-purple-500/30 bg-purple-500/10 text-purple-300 font-semibold',
        secondary:
          'border border-slate-800 bg-slate-900/60 text-slate-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
