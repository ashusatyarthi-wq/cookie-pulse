# 🍪 CookiePulse — Real-Time Cookie Chain Analytics, Dispatcher & MCP Hub

[![Network](https://img.shields.io/badge/Network-Cookie%20Chain%20(SVM)-orange)](https://cookiechain.wtf)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Superteam Earn](https://img.shields.io/badge/Bounty-Superteam%20Earn-purple)](https://superteam.fun)

**CookiePulse** is an all-in-one on-chain intelligence dashboard, wallet profiler, transaction dispatcher, and AI Agent MCP integration hub built natively for the **Cookie Chain (SVM)** ecosystem.

---

## 🍪 What is CookiePulse?

Cookie Chain brings high-throughput, sub-second finality and ultra-low transaction costs (~.05 program deployments) to the Solana Virtual Machine (SVM). 

**CookiePulse** serves as the vital utility layer that connects users, developers, and autonomous AI agents directly with the Cookie Chain network:

1. **⚡ Real-Time Network Telemetry**: Live slot height, SVM core runtime version, block finality, and network health directly polled from the canonical RPC (https://rpc.cookiescan.io).
2. **🔍 Account & Token Inspector**: Instant on-chain state queries for any Cookie Chain public key with live balance formatting in $COOKIE.
3. **🚀 Interactive cApp Dispatcher**: Connect wallet (Phantom / Nightly / Solflare) to construct and broadcast on-chain transfers with custom memo payloads and real-time confirmation.
4. **🤖 Cookie-MCP Agent Toolkit**: Turnkey Model Context Protocol tool configurations empowering autonomous AI agents (Claude, GPT-4, ElizaOS) to operate on Cookie Chain.
5. **🌐 Ecosystem Directory**: Direct portal to CookieScan Explorer, Cookiebox, Cookieswap, Cookie DAS API, and the official Bridge.

---

## 🏗️ Architecture Overview

`	ext
+-----------------------------------------------------------------------------------+
|                                  USER INTERFACE                                   |
|       [Account Inspector]  |  [cApp Dispatcher]  |  [Cookie-MCP Agent Tool]       |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                           COOKIEPULSE CLIENT ENGINE                               |
|        - Solana Web3.js Connection Layer                                          |
|        - Wallet Adapter Integration (Nightly / Phantom / Solflare)                |
|        - Real-Time JSON-RPC Polling & Telemetry State Engine                      |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                              COOKIE CHAIN (SVM)                                   |
|       RPC: https://rpc.cookiescan.io  |  Explorer: https://cookiescan.io          |
|       Sub-Second Block Finality       |  ~.05 Program Deployment Cost           |
+-----------------------------------------------------------------------------------+
`

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn

### 1. Clone & Install
`ash
git clone https://github.com/ashusatyarthi-wq/cookie-pulse.git
cd cookie-pulse
npm install
`

### 2. Run Local Development Server
`ash
npm run dev
`
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for Production
`ash
npm run build
`
Generates a static deployment ready for Vercel, Netlify, or GitHub Pages in dist/.

---

## ⚙️ Cookie Chain Integration Specs

- **Network RPC**: https://rpc.cookiescan.io
- **Chain Architecture**: Solana Virtual Machine (SVM) Compatible
- **Core Version**: Solana-Core 4.1.2
- **Explorer**: [https://cookiescan.io](https://cookiescan.io)
- **Documentation**: [https://docs.cookiechain.wtf](https://docs.cookiechain.wtf)

---

## 👤 Author

- **Name**: Nitesh Satyarthi
- **GitHub**: [@ashusatyarthi-wq](https://github.com/ashusatyarthi-wq)
- **Email**: ashusatyarthi@gmail.com
- **Portfolio**: [ashusatyarthi-wq.github.io/My-Portfolio/](https://ashusatyarthi-wq.github.io/My-Portfolio/)
