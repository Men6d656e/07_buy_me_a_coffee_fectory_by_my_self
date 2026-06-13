"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Coffee, Wallet, Power } from "lucide-react";

export function Navbar() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConnect = () => {
    if (connectors.length > 0) {
      connect({ connector: connectors[0] });
    } else {
      alert(
        "No injected wallet detected. Please install MetaMask or another Web3 wallet!",
      );
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b-4 border-black bg-neo-yellow px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 bg-white p-2 border-4 border-black shadow-[4px_4px_0px_0px_#000000] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000000] active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#000000] transition-all font-black text-xl md:text-2xl text-black"
        >
          <div className="bg-neo-pink p-1 border-2 border-black rounded-sm flex items-center justify-center">
            <Coffee className="h-6 w-6 text-black fill-current" />
          </div>
          <span className="hidden sm:inline tracking-tight">COFFEE ENGINE</span>
        </Link>

        {/* Navigation links */}
        <nav className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="font-bold text-black border-2 border-transparent hover:border-black hover:bg-white hover:shadow-neo-sm px-3 py-1.5 transition-all"
          >
            Dashboard
          </Link>

          {mounted &&
            (isConnected && address ? (
              <div className="flex items-center gap-2">
                <span className="hidden md:inline-block font-mono bg-white border-4 border-black px-3 py-1.5 text-sm font-bold shadow-[2px_2px_0px_0px_#000000] text-black">
                  {formatAddress(address)}
                </span>
                <button
                  onClick={() => disconnect()}
                  className="flex items-center gap-2 bg-neo-pink text-black font-black px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_#000000] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000000] active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#000000] transition-all cursor-pointer"
                >
                  <Power className="h-4 w-4" />
                  <span className="hidden sm:inline">Disconnect</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                className="flex items-center gap-2 bg-neo-cyan text-black font-black px-5 py-2 border-4 border-black shadow-[4px_4px_0px_0px_#000000] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000000] active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#000000] transition-all cursor-pointer"
              >
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </button>
            ))}
        </nav>
      </div>
    </header>
  );
}
