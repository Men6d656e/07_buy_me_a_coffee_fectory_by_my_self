# ☕ Buy Me A Coffee Factory

## Table of Contents

- [What Problem Does This Solve?](#what-problem-does-this-solve)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Smart Contracts](#smart-contracts)
- [Getting Started](#getting-started)
- [Full List of Make Commands](#full-list-of-make-commands)
- [Connecting MetaMask](#connecting-metamask)
- [Environment Variables](#environment-variables)
- [Design System (Neo-Brutalist)](#design-system-neo-brutalist)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

**A decentralized tipping platform where creators deploy their own smart contracts to accept ETH tips directly from fans — no middlemen, no fees, full ownership.**

---

## What Problem Does This Solve?

Platforms like Patreon, Ko-fi, and Buy Me A Coffee (the Web2 version) take cuts, hold your funds, and can freeze your account. **This project eliminates all of that.**

Instead of pooling everyone's tips into one contract, this **factory pattern** lets each creator deploy their **own personal tipping contract** on Ethereum. Fans send ETH directly to that contract, and only the creator can withdraw. The platform itself has zero custody over funds.

**In short:** You own your contract. You own your tips. No platform can touch them.

---

## How It Works

1. **Creator** connects their wallet → visits the Dashboard
2. **Creator** clicks "Deploy Contract" → calls `CoffeeFactory.createCoffeeContract()`
3. **Factory** deploys a new `BuyMeACoffee` contract, sets the creator as owner, stores the mapping
4. **Creator** shares their tipping link: `/0xTheirAddress`
5. **Fan** visits the link → the app looks up their contract via `Factory.getCoffeeContract(creatorAddress)`
6. **Fan** fills in name, message, tip amount → calls `buyCoffee()` on the creator's contract
7. **Creator** visits dashboard → sees analytics (revenue, tips, memos) → clicks "Withdraw" to claim funds

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Smart Contracts** | Solidity 0.8.20 | Latest stable, built-in overflow protection |
| **Contract Framework** | Foundry (Forge) | Fast compilation, testing, deployment |
| **Frontend** | Next.js 16 + React 19 | App Router, server components, latest React |
| **Styling** | Tailwind CSS 4 | Utility-first, custom neo-brutalist theme |
| **Blockchain Connection** | Wagmi v3 + Viem | Type-safe hooks for reading/writing contracts |
| **State Management** | TanStack React Query | Caching, refetching, loading states |
| **Charts** | Recharts | Revenue analytics and tip visualization |
| **Animations** | Framer Motion | Landing page transitions and hover effects |
| **Testing** | Vitest + React Testing Library | Unit tests for all frontend components |
| **Contract Testing** | Forge Test | 8 comprehensive Solidity tests |

---

## Project Structure

```
├── contracts/                     # Solidity smart contracts (Foundry project)
│   ├── src/
│   │   ├── BuyMeACoffee.sol       # Individual tipping contract (one per creator)
│   │   └── CoffeeFactory.sol      # Factory that deploys tipping contracts
│   ├── test/
│   │   └── CoffeeFactory.t.sol    # Contract unit tests (8 tests)
│   ├── script/
│   │   └── Deploy.s.sol           # Forge deployment script
│   ├── lib/                       # Foundry dependencies (forge-std)
│   └── foundry.toml               # Foundry configuration
│
├── frontend/                      # Next.js 16 + React 19 frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           # Landing page — hero, features, CTA
│   │   │   ├── layout.tsx         # Root layout — fonts, providers, global CSS
│   │   │   ├── providers.tsx      # Wagmi + React Query context providers
│   │   │   ├── globals.css        # Neo-brutalist theme (colors, shadows, utilities)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx       # Creator dashboard — deploy, analytics, withdraw
│   │   │   └── [creatorAddress]/
│   │   │       └── page.tsx       # Public tipping page — send ETH to a creator
│   │   ├── components/
│   │   │   └── Navbar.tsx         # Navigation bar with wallet connect/disconnect
│   │   ├── constants/
│   │   │   ├── addresses.ts       # Deployed factory contract address
│   │   │   └── abi/
│   │   │       ├── BuyMeACoffee.json   # ABI for the tipping contract
│   │   │       └── CoffeeFactory.json  # ABI for the factory contract
│   │   ├── __tests__/             # Unit tests (41 tests across 4 files)
│   │   │   ├── Home.test.tsx
│   │   │   ├── Navbar.test.tsx
│   │   │   ├── Dashboard.test.tsx
│   │   │   └── CreatorPage.test.tsx
│   │   └── wagmi.ts              # Blockchain connection config (localhost + Sepolia)
│   └── package.json
│
├── scripts/
│   └── sync.js                    # Reads Foundry broadcast → writes ABIs + addresses to frontend
│
├── Makefile                       # Build, test, deploy, run, clean commands
├── README.md                      # This file
└── .env                           # Environment variables (not committed)
```

---

## Smart Contracts

### BuyMeACoffee.sol — The Tipping Contract

Each creator gets one of these. It accepts ETH, stores memos, tracks revenue, and allows withdrawal.

```solidity
function buyCoffee(string calldata name, string calldata message) external payable;
function withdraw() external;  // owner only
function getMemos() external view returns (Memo[] memory);
function totalRevenue() external view returns (uint256);  // persists across withdrawals
```

### CoffeeFactory.sol — The Factory

This is the entry point. It deploys new tipping contracts, tracks which creator owns which contract, prevents duplicates, and maintains a registry of all creators.

```solidity
function createCoffeeContract() external returns (address);
function getCoffeeContract(address creator) external view returns (address);
function hasCoffeeContract(address creator) external view returns (bool);
function getAllCreators() external view returns (address[] memory);
function getCreatorsCount() external view returns (uint256);
```

### Why a Factory Pattern?

| Approach | Pros | Cons |
|----------|------|------|
| **Single shared contract** | Simple to deploy | All tips pooled, complex accounting, single point of failure |
| **Factory pattern (this project)** | Each creator owns their contract, direct ETH flow, simple withdraw | Slightly more gas to deploy |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (`node --version`)
- **Foundry** (`forge --version`) — Install: `curl -L https://foundry.paradigm.xyz | bash && foundryup`
- **Git** (`git --version`)

### Quick Start (using Makefile)

```bash
# 1. Install dependencies
make install

# 2. Build contracts + frontend
make build

# 3. Run all tests
make test

# 4. Start everything (Anvil + frontend dev server)
make dev
```

### Step-by-Step Setup

<details>
<summary><strong>Manual setup (without Makefile)</strong></summary>

```bash
# Clone & enter the repo
git clone <repo-url>
cd 07_buy_me_a_coffee_factory_by_antigravity

# Install frontend dependencies
cd frontend && npm install && cd ..

# Build contracts
cd contracts && forge build && cd ..

# Sync ABIs to frontend
node scripts/sync.js

# Start Anvil (local blockchain)
anvil

# In another terminal: deploy contracts
cd contracts && forge script script/Deploy.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --interactive 1

# Sync ABIs again (to pick up the deployed address)
cd .. && node scripts/sync.js

# Start the frontend
cd frontend && npm run dev
```

</details>

### Full List of Make Commands

Run `make help` to see all available commands:

| Command | What it does |
|---------|-------------|
| `make help` | Show all available commands |
| `make build` | Build everything (contracts + frontend) |
| `make build-contracts` | Compile Solidity contracts with Forge |
| `make build-frontend` | Build the Next.js frontend |
| `make test` | Run all tests (contracts + frontend) |
| `make test-contracts` | Run Forge contract tests |
| `make test-frontend` | Run Vitest frontend tests |
| `make typecheck` | Type-check frontend TypeScript |
| `make lint` | Lint frontend code |
| `make dev` | Start everything (Anvil + frontend dev server) |
| `make dev-frontend` | Start only the Next.js dev server |
| `make dev-contracts` | Start only the Anvil local blockchain |
| `make anvil` | Start Anvil in the background |
| `make start` | Build & serve frontend in production mode |
| `make deploy-anvil` | Deploy contracts to local Anvil chain |
| `make deploy-sepolia` | Deploy contracts to Sepolia testnet (needs .env) |
| `make sync-abis` | Sync ABIs + addresses from contracts to frontend |
| `make install` | Install all dependencies |
| `make install-frontend` | Install frontend npm dependencies |
| `make clean` | Remove all build artifacts |
| `make clean-all` | Clean everything including dependencies |
| `make clean-contracts` | Remove Forge build artifacts |
| `make clean-frontend` | Remove .next, out, and node_modules |
| `make clean-cache` | Clear Next.js + Forge caches only |
| `make clean-deps` | Remove all node_modules |
| `make reset` | Full clean + reinstall + build |
| `make status` | Show project status (deps, build artifacts, etc.) |

---

## Connecting MetaMask

1. Install the **MetaMask** browser extension
2. Add a custom network:
   - **Network Name:** Anvil Local
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
3. Import a test account using one of Anvil's private keys (printed when you start `anvil`)
4. Visit `http://localhost:3000` → click **"Launch Dashboard"** → Connect Wallet → Deploy Your Contract

---

## Environment Variables

Create a `.env` file in the project root (only needed for Sepolia deployment):

```bash
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
```

---

## Design System (Neo-Brutalist)

The UI uses a **neo-brutalist** aesthetic — bold borders, hard shadows, bright accent colors:

| Token | Color | Usage |
|-------|-------|-------|
| `neo-yellow` | `#facc15` | Primary actions, navbar background |
| `neo-pink` | `#f472b6` | Accent, deploy button, error states |
| `neo-cyan` | `#22d3ee` | Secondary accent, chart bars |
| `neo-green` | `#4ade80` | Success states |

Key visual traits:
- 4px solid black borders on all cards
- Hard box shadows (`8px 8px 0px 0px #000`)
- Hover effects: translate up-left + larger shadow
- Active effects: translate down-right + smaller shadow
- All caps, font-black headings

## Screenshots / Demo GIFs

> The following screenshots demonstrate the UI.

![Screenshot 1](./media/Screenshot%20from%202026-06-16%2020-24-27.png)
![Screenshot 2](./media/Screenshot%20from%202026-06-16%2020-24-37.png)
![Screenshot 3](./media/Screenshot%20from%202026-06-16%2020-24-44.png)
![Screenshot 4](./media/Screenshot%20from%202026-06-16%2020-25-16.png)
![Screenshot 5](./media/Screenshot%20from%202026-06-16%2020-25-40.png)
![Screenshot 6](./media/Screenshot%20from%202026-06-16%2020-25-46.png)
![Screenshot 7](./media/Screenshot%20from%202026-06-16%2020-26-09.png)


## Testing

### Contract Tests (8 tests)

```bash
make test-contracts            # or: cd contracts && forge test -vv
```

Covers: deployment, contract creation, buying coffee, withdrawal, edge cases (reverts for zero amount, empty name/message, non-owner withdraw, duplicate creation).

### Frontend Tests (41 tests)

```bash
make test-frontend             # or: cd frontend && npm run test
```

| File | Tests | What's Tested |
|------|-------|---------------|
| `Home.test.tsx` | 1 | Landing page renders heading, features, CTA |
| `Navbar.test.tsx` | 2 | Branding, wallet connect/disconnect |
| `Dashboard.test.tsx` | 19 | Deploy flow, analytics, memos, withdraw, loading states, error handling |
| `CreatorPage.test.tsx` | 19 | Tipping form, presets, custom amount, memo feed, creator offline, form submission |

### Type Checking

```bash
make typecheck                # or: cd frontend && npx tsc --noEmit
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `forge: command not found` | Install Foundry: `curl -L https://foundry.paradigm.xyz \| bash && foundryup` |
| `npm install` hangs | Run `make clean-deps && make install` |
| MetaMask can't connect | Make sure Anvil is running (`make anvil`) and MetaMask is on chain ID 31337 |
| Tests fail with "Cannot find module" | Run `make install-frontend` |
| ABI sync shows zero address | Deploy contracts first (`make deploy-anvil`), then `make sync-abis` |
| Chart warnings in tests | Normal — Recharts warns about zero-size containers in JSDOM, doesn't affect functionality |
| Hydration mismatch error | Check if a browser extension (like ColorZilla) is modifying the DOM. This is handled by `suppressHydrationWarning` on `<body>` |
| Frontend won't build | Run `make clean-frontend && make install-frontend && make build-frontend` |
| Stale data / cache issues | Run `make clean-cache` to clear Next.js + Forge caches |

---



1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `make test`
5. Commit: `git commit -m "feat: add my feature"`
6. Push: `git push origin feature/my-feature`
7. Open a Pull Request

---

## License

MIT License — use this however you want.


