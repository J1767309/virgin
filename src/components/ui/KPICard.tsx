'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card } from './Card'

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  format?: 'currency' | 'percent' | 'number' | 'index'
  className?: string
}

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon,
  trend,
  format = 'number',
  className,
}: KPICardProps) {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-virgin-gray-400" />
  }

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600'
    if (trend === 'down') return 'text-red-600'
    return 'text-virgin-gray-600'
  }

  const formatValue = () => {
    if (typeof value === 'string') return value

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value)
      case 'percent':
        return `${value.toFixed(1)}%`
      case 'index':
        return value.toFixed(1)
      default:
        return new Intl.NumberFormat('en-US').format(value)
    }
  }

  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-virgin-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-virgin-black">{formatValue()}</p>
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              {getTrendIcon()}
              <span className={cn('text-sm font-medium', getTrendColor())}>
                {change > 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
              {changeLabel && (
                <span className="text-sm text-virgin-gray-500 ml-1">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-virgin-red/10 rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}

interface IndexCardProps {
  title: string
  value: number
  description?: string
  className?: string
}

export function IndexCard({ title, value, description, className }: IndexCardProps) {
  const getBackgroundColor = () => {
    if (value >= 100) return 'bg-green-50 border-green-200'
    if (value >= 95) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  const getTextColor = () => {
    if (value >= 100) return 'text-green-700'
    if (value >= 95) return 'text-yellow-700'
    return 'text-red-700'
  }

  const getStatusText = () => {
    if (value >= 100) return 'Above Market'
    if (value >= 95) return 'At Market'
    return 'Below Market'
  }

  return (
    <div className={cn('p-4 rounded-lg border', getBackgroundColor(), className)}>
      <p className="text-sm font-medium text-virgin-gray-600">{title}</p>
      <p className={cn('text-2xl font-bold mt-1', getTextColor())}>
        {value.toFixed(1)}
      </p>
      <p className={cn('text-xs mt-1', getTextColor())}>
        {description || getStatusText()}
      </p>
    </div>
  )
}
