import { forwardRef } from 'react'

const Textarea = forwardRef(({ 
  className = '', 
  size = 'md', 
  variant = 'bordered',
  ...props 
}, ref) => {
  // Size variants
  const sizeClasses = {
    xs: 'textarea-xs',
    sm: 'textarea-sm', 
    md: '', // default
    lg: 'textarea-lg',
    xl: 'textarea-xl'
  }

  // Style variants
  const variantClasses = {
    bordered: 'textarea-bordered',
    ghost: 'textarea-ghost',
    primary: 'textarea-primary',
    secondary: 'textarea-secondary',
    accent: 'textarea-accent',
    info: 'textarea-info',
    success: 'textarea-success',
    warning: 'textarea-warning',
    error: 'textarea-error'
  }

  const baseClasses = `textarea ${variantClasses[variant]} ${sizeClasses[size]}`
  const finalClasses = `${baseClasses} ${className}`.trim()

  return (
    <textarea
      ref={ref}
      className={finalClasses}
      {...props}
    />
  )
})

Textarea.displayName = 'Textarea'

export default Textarea
