import { motion } from 'framer-motion'
import { useChainLuck } from '../hooks/useChainLuck'
import { formatCurrency } from '../utils'
import { Vault, Activity, Clock } from 'lucide-react'

export default function VaultStatus() {
  const { roundInfo, vaultBalance, winnersPerDraw, minParticipants, isLoading } = useChainLuck()

  if (isLoading) {
    return (
      <div className="glass-card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  const prizePerWinner = roundInfo && winnersPerDraw > 0 
    ? (parseFloat(vaultBalance) / winnersPerDraw).toFixed(4)
    : '0'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card"
    >
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Vault className="w-5 h-5 mr-2 text-neon-blue" />
        Vault Status
      </h2>

      <div className="space-y-4">
        {/* Total Vault Balance */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Total Prize Pool</span>
          <span className="text-2xl font-bold text-neon-blue">
            {formatCurrency(vaultBalance)}
          </span>
        </div>

        {/* Prize per Winner */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Prize per Winner</span>
          <span className="text-lg font-semibold text-neon-green">
            {formatCurrency(prizePerWinner)}
          </span>
        </div>

        {/* Round Info */}
        <div className="border-t border-gray-700 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 flex items-center">
              <Activity className="w-4 h-4 mr-1" />
              Round #{roundInfo?.roundId || 0}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              roundInfo?.isActive 
                ? 'bg-neon-green/20 text-neon-green' 
                : 'bg-gray-700 text-gray-400'
            }`}>
              {roundInfo?.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400 flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              Participants
            </span>
            <span className="font-semibold">
              {roundInfo?.participantCount || 0} / {minParticipants}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-neon-purple to-neon-blue h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(100, ((roundInfo?.participantCount || 0) / minParticipants) * 100)}%` 
                }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {minParticipants - (roundInfo?.participantCount || 0)} more needed to trigger draw
            </p>
          </div>
        </div>

        {/* Draw Trigger Info */}
        {roundInfo?.participantCount && roundInfo.participantCount >= minParticipants && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-neon-green/10 border border-neon-green/20 rounded-lg p-3"
          >
            <p className="text-sm text-neon-green font-medium">
              🎉 Ready for draw! Waiting for admin to trigger winner selection.
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
} 