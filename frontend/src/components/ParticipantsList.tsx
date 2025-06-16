import { useState, useEffect } from 'react'
import { useContractRead } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'
import { CHAINLUCK_CONTRACT_ADDRESS } from '../config/wagmi'
import { CHAINLUCK_ABI } from '../config/contract'
import { useChainLuck } from '../hooks/useChainLuck'
import { formatAddress } from '../utils'
import { Users, RefreshCw } from 'lucide-react'

export default function ParticipantsList() {
  const { roundInfo, refetchAll } = useChainLuck()
  const [refreshing, setRefreshing] = useState(false)

  const { data: participants, isLoading, refetch } = useContractRead({
    address: CHAINLUCK_CONTRACT_ADDRESS,
    abi: CHAINLUCK_ABI,
    functionName: 'getRoundParticipants',
    args: roundInfo ? [BigInt(roundInfo.roundId)] : undefined,
    enabled: !!roundInfo?.roundId,
  })

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([refetch(), refetchAll()])
    setTimeout(() => setRefreshing(false), 500)
  }

  const participantsList = participants as string[] | undefined

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card h-fit"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <Users className="w-5 h-5 mr-2 text-neon-green" />
          Participants
        </h2>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : participantsList && participantsList.length > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <AnimatePresence>
            {participantsList.map((participant, index) => (
              <motion.div
                key={participant}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-neon-purple to-neon-blue rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <span className="address-text">
                    {formatAddress(participant)}
                  </span>
                </div>
                
                {index < 3 && (
                  <span className="text-xs px-2 py-1 bg-neon-purple/20 text-neon-purple rounded-full">
                    Early Bird
                  </span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">👥</div>
          <p className="text-gray-400 mb-2">No participants yet</p>
          <p className="text-sm text-gray-500">
            Be the first to enter the draw!
          </p>
        </div>
      )}

      {participantsList && participantsList.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Total Participants</span>
            <span className="font-semibold text-neon-green">
              {participantsList.length}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  )
} 