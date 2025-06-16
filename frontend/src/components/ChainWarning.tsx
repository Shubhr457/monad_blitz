import { useSwitchChain } from 'wagmi'
import { motion } from 'framer-motion'
import { monadTestnet } from '../config/wagmi'
import { AlertTriangle, Zap } from 'lucide-react'

export default function ChainWarning() {
  const { switchChain, isPending } = useSwitchChain()

  const handleSwitchChain = () => {
    switchChain({ chainId: monadTestnet.id })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-red-600 to-red-700 text-white p-4"
    >
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
          <div>
            <p className="font-semibold">Wrong Network Detected</p>
            <p className="text-sm opacity-90">
              Please switch to Monad Testnet to use ChainLuck
            </p>
          </div>
        </div>

        <button
          onClick={handleSwitchChain}
          disabled={isPending}
          className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <Zap className="w-4 h-4" />
          <span>{isPending ? 'Switching...' : 'Switch Network'}</span>
        </button>
      </div>
    </motion.div>
  )
} 