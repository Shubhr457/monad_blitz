import { useAccount } from 'wagmi'
import { useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { useChainLuck } from '../hooks/useChainLuck'
import { formatCurrency, formatAddress } from '../utils'
import VaultStatus from '../components/VaultStatus'
import EntryButton from '../components/EntryButton'
import ParticipantsList from '../components/ParticipantsList'
import { Coins, Users, Trophy, Sparkles } from 'lucide-react'

export default function HomePage() {
  const { isConnected, address } = useAccount()
  const {
    roundInfo,
    vaultBalance,
    hasEntered,
    isLoading,
    enter,
    enterPending,
    enterSuccess,
    winnersPerDraw,
    minParticipants,
    refetchAll,
  } = useChainLuck()

  useEffect(() => {
    if (enterSuccess) {
      toast.success('🎉 Successfully entered the lottery!')
      refetchAll()
    }
  }, [enterSuccess, refetchAll])

  const handleEnter = async () => {
    if (!address) return
    
    try {
      await enter()
    } catch (error) {
      toast.error('Failed to enter lottery. Please try again.')
      console.error('Enter error:', error)
    }
  }

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card max-w-md mx-auto"
        >
          <div className="text-6xl mb-6">🍀</div>
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">
            Welcome to ChainLuck
          </h1>
          <p className="text-gray-300 mb-6">
            Connect your wallet to participate in decentralized lucky draws and win instant ETH rewards!
          </p>
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <Coins className="w-4 h-4" />
              <span>Instant Payouts</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Fair & Random</span>
            </div>
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4" />
              <span>Multiple Winners</span>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="loading-spinner mx-auto mb-4" />
        <p className="text-gray-400">Loading lottery information...</p>
      </div>
    )
  }

  const canEnter = roundInfo?.isActive && !hasEntered && roundInfo.participantCount < minParticipants

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <h1 className="text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-neon-purple via-neon-blue to-neon-green bg-clip-text text-transparent">
            ChainLuck Lottery
          </span>
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Decentralized luck-based rewards for the Monad ecosystem
        </p>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card text-center"
          >
            <Coins className="w-8 h-8 text-neon-purple mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">Prize Pool</h3>
            <p className="text-2xl font-bold text-neon-purple">
              {formatCurrency(vaultBalance)}
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card text-center"
          >
            <Users className="w-8 h-8 text-neon-blue mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">Participants</h3>
            <p className="text-2xl font-bold text-neon-blue">
              {roundInfo?.participantCount || 0} / {minParticipants}
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card text-center"
          >
            <Trophy className="w-8 h-8 text-neon-green mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">Winners</h3>
            <p className="text-2xl font-bold text-neon-green">
              {winnersPerDraw} Lucky Winners
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lottery Status */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <VaultStatus />
          
          {/* Entry Section */}
          <div className="glass-card">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-neon-purple" />
              Enter the Draw
            </h2>
            
            {hasEntered ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-8"
              >
                <div className="text-4xl mb-4">🎫</div>
                <h3 className="text-xl font-semibold text-neon-green mb-2">
                  You're in the draw!
                </h3>
                <p className="text-gray-400">
                  Your address: <span className="address-text">{formatAddress(address || '')}</span>
                </p>
                <div className="mt-4 p-4 bg-neon-green/10 border border-neon-green/20 rounded-lg">
                  <p className="text-sm text-neon-green">
                    Waiting for {minParticipants - (roundInfo?.participantCount || 0)} more participants
                    to start the draw
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🎲</div>
                <h3 className="text-xl font-semibold mb-4">
                  Ready to try your luck?
                </h3>
                <p className="text-gray-400 mb-6">
                  No cost to enter - just connect and participate!
                </p>
                
                <EntryButton
                  onEnter={handleEnter}
                  disabled={!canEnter}
                  loading={enterPending}
                />
                
                {!roundInfo?.isActive && (
                  <p className="text-yellow-400 text-sm mt-4">
                    🏁 Current round is not active
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Participants */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <ParticipantsList />
        </motion.div>
      </div>

      {/* How it Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">How ChainLuck Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: '1', title: 'Connect', desc: 'Connect your wallet to Monad testnet' },
            { step: '2', title: 'Enter', desc: 'Join the current round for free' },
            { step: '3', title: 'Wait', desc: 'Automatic draw when minimum participants reached' },
            { step: '4', title: 'Win', desc: 'Winners receive instant ETH payouts' },
          ].map((item, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-neon-purple to-neon-blue rounded-full flex items-center justify-center text-xl font-bold mb-3 mx-auto">
                {item.step}
              </div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
} 