'use client'

import { forwardRef } from 'react'

const Select = forwardRef(({ 
  className = '', 
  size = 'md', 
  variant = 'bordered',
  children,
  ...props 
}, ref) => {
  // Size variants
  const sizeClasses = {
    xs: 'select-xs',
    sm: 'select-sm', 
    md: '', // default
    lg: 'select-lg',
    xl: 'select-xl'
  }

  // Style variants
  const variantClasses = {
    bordered: 'select-bordered',
    ghost: 'select-ghost',
    primary: 'select-primary',
    secondary: 'select-secondary',
    accent: 'select-accent',
    info: 'select-info',
    success: 'select-success',
    warning: 'select-warning',
    error: 'select-error'
  }

  const baseClasses = `select ${variantClasses[variant]} ${sizeClasses[size]}`
  const finalClasses = `${baseClasses} ${className}`.trim()

  return (
    <select
      ref={ref}
      className={finalClasses}
      {...props}
    >
      {children}
    </select>
  )
})

Select.displayName = 'Select'

export default Select
