import { create } from 'zustand'

interface AppState {
  // UI State
  showAdminPanel: boolean
  showWinnerModal: boolean
  isConnecting: boolean
  
  // Notifications
  lastWinner: string | null
  lastPrize: string | null
  
  // Actions
  setShowAdminPanel: (show: boolean) => void
  setShowWinnerModal: (show: boolean) => void
  setIsConnecting: (connecting: boolean) => void
  setLastWinner: (winner: string | null, prize: string | null) => void
  reset: () => void
}

const initialState = {
  showAdminPanel: false,
  showWinnerModal: false,
  isConnecting: false,
  lastWinner: null,
  lastPrize: null,
}

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,
  
  setShowAdminPanel: (show) => set({ showAdminPanel: show }),
  
  setShowWinnerModal: (show) => set({ showWinnerModal: show }),
  
  setIsConnecting: (connecting) => set({ isConnecting: connecting }),
  
  setLastWinner: (winner, prize) => {
    set({ lastWinner: winner, lastPrize: prize })
    if (winner) {
      set({ showWinnerModal: true })
    }
  },
  
  reset: () => set(initialState),
})) 