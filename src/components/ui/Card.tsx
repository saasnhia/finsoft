'use client'

import { type HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient' | 'glass'
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className = '', 
    variant = 'default', 
    hover = false,
    padding = 'md',
    children, 
    ...props 
  }, ref) => {
    const baseStyles = `
      rounded-2xl
      transition-all duration-300
    `

    const variants = {
      default: `
        bg-white
        border border-navy-100
        shadow-card
      `,
      gradient: `
        bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900
        border border-navy-700
        text-white
      `,
      glass: `
        bg-white/70 backdrop-blur-xl
        border border-white/20
        shadow-lg
      `,
    }

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    }

    const hoverStyles = hover ? `
      hover:shadow-card-hover
      hover:-translate-y-1
      cursor-pointer
    ` : ''

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${hoverStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
