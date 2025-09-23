# Case Files

An interactive Next.js application for investigative case files. Players read a brief, follow structured hints, and submit a prime-suspect verdict. Each verdict is encrypted and time-locked on-chain via Blocklock, revealing only after the configured unlock time.

## 🌟 Features

- **Case-driven gameplay**: Browse cases, read the story and hints, and select a suspect
- **Time-locked verdicts**: Verdicts are encrypted with Blocklock and revealed later
- **Wallet integration**: Seamless connection via RainbowKit + Wagmi
- **Responsive design**: Tailwind CSS UI optimized for mobile and desktop

## 🚀 Getting Started

### Prerequisites

- Node.js >= 22.0.0
- A crypto wallet (MetaMask, etc.)
- Network connection to supported blockchains

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd case-files
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Configuration

Create a local environment file and set your Alchemy API key (Base Sepolia used by default in this app):
```bash
cp .env.sample .env.local
```

```env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
NEXT_PUBLIC_ALCHEMY_KEY=your_alchemy_key
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15.3.0 with React 18
- **Styling**: Tailwind CSS
- **Wallet Connection**: RainbowKit + Wagmi
- **Blockchain Integration**: Ethers.js + Blocklock.js
- **State Management**: React Query (@tanstack/react-query)
- **TypeScript**: Full type safety

## 🔧 Supported Networks

- **Base Sepolia** (Chain ID: 84532)

> This application is configured to run against Base Sepolia for verdict submissions.

## 🔒 How It Works

1. **Connect Wallet**: Connect your wallet on a supported test network
2. **Open Cases**: Navigate to `/case-files` and choose a case
3. **Read & Decide**: Review the brief and hints, then select a suspect
4. **Encrypt & Submit**: Your verdict is encoded and encrypted with a time-lock condition using Blocklock
5. **Reveal Later**: The verdict becomes decryptable on-chain after the unlock time

Key implementation point:

- The case detail page at `app/case-files/[id]/page.tsx` performs encryption and sends the request via `createTimelockRequestWithDirectFunding` to the configured contract.

## 📁 Project Structure

```
├── app/
│   ├── case-files/
│   │   ├── [id]/page.tsx     # Case detail view; verdict encryption + submission
│   │   ├── header.tsx        # Local header for case-files
│   │   └── page.tsx          # Case index with cards
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Landing page
│   ├── providers.tsx         # Providers (Wagmi/RainbowKit/Query)
│   └── wallet.tsx            # Wallet connect gate for routes
├── components/               # Shared UI (header, footer, wallet connect)
├── hooks/                    # Custom hooks (ethers, encrypt, explorer, network)
├── lib/
│   ├── contract.ts           # Contract address/ABI bindings
│   └── MockBlocklockStringReceiver.sol
└── public/
    ├── assets/               # Backgrounds and branding
    └── case-videos/          # Case hero videos (1.mp4, 2.mp4, 3.mp4)
```

## 🔗 Smart Contract Integration

The app uses Blocklock to submit time-locked ciphertext on-chain:

- Encrypts a user’s selected suspect ID to ciphertext
- Computes a timelock condition (target block height)
- Estimates callback gas and funds the request in the same transaction
- Calls the contract method defined in `lib/contract.ts` to persist the request

## 🎨 UI Surface

- **Case Index**: Browse open cases with counts for hints and suspects
- **Case Detail**: Read the brief and hints, select a suspect, and submit a verdict
- **Wallet Connection**: RainbowKit modal and route gating
- **Header/Footer**: Shared navigation and branding

## 📝 Scripts

- `npm run dev`: Start development server with Turbopack
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
