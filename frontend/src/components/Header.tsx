import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Link, useLocation } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useChainLuck } from '../hooks/useChainLuck'
import { Coins, Settings } from 'lucide-react'

export default function Header() {
  const location = useLocation()
  const { isConnected } = useAccount()
  const { isOwner } = useChainLuck()

  return (
    <header className="glass border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-xl font-bold">
            <div className="w-8 h-8 bg-gradient-to-r from-neon-purple to-neon-blue rounded-lg flex items-center justify-center">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">
              ChainLuck
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            {isConnected && (
              <>
                <Link
                  to="/"
                  className={`px-4 py-2 rounded-lg transition-all ${
                    location.pathname === '/'
                      ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30'
                      : 'hover:bg-white/5'
                  }`}
                >
                  Home
                </Link>
                
                {isOwner && (
                  <Link
                    to="/admin"
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      location.pathname === '/admin'
                        ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Admin</span>
                  </Link>
                )}
              </>
            )}

            {/* Connect Wallet */}
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
              }) => {
                const ready = mounted
                const connected = ready && account && chain

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      style: {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            className="neon-button"
                          >
                            Connect Wallet
                          </button>
                        )
                      }

                      if (chain.unsupported) {
                        return (
                          <button
                            onClick={openChainModal}
                            className="neon-button bg-red-600 hover:bg-red-700"
                          >
                            Wrong Network
                          </button>
                        )
                      }

                      return (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={openChainModal}
                            className="glass px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            {chain.hasIcon && (
                              <div
                                style={{
                                  background: chain.iconBackground,
                                  width: 16,
                                  height: 16,
                                  borderRadius: 999,
                                  overflow: 'hidden',
                                  marginRight: 4,
                                }}
                              >
                                {chain.iconUrl && (
                                  <img
                                    alt={chain.name ?? 'Chain icon'}
                                    src={chain.iconUrl}
                                    style={{ width: 16, height: 16 }}
                                  />
                                )}
                              </div>
                            )}
                            {chain.name}
                          </button>

                          <button
                            onClick={openAccountModal}
                            className="glass px-4 py-2 rounded-lg hover:bg-white/10 transition-colors address-text"
                          >
                            {account.displayName}
                          </button>
                        </div>
                      )
                    })()}
                  </div>
                )
              }}
            </ConnectButton.Custom>
          </nav>
        </div>
      </div>
    </header>
  )
} 