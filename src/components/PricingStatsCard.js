export default function PricingStatsCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  variant = 'default',
  className = '' 
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'danger':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-white border-gray-200'
    }
  }

  const getValueColor = () => {
    switch (variant) {
      case 'success':
        return 'text-green-700'
      case 'warning':
        return 'text-yellow-700'
      case 'danger':
        return 'text-red-700'
      default:
        return 'text-gray-900'
    }
  }

  return (
    <div className={`rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow ${getVariantStyles()} ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      
      <div className={`text-2xl font-bold mb-2 ${getValueColor()}`}>
        {value}
      </div>
      
      {subtitle && (
        <p className="text-sm text-gray-600">{subtitle}</p>
      )}
    </div>
  )
}
