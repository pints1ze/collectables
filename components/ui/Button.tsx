import { ButtonHTMLAttributes, forwardRef } from 'react'
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 border border-primary/20 shadow-sm',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 border border-destructive/20 shadow-sm',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border shadow-sm',
        ghost: 'hover:bg-accent hover:text-accent-foreground border border-transparent hover:border-border',
        link: 'text-primary underline-offset-4 hover:underline border-0 shadow-none',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    // Map existing variants to shadcn variants
    const variantMap: Record<string, VariantProps<typeof buttonVariants>['variant']> = {
      primary: 'default',
      secondary: 'secondary',
      danger: 'destructive',
      ghost: 'ghost',
    }
    
    // Map existing sizes to shadcn sizes
    const sizeMap: Record<string, VariantProps<typeof buttonVariants>['size']> = {
      sm: 'sm',
      md: 'default',
      lg: 'lg',
    }
    
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant: variantMap[variant], size: sizeMap[size] }), className)}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
