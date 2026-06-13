'use client';

/**
 * @file [creatorAddress]/page.tsx
 * @description Dynamic fan tipping page. Fans visit /[creatorAddress] to tip their favourite creators
 * directly on-chain. Looks up the creator's deployed BuyMeACoffee contract via the Factory registry.
 */

import React, { useEffect, useState } from 'react';
import { useReadContract, useWriteContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Navbar } from '@/components/Navbar';
import { Coffee, Send, User, MessageSquare, AlertTriangle } from 'lucide-react';

import { COFFEE_FACTORY_ADDRESS } from '@/constants/addresses';
import CoffeeFactoryJSON from '@/constants/abi/CoffeeFactory.json';
import BuyMeACoffeeJSON from '@/constants/abi/BuyMeACoffee.json';

const factoryAbi = CoffeeFactoryJSON.abi;
const coffeeAbi = BuyMeACoffeeJSON.abi;

/**
 * @interface MemoData
 * @description On-chain memo / tipping entry returned by getMemos()
 */
interface MemoData {
  sender: string;
  timestamp: bigint;
  name: string;
  message: string;
  amount: bigint;
}

export default function CreatorTippingPage() {
  const [mounted, setMounted] = useState(false);
  const [creatorAddress, setCreatorAddress] = useState<string>('');

  // Form state
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [coffeeCount, setCoffeeCount] = useState(1);
  const [customAmount, setCustomAmount] = useState('0.001');
  const [isCustom, setIsCustom] = useState(false);

  const { writeContract, isPending: isTxPending } = useWriteContract();

  /** Parse creator address from the URL path on mount */
  useEffect(() => {
    setMounted(true);
    const pathSegments = window.location.pathname.split('/');
    const addressParam = pathSegments[pathSegments.length - 1];
    if (addressParam && addressParam.startsWith('0x') && addressParam.length === 42) {
      setCreatorAddress(addressParam);
    }
  }, []);

  // Read the creator's deployed coffee contract from the Factory
  const {
    data: coffeeContractRaw,
    isLoading: isContractLoading,
    refetch: refetchContractAddress,
  } = useReadContract({
    address: COFFEE_FACTORY_ADDRESS as `0x${string}`,
    abi: factoryAbi,
    functionName: 'getCoffeeContract',
    args: creatorAddress ? [creatorAddress as `0x${string}`] : undefined,
    query: { enabled: !!creatorAddress },
  });

  const coffeeContractAddress = coffeeContractRaw as `0x${string}` | undefined;
  const isCoffeeContractDeployed =
    !!coffeeContractAddress &&
    coffeeContractAddress !== '0x0000000000000000000000000000000000000000';

  // Read memos from the creator's contract
  const {
    data: memosRaw,
    refetch: refetchMemos,
    isLoading: isMemosLoading,
  } = useReadContract({
    address: isCoffeeContractDeployed ? coffeeContractAddress : undefined,
    abi: coffeeAbi,
    functionName: 'getMemos',
    query: { enabled: isCoffeeContractDeployed },
  });

  const memos = (memosRaw as MemoData[] | undefined) ?? [];

  const handleRefresh = async () => {
    await refetchContractAddress();
    if (isCoffeeContractDeployed) await refetchMemos();
  };

  const getTipAmount = (): string => {
    if (isCustom) return customAmount;
    return (coffeeCount * 0.001).toString();
  };

  const handleSendTip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCoffeeContractDeployed || !coffeeContractAddress) return;

    const tipAmountEth = getTipAmount();
    if (!tipAmountEth || parseFloat(tipAmountEth) <= 0) {
      alert('Please specify a valid tip amount greater than 0.');
      return;
    }

    writeContract(
      {
        address: coffeeContractAddress,
        abi: coffeeAbi,
        functionName: 'buyCoffee',
        args: [name || 'Anonymous', message || 'Sent a coffee!'],
        value: parseEther(tipAmountEth),
      },
      {
        onSuccess: () => {
          alert('Tip submitted successfully! Thank you for your support. ☕');
          setName('');
          setMessage('');
          setTimeout(handleRefresh, 4000);
        },
        onError: (err) => {
          console.error(err);
          alert(`Tip transaction failed: ${err.message}`);
        },
      }
    );
  };

  const formatAddr = (addr: string) =>
    `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f0] text-black">
      <Navbar />

      <main className="flex-grow p-6 md:p-12 max-w-5xl mx-auto w-full">
        {/* Invalid address guard */}
        {!creatorAddress && (
          <div className="bg-neo-pink border-4 border-black p-12 text-center shadow-neo">
            <AlertTriangle className="h-16 w-16 mx-auto mb-6 text-black" />
            <h2 className="text-3xl font-black uppercase mb-4">Invalid Creator URL</h2>
            <p className="font-bold text-lg mb-4">
              The address provided in the URL path is invalid or missing.
            </p>
            <p className="font-semibold text-gray-700 text-sm">
              Format: <code className="bg-white border-2 border-black px-2 py-0.5">/0xYourAddress</code>
            </p>
          </div>
        )}

        {/* Valid creator page */}
        {creatorAddress && (
          <div className="space-y-12">

            {/* Creator header banner */}
            <div className="bg-white border-4 border-black p-6 md:p-8 shadow-neo flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-neo-yellow p-4 border-4 border-black shadow-neo-sm">
                  <User className="h-8 w-8 text-black" />
                </div>
                <div>
                  <span className="text-xs uppercase font-black tracking-widest text-gray-500">
                    Supporting Creator
                  </span>
                  <h1 className="text-2xl md:text-3xl font-black font-mono">
                    {formatAddr(creatorAddress)}
                  </h1>
                </div>
              </div>

              <div className="bg-neo-cyan px-4 py-2 border-4 border-black font-bold text-sm shadow-neo-sm">
                Contract:{' '}
                {isContractLoading
                  ? 'Checking…'
                  : isCoffeeContractDeployed
                  ? 'Active ✅'
                  : 'Inactive ❌'}
              </div>
            </div>

            {/* Creator offline warning */}
            {!isContractLoading && !isCoffeeContractDeployed && (
              <div className="bg-neo-yellow border-4 border-black p-12 text-center shadow-neo">
                <AlertTriangle className="h-16 w-16 mx-auto mb-6 text-black" />
                <h2 className="text-3xl font-black uppercase mb-4">Creator Offline</h2>
                <p className="font-bold text-lg max-w-md mx-auto mb-2">
                  This address has not deployed a BuyMeACoffee contract yet.
                </p>
                <p className="font-semibold text-gray-700">
                  Ask them to visit the Dashboard and launch their contract!
                </p>
              </div>
            )}

            {/* Tipping interface */}
            {isCoffeeContractDeployed && (
              <div className="grid md:grid-cols-5 gap-8 items-start">

                {/* Tipping form — 3/5 cols */}
                <div className="md:col-span-3 bg-white border-4 border-black p-6 md:p-8 shadow-neo">
                  <h2 className="text-2xl font-black uppercase mb-6 pb-2 border-b-4 border-black flex items-center gap-2">
                    <Coffee className="h-6 w-6" />
                    Buy a Coffee
                  </h2>

                  <form onSubmit={handleSendTip} className="space-y-6">
                    {/* Preset amount buttons */}
                    <div>
                      <label className="block text-sm font-black uppercase mb-3">
                        Choose Tipping Amount
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {([1, 3, 5] as const).map((count) => (
                          <button
                            key={count}
                            type="button"
                            onClick={() => { setIsCustom(false); setCoffeeCount(count); }}
                            className={`py-3 border-4 border-black font-black text-sm transition-all cursor-pointer ${
                              !isCustom && coffeeCount === count
                                ? 'bg-neo-yellow shadow-neo-sm -translate-x-[2px] -translate-y-[2px]'
                                : 'bg-white hover:bg-neo-yellow/20'
                            }`}
                          >
                            {'☕'.repeat(count).substring(0, count * 2)}
                            <span className="block font-mono text-xs text-gray-500 font-semibold mt-1">
                              {(count * 0.001).toFixed(3)} ETH
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom amount toggle */}
                    <div className="flex gap-3 items-center">
                      <input
                        type="checkbox"
                        id="customCheckbox"
                        checked={isCustom}
                        onChange={(e) => setIsCustom(e.target.checked)}
                        className="w-5 h-5 accent-black"
                      />
                      <label htmlFor="customCheckbox" className="font-black text-sm uppercase cursor-pointer select-none">
                        Custom Amount (ETH)
                      </label>
                    </div>

                    {isCustom && (
                      <div className="relative">
                        <input
                          type="number"
                          step="0.0001"
                          min="0.0001"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          className="w-full bg-[#fdfdfd] border-4 border-black p-3 font-mono font-bold focus:outline-none"
                          placeholder="0.01"
                        />
                        <span className="absolute right-4 top-3.5 font-black text-sm">ETH</span>
                      </div>
                    )}

                    {/* Supporter info */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-black uppercase mb-2">Your Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-[#fdfdfd] border-4 border-black p-3 font-bold focus:outline-none"
                          placeholder="e.g. Alice"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-black uppercase mb-2">Memo / Message</label>
                        <textarea
                          rows={4}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="w-full bg-[#fdfdfd] border-4 border-black p-3 font-bold focus:outline-none resize-none"
                          placeholder="e.g. Keep up the amazing work!"
                        />
                      </div>
                    </div>

                    {/* Tip summary */}
                    <div className="border-4 border-black bg-neo-cyan p-4 font-bold flex justify-between items-center">
                      <span>Total Support:</span>
                      <span className="font-mono text-xl bg-white border-2 border-black px-3 py-0.5 shadow-neo-sm">
                        {getTipAmount()} ETH
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isTxPending}
                      className="w-full flex items-center justify-center gap-2 bg-neo-pink text-black font-black text-lg py-4 border-4 border-black shadow-[6px_6px_0px_0px_#000000] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#000000] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                    >
                      <Send className="h-5 w-5" />
                      {isTxPending ? 'Sending…' : 'Send Coffee ☕'}
                    </button>
                  </form>
                </div>

                {/* Memo feed — 2/5 cols */}
                <div className="md:col-span-2 space-y-6">
                  <h3 className="text-xl font-black uppercase pb-2 border-b-4 border-black flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Supporter Feed
                  </h3>

                  {isMemosLoading ? (
                    <div className="text-center py-6 font-bold animate-pulse">Loading feed…</div>
                  ) : memos.length > 0 ? (
                    <div className="space-y-4 overflow-y-auto max-h-[600px] pr-1">
                      {[...memos].reverse().map((memo, idx) => (
                        <div key={idx} className="bg-white border-4 border-black p-4 shadow-neo-sm">
                          <div className="flex justify-between items-start mb-2 border-b border-dashed border-black pb-1">
                            <span className="font-black text-sm uppercase">☕ {memo.name}</span>
                            <span className="font-mono text-[10px] text-gray-500">
                              {new Date(Number(memo.timestamp) * 1000).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="font-bold text-gray-700 text-sm italic mb-2">
                            &ldquo;{memo.message}&rdquo;
                          </p>
                          <div className="bg-[#f4f4f0] p-1 border border-black text-right font-mono text-xs font-bold">
                            {formatEther(memo.amount)} ETH
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border-4 border-dashed border-black p-8 text-center text-gray-500 font-bold bg-white">
                      Be the first to leave a coffee! ☕
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
