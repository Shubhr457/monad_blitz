# 🍀 ChainLuck Frontend

A sleek, production-ready frontend for ChainLuck - a decentralized luck-based cashback system built on Monad Testnet.

## ✨ Features

- **🎰 Lottery Interface**: User-friendly lottery participation system
- **👑 Admin Dashboard**: Contract management for dApp partners
- **🌐 Wallet Integration**: Seamless connection with popular wallets via RainbowKit
- **📱 Responsive Design**: Mobile-first glassmorphism UI with dark theme
- **⚡ Real-time Updates**: Live blockchain event monitoring
- **🎉 Animated Celebrations**: Winner announcements with confetti
- **🔗 Monad Network**: Optimized for Monad Testnet integration

## 🛠️ Tech Stack

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom glassmorphism components
- **Web3**: wagmi, viem, RainbowKit
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ChainLuck/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup

The app is pre-configured for Monad Testnet. Update the contract address in `src/config/wagmi.ts`:

```typescript
export const CHAINLUCK_CONTRACT_ADDRESS = 'YOUR_CONTRACT_ADDRESS'
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Header.tsx      # Navigation and wallet connection
│   │   ├── VaultStatus.tsx # Current lottery status
│   │   ├── EntryButton.tsx # Lottery entry interface
│   │   ├── ParticipantsList.tsx # Active participants
│   │   ├── WinnerModal.tsx # Winner celebration
│   │   └── ChainWarning.tsx # Network switching
│   ├── pages/              # Main application pages
│   │   ├── HomePage.tsx    # User lottery interface
│   │   └── AdminPage.tsx   # Contract management
│   ├── hooks/              # Custom React hooks
│   │   └── useChainLuck.ts # Contract interaction logic
│   ├── stores/             # State management
│   │   └── useAppStore.ts  # Global application state
│   ├── config/             # Configuration files
│   │   ├── wagmi.ts        # Web3 and network setup
│   │   └── contract.ts     # Smart contract ABI
│   ├── utils/              # Utility functions
│   │   └── index.ts        # Formatters and helpers
│   └── styles/             # Global styles
│       └── index.css       # Tailwind and custom CSS
├── public/                 # Static assets
└── package.json           # Dependencies and scripts
```

## 🎨 Design System

### Color Palette

- **Neon Purple**: `#a855f7` - Primary actions
- **Neon Blue**: `#2563eb` - Secondary elements
- **Neon Green**: `#22c55e` - Success states
- **Neon Pink**: `#ec4899` - Accent colors

### Components

#### Glass Cards
```css
.glass-card {
  @apply bg-glass-100 backdrop-blur-md border border-glass-200 shadow-inner-glow rounded-xl p-6;
}
```

#### Neon Buttons
```css
.neon-button {
  @apply bg-gradient-to-r from-neon-purple to-neon-blue text-white;
  @apply hover:shadow-glow hover:scale-105 transition-all duration-300;
}
```

## 🔗 Smart Contract Integration

### Core Functions

- **`enter()`**: Join the current lottery round
- **`deposit(amount)`**: Fund the prize vault (admin only)
- **`drawWinners()`**: Trigger winner selection (admin only)
- **`getCurrentRoundInfo()`**: Get current round status
- **`hasUserEnteredCurrent()`**: Check user participation

### Hooks Usage

```typescript
import { useChainLuck } from '../hooks/useChainLuck'

function MyComponent() {
  const {
    roundInfo,
    vaultBalance,
    hasEntered,
    enter,
    enterPending,
    enterSuccess
  } = useChainLuck()

  // Use the data and functions
}
```

## 🌐 Network Configuration

### Monad Testnet

```typescript
export const monadTestnet = defineChain({
  id: 41454,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'tMON',
    symbol: 'tMON',
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
```

## 📱 Pages & Features

### Home Page (`/`)

- **Welcome Screen**: For disconnected users
- **Lottery Status**: Current round information
- **Entry Interface**: Join lottery functionality
- **Participants List**: Live participant tracking
- **How It Works**: User guide

### Admin Dashboard (`/admin`)

- **Access Control**: Owner-only access
- **Vault Management**: Fund prize pool
- **Round Control**: Trigger winner draws
- **Statistics**: Participation metrics
- **Instructions**: Admin guidance

## 🎯 User Flow

1. **Connect Wallet**: RainbowKit integration
2. **Network Check**: Auto-switch to Monad Testnet
3. **Enter Lottery**: Free participation
4. **Wait for Draw**: Automatic or manual trigger
5. **Winner Celebration**: Animated winner announcement

## 🔧 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Customization

#### Adding New Components

1. Create component in `src/components/`
2. Use Tailwind classes with design system
3. Add animations with Framer Motion
4. Export and import where needed

#### Contract Integration

1. Update ABI in `src/config/contract.ts`
2. Modify `useChainLuck` hook for new functions
3. Add UI components for new features

## 🚀 Deployment

### Build Production

```bash
npm run build
```

### Environment Variables

No environment variables required for basic setup. The app uses hardcoded configuration for Monad Testnet.

### Hosting

Compatible with:
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Follow the existing code style
4. Add TypeScript types
5. Test thoroughly
6. Submit pull request

## 🔒 Security

- No private keys stored in frontend
- All transactions require user approval
- Network validation prevents wrong chain usage
- Input validation for all user inputs

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- Built for Monad Ecosystem
- Powered by RainbowKit
- Styled with Tailwind CSS
- Animated with Framer Motion
