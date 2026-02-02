'use client'

import { forwardRef, type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className = '', 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    icon,
    children, 
    disabled,
    ...props 
  }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-display font-medium
      transition-all duration-200 ease-out
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      active:scale-[0.98]
    `

    const variants = {
      primary: `
        bg-gradient-to-r from-emerald-500 to-emerald-600
        hover:from-emerald-600 hover:to-emerald-700
        text-white shadow-lg shadow-emerald-500/25
        focus:ring-emerald-500
      `,
      secondary: `
        bg-navy-800 hover:bg-navy-700
        text-white
        focus:ring-navy-500
      `,
      outline: `
        border-2 border-navy-200 hover:border-navy-300
        bg-transparent hover:bg-navy-50
        text-navy-700
        focus:ring-navy-500
      `,
      ghost: `
        bg-transparent hover:bg-navy-100
        text-navy-600 hover:text-navy-800
        focus:ring-navy-500
      `,
      danger: `
        bg-gradient-to-r from-coral-500 to-coral-600
        hover:from-coral-600 hover:to-coral-700
        text-white shadow-lg shadow-coral-500/25
        focus:ring-coral-500
      `,
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-lg',
      md: 'px-4 py-2.5 text-base rounded-xl',
      lg: 'px-6 py-3.5 text-lg rounded-xl',
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg 
            className="animate-spin h-5 w-5" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : icon}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
