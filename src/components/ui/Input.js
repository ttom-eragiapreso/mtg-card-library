import { forwardRef } from 'react'

const Input = forwardRef(({ 
  className = '', 
  size = 'md', 
  variant = 'bordered',
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  ...props 
}, ref) => {
  // Size variants
  const sizeClasses = {
    xs: 'input-xs',
    sm: 'input-sm', 
    md: '', // default
    lg: 'input-lg',
    xl: 'input-xl'
  }

  // Style variants
  const variantClasses = {
    bordered: 'input-bordered',
    ghost: 'input-ghost',
    primary: 'input-primary',
    secondary: 'input-secondary',
    accent: 'input-accent',
    info: 'input-info',
    success: 'input-success',
    warning: 'input-warning',
    error: 'input-error'
  }

  const baseClasses = `input ${variantClasses[variant]} ${sizeClasses[size]}`
  const finalClasses = `${baseClasses} ${className}`.trim()

  if (LeftIcon || RightIcon) {
    return (
      <div className="relative">
        {LeftIcon && (
          <LeftIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        )}
        <input
          ref={ref}
          className={`${finalClasses} ${LeftIcon ? 'pl-10' : ''} ${RightIcon ? 'pr-10' : ''}`}
          {...props}
        />
        {RightIcon && (
          <RightIcon className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        )}
      </div>
    )
  }

  return (
    <input
      ref={ref}
      className={finalClasses}
      {...props}
    />
  )
})

Input.displayName = 'Input'

export default Input
