import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { useAppStore } from './stores/useAppStore'
import { monadTestnet } from './config/wagmi'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import AdminPage from './pages/AdminPage'
import WinnerModal from './components/WinnerModal'
import ChainWarning from './components/ChainWarning'

function App() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { showWinnerModal, reset } = useAppStore()
  
  const isCorrectChain = chainId === monadTestnet.id

  useEffect(() => {
    if (!isConnected) {
      reset()
    }
  }, [isConnected, reset])

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-green-900/20 pointer-events-none" />
      
      {/* Chain warning */}
      {isConnected && !isCorrectChain && <ChainWarning />}
      
      <div className="relative z-10">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
      </div>
      
      {/* Winner Modal */}
      {showWinnerModal && <WinnerModal />}
    </div>
  )
}

export default App
