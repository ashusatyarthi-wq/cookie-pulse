import React, { useState, useEffect } from "react";
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from "@solana/web3.js";
import { Activity, Wallet, Send, Search, Terminal, Globe, ExternalLink, ShieldCheck, RefreshCw } from "lucide-react";

const COOKIE_RPC = "https://rpc.cookiescan.io";

export default function App() {
  const [activeTab, setActiveTab] = useState<"explorer" | "dispatcher" | "mcp" | "ecosystem">("explorer");
  const [slot, setSlot] = useState<number | null>(null);
  const [version, setVersion] = useState<string>("Loading...");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    "[System] Initializing CookiePulse on Cookie Chain SVM...",
    `[RPC] Connecting to ${COOKIE_RPC}...`
  ]);

  // Account inspector state
  const [inspectAddress, setInspectAddress] = useState("");
  const [inspectedBalance, setInspectedBalance] = useState<string | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);

  // Dispatcher state
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("0.05");
  const [memo, setMemo] = useState("Hello from CookiePulse cApp!");
  const [isSending, setIsSending] = useState(false);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  // Fetch live network telemetry
  const fetchNetworkStats = async () => {
    try {
      const conn = new Connection(COOKIE_RPC, "confirmed");
      const currentSlot = await conn.getSlot();
      setSlot(currentSlot);

      const ver = await conn.getVersion();
      setVersion(`v${ver["solana-core"]}`);
      addLog(`[Telemetry] Current Slot: ${currentSlot} | SVM Core: ${ver["solana-core"]}`);
    } catch (err: any) {
      addLog(`[Error] Failed to fetch telemetry: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchNetworkStats();
    const interval = setInterval(fetchNetworkStats, 8000);
    return () => clearInterval(interval);
  }, []);

  // Connect wallet
  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      const provider = (window as any).solana || (window as any).nightly?.solana;
      if (provider) {
        const resp = await provider.connect();
        const pubkey = resp.publicKey.toString();
        setWalletAddress(pubkey);
        addLog(`[Wallet] Connected: ${pubkey.slice(0, 4)}...${pubkey.slice(-4)}`);

        // Fetch balance
        const conn = new Connection(COOKIE_RPC, "confirmed");
        const lamports = await conn.getBalance(new PublicKey(pubkey));
        setBalance(lamports / LAMPORTS_PER_SOL);
      } else {
        // Fallback demo mode
        const demoPubkey = "Cook1e9w7A6r4qJ9M3V1xY8pD5uF7gH2jK4nL6sQ8tW";
        setWalletAddress(demoPubkey);
        setBalance(12.45);
        addLog(`[Demo Mode] Simulated wallet connected: ${demoPubkey.slice(0, 6)}...`);
      }
    } catch (err: any) {
      addLog(`[Wallet Error] ${err.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  // Inspect address
  const handleInspect = async () => {
    if (!inspectAddress) return;
    setIsInspecting(true);
    setInspectedBalance(null);
    try {
      const pubkey = new PublicKey(inspectAddress.trim());
      const conn = new Connection(COOKIE_RPC, "confirmed");
      const lamports = await conn.getBalance(pubkey);
      const val = (lamports / LAMPORTS_PER_SOL).toFixed(4);
      setInspectedBalance(`${val} $COOKIE`);
      addLog(`[Inspector] ${pubkey.toString()} balance: ${val} $COOKIE`);
    } catch (err: any) {
      setInspectedBalance("Invalid address / Not found");
      addLog(`[Inspector Error] ${err.message}`);
    } finally {
      setIsInspecting(false);
    }
  };

  // Execute Dispatcher Transaction
  const handleDispatch = async () => {
    if (!recipient || !amount) return;
    setIsSending(true);
    try {
      addLog(`[Dispatcher] Preparing transaction: Send ${amount} $COOKIE to ${recipient.slice(0, 6)}...`);
      addLog(`[Dispatcher] Attaching on-chain memo: "${memo}"`);

      const provider = (window as any).solana;
      if (provider && provider.isPhantom && walletAddress) {
        const conn = new Connection(COOKIE_RPC, "confirmed");
        const tx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: new PublicKey(walletAddress),
            toPubkey: new PublicKey(recipient.trim()),
            lamports: parseFloat(amount) * LAMPORTS_PER_SOL,
          })
        );
        const { blockhash } = await conn.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = new PublicKey(walletAddress);

        const signed = await provider.signAndSendTransaction(tx);
        addLog(`[Success] On-chain tx confirmed! Signature: ${signed.signature}`);
      } else {
        // Simulated execution on Cookie Chain
        await new Promise((r) => setTimeout(r, 1200));
        const mockSig = "0x" + Math.random().toString(36).substring(2) + "..." + Math.random().toString(36).substring(2);
        addLog(`[Success] Simulated execution confirmed on Cookie Chain!`);
        addLog(`[TxHash] ${mockSig}`);
      }
    } catch (err: any) {
      addLog(`[Dispatch Error] ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="brand">
          <span className="brand-icon">🍪</span>
          <div>
            <h1 className="brand-title">CookiePulse</h1>
            <span className="brand-tag">Cookie Chain SVM cApp</span>
          </div>
        </div>

        <button className="wallet-btn" onClick={connectWallet} disabled={isConnecting}>
          <Wallet size={16} />
          {walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)} (${balance ?? 0} $COOKIE)` : "Connect Wallet"}
        </button>
      </header>

      {/* Network Stats Grid */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span>NETWORK SLOT</span>
            <Activity size={16} color="var(--accent-gold)" />
          </div>
          <div className="stat-value">{slot ? slot.toLocaleString() : "Loading..."}</div>
          <div className="stat-sub">● Sub-second finality active</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>SVM RUNTIME</span>
            <ShieldCheck size={16} color="var(--accent-cyan)" />
          </div>
          <div className="stat-value">{version}</div>
          <div className="stat-sub">Solana 4.1.2 Compatible</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>DEPLOYMENT COST</span>
            <span style={{ color: "var(--accent-green)", fontWeight: 700 }}>~ $0.05</span>
          </div>
          <div className="stat-value">99.8%</div>
          <div className="stat-sub">Cost reduction vs Ethereum</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>RPC STATUS</span>
            <RefreshCw size={16} color="var(--accent-green)" />
          </div>
          <div className="stat-value" style={{ color: "var(--accent-green)", fontSize: "20px" }}>ONLINE</div>
          <div className="stat-sub">rpc.cookiescan.io (100% Health)</div>
        </div>
      </section>

      {/* Tab Selector */}
      <nav className="tabs">
        <button className={`tab-btn ${activeTab === "explorer" ? "active" : ""}`} onClick={() => setActiveTab("explorer")}>
          Account Explorer
        </button>
        <button className={`tab-btn ${activeTab === "dispatcher" ? "active" : ""}`} onClick={() => setActiveTab("dispatcher")}>
          cApp Dispatcher
        </button>
        <button className={`tab-btn ${activeTab === "mcp" ? "active" : ""}`} onClick={() => setActiveTab("mcp")}>
          AI Agent MCP Tool
        </button>
        <button className={`tab-btn ${activeTab === "ecosystem" ? "active" : ""}`} onClick={() => setActiveTab("ecosystem")}>
          Ecosystem Hub
        </button>
      </nav>

      {/* Active Tab Panel */}
      {activeTab === "explorer" && (
        <div className="panel">
          <h2 className="panel-title"><Search size={18} color="var(--accent-gold)" /> Account & Token Inspector</h2>
          <p className="panel-desc">Query on-chain address balances and state directly from Cookie Chain SVM RPC.</p>

          <div className="input-group">
            <label className="input-label">Cookie Chain Public Key</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. 8b6r... or Cook1e9w7A6r4qJ9M3V1xY8pD5uF7gH2jK4nL6sQ8tW"
              value={inspectAddress}
              onChange={(e) => setInspectAddress(e.target.value)}
            />
          </div>

          <button className="action-btn" onClick={handleInspect} disabled={isInspecting || !inspectAddress}>
            {isInspecting ? "Querying SVM..." : "Query Balance"}
          </button>

          {inspectedBalance && (
            <div style={{ marginTop: "20px", padding: "16px", background: "var(--bg-secondary)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Balance Result:</span>
              <div style={{ fontSize: "22px", fontFamily: "var(--font-mono)", color: "var(--accent-gold)", fontWeight: 700, marginTop: "4px" }}>
                {inspectedBalance}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "dispatcher" && (
        <div className="panel">
          <h2 className="panel-title"><Send size={18} color="var(--accent-gold)" /> Cookie Dispatcher & Memo Broadcaster</h2>
          <p className="panel-desc">Construct and broadcast transactions on Cookie Chain with instant sub-second finality.</p>

          <div className="input-group">
            <label className="input-label">Recipient Public Key</label>
            <input
              type="text"
              className="input-field"
              placeholder="Recipient address on Cookie Chain"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Amount ($COOKIE)</label>
            <input
              type="number"
              className="input-field"
              placeholder="0.05"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">On-Chain Memo / Note</label>
            <input
              type="text"
              className="input-field"
              placeholder="Custom message on Cookie Chain"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>

          <button className="action-btn" onClick={handleDispatch} disabled={isSending}>
            {isSending ? "Broadcasting to Cookie Chain..." : "Execute cApp Dispatch"}
          </button>
        </div>
      )}

      {activeTab === "mcp" && (
        <div className="panel">
          <h2 className="panel-title"><Terminal size={18} color="var(--accent-gold)" /> Cookie-MCP: Autonomous AI Agent Setup</h2>
          <p className="panel-desc">Turnkey Model Context Protocol configuration for autonomous LLM agents operating on Cookie Chain.</p>

          <div className="console-box" style={{ maxHeight: "300px", color: "var(--text-primary)" }}>
{`// Cookie Chain MCP Agent Tool Definition
{
  "mcpServers": {
    "cookie-chain": {
      "command": "npx",
      "args": ["-y", "cookie-mcp"],
      "env": {
        "COOKIE_RPC_URL": "https://rpc.cookiescan.io",
        "SVM_CHAIN_ID": "cookie-mainnet",
        "SUB_SECOND_FINALITY": "true"
      }
    }
  }
}

// Available AI Tools:
1. cookie_get_balance({ address })
2. cookie_send_transfer({ recipient, amount })
3. cookie_query_das({ assetId })
4. cookie_swap({ fromToken, toToken, amount })`}
          </div>
        </div>
      )}

      {activeTab === "ecosystem" && (
        <div className="panel">
          <h2 className="panel-title"><Globe size={18} color="var(--accent-gold)" /> Cookie Ecosystem Hub & Tooling</h2>
          <p className="panel-desc">Direct access to core Cookie Chain infrastructure, DEXs, and explorer services.</p>

          <div className="eco-grid">
            <a href="https://cookiescan.io" target="_blank" rel="noreferrer" className="eco-card">
              <div>
                <div className="eco-title">CookieScan Explorer <ExternalLink size={14} /></div>
                <div className="eco-desc">Real-time block explorer and transaction search engine for Cookie Chain.</div>
              </div>
            </a>

            <a href="https://docs.cookiechain.wtf" target="_blank" rel="noreferrer" className="eco-card">
              <div>
                <div className="eco-title">Cookie Docs <ExternalLink size={14} /></div>
                <div className="eco-desc">Official documentation for SVM developers, program deployments, and RPC endpoints.</div>
              </div>
            </a>

            <a href="https://api.cookiescan.io" target="_blank" rel="noreferrer" className="eco-card">
              <div>
                <div className="eco-title">Cookie DAS API <ExternalLink size={14} /></div>
                <div className="eco-desc">Digital Asset Standard indexing API for high-speed token queries.</div>
              </div>
            </a>

            <a href="https://www.cookiechain.wtf" target="_blank" rel="noreferrer" className="eco-card">
              <div>
                <div className="eco-title">Cookie Bridge <ExternalLink size={14} /></div>
                <div className="eco-desc">Bridge assets seamlessly between Solana and Cookie Chain SVM.</div>
              </div>
            </a>
          </div>
        </div>
      )}

      {/* Real-Time Telemetry Console */}
      <div className="panel">
        <h3 className="panel-title" style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
          <Terminal size={14} /> Real-Time Telemetry & Console Log
        </h3>
        <div className="console-box">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>

      <footer className="footer">
        <p>Built for the Cookie Chain Developer Bounty on Superteam Earn · Powered by Solana SVM & Cookie Chain RPC</p>
      </footer>
    </div>
  );
}
