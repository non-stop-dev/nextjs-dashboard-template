import React from 'react'

interface CardSimpleProps {
  title: string
  value: string | number
  className?: string
  icon?: React.ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
}

export const CardSimple = React.memo(function CardSimple({
  title,
  value,
  className = '',
  icon,
  variant = 'default'
}: CardSimpleProps) {
  // Simple theme-based styling (matching your design system)
  const getVariantClasses = (variant: string) => {
    switch (variant) {
      case 'primary':
        return {
          bg: 'bg-primary border-primary/20',
          text: 'text-primary-foreground'
        }
      case 'success':
        return {
          bg: 'bg-success border-success/20',
          text: 'text-success-foreground'
        }
      case 'warning':
        return {
          bg: 'bg-warning border-warning/20',
          text: 'text-warning-foreground'
        }
      case 'danger':
        return {
          bg: 'bg-danger border-danger/20',
          text: 'text-danger-foreground'
        }
      default:
        return {
          bg: 'bg-background border',
          text: 'text-foreground'
        }
    }
  }

  const variantStyles = getVariantClasses(variant)

  return (
    <div className={`
      p-4 rounded-lg transition-colors hover:bg-opacity-80 border-muted-foreground
      ${variantStyles.bg}
      ${variantStyles.text}
      ${className}
    `}>
      {/* Header with optional icon */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-foreground">
          {title}
        </h3>
        {icon && (
          <div className="text-foreground">
            {icon}
          </div>
        )}
      </div>
      
      {/* Value */}
      <p className="text-2xl font-bold">
        {value}
      </p>
    </div>
  )
})