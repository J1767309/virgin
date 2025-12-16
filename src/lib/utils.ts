import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function getIndexColor(value: number): string {
  if (value >= 100) return 'text-green-600'
  if (value >= 95) return 'text-yellow-600'
  return 'text-red-600'
}

export function getIndexBgColor(value: number): string {
  if (value >= 100) return 'bg-green-100'
  if (value >= 95) return 'bg-yellow-100'
  return 'bg-red-100'
}

export function getVarianceColor(actual: number, target: number): string {
  const variance = ((actual - target) / target) * 100
  if (variance >= 0) return 'text-green-600'
  if (variance >= -5) return 'text-yellow-600'
  return 'text-red-600'
}

export function calculateVariance(actual: number, target: number): number {
  if (target === 0) return 0
  return ((actual - target) / target) * 100
}

export function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`
}

export function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

export function getBrandDisplayName(brand: string): string {
  switch (brand) {
    case 'virgin_hotels':
      return 'Virgin Hotels'
    case 'virgin_limited_edition':
      return 'Virgin Limited Edition'
    default:
      return brand
  }
}

export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'in_progress':
      return 'bg-blue-100 text-blue-800'
    case 'not_started':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getDisciplineDisplayName(discipline: string): string {
  switch (discipline) {
    case 'sales':
      return 'Sales'
    case 'revenue_management':
      return 'Revenue Management'
    case 'ecommerce':
      return 'E-commerce'
    default:
      return discipline
  }
}
