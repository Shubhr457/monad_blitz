import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { defineChain } from 'viem'

// Define Monad Testnet
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://explorer.testnet.monad.xyz',
    },
  },
  testnet: true,
})

export const config = getDefaultConfig({
  appName: 'ChainLuck',
  projectId: 'YOUR_PROJECT_ID', // Get this from WalletConnect Cloud
  chains: [monadTestnet],
  ssr: false,
})

// Contract address - Update this with your deployed contract
export const CHAINLUCK_CONTRACT_ADDRESS = '0xCB58A72705FF1a064C6F3Cdb41014927649d8ED9' as const 