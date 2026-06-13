import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '../app/page';
import React from 'react';

// Mock wagmi Navbar dependencies
vi.mock('wagmi', () => ({
  useAccount: () => ({
    address: null,
    isConnected: false,
  }),
  useConnect: () => ({
    connect: vi.fn(),
    connectors: [],
  }),
  useDisconnect: () => ({
    disconnect: vi.fn(),
  }),
}));

describe('Home Component', () => {
  it('renders landing title and descriptions', () => {
    render(<Home />);
    
    // Check main heading
    expect(screen.getByText('Buy Me A Coffee')).toBeInTheDocument();
    
    // Check buttons
    expect(screen.getByText('Launch Dashboard')).toBeInTheDocument();
    
    // Check key features
    expect(screen.getByText('One-Click Factory')).toBeInTheDocument();
    expect(screen.getByText('Analytics Suite')).toBeInTheDocument();
    expect(screen.getByText('Direct Ownership')).toBeInTheDocument();
  });
});
