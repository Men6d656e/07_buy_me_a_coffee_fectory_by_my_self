import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Navbar } from '../components/Navbar';
import React from 'react';

// Mock wagmi
vi.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0x1234567890123456789012345678901234567890',
    isConnected: true,
  }),
  useConnect: () => ({
    connect: vi.fn(),
    connectors: [{ id: 'injected', name: 'Injected' }],
  }),
  useDisconnect: () => ({
    disconnect: vi.fn(),
  }),
}));

describe('Navbar Component', () => {
  it('renders the branding title', () => {
    render(<Navbar />);
    expect(screen.getByText('COFFEE ENGINE')).toBeInTheDocument();
  });

  it('renders the wallet status when connected', () => {
    render(<Navbar />);
    expect(screen.getByText('0x1234...7890')).toBeInTheDocument();
    expect(screen.getByText('Disconnect')).toBeInTheDocument();
  });
});
