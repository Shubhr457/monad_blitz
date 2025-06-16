import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { useChainLuck } from '../hooks/useChainLuck'
import { formatCurrency, formatAddress } from '../utils'
import { 
  Coins, 
  Dice1, 
  Users, 
  Settings, 
  DollarSign, 
  Trophy,
  RefreshCw,
  AlertCircle
} from 'lucide-react'

export default function AdminPage() {
  const { address } = useAccount()
  const {
    roundInfo,
    vaultBalance,
    isOwner,
    deposit,
    draw,
    depositPending,
    depositSuccess,
    drawPending,
    drawSuccess,
    winnersPerDraw,
    minParticipants,
    refetchAll,
  } = useChainLuck()

  const [depositAmount, setDepositAmount] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (depositSuccess) {
      toast.success('💰 Vault funded successfully!')
      setDepositAmount('')
      refetchAll()
    }
  }, [depositSuccess, refetchAll])

  useEffect(() => {
    if (drawSuccess) {
      toast.success('🎉 Winners drawn successfully!')
      refetchAll()
    }
  }, [drawSuccess, refetchAll])

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    try {
      await deposit(depositAmount)
    } catch (error) {
      toast.error('Failed to fund vault. Please try again.')
      console.error('Deposit error:', error)
    }
  }

  const handleDraw = async () => {
    if (!roundInfo?.participantCount || roundInfo.participantCount < minParticipants) {
      toast.error(`Need at least ${minParticipants} participants to draw winners`)
      return
    }

    try {
      await draw()
    } catch (error) {
      toast.error('Failed to draw winners. Please try again.')
      console.error('Draw error:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetchAll()
    setTimeout(() => setRefreshing(false), 500)
  }

  if (!isOwner) {
    return (
      <div className="text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card max-w-md mx-auto"
        >
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">
            Only the contract owner can access the admin panel.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">
            Admin Dashboard
          </span>
        </h1>
        <p className="text-gray-300">
          Manage the ChainLuck lottery system
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vault Management */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Vault Status */}
          <div className="glass-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center">
                <Coins className="w-6 h-6 mr-2 text-neon-blue" />
                Vault Management
              </h2>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-neon-blue/10 border border-neon-blue/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Current Balance</span>
                  <span className="text-2xl font-bold text-neon-blue">
                    {formatCurrency(vaultBalance)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-sm text-gray-400">Winners per Draw</p>
                  <p className="text-lg font-semibold text-neon-green">
                    {winnersPerDraw}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-sm text-gray-400">Min Participants</p>
                  <p className="text-lg font-semibold text-neon-purple">
                    {minParticipants}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Fund Vault */}
          <div className="glass-card">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-neon-green" />
              Fund Vault
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Amount (tMON)
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.0"
                  step="0.001"
                  min="0"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-green/50 transition-colors"
                />
              </div>

              <button
                onClick={handleDeposit}
                disabled={depositPending || !depositAmount}
                className="w-full neon-button"
              >
                {depositPending ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="loading-spinner" />
                    <span>Funding...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Coins className="w-4 h-4" />
                    <span>Fund Vault</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Round Management */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Current Round */}
          <div className="glass-card">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Trophy className="w-6 h-6 mr-2 text-neon-purple" />
              Round Management
            </h2>

            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Round #{roundInfo?.roundId || 0}</span>
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
                    <Users className="w-4 h-4 mr-1" />
                    Participants
                  </span>
                  <span className="font-semibold text-lg">
                    {roundInfo?.participantCount || 0}
                  </span>
                </div>

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
                    {Math.max(0, minParticipants - (roundInfo?.participantCount || 0))} participants needed
                  </p>
                </div>
              </div>

              {/* Draw Winners Button */}
              <button
                onClick={handleDraw}
                disabled={
                  drawPending || 
                  !roundInfo?.isActive || 
                  !roundInfo?.participantCount ||
                  roundInfo.participantCount < minParticipants
                }
                className="w-full neon-button"
              >
                {drawPending ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="loading-spinner" />
                    <span>Drawing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Dice1 className="w-4 h-4" />
                    <span>Draw Winners</span>
                  </div>
                )}
              </button>

              {roundInfo?.participantCount && roundInfo.participantCount < minParticipants && (
                <p className="text-sm text-yellow-400 text-center">
                  ⚠️ Need {minParticipants - roundInfo.participantCount} more participants
                </p>
              )}
            </div>
          </div>

          {/* Admin Info */}
          <div className="glass-card">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-gray-400" />
              Admin Info
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Admin Address</span>
                <span className="address-text font-semibold">
                  {formatAddress(address || '')}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Contract Owner</span>
                <span className="text-neon-green font-semibold">✓ Verified</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card"
      >
        <h3 className="text-xl font-bold mb-4">Admin Instructions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-neon-blue/10 border border-neon-blue/20 rounded-lg p-4">
            <h4 className="font-semibold text-neon-blue mb-2">1. Fund Vault</h4>
            <p className="text-gray-400">
              Add tMON to the prize pool to reward winners. Higher amounts attract more participants.
            </p>
          </div>
          <div className="bg-neon-purple/10 border border-neon-purple/20 rounded-lg p-4">
            <h4 className="font-semibold text-neon-purple mb-2">2. Monitor Participation</h4>
            <p className="text-gray-400">
              Watch the participant count. The draw triggers automatically when minimum is reached.
            </p>
          </div>
          <div className="bg-neon-green/10 border border-neon-green/20 rounded-lg p-4">
            <h4 className="font-semibold text-neon-green mb-2">3. Draw Winners</h4>
            <p className="text-gray-400">
              Manually trigger winner selection when ready. Winners receive instant payouts.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
} 