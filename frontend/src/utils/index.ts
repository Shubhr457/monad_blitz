import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string, start = 6, end = 4): string {
  if (!address) return ''
  if (address.length < start + end) return address
  return `${address.slice(0, start)}...${address.slice(-end)}`
}

export function formatNumber(num: number | string, decimals = 4): string {
  const number = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(number)) return '0'
  
  if (number === 0) return '0'
  if (number < 0.0001) return '< 0.0001'
  
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  }).format(number)
}

export function formatCurrency(
  amount: number | string,
  currency = 'tMON',
  decimals = 4
): string {
  const formatted = formatNumber(amount, decimals)
  return `${formatted} ${currency}`
}

export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function generateConfetti() {
  const colors = ['#a855f7', '#2563eb', '#22c55e', '#ec4899', '#f59e0b']
  const confettiCount = 50
  
  return Array.from({ length: confettiCount }, (_, i) => ({
    id: i,
    color: colors[Math.floor(Math.random() * colors.length)],
    left: Math.random() * 100,
    animationDelay: Math.random() * 3,
    size: Math.random() * 8 + 4,
  }))
} 