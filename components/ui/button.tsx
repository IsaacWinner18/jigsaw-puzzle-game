import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-semibold font-poppins transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-white border border-slate-700 shadow-sm',
        amber:
          'bg-amber-400 text-slate-950 hover:bg-amber-300 font-bold shadow-md shadow-amber-500/20 active:bg-amber-500',
        amberOutline:
          'border border-amber-400/40 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 hover:border-amber-400',
        secondary:
          'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800',
        outline:
          'border border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white',
        ghost:
          'text-slate-400 hover:text-white hover:bg-slate-800/80',
        destructive:
          'bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25',
        link: 'text-amber-400 underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-9 px-3.5 py-2',
        sm: 'h-7 rounded-lg px-2.5 text-[11px]',
        lg: 'h-11 rounded-xl px-5 text-sm font-bold',
        icon: 'h-8 w-8 p-0 rounded-lg',
        iconSm: 'h-7 w-7 p-0 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
