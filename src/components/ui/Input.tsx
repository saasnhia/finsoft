'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  suffix?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, icon, suffix, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-navy-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full
              px-4 py-2.5
              ${icon ? 'pl-10' : ''}
              ${suffix ? 'pr-12' : ''}
              bg-white
              border-2 border-navy-200
              rounded-xl
              font-body text-navy-900
              placeholder:text-navy-400
              transition-all duration-200
              focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
              hover:border-navy-300
              disabled:bg-navy-50 disabled:cursor-not-allowed
              ${error ? 'border-coral-500 focus:border-coral-500 focus:ring-coral-500/20' : ''}
              ${className}
            `}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-500 font-medium">
              {suffix}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-coral-600">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
