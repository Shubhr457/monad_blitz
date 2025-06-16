import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../stores/useAppStore'
import { formatAddress, formatCurrency, generateConfetti } from '../utils'
import { Trophy, X, Sparkles } from 'lucide-react'

export default function WinnerModal() {
  const { showWinnerModal, lastWinner, lastPrize, setShowWinnerModal } = useAppStore()
  const confetti = generateConfetti()

  useEffect(() => {
    if (showWinnerModal) {
      // Auto close after 10 seconds
      const timer = setTimeout(() => {
        setShowWinnerModal(false)
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [showWinnerModal, setShowWinnerModal])

  return (
    <AnimatePresence>
      {showWinnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowWinnerModal(false)}
          />

          {/* Confetti */}
          {confetti.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{ y: -100, opacity: 1 }}
              animate={{ y: window.innerHeight + 100, opacity: 0 }}
              transition={{
                duration: 3,
                delay: piece.animationDelay,
                ease: 'easeOut',
              }}
              className="absolute"
              style={{
                left: `${piece.left}%`,
                width: `${piece.size}px`,
                height: `${piece.size}px`,
                backgroundColor: piece.color,
                borderRadius: '50%',
              }}
            />
          ))}

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotateY: 180 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotateY: -180 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative glass-card max-w-md w-full text-center"
          >
            {/* Close button */}
            <button
              onClick={() => setShowWinnerModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="p-8">
              {/* Trophy Animation */}
              <motion.div
                animate={{ 
                  rotateY: [0, 360],
                  scale: [1, 1.1, 1],
                }}
                transition={{ 
                  rotateY: { duration: 2, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 1, repeat: Infinity, ease: 'easeInOut' }
                }}
                className="text-6xl mb-6"
              >
                🏆
              </motion.div>

              {/* Winner Text */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold mb-4 bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent"
              >
                🎉 Congratulations!
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                <p className="text-xl text-gray-300">
                  You've won the lucky draw!
                </p>

                {lastWinner && (
                  <div className="bg-neon-green/10 border border-neon-green/20 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Winner Address</p>
                    <p className="address-text text-neon-green font-semibold">
                      {formatAddress(lastWinner)}
                    </p>
                  </div>
                )}

                {lastPrize && (
                  <div className="bg-neon-blue/10 border border-neon-blue/20 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Prize Amount</p>
                    <p className="text-2xl font-bold text-neon-blue">
                      {formatCurrency(lastPrize)}
                    </p>
                  </div>
                )}

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center justify-center space-x-2 text-sm text-gray-400"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Prize sent to your wallet instantly!</span>
                  <Sparkles className="w-4 h-4" />
                </motion.div>
              </motion.div>

              {/* Action Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                onClick={() => setShowWinnerModal(false)}
                className="mt-6 neon-button"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Awesome!
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
} 