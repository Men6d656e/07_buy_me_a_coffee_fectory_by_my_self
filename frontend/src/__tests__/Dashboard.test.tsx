import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardPage from '../app/dashboard/page';
import React from 'react';

// ─── Mock data ───────────────────────────────────────────────
const MOCK_CONNECTED_ADDRESS = '0x1111111111111111111111111111111111111111';
const MOCK_CONTRACT_ADDRESS = '0x2222222222222222222222222222222222222222';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const MOCK_MEMOS = [
  {
    sender: '0xaaaa',
    timestamp: BigInt('1700000000'),
    name: 'Alice',
    message: 'Great project!',
    amount: BigInt('1000000000000000'), // 0.001 ETH
  },
  {
    sender: '0xbbbb',
    timestamp: BigInt('1700001000'),
    name: 'Bob',
    message: 'Love it!',
    amount: BigInt('2000000000000000'), // 0.002 ETH
  },
];

// ─── Mocks ───────────────────────────────────────────────────
const mockAlert = vi.fn();
vi.spyOn(window, 'alert').mockImplementation(mockAlert);
vi.spyOn(console, 'error').mockImplementation(() => {}); // Suppress error noise in tests

const mockRefetchContractAddress = vi.fn();
const mockRefetchBalance = vi.fn();
const mockRefetchRevenue = vi.fn();
const mockRefetchMemos = vi.fn();
const mockWriteContract = vi.fn();
const mockConnect = vi.fn();

let isConnected = false;
let coffeeContractRaw: `0x${string}` | typeof ZERO_ADDRESS = ZERO_ADDRESS;
let contractBalanceData: { value: bigint } | undefined;
let totalRevenueData: bigint | undefined;
let memosData: unknown = undefined;
let isContractLoading = false;
let isMemosLoading = false;
let isWritePending = false;

vi.mock('wagmi', () => ({
  useAccount: () => ({
    address: isConnected ? MOCK_CONNECTED_ADDRESS : undefined,
    isConnected,
  }),
  useConnect: () => ({
    connect: mockConnect,
    connectors: [{ id: 'injected', name: 'Injected' }],
  }),
  useDisconnect: () => ({ disconnect: vi.fn() }),
  useReadContract: ({ functionName }: { functionName: string }) => {
    if (functionName === 'getCoffeeContract') {
      return { data: coffeeContractRaw, refetch: mockRefetchContractAddress, isLoading: isContractLoading };
    }
    if (functionName === 'totalRevenue') {
      return { data: totalRevenueData, refetch: mockRefetchRevenue };
    }
    if (functionName === 'getMemos') {
      return { data: memosData, refetch: mockRefetchMemos, isLoading: isMemosLoading };
    }
    return { data: undefined, refetch: vi.fn() };
  },
  useWriteContract: () => ({
    writeContract: mockWriteContract,
    isPending: isWritePending,
  }),
  useBalance: ({ address }: { address?: string }) => ({
    data: address ? contractBalanceData : undefined,
    refetch: mockRefetchBalance,
  }),
}));

Object.defineProperty(window, 'location', {
  value: { origin: 'http://localhost:3000' },
  writable: true,
});

// ─── Tests ───────────────────────────────────────────────────
describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isConnected = false;
    coffeeContractRaw = ZERO_ADDRESS;
    contractBalanceData = undefined;
    totalRevenueData = undefined;
    memosData = undefined;
    isContractLoading = false;
    isMemosLoading = false;
    isWritePending = false;
  });

  it('renders the dashboard heading', () => {
    render(<DashboardPage />);
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('shows wallet disconnected state when not connected', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Wallet Disconnected')).toBeInTheDocument();
    expect(screen.getByText('Connect your Ethereum wallet to access your creator dashboard.')).toBeInTheDocument();
  });

  it('shows deploy card when connected but no contract deployed', () => {
    isConnected = true;
    coffeeContractRaw = ZERO_ADDRESS;
    render(<DashboardPage />);
    expect(screen.getByText('Create Your Coffee Contract')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Deploy Coffee Contract/ })).toBeInTheDocument();
    expect(screen.getByText('What Happens Next')).toBeInTheDocument();
  });

  it('shows stat cards when contract is deployed', () => {
    isConnected = true;
    coffeeContractRaw = MOCK_CONTRACT_ADDRESS;
    contractBalanceData = { value: BigInt('500000000000000000') }; // 0.5 ETH
    totalRevenueData = BigInt('1000000000000000000'); // 1 ETH
    memosData = MOCK_MEMOS;
    render(<DashboardPage />);

    expect(screen.getByText('Total Revenue Generated')).toBeInTheDocument();
    expect(screen.getByText('Contract Balance (Pending)')).toBeInTheDocument();
    expect(screen.getByText('Total ETH Withdrawn')).toBeInTheDocument();
  });

  it('shows withdraw and tipping page when contract deployed', () => {
    isConnected = true;
    coffeeContractRaw = MOCK_CONTRACT_ADDRESS;
    contractBalanceData = { value: BigInt('500000000000000000') };
    totalRevenueData = BigInt('1000000000000000000');
    memosData = [];
    render(<DashboardPage />);

    expect(screen.getByRole('button', { name: /Withdraw ETH/ })).toBeInTheDocument();
    expect(screen.getByText('Your Tipping Page')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open Tipping Page/ })).toBeInTheDocument();
  });

  it('shows analytics when memos exist', () => {
    isConnected = true;
    coffeeContractRaw = MOCK_CONTRACT_ADDRESS;
    contractBalanceData = { value: BigInt('100000000000000') };
    totalRevenueData = BigInt('300000000000000');
    memosData = MOCK_MEMOS;
    render(<DashboardPage />);

    expect(screen.getByText('Analytics Suite')).toBeInTheDocument();
    expect(screen.getByText(/Cumulative Revenue Generated/)).toBeInTheDocument();
    expect(screen.getByText(/Individual Tip Amounts/)).toBeInTheDocument();
  });

  it('shows empty analytics when no memos', () => {
    isConnected = true;
    coffeeContractRaw = MOCK_CONTRACT_ADDRESS;
    contractBalanceData = { value: BigInt('0') };
    totalRevenueData = BigInt('0');
    memosData = [];
    render(<DashboardPage />);

    expect(screen.getByText(/No transactions yet/)).toBeInTheDocument();
  });

  it('shows memos feed when memos exist', () => {
    isConnected = true;
    coffeeContractRaw = MOCK_CONTRACT_ADDRESS;
    contractBalanceData = { value: BigInt('1000000000000000') };
    totalRevenueData = BigInt('3000000000000000');
    memosData = MOCK_MEMOS;
    render(<DashboardPage />);

    expect(screen.getByText(/Recent Memos/)).toBeInTheDocument();
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
    expect(screen.getByText(/Great project/)).toBeInTheDocument();
    expect(screen.getByText(/Love it/)).toBeInTheDocument();
  });

  it('shows empty memos when none exist', () => {
    isConnected = true;
    coffeeContractRaw = MOCK_CONTRACT_ADDRESS;
    contractBalanceData = { value: BigInt('0') };
    totalRevenueData = BigInt('0');
    memosData = [];
    render(<DashboardPage />);

    expect(screen.getByText(/No memos received yet/)).toBeInTheDocument();
  });

  it('calls connect when wallet button clicked', () => {
    render(<DashboardPage />);
    // The dashboard disconnected state has its own Connect Wallet button
    const buttons = screen.getAllByRole('button', { name: 'Connect Wallet' });
    const dashboardButton = buttons[buttons.length - 1];
    fireEvent.click(dashboardButton);
    expect(mockConnect).toHaveBeenCalled();
  });

  it('calls writeContract when deploy button is clicked', () => {
    isConnected = true;
    coffeeContractRaw = ZERO_ADDRESS;
    render(<DashboardPage />);
    const deployBtn = screen.getByRole('button', { name: /Deploy Coffee Contract/ });
    fireEvent.click(deployBtn);
    expect(mockWriteContract).toHaveBeenCalledTimes(1);
  });

  it('calls writeContract when withdraw button is clicked', () => {
    isConnected = true;
    coffeeContractRaw = MOCK_CONTRACT_ADDRESS;
    contractBalanceData = { value: BigInt('1000000000000000') };
    totalRevenueData = BigInt('1000000000000000');
    memosData = [];
    render(<DashboardPage />);
    const withdrawBtn = screen.getByRole('button', { name: /Withdraw ETH/ });
    fireEvent.click(withdrawBtn);
    expect(mockWriteContract).toHaveBeenCalledTimes(1);
  });

  it('shows refresh data button when connected', () => {
    isConnected = true;
    coffeeContractRaw = MOCK_CONTRACT_ADDRESS;
    contractBalanceData = { value: BigInt('0') };
    totalRevenueData = BigInt('0');
    memosData = [];
    render(<DashboardPage />);
    expect(screen.getByRole('button', { name: /Refresh Data/ })).toBeInTheDocument();
  });

  it('shows Deploying text when write is pending on deploy', () => {
    isConnected = true;
    coffeeContractRaw = ZERO_ADDRESS;
    isWritePending = true;
    render(<DashboardPage />);
    expect(screen.getByText('Deploying…')).toBeInTheDocument();
  });

  it('shows Executing text when write is pending on withdraw', () => {
    isConnected = true;
    coffeeContractRaw = MOCK_CONTRACT_ADDRESS;
    contractBalanceData = { value: BigInt('1000000000000000') };
    totalRevenueData = BigInt('1000000000000000');
    memosData = [];
    isWritePending = true;
    render(<DashboardPage />);
    expect(screen.getByText('Executing…')).toBeInTheDocument();
  });

  it('disables deploy button when write is pending', () => {
    isConnected = true;
    coffeeContractRaw = ZERO_ADDRESS;
    isWritePending = true;
    render(<DashboardPage />);
    const btn = screen.getByRole('button', { name: /Deploying/ });
    expect(btn).toBeDisabled();
  });

  it('calls alert on deployment error', () => {
    isConnected = true;
    coffeeContractRaw = ZERO_ADDRESS;
    mockWriteContract.mockImplementation((_config: unknown, callbacks: { onError?: (err: Error) => void }) => {
      callbacks.onError?.(new Error('User rejected'));
    });
    render(<DashboardPage />);
    const btn = screen.getByRole('button', { name: /Deploy Coffee Contract/ });
    fireEvent.click(btn);
    expect(mockAlert).toHaveBeenCalledWith('Deployment failed: User rejected');
  });

  it('calls alert on withdrawal error', () => {
    isConnected = true;
    coffeeContractRaw = MOCK_CONTRACT_ADDRESS;
    contractBalanceData = { value: BigInt('1000000000000000') };
    totalRevenueData = BigInt('1000000000000000');
    memosData = [];
    mockWriteContract.mockImplementation((_config: unknown, callbacks: { onError?: (err: Error) => void }) => {
      callbacks.onError?.(new Error('Insufficient funds'));
    });
    render(<DashboardPage />);
    const btn = screen.getByRole('button', { name: /Withdraw ETH/ });
    fireEvent.click(btn);
    expect(mockAlert).toHaveBeenCalledWith('Withdrawal failed: Insufficient funds');
  });

  it('shows disabled withdraw when zero balance', () => {
    isConnected = true;
    coffeeContractRaw = MOCK_CONTRACT_ADDRESS;
    contractBalanceData = { value: BigInt('0') };
    totalRevenueData = BigInt('0');
    memosData = [];
    render(<DashboardPage />);

    const withdrawBtn = screen.getByRole('button', { name: /No Funds to Withdraw/ });
    expect(withdrawBtn).toBeDisabled();
  });
});
