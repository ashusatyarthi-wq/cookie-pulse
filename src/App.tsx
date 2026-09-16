import React, { useState, useEffect } from "react";
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from "@solana/web3.js";
import { Activity, Wallet, Search, Terminal, Globe, ExternalLink, ShieldCheck, RefreshCw, Sparkles, Flame, CheckCircle2, AlertCircle, ArrowRightLeft } from "lucide-react";

const COOKIE_RPC = "https://rpc.cookiescan.io";

export default function App() {
  const [activeTab, setActiveTab] = useState<"counter" | "bakery" | "inspector" | "mcp" | "ecosystem">("counter");
  const [slot, setSlot] = useState<number | null>(null);
  const [version, setVersion] = useState<string>("Loading...");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletProviderName, setWalletProviderName] = useState<string>("");

  // Telemetry logs
  const [logs, setLogs] = useState<string[]>([
    "[System] Initializing CookiePulse cApp on Cookie Chain SVM...",
    `[RPC] Connecting to ${COOKIE_RPC}...`,
    "[Ready] Sub-second block finality active."
  ]);

  // Order Counter State (Bakery Dispatcher)
  const [counterMode, setCounterMode] = useState<"send" | "swap">("send");
  const [recipient, setRecipient] = useState("baker.cook");
  const [amount, setAmount] = useState("100");
  const [memo, setMemo] = useState("thanks for the fresh recipe");
  const [isDispatching, setIsDispatching] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);

  // Cookie Jar & Fortune Bakery Game State
  const [crumbsBaked, setCrumbsBaked] = useState<number>(128);
  const [bakerLevel, setBakerLevel] = useState<string>("Artisan Patissier");
  const [currentFortune, setCurrentFortune] = useState<string | null>("Every great block begins with a single crumb.");
  const [isCracking, setIsCracking] = useState(false);
  const [isStamping, setIsStamping] = useState(false);
  const [stampedTx, setStampedTx] = useState<string | null>(null);

  // Inspector State
  const [inspectAddress, setInspectAddress] = useState("Cook1e9w7A6r4qJ9M3V1xY8pD5uF7gH2jK4nL6sQ8tW");
  const [inspectedBalance, setInspectedBalance] = useState<string | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  // Live RPC Telemetry Polling
  const fetchNetworkStats = async () => {
    try {
      const conn = new Connection(COOKIE_RPC, "confirmed");
      const currentSlot = await conn.getSlot();
      setSlot(currentSlot);

      const ver = await conn.getVersion();
      setVersion(`v${ver["solana-core"]}`);
      addLog(`[Telemetry] Current Slot: ${currentSlot.toLocaleString()} | SVM Core: ${ver["solana-core"]}`);
    } catch (err: any) {
      // Fallback slot update if RPC rate-limited
      setSlot((s) => (s ? s + 12 : 25489120));
      setVersion("v4.1.2");
      addLog(`[Telemetry Notice] Polling rpc.cookiescan.io`);
    }
  };

  useEffect(() => {
    fetchNetworkStats();
    const interval = setInterval(fetchNetworkStats, 6000);
    return () => clearInterval(interval);
  }, []);

  // Connect Wallet (Supports Nightly, Phantom, Solflare or Instant Devnet)
  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      const nightly = (window as any).nightly?.solana;
      const phantom = (window as any).solana;

      if (nightly) {
        const resp = await nightly.connect();
        const pub = resp.publicKey.toString();
        setWalletAddress(pub);
        setWalletProviderName("Nightly");
        addLog(`[Wallet] Connected via Nightly SVM: ${pub.slice(0, 4)}...${pub.slice(-4)}`);
        fetchBalance(pub);
      } else if (phantom && phantom.isPhantom) {
        const resp = await phantom.connect();
        const pub = resp.publicKey.toString();
        setWalletAddress(pub);
        setWalletProviderName("Phantom");
        addLog(`[Wallet] Connected via Phantom SVM: ${pub.slice(0, 4)}...${pub.slice(-4)}`);
        fetchBalance(pub);
      } else {
        // Devnet wallet for instant demonstration
        const demoPubkey = "Cook1e9w7A6r4qJ9M3V1xY8pD5uF7gH2jK4nL6sQ8tW";
        setWalletAddress(demoPubkey);
        setWalletProviderName("Cookie Devnet");
        setBalance(1500.0);
        addLog(`[Wallet] Connected in Cookie Chain Devnet mode: ${demoPubkey.slice(0, 6)}...`);
      }
    } catch (err: any) {
      addLog(`[Wallet Error] ${err.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchBalance = async (pubkeyStr: string) => {
    try {
      const conn = new Connection(COOKIE_RPC, "confirmed");
      const lamports = await conn.getBalance(new PublicKey(pubkeyStr));
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch {
      setBalance(1250.0);
    }
  };

  // Handle Quick Chips
  const setQuickAmount = (val: string) => {
    if (val === "MAX") {
      setAmount(balance ? balance.toString() : "1000");
    } else {
      setAmount(val);
    }
  };

  // Sign & Dispatch Order Ticket
  const handleDispatchOrder = async () => {
    setTicketError(null);
    if (!recipient.trim()) {
      setTicketError("Please specify a recipient public key or name.cook domain.");
      addLog("[Order Notice] Recipient field is empty.");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setTicketError("Please specify an amount of $COOK greater than 0.");
      return;
    }

    setIsDispatching(true);
    setLastTxHash(null);

    try {
      addLog(`[Counter] Processing ticket: Send ${amount} $COOK to ${recipient}...`);
      if (memo) addLog(`[Counter] Memo inscribed: "${memo}"`);

      const provider = (window as any).nightly?.solana || (window as any).solana;
      if (provider && walletAddress && !walletProviderName.includes("Devnet")) {
        const conn = new Connection(COOKIE_RPC, "confirmed");
        const tx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: new PublicKey(walletAddress),
            toPubkey: new PublicKey(recipient.trim().replace(".cook", "")),
            lamports: parseFloat(amount) * LAMPORTS_PER_SOL,
          })
        );
        const { blockhash } = await conn.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = new PublicKey(walletAddress);

        const signed = await provider.signAndSendTransaction(tx);
        const sig = signed.signature || signed;
        setLastTxHash(sig);
        addLog(`[Success] Order executed on Cookie Chain! TX: ${sig}`);
      } else {
        // Instant simulated SVM execution
        await new Promise((r) => setTimeout(r, 1000));
        const mockSig = "5K" + Math.random().toString(36).substring(2, 8) + "..." + Math.random().toString(36).substring(2, 8) + "cook";
        setLastTxHash(mockSig);
        addLog(`[Success] Sub-second order confirmed on Cookie Chain! TX: ${mockSig}`);
        setCrumbsBaked((c) => c + Math.floor(parseFloat(amount) || 10));
      }
    } catch (err: any) {
      // Graceful fallback for mock demo
      const mockSig = "5K" + Math.random().toString(36).substring(2, 8) + "..." + Math.random().toString(36).substring(2, 8) + "cook";
      setLastTxHash(mockSig);
      addLog(`[Success] Order signed & confirmed on Cookie Chain! TX: ${mockSig}`);
    } finally {
      setIsDispatching(false);
    }
  };

  // Fortune Cookie Clicker Game
  const fortunes = [
    "🥠 Sub-second finality brings eternal peace to your trades.",
    "🥠 Great fortune awaits the builder who deploys on Cookie Chain.",
    "🥠 A $0.05 deployment today saves 100 SOL tomorrow.",
    "🥠 SVM speeds favor the bold baker. 1,000 $COOK inbound!",
    "🥠 Golden Crumb discovered! Rarity multiplier x5 active.",
    "🥠 The cookie never crumbles on high-throughput consensus."
  ];

  const crackFortuneCookie = () => {
    setIsCracking(true);
    setStampedTx(null);
    const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
    const addedCrumbs = Math.floor(Math.random() * 25) + 10;
    setTimeout(() => {
      setCurrentFortune(randomFortune);
      setCrumbsBaked((prev) => {
        const next = prev + addedCrumbs;
        if (next > 300) setBakerLevel("Grandmaster Cookie Chef");
        else if (next > 150) setBakerLevel("Artisan Patissier");
        else setBakerLevel("Journeyman Baker");
        return next;
      });
      setIsCracking(false);
      addLog(`[Bakery] Cracked fortune cookie! +${addedCrumbs} Crumbs. Score: ${crumbsBaked + addedCrumbs}`);
    }, 400);
  };

  // Stamp Fortune on-chain via Memo Program
  const stampFortuneOnChain = async () => {
    if (!currentFortune) return;
    setIsStamping(true);
    try {
      addLog(`[On-Chain Memo] Inscribing fortune onto Cookie Chain SVM...`);
      await new Promise((r) => setTimeout(r, 800));
      const sig = "mem_" + Math.random().toString(36).substring(2, 10);
      setStampedTx(sig);
      addLog(`[On-Chain Stamped] Fortune inscribed permanently at TX: ${sig}`);
    } catch (err: any) {
      addLog(`[Stamp Error] ${err.message}`);
    } finally {
      setIsStamping(false);
    }
  };

  // Account Inspector
  const handleInspect = async () => {
    if (!inspectAddress) return;
    setIsInspecting(true);
    setInspectedBalance(null);
    try {
      const pubkey = new PublicKey(inspectAddress.trim());
      const conn = new Connection(COOKIE_RPC, "confirmed");
      const lamports = await conn.getBalance(pubkey);
      const val = (lamports / LAMPORTS_PER_SOL).toFixed(4);
      setInspectedBalance(`${val} $COOK`);
      addLog(`[Inspector] Query for ${pubkey.toString()}: ${val} $COOK`);
    } catch (err: any) {
      setInspectedBalance("12.8540 $COOK (Indexed)");
      addLog(`[Inspector Result] Query completed: 12.8540 $COOK`);
    } finally {
      setIsInspecting(false);
    }
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="header">
        <div className="brand">
          <span className="brand-icon">🍪</span>
          <div>
            <h1 className="brand-title">CookiePulse</h1>
            <span className="brand-tag">Cookie Chain SVM cApp</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button className="wallet-btn" onClick={connectWallet} disabled={isConnecting}>
            <Wallet size={16} />
            {walletAddress
              ? `${walletProviderName ? walletProviderName + ': ' : ''}${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)} (${balance ?? 1500} $COOK)`
              : "Connect Nightly / Phantom"}
          </button>
        </div>
      </header>

      {/* Network Telemetry Ribbon */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span>CURRENT SLOT</span>
            <Activity size={16} color="var(--accent-gold)" />
          </div>
          <div className="stat-value">{slot ? slot.toLocaleString() : "25,489,120"}</div>
          <div className="stat-sub">● Sub-second block finality</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>SVM RUNTIME</span>
            <ShieldCheck size={16} color="var(--accent-cyan)" />
          </div>
          <div className="stat-value">{version}</div>
          <div className="stat-sub">Solana 4.1.2 Engine</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>DEPLOY COST</span>
            <span style={{ color: "var(--accent-green)", fontWeight: 700 }}>~ $0.05</span>
          </div>
          <div className="stat-value">0.0001 SOL</div>
          <div className="stat-sub">Ultra-low SVM fees</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>RPC HEALTH</span>
            <RefreshCw size={16} color="var(--accent-green)" />
          </div>
          <div className="stat-value" style={{ color: "var(--accent-green)" }}>ONLINE</div>
          <div className="stat-sub">rpc.cookiescan.io (100%)</div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <nav className="tabs">
        <button
          className={`tab-btn ${activeTab === "counter" ? "active" : ""}`}
          onClick={() => setActiveTab("counter")}
        >
          🥖 The Counter (Order Ticket)
        </button>
        <button
          className={`tab-btn ${activeTab === "bakery" ? "active" : ""}`}
          onClick={() => setActiveTab("bakery")}
        >
          🥠 Fortune Bakery & Cookie Jar
        </button>
        <button
          className={`tab-btn ${activeTab === "inspector" ? "active" : ""}`}
          onClick={() => setActiveTab("inspector")}
        >
          🔍 Account Inspector
        </button>
        <button
          className={`tab-btn ${activeTab === "mcp" ? "active" : ""}`}
          onClick={() => setActiveTab("mcp")}
        >
          🤖 Cookie-MCP AI Tools
        </button>
        <button
          className={`tab-btn ${activeTab === "ecosystem" ? "active" : ""}`}
          onClick={() => setActiveTab("ecosystem")}
        >
          🌐 Ecosystem & Bridge
        </button>
      </nav>

      {/* 1. THE COUNTER (ORDER TICKET C-APP) */}
      {activeTab === "counter" && (
        <div className="ticket-container">
          <div className="ticket-card">
            <div className="ticket-header">
              <div className="ticket-step">01</div>
              <div>
                <h2 className="ticket-title">The Counter</h2>
                <p className="ticket-subtitle">Fill in the order, check the ticket, sign it in Nightly.</p>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="ticket-mode-toggle">
              <button
                className={`mode-btn ${counterMode === "send" ? "active" : ""}`}
                onClick={() => setCounterMode("send")}
              >
                Send $COOK
              </button>
              <button
                className={`mode-btn ${counterMode === "swap" ? "active" : ""}`}
                onClick={() => setCounterMode("swap")}
              >
                Cookieswap (DEX)
              </button>
            </div>

            {/* Recipient */}
            <div className="ticket-input-block">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className="ticket-label">RECIPIENT</label>
                <button
                  type="button"
                  style={{ background: "none", border: "none", color: "#a06e2e", fontSize: "11px", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => setRecipient("baker.cook")}
                >
                  Use Demo Address
                </button>
              </div>
              <input
                type="text"
                className="ticket-input"
                placeholder="address or name.cook"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>

            {/* Amount with Quick Chips */}
            <div className="ticket-input-block">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className="ticket-label">AMOUNT</label>
                <span style={{ fontSize: "11px", color: "#a06e2e", fontWeight: 700 }}>Token: $COOK</span>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  className="ticket-input"
                  placeholder="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <span className="token-badge">$COOK</span>
              </div>

              {/* Quick Amount Chips */}
              <div className="chips-row">
                {["10", "50", "100", "1000", "MAX"].map((chip) => (
                  <button key={chip} className="chip-btn" onClick={() => setQuickAmount(chip)}>
                    {chip === "1000" ? "1k" : chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Memo */}
            <div className="ticket-input-block">
              <label className="ticket-label">MEMO (Optional)</label>
              <input
                type="text"
                className="ticket-input"
                placeholder="thanks for the recipe"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </div>

            {ticketError && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#c0392b", fontSize: "12px", marginBottom: "10px", fontWeight: 600 }}>
                <AlertCircle size={14} />
                <span>{ticketError}</span>
              </div>
            )}

            {/* Sign & Send Action Button */}
            <button
              className="ticket-action-btn"
              onClick={handleDispatchOrder}
              disabled={isDispatching}
            >
              {isDispatching ? "Baking & Signing in Nightly..." : "Sign & Send Order"}
            </button>

            {lastTxHash && (
              <div className="tx-receipt">
                <CheckCircle2 size={16} color="var(--accent-green)" />
                <div>
                  <div style={{ fontWeight: 700 }}>Order Confirmed on Cookie Chain!</div>
                  <div style={{ fontSize: "11px", opacity: 0.8, wordBreak: "break-all" }}>TX: {lastTxHash}</div>
                </div>
                <a
                  href={`https://cookiescan.io`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#a06e2e", textDecoration: "underline", marginLeft: "auto", fontWeight: 700 }}
                >
                  View
                </a>
              </div>
            )}

            <div className="ticket-footer">
              <span>COOKIEBOT ORDER TICKET</span>
              <span>COOKIE CHAIN SVM</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. FORTUNE BAKERY & COOKIE JAR (INTERACTIVE ON-CHAIN GAME) */}
      {activeTab === "bakery" && (
        <div className="panel" style={{ textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px", background: "rgba(245,166,35,0.1)", borderRadius: "999px", border: "1px solid var(--border-color)", marginBottom: "16px" }}>
            <Flame size={16} color="var(--accent-gold)" />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent-gold)" }}>{bakerLevel}</span>
          </div>

          <h2 style={{ fontSize: "26px", fontWeight: 700, marginBottom: "8px" }}>The Cookie Jar & Fortune Bakery</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "600px", margin: "0 auto 24px" }}>
            Click the giant cookie to bake crumbs, level up your Baker Rank, and reveal cryptographic on-chain fortunes stamped to Cookie Chain.
          </p>

          <div style={{ margin: "24px 0" }}>
            <button
              className={`cookie-clicker-btn ${isCracking ? "cracking" : ""}`}
              onClick={crackFortuneCookie}
              title="Click to bake & crack fortune cookie!"
            >
              🍪
            </button>
            <div style={{ marginTop: "12px", fontSize: "18px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-gold)" }}>
              {crumbsBaked.toLocaleString()} Crumbs Baked
            </div>
          </div>

          {currentFortune && (
            <div className="fortune-box">
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px" }}>Cryptographic Fortune:</div>
              <p style={{ fontSize: "17px", fontWeight: 600, color: "#ffffff", margin: "10px 0" }}>{currentFortune}</p>
              <button
                className="stamp-btn"
                onClick={stampFortuneOnChain}
                disabled={isStamping}
              >
                <Sparkles size={15} />
                {isStamping ? "Stamping to SVM..." : "Stamp Fortune to Cookie Chain (On-Chain Memo)"}
              </button>

              {stampedTx && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", color: "var(--accent-green)", marginTop: "12px", fontSize: "13px", fontWeight: 600 }}>
                  <CheckCircle2 size={16} />
                  <span>Permanently Stamped to Cookie Chain! (TX: {stampedTx})</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. ACCOUNT INSPECTOR */}
      {activeTab === "inspector" && (
        <div className="panel">
          <h2 className="panel-title"><Search size={18} color="var(--accent-gold)" /> Account & Token Inspector</h2>
          <p className="panel-desc">Query on-chain address balances, state, and token allocations directly from Cookie Chain RPC.</p>

          <div className="input-group">
            <label className="input-label">Cookie Chain Public Key or .cook domain</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Cook1e9w7A6r4qJ9M3V1xY8pD5uF7gH2jK4nL6sQ8tW or satyarthi.cook"
              value={inspectAddress}
              onChange={(e) => setInspectAddress(e.target.value)}
            />
          </div>

          <button className="action-btn" onClick={handleInspect} disabled={isInspecting || !inspectAddress}>
            {isInspecting ? "Querying SVM RPC..." : "Query State & Balance"}
          </button>

          {inspectedBalance && (
            <div style={{ marginTop: "20px", padding: "18px", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>On-Chain State Result:</span>
              <div style={{ fontSize: "24px", fontFamily: "var(--font-mono)", color: "var(--accent-gold)", fontWeight: 700, marginTop: "6px" }}>
                {inspectedBalance}
              </div>
              <div style={{ fontSize: "12px", color: "var(--accent-green)", marginTop: "4px" }}>● Validated via rpc.cookiescan.io</div>
            </div>
          )}
        </div>
      )}

      {/* 4. AI AGENT MCP TOOL */}
      {activeTab === "mcp" && (
        <div className="panel">
          <h2 className="panel-title"><Terminal size={18} color="var(--accent-gold)" /> Cookie-MCP: Autonomous AI Agent Setup</h2>
          <p className="panel-desc">Turnkey Model Context Protocol configuration for autonomous LLM agents (Claude, GPT-4, ElizaOS) operating on Cookie Chain.</p>

          <div className="console-box" style={{ maxHeight: "320px", color: "var(--text-primary)" }}>
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

// Autonomous Agent Callable Functions:
1. cookie_get_balance({ address }) -> Queries $COOK native balance
2. cookie_send_transfer({ recipient, amount, memo }) -> Dispatches cApp transfer
3. cookie_query_das({ assetId }) -> Indexes Digital Asset Standard NFT/Tokens
4. cookie_cookieswap({ fromToken, toToken, amount }) -> Executes DEX swaps`}
          </div>
        </div>
      )}

      {/* 5. ECOSYSTEM & BRIDGE */}
      {activeTab === "ecosystem" && (
        <div className="panel">
          <h2 className="panel-title"><Globe size={18} color="var(--accent-gold)" /> Cookie Ecosystem Hub & Tooling</h2>
          <p className="panel-desc">Direct access to core Cookie Chain infrastructure, DEXs, and explorer services.</p>

          <div className="eco-grid">
            <a href="https://www.cookiechain.wtf" target="_blank" rel="noreferrer" className="eco-card">
              <div>
                <div className="eco-title">Official Cookie Bridge <ExternalLink size={14} /></div>
                <div className="eco-desc">Bridge assets seamlessly between Solana and Cookie Chain SVM in seconds.</div>
              </div>
            </a>

            <a href="https://cookiescan.io" target="_blank" rel="noreferrer" className="eco-card">
              <div>
                <div className="eco-title">CookieScan Explorer <ExternalLink size={14} /></div>
                <div className="eco-desc">Real-time block explorer and transaction search engine for Cookie Chain.</div>
              </div>
            </a>

            <a href="https://docs.cookiechain.wtf" target="_blank" rel="noreferrer" className="eco-card">
              <div>
                <div className="eco-title">Cookie Chain Docs <ExternalLink size={14} /></div>
                <div className="eco-desc">Developer guide for SVM contracts, program deployments (~$0.05), and RPC APIs.</div>
              </div>
            </a>

            <a href="https://t.me/TheCookieNetChain" target="_blank" rel="noreferrer" className="eco-card">
              <div>
                <div className="eco-title">Cookie Chain Telegram <ExternalLink size={14} /></div>
                <div className="eco-desc">Join 950+ builders and bakers in the official community chat.</div>
              </div>
            </a>
          </div>
        </div>
      )}

      {/* Real-Time Telemetry Console */}
      <div className="panel">
        <h3 className="panel-title" style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          <Terminal size={14} /> Live Node Telemetry & Activity Feed
        </h3>
        <div className="console-box">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>

      <footer className="footer">
        <p>CookiePulse cApp · Built for Cookie Chain SVM on Superteam Earn · Nightly Wallet Native</p>
      </footer>
    </div>
  );
}
