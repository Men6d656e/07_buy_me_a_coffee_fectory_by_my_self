import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CreatorTippingPage from '../app/[creatorAddress]/page';
import React from 'react';

// ─── Mock data ───────────────────────────────────────────────
const MOCK_CREATOR_ADDRESS = '0x1111111111111111111111111111111111111111';
const MOCK_CONTRACT_ADDRESS = '0x2222222222222222222222222222222222222222';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const MOCK_MEMOS = [
  {
    sender: '0xaaaa',
    timestamp: BigInt('1700000000'),
    name: 'Alice',
    message: 'Great project!',
    amount: BigInt('1000000000000000'),
  },
  {
    sender: '0xbbbb',
    timestamp: BigInt('1700001000'),
    name: 'Bob',
    message: 'Love it!',
    amount: BigInt('2000000000000000'),
  },
];

// ─── Mocks ───────────────────────────────────────────────────
const mockAlert = vi.fn();
vi.spyOn(window, 'alert').mockImplementation(mockAlert);
vi.spyOn(console, 'error').mockImplementation(() => {}); // Suppress error noise in tests

const mockRefetchContractAddress = vi.fn();
const mockRefetchMemos = vi.fn();
const mockWriteContract = vi.fn();

let isConnected = true;
let coffeeContractRaw: `0x${string}` | typeof ZERO_ADDRESS = ZERO_ADDRESS;
let memosData: unknown = undefined;
let isContractLoading = false;
let isMemosLoading = false;
let isWritePending = false;
let pathname = '';

vi.mock('wagmi', () => ({
  useAccount: () => ({
    address: MOCK_CREATOR_ADDRESS,
    isConnected,
  }),
  useConnect: () => ({
    connect: vi.fn(),
    connectors: [],
  }),
  useDisconnect: () => ({ disconnect: vi.fn() }),
  useReadContract: ({ functionName }: { functionName: string }) => {
    if (functionName === 'getCoffeeContract') {
      return { data: coffeeContractRaw, refetch: mockRefetchContractAddress, isLoading: isContractLoading };
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
  useBalance: () => ({
    data: undefined,
    refetch: vi.fn(),
  }),
}));

Object.defineProperty(window, 'location', {
  get() {
    return { origin: 'http://localhost:3000', pathname };
  },
  configurable: true,
});

// ─── Tests ───────────────────────────────────────────────────
describe('Creator Tipping Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isConnected = true;
    coffeeContractRaw = ZERO_ADDRESS;
    memosData = undefined;
    isContractLoading = false;
    isMemosLoading = false;
    isWritePending = false;
    pathname = `/${MOCK_CREATOR_ADDRESS}`;
  });

  it('shows invalid URL message when address is missing', () => {
    pathname = '/invalid';
    render(<CreatorTippingPage />);
    expect(screen.getByText('Invalid Creator URL')).toBeInTheDocument();
  });

  it('shows creator header banner', () => {
    coffeeContractRaw = MOCK_CONTRACT_ADDRESS;
    render(<CreatorTippingPage />);
    expect(screen.getByText('Supporting Creator')).toBeInTheDocument();
  });

  it('shows creator offline when no contract deployed', () => {
    coffeeContractRaw = ZERO_ADDRESS;
    render(<CreatorTippingPage />);
    expect(screen.getByText('Creator Offline')).toBeInTheDocument();
  });

  it('shows tipping form when contract deployed', () => {
    coffeeContractRaw = MOCK_CONTRACT_ADDRESS;
    render(<CreatorTippingPage />);
    expect(screen.getByText('Buy a Coffee')).toBeInTheDocument();
  });

  it('shows preset tip buttons', () => {
    coffeeContractRaw = MOCK_CONTRACT_ADDRESS;
    render(<CreatorTippingPage />);
    // These appear as spans inside the buttons
    // These amounts appear inside tip buttons as span elements
    const amounts = screen.getAllByText('0.001 ETH');
    expect(amounts.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('0.003 ETH')).toBeInTheDocument();
    expect(screen.getByText('0.005 ETH')).toBeInTheDocument();
  });

  it('shows name and message inputs', () => {
    coffeeContractRaw = MOCK_CONTRACT_ADDRESS;
    render(<CreatorTippingPage />);
    expect(screen.getByPlaceholderText('e.g. Alice')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Keep up the amazing work!')).toBeInTheDocument();
  });

  it('shows supporter feed section', () => {
    coffeeContractRaw = MOCK_CONTRACT_ADDRESS;
    memosData = MOCK_MEMOS;
    render(<CreatorTippingPage />);
    expect(screen.getByText('Supporter Feed')).toBeInTheDocument();
  });

  it('shows memos in feed', () => {
    coffeeContractRaw = MOCK_CONTRACT_ADDRESS;
    memosData = MOCK_MEMOS;
    render(<CreatorTippingPage />);
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
    expect(screen.getByText(/Great project/)).toBeInTheDocument();
    expect(screen.getByText(/Love it/)).toBeInTheDocument();
  });

  it('shows empty feed message', () => {
    coffeeContractRaw = MOCK_CONTRACT_ADDRESS;
    memosData = [];
    render(<CreatorTippingPage />);
    expect(screen.getByText(/Be the first/)).toBeInTheDocument();
  });

  it('shows loading state for feed', () => {
    coffeeContractRaw = MOCK_CONTRACT_ADDRESS;
    isMemosLoading = true;
    render(<CreatorTippingPage />);
    expect(screen.getByText(/Loading feed/)).toBeInTheDocument();
  });

  it('toggles custom amount input', () => {
    coffeeContractRaw = MOCK_CONTRACT_ADDRESS;
    render(<CreatorTippingPage />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(screen.getByPlaceholderText('0.01')).toBeInTheDocument();
  });

  it('shows contract status badge when deployed', () => {
    coffeeContractRaw = MOCK_CONTRACT_ADDRESS;
    render(<CreatorTippingPage />);
    expect(screen.getByText(/Active/)).toBeInTheDocument();
  });

  it('calls writeContract when form is submitted', () => {
    coffeeContractRaw = MOCK_CONTRACT_ADDRESS;
    render(<CreatorTippingPage />);
    const submitBtn = screen.getByRole('button', { name: /Send Coffee/ });
    fireEvent.click(submitBtn);
    expect(mockWriteContract).toHaveBeenCalledTimes(1);
  });

  it('shows total support summary', () => {
    coffeeContractRaw = MOCK_CONTRACT_ADDRESS;
    render(<CreatorTippingPage />);
    expect(screen.getByText('Total Support:')).toBeInTheDocument();
  });

  it('shows Sending text when write is pending', () => {
    coffeeContractRaw = MOCK_CONTRACT_ADDRESS;
    isWritePending = true;
    render(<CreatorTippingPage />);
    expect(screen.getByText('Sending…')).toBeInTheDocument();
  });

  it('disables submit button when write is pending', () => {
    coffeeContractRaw = MOCK_CONTRACT_ADDRESS;
    isWritePending = true;
    render(<CreatorTippingPage />);
    const btn = screen.getByRole('button', { name: /Sending/ });
    expect(btn).toBeDisabled();
  });

  it('calls alert on tip submission error', () => {
    coffeeContractRaw = MOCK_CONTRACT_ADDRESS;
    mockWriteContract.mockImplementation((_config: unknown, callbacks: { onError?: (err: Error) => void }) => {
      callbacks.onError?.(new Error('Transaction rejected'));
    });
    render(<CreatorTippingPage />);
    const btn = screen.getByRole('button', { name: /Send Coffee/ });
    fireEvent.click(btn);
    expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('Tip transaction failed'));
  });

  it('shows memo and custom amount checkbox', () => {
    coffeeContractRaw = MOCK_CONTRACT_ADDRESS;
    render(<CreatorTippingPage />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByText(/Custom Amount/)).toBeInTheDocument();
  });

  it('shows contract status badge when not deployed', () => {
    coffeeContractRaw = ZERO_ADDRESS;
    render(<CreatorTippingPage />);
    expect(screen.getByText(/Inactive/)).toBeInTheDocument();
  });
});
