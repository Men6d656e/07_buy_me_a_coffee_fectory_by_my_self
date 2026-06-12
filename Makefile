-include .env

# ─────────────────────────────────────────────
#  Coffee Factory — Makefile
#  Run `make help` to see all available commands
# ─────────────────────────────────────────────

.PHONY: help build build-contracts build-frontend test test-contracts test-frontend \
        lint typecheck dev dev-contracts dev-frontend start \
        deploy-anvil deploy-sepolia sync-abis \
        clean clean-all clean-contracts clean-frontend clean-cache clean-deps \
        install install-frontend install-contracts \
        status reset anvil

# ─── Help ────────────────────────────────────

help: ## Show all available commands
	@echo ""
	@echo "  ☕ Buy Me A Coffee Factory — Available Commands"
	@echo "  ─────────────────────────────────────────────────"
	@echo ""
	@echo "  🏗️  Build"
	@echo "    make build              Build everything (contracts + frontend)"
	@echo "    make build-contracts    Compile Solidity contracts with Forge"
	@echo "    make build-frontend     Build the Next.js frontend"
	@echo ""
	@echo "  🧪 Test"
	@echo "    make test               Run all tests (contracts + frontend)"
	@echo "    make test-contracts     Run Forge contract tests"
	@echo "    make test-frontend      Run Vitest frontend tests"
	@echo "    make typecheck          Type-check frontend TypeScript"
	@echo "    make lint               Lint frontend code"
	@echo ""
	@echo "  🚀 Run"
	@echo "    make dev                Start everything (Anvil + frontend dev server)"
	@echo "    make dev-frontend       Start only the Next.js dev server"
	@echo "    make dev-contracts      Start only the Anvil local blockchain"
	@echo "    make anvil              Start Anvil in the background"
	@echo "    make start              Build & serve frontend in production mode"
	@echo ""
	@echo "  📦 Deploy"
	@echo "    make deploy-anvil       Deploy contracts to local Anvil chain"
	@echo "    make deploy-sepolia     Deploy contracts to Sepolia testnet"
	@echo "    make sync-abis          Sync ABIs + addresses from contracts → frontend"
	@echo ""
	@echo "  📥 Install"
	@echo "    make install            Install all dependencies (frontend)"
	@echo "    make install-frontend   Install frontend npm dependencies"
	@echo ""
	@echo "  🧹 Clean"
	@echo "    make clean              Remove build artifacts (contracts + frontend)"
	@echo "    make clean-all          Clean everything including dependencies"
	@echo "    make clean-contracts    Remove Forge build artifacts"
	@echo "    make clean-frontend     Remove .next, out, and node_modules"
	@echo "    make clean-cache        Clear Next.js + Forge caches only"
	@echo "    make clean-deps         Remove all node_modules"
	@echo ""
	@echo "  🔄 Reset"
	@echo "    make reset              Full clean + reinstall + build"
	@echo ""
	@echo "  📊 Status"
	@echo "    make status             Show project status (deps, build artifacts, etc.)"
	@echo ""

# ─── Build ───────────────────────────────────

build: build-contracts build-frontend ## Build everything (contracts + frontend)

build-contracts: ## Compile Solidity contracts with Forge
	@echo "🔨 Building contracts..."
	cd contracts && forge build
	@echo "✅ Contracts compiled."

build-frontend: ## Build the Next.js frontend
	@echo "🔨 Building frontend..."
	cd frontend && npm run build
	@echo "✅ Frontend built."

# ─── Test ────────────────────────────────────

test: test-contracts test-frontend ## Run all tests (contracts + frontend)

test-contracts: build-contracts ## Run Forge contract tests
	@echo "🧪 Running contract tests..."
	cd contracts && forge test -vv
	@echo "✅ Contract tests done."

test-frontend: build-contracts sync-abis ## Run Vitest frontend tests
	@echo "🧪 Running frontend tests..."
	cd frontend && npm run test
	@echo "✅ Frontend tests done."

typecheck: ## Type-check frontend TypeScript
	@echo "🔍 Type-checking frontend..."
	cd frontend && npx tsc --noEmit
	@echo "✅ No type errors."

lint: ## Lint frontend code
	@echo "🔍 Linting frontend..."
	cd frontend && npm run lint
	@echo "✅ Lint passed."

# ─── Run ─────────────────────────────────────

dev: dev-contracts dev-frontend ## Start everything (Anvil + frontend dev server)
	@echo ""
	@echo "🚀 All services running!"
	@echo "   Anvil:     http://127.0.0.1:8545"
	@echo "   Frontend:  http://localhost:3000"

dev-frontend: ## Start the Next.js dev server
	@echo "🚀 Starting frontend dev server..."
	cd frontend && npm run dev

dev-contracts: anvil ## Start Anvil local blockchain
	@echo "🚀 Anvil running at http://127.0.0.1:8545"

anvil: ## Start Anvil in the background
	@echo "🚀 Starting Anvil local blockchain..."
	anvil &

start: build-frontend ## Build & serve frontend in production mode
	@echo "🚀 Starting production server..."
	cd frontend && npm run start

# ─── Deploy ──────────────────────────────────

deploy-anvil: build-contracts ## Deploy contracts to local Anvil chain
	@echo "📦 Deploying to Anvil..."
	cd contracts && forge script script/Deploy.s.sol \
		--rpc-url http://127.0.0.1:8545 \
		--broadcast \
		--interactives 1
	@echo "🔄 Syncing ABIs..."
	node scripts/sync.js
	@echo "✅ Deployed to Anvil + ABIs synced."

deploy-sepolia: build-contracts ## Deploy contracts to Sepolia testnet (needs .env)
	@echo "📦 Deploying to Sepolia..."
	cd contracts && forge script script/Deploy.s.sol \
		--rpc-url $(RPC_URL) \
		--broadcast \
		--interactives 1 \
		--verify \
		--etherscan-api-key $(ETHERSCAN_API_KEY)
	@echo "🔄 Syncing ABIs..."
	node scripts/sync.js
	@echo "✅ Deployed to Sepolia + ABIs synced."

sync-abis: build-contracts ## Sync ABIs + addresses from contracts → frontend
	@echo "🔄 Syncing ABIs..."
	node scripts/sync.js
	@echo "✅ ABIs synced to frontend."

# ─── Install ─────────────────────────────────

install: install-frontend ## Install all dependencies
	@echo "✅ All dependencies installed."

install-frontend: ## Install frontend npm dependencies
	@echo "📥 Installing frontend dependencies..."
	cd frontend && npm install
	@echo "✅ Frontend dependencies installed."

# ─── Clean ───────────────────────────────────

clean: clean-contracts clean-frontend clean-cache ## Remove all build artifacts
	@echo "✅ All build artifacts cleaned."

clean-all: clean clean-deps ## Clean everything including dependencies
	@echo "✅ Full clean complete. Run 'make install' to reinstall."

clean-contracts: ## Remove Forge build artifacts
	@echo "🧹 Cleaning contract artifacts..."
	rm -rf contracts/out contracts/cache contracts/broadcast
	@echo "✅ Contract artifacts cleaned."

clean-frontend: ## Remove Next.js build output and node_modules
	@echo "🧹 Cleaning frontend build output..."
	rm -rf frontend/.next frontend/out frontend/node_modules
	@echo "✅ Frontend cleaned."

clean-cache: ## Clear Next.js + Forge caches only
	@echo "🧹 Clearing caches..."
	rm -rf frontend/.next contracts/cache
	@echo "✅ Caches cleared."

clean-deps: ## Remove all node_modules
	@echo "🧹 Removing node_modules..."
	rm -rf node_modules frontend/node_modules
	@echo "✅ Dependencies removed."

# ─── Reset ───────────────────────────────────

reset: clean-all install build ## Full reset: clean → install → build
	@echo ""
	@echo "🔄 Full reset complete!"
	@echo "   Run 'make dev' to start the application."

# ─── Status ──────────────────────────────────

status: ## Show project status
	@echo ""
	@echo "  ☕ Buy Me A Coffee Factory — Project Status"
	@echo "  ─────────────────────────────────────────────"
	@echo ""
	@# Check Node.js
	@command -v node >/dev/null 2>&1 && echo "  ✅ Node.js: $$(node --version)" || echo "  ❌ Node.js: not installed"
	@# Check Foundry
	@command -v forge >/dev/null 2>&1 && echo "  ✅ Foundry: $$(forge --version 2>&1 | head -1)" || echo "  ❌ Foundry: not installed"
	@# Check Anvil running
	@curl -s http://127.0.0.1:8545 >/dev/null 2>&1 && echo "  ✅ Anvil: running on port 8545" || echo "  ⚠️  Anvil: not running (run 'make anvil' to start)"
	@# Check frontend deps
	@test -d frontend/node_modules && echo "  ✅ Frontend deps: installed" || echo "  ❌ Frontend deps: not installed (run 'make install')"
	@# Check contract artifacts
	@test -d contracts/out && echo "  ✅ Contract artifacts: built" || echo "  ⚠️  Contract artifacts: not built (run 'make build-contracts')"
	@# Check ABI sync
	@test -f frontend/src/constants/abi/CoffeeFactory.json && echo "  ✅ ABIs: synced" || echo "  ⚠️  ABIs: not synced (run 'make sync-abis')"
	@# Check .env
	@test -f .env && echo "  ✅ .env: present" || echo "  ⚠️  .env: not found (needed for Sepolia deployment)"
	@echo ""
