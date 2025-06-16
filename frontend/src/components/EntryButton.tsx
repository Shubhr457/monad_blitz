import { motion } from 'framer-motion'
import { Dice6, Loader2 } from 'lucide-react'

interface EntryButtonProps {
  onEnter: () => void
  disabled?: boolean
  loading?: boolean
}

export default function EntryButton({ onEnter, disabled, loading }: EntryButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onEnter}
      disabled={disabled || loading}
      className={`
        relative overflow-hidden rounded-xl px-8 py-4 text-lg font-bold transition-all duration-300
        ${disabled || loading
          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
          : 'neon-button animate-pulse-glow'
        }
      `}
    >
      <div className="flex items-center justify-center space-x-2">
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Dice6 className="w-5 h-5" />
        )}
        <span>
          {loading ? 'Entering...' : disabled ? 'Entry Closed' : 'Enter Lucky Draw'}
        </span>
      </div>
      
      {/* Glow effect */}
      {!disabled && !loading && (
        <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/20 to-neon-blue/20 animate-pulse" />
      )}
    </motion.button>
  )
} 