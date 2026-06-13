"use client";

/**
 * @file dashboard/page.tsx
 * @description Creator dashboard — deploy a personalized BuyMeACoffee contract,
 * view Recharts analytics (persistent total revenue, tipping activity),
 * withdraw ETH, and browse all incoming memos.
 */

import React, { useEffect, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useBalance,
  useConnect,
} from "wagmi";
import { formatEther } from "viem";
import { Navbar } from "@/components/Navbar";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Coffee,
  ArrowUpRight,
  Coins,
  MessageSquare,
  Play,
  AlertCircle,
  RefreshCw,
  BarChart3,
} from "lucide-react";

import { COFFEE_FACTORY_ADDRESS } from "@/constants/addresses";
import CoffeeFactoryJSON from "@/constants/abi/CoffeeFactory.json";
import BuyMeACoffeeJSON from "@/constants/abi/BuyMeACoffee.json";

const factoryAbi = CoffeeFactoryJSON.abi;
const coffeeAbi = BuyMeACoffeeJSON.abi;

/**
 * @interface MemoData
 * @description On-chain memo struct from BuyMeACoffee.getMemos()
 */
interface MemoData {
  sender: string;
  timestamp: bigint;
  name: string;
  message: string;
  amount: bigint;
}

/**
 * @interface ChartPoint
 * @description Single data point used in Recharts analytics charts
 */
interface ChartPoint {
  date: string;
  tipAmount: number;
  cumulativeRevenue: number;
}

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const [mounted, setMounted] = useState(false);
  const [origin, setOrigin] = useState("");

  const { writeContract, isPending: isWritePending } = useWriteContract();

  useEffect(() => {
    setMounted(true);
    setOrigin(window.location.origin);
  }, []);

  /* ─── Contract reads ─────────────────────────────────────── */

  const {
    data: coffeeContractRaw,
    refetch: refetchContractAddress,
    isLoading: isContractLoading,
  } = useReadContract({
    address: COFFEE_FACTORY_ADDRESS as `0x${string}`,
    abi: factoryAbi,
    functionName: "getCoffeeContract",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const coffeeContractAddress = coffeeContractRaw as `0x${string}` | undefined;
  const isCoffeeContractDeployed =
    !!coffeeContractAddress &&
    coffeeContractAddress !== "0x0000000000000000000000000000000000000000";

  const { data: contractBalance, refetch: refetchBalance } = useBalance({
    address: isCoffeeContractDeployed ? coffeeContractAddress : undefined,
    query: { enabled: isCoffeeContractDeployed },
  });

  const { data: totalRevenueRaw, refetch: refetchRevenue } = useReadContract({
    address: isCoffeeContractDeployed ? coffeeContractAddress : undefined,
    abi: coffeeAbi,
    functionName: "totalRevenue",
    query: { enabled: isCoffeeContractDeployed },
  });

  const {
    data: memosRaw,
    refetch: refetchMemos,
    isLoading: isMemosLoading,
  } = useReadContract({
    address: isCoffeeContractDeployed ? coffeeContractAddress : undefined,
    abi: coffeeAbi,
    functionName: "getMemos",
    query: { enabled: isCoffeeContractDeployed },
  });

  /* ─── Computed values ────────────────────────────────────── */

  const memos = (memosRaw as MemoData[] | undefined) ?? [];
  const totalRevEth = totalRevenueRaw
    ? parseFloat(formatEther(totalRevenueRaw as bigint))
    : 0;
  const balanceEth = contractBalance
    ? parseFloat(formatEther(contractBalance.value))
    : 0;
  const totalWithdrawnEth = Math.max(0, totalRevEth - balanceEth);
  const totalTipsCount = memos.length;

  /** Build chart data sorted chronologically with cumulative revenue */
  const analyticsData: ChartPoint[] = React.useMemo(() => {
    const sorted = [...memos].sort(
      (a, b) => Number(a.timestamp) - Number(b.timestamp),
    );
    let cumulative = 0;
    return sorted.map((memo) => {
      const eth = parseFloat(formatEther(memo.amount));
      cumulative += eth;
      return {
        date: new Date(Number(memo.timestamp) * 1000).toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
          },
        ),
        tipAmount: eth,
        cumulativeRevenue: parseFloat(cumulative.toFixed(6)),
      };
    });
  }, [memos]);

  /* ─── Actions ────────────────────────────────────────────── */

  const handleRefresh = async () => {
    await refetchContractAddress();
    if (isCoffeeContractDeployed) {
      await Promise.all([refetchBalance(), refetchRevenue(), refetchMemos()]);
    }
  };

  const handleDeployContract = () => {
    writeContract(
      {
        address: COFFEE_FACTORY_ADDRESS as `0x${string}`,
        abi: factoryAbi,
        functionName: "createCoffeeContract",
      },
      {
        onSuccess: () => {
          alert("Deployment transaction submitted! Waiting for confirmation…");
          setTimeout(handleRefresh, 6000);
        },
        onError: (err) => {
          console.error(err);
          alert(`Deployment failed: ${err.message}`);
        },
      },
    );
  };

  const handleWithdraw = () => {
    if (!isCoffeeContractDeployed || !coffeeContractAddress) return;
    writeContract(
      {
        address: coffeeContractAddress,
        abi: coffeeAbi,
        functionName: "withdraw",
      },
      {
        onSuccess: () => {
          alert("Withdrawal transaction submitted!");
          setTimeout(handleRefresh, 5000);
        },
        onError: (err) => {
          console.error(err);
          alert(`Withdrawal failed: ${err.message}`);
        },
      },
    );
  };

  const handleConnectWallet = () => {
    if (connectors.length > 0) connect({ connector: connectors[0] });
  };

  if (!mounted) return null;

  /* ─── Render ─────────────────────────────────────────────── */

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f0] text-black">
      <Navbar />

      <main className="grow p-6 md:p-12 max-w-7xl mx-auto w-full">
        {/* ── Page header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight">
              Dashboard
            </h1>
            <p className="font-bold text-gray-700 mt-2">
              Deploy, monitor, and claim your decentralised tips.
            </p>
          </div>
          {isConnected && (
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-white px-4 py-2 border-4 border-black shadow-neo-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-neo active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#000000] font-black uppercase text-sm transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </button>
          )}
        </div>

        {/* ── Not connected ── */}
        {!isConnected && (
          <div className="bg-neo-pink border-4 border-black p-12 text-center shadow-neo">
            <AlertCircle className="h-16 w-16 mx-auto mb-6 text-black" />
            <h2 className="text-3xl font-black uppercase mb-4">
              Wallet Disconnected
            </h2>
            <p className="font-bold text-lg mb-8 max-w-md mx-auto">
              Connect your Ethereum wallet to access your creator dashboard.
            </p>
            <button
              onClick={handleConnectWallet}
              className="bg-neo-yellow text-black font-black text-lg px-8 py-4 border-4 border-black shadow-[8px_8px_0px_0px_#000000] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-[4px_4px_0px_0px_#000000] transition-all"
            >
              Connect Wallet
            </button>
          </div>
        )}

        {/* ── Connected — no contract deployed ── */}
        {isConnected && !isContractLoading && !isCoffeeContractDeployed && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-neo-yellow border-4 border-black p-8 md:p-12 shadow-neo flex flex-col justify-between">
              <div>
                <span className="inline-block bg-white border-2 border-black font-black text-xs px-3 py-1 uppercase tracking-wider mb-6">
                  Ready to launch
                </span>
                <h2 className="text-3xl md:text-5xl font-black uppercase leading-tight mb-6">
                  Create Your Coffee Contract
                </h2>
                <p className="font-bold bg-white/50 border-2 border-black p-4 mb-8">
                  Deploys a personalised tipping contract onto Ethereum. Your
                  supporters send ETH directly to this contract. You keep 100%.
                </p>
              </div>
              <button
                onClick={handleDeployContract}
                disabled={isWritePending}
                className="w-full flex items-center justify-center gap-2 bg-neo-pink text-black font-black text-xl py-5 border-4 border-black shadow-[8px_8px_0px_0px_#000000] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-[4px_4px_0px_0px_#000000] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
              >
                <Play className="h-6 w-6 fill-current" />
                {isWritePending ? "Deploying…" : "Deploy Coffee Contract"}
              </button>
            </div>

            <div className="bg-white border-4 border-black p-8 shadow-neo">
              <h3 className="text-2xl font-black uppercase mb-6 border-b-4 border-black pb-2">
                What Happens Next
              </h3>
              <ul className="space-y-4 font-bold text-sm">
                {[
                  "A personalised clone of BuyMeACoffee is instantiated on-chain.",
                  `Your address (${address?.substring(0, 10)}…) is set as the exclusive owner.`,
                  "The Factory registers your contract — your dashboard unlocks immediately.",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="shrink-0 bg-neo-cyan px-2 py-0.5 border-2 border-black font-mono">
                      {i + 1}
                    </div>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── Connected — contract deployed ── */}
        {isConnected && isCoffeeContractDeployed && (
          <div className="space-y-12">
            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  label: "Total Revenue Generated",
                  value: `${totalRevEth.toFixed(4)} ETH`,
                  colour: "bg-neo-yellow",
                  icon: <Coins className="h-6 w-6" />,
                  valueClass: "",
                },
                {
                  label: "Contract Balance (Pending)",
                  value: `${balanceEth.toFixed(4)} ETH`,
                  colour: "bg-neo-pink",
                  icon: <Coffee className="h-6 w-6" />,
                  valueClass: "text-neo-pink",
                },
                {
                  label: "Total ETH Withdrawn",
                  value: `${totalWithdrawnEth.toFixed(4)} ETH`,
                  colour: "bg-neo-cyan",
                  icon: <ArrowUpRight className="h-6 w-6" />,
                  valueClass: "text-neo-cyan",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white border-4 border-black p-6 shadow-neo flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs uppercase font-black tracking-widest text-gray-500">
                      {stat.label}
                    </span>
                    <h3
                      className={`text-3xl md:text-4xl font-black mt-2 font-mono ${stat.valueClass}`}
                    >
                      {stat.value}
                    </h3>
                  </div>
                  <div className={`${stat.colour} p-3 border-4 border-black`}>
                    {stat.icon}
                  </div>
                </div>
              ))}
            </div>

            {/* Withdraw + sharing */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Withdraw card */}
              <div className="bg-neo-pink border-4 border-black p-8 shadow-neo flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-black uppercase mb-4">
                    Withdraw Balance
                  </h3>
                  <p className="font-bold bg-white/40 border-2 border-black p-4 mb-6">
                    Available for withdrawal:{" "}
                    <strong className="font-mono text-lg">
                      {balanceEth.toFixed(4)} ETH
                    </strong>
                    .
                    <br />
                    The entire contract balance is transferred to your wallet in
                    a single transaction.{" "}
                    <em>Your historical revenue data is preserved.</em>
                  </p>
                </div>
                <button
                  onClick={handleWithdraw}
                  disabled={balanceEth === 0 || isWritePending}
                  className="w-full flex items-center justify-center gap-2 bg-neo-yellow text-black font-black text-lg py-4 border-4 border-black shadow-[6px_6px_0px_0px_#000000] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#000000] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                >
                  <ArrowUpRight className="h-5 w-5" />
                  {isWritePending
                    ? "Executing…"
                    : balanceEth === 0
                      ? "No Funds to Withdraw"
                      : "Withdraw ETH"}
                </button>
              </div>

              {/* Sharing card */}
              <div className="bg-neo-cyan border-4 border-black p-8 shadow-neo flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-black uppercase mb-4">
                    Your Tipping Page
                  </h3>
                  <p className="font-bold text-sm mb-6">
                    Share this link with your audience. They can tip you in ETH
                    and leave a message directly on-chain.
                  </p>
                  <div className="bg-white border-4 border-black p-4 font-mono font-bold text-sm mb-4 select-all break-all">
                    {origin}/{address}
                  </div>
                </div>
                <a
                  href={`/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-white text-black font-black text-lg py-4 border-4 border-black shadow-[6px_6px_0px_0px_#000000] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#000000] transition-all text-center"
                >
                  Open Tipping Page ↗
                </a>
              </div>
            </div>

            {/* Analytics charts */}
            <div className="bg-white border-4 border-black p-6 md:p-8 shadow-neo">
              <h3 className="text-2xl font-black uppercase mb-2 flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Analytics Suite
              </h3>
              <p className="text-sm font-bold text-gray-500 mb-8">
                Tip #{totalTipsCount} total &nbsp;·&nbsp; All data is on-chain
                and persists even after withdrawals.
              </p>

              {analyticsData.length > 0 ? (
                <div className="space-y-12">
                  {/* Chart 1: Cumulative Revenue — persistent even after withdrawals */}
                  <div>
                    <h4 className="text-base font-black uppercase mb-4 text-gray-700">
                      Cumulative Revenue Generated (ETH)
                    </h4>
                    <div className="h-72 w-full border-4 border-black p-2 bg-[#fdfdfd]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#000"
                            strokeOpacity={0.15}
                          />
                          <XAxis
                            dataKey="date"
                            stroke="#000"
                            tick={{ fontWeight: 700, fontSize: 11 }}
                          />
                          <YAxis
                            stroke="#000"
                            tick={{ fontWeight: 700, fontSize: 11 }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#fff",
                              border: "4px solid #000",
                              fontWeight: 700,
                              boxShadow: "4px 4px 0px 0px #000",
                            }}
                          />
                          <Legend wrapperStyle={{ fontWeight: 700 }} />
                          <Line
                            type="monotone"
                            name="Total Revenue (ETH)"
                            dataKey="cumulativeRevenue"
                            stroke="#f472b6"
                            strokeWidth={4}
                            dot={{
                              r: 5,
                              strokeWidth: 2,
                              stroke: "#000",
                              fill: "#f472b6",
                            }}
                            activeDot={{ r: 8, strokeWidth: 2, stroke: "#000" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2: Individual tip amounts */}
                  <div>
                    <h4 className="text-base font-black uppercase mb-4 text-gray-700">
                      Individual Tip Amounts (ETH)
                    </h4>
                    <div className="h-72 w-full border-4 border-black p-2 bg-[#fdfdfd]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#000"
                            strokeOpacity={0.15}
                          />
                          <XAxis
                            dataKey="date"
                            stroke="#000"
                            tick={{ fontWeight: 700, fontSize: 11 }}
                          />
                          <YAxis
                            stroke="#000"
                            tick={{ fontWeight: 700, fontSize: 11 }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#fff",
                              border: "4px solid #000",
                              fontWeight: 700,
                              boxShadow: "4px 4px 0px 0px #000",
                            }}
                          />
                          <Legend wrapperStyle={{ fontWeight: 700 }} />
                          <Bar
                            name="Tip Amount (ETH)"
                            dataKey="tipAmount"
                            fill="#22d3ee"
                            stroke="#000"
                            strokeWidth={2}
                            radius={[0, 0, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-4 border-dashed border-black p-12 text-center text-gray-500 font-bold">
                  No transactions yet — share your tipping link to receive your
                  first coffee!
                </div>
              )}
            </div>

            {/* Memo feed */}
            <div className="bg-white border-4 border-black p-6 md:p-8 shadow-neo">
              <h3 className="text-2xl font-black uppercase mb-6 pb-4 border-b-4 border-black flex items-center gap-2">
                <MessageSquare className="h-6 w-6" />
                Recent Memos ({totalTipsCount})
              </h3>

              {isMemosLoading ? (
                <div className="text-center py-6 font-bold animate-pulse">
                  Loading memos…
                </div>
              ) : memos.length > 0 ? (
                <div className="grid gap-6">
                  {[...memos].reverse().map((memo, idx) => (
                    <div
                      key={idx}
                      className="bg-[#fefeff] border-4 border-black p-6 shadow-neo-sm"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 border-b-2 border-dashed border-black pb-2">
                        <span className="font-black text-lg uppercase bg-neo-yellow px-2 py-0.5 border-2 border-black shadow-neo-sm">
                          ☕ {memo.name || "Anonymous"}
                        </span>
                        <span className="font-mono text-xs font-semibold text-gray-500">
                          {new Date(
                            Number(memo.timestamp) * 1000,
                          ).toLocaleString()}
                        </span>
                      </div>
                      <p className="font-bold text-gray-800 text-lg italic mb-4">
                        &ldquo;{memo.message || "Sent a silent coffee."}&rdquo;
                      </p>
                      <div className="flex items-center justify-between text-sm font-bold bg-[#f4f4f0] p-2 border-2 border-black">
                        <span className="font-mono text-xs truncate max-w-[200px] sm:max-w-none">
                          {memo.sender}
                        </span>
                        <span className="bg-neo-cyan px-2 py-0.5 border-2 border-black font-mono whitespace-nowrap">
                          {formatEther(memo.amount)} ETH
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 font-bold border-4 border-dashed border-black">
                  No memos received yet. Share your link!
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
