<p align="center">
<img width="8192" height="5548" alt="logo" src="https://github.com/user-attachments/assets/3a906008-453c-46a2-aae5-06196dc92e8f" />


Welcome to Darkest Dungeon, an infinite procedural dungeon-crawling adventure where danger lurks around every corner! 🧙‍♂️⚔️ Explore mysterious dungeons, collect treasures, defeat fearsome enemies, and race to find the stairs to escape to the next level! But beware—each level gets harder, and you only have 3 lives. Can you survive the darkness and climb to glory?

💰 Earn as You Play! The core you collect in the game can be minted into Dungeon Tokens ($DGN), making every adventure not just thrilling but also rewarding! 🚀🔥

## ⚙️ How It Works

### 🕹️ Gameplay Mechanics

- **Randomly Generated Dungeons**: Each playthrough offers a fresh dungeon layout. No two games are the same!
- **Enemies**:
  - Skeletons: Common foes with average stats.
  - Archers: Dangerous enemies with long-range attacks, higher HP, and higher damage per second (DPS).
- **Loot System**: Collect coins to increase your score and HP. Coins come in various forms:
  - 🪙 Silver
  - 🟡 Gold
  - 🟢 Emerald
  - 🔴 Ruby
  - 💠 Diamond

### 🎮 Objective

Explore rooms, defeat enemies, and find the stairs to advance to the next level. With each new level, the dungeon grows larger, enemies get tougher, and the stakes get higher!

### 🔥 Scoring System

- Defeat enemies to boost your score.
- Collect rare loot for extra points and perks.
- 💀 3 Lives: When your three lives are up, Game Over! Save your scores and records on-chain to earn perks for future runs.

---

## 🛠️ Built for Forte Hacks Hackathon

This game is built for the [Forte Hacks Hackathon](https://www.hackquest.io/hackathons/Forte-Hacks) using modern tools and Web3 integrations. Here's what powers the dungeon:

### 🔗 On-Chain Features

- **Score Storage**: All your play records, scores, and round timings are permanently stored on-chain
- **ERC721 NFT Minting**: Each player receives an NFT that tracks their progress and achievements
- **Token Rewards**: Earn Dungeon Tokens ($DGN) based on your score (1 score = 1 DGN token)
- **Profile System**: View your complete gaming history including all sessions, scores, and timings
- **Immutable Records**: Your achievements are forever recorded on the Flow blockchain

### 📋 Contract Deployment

**Network**: Flow Testnet

**Deployer Address**: 0x09Fe5ac53e9aB96755Bd550bC8AeD6b3584F526A

- **Dungeon Token**: 0x243d9Dc72D8FD5aC05636A35D210258cbb46470f
- **Darkest Dungeon**: 0x72419DF6e4B30009DeE8c1E82cBb0424f9E03503

---

## ✨ What's New

We've introduced exciting new features to enhance your dungeon-crawling experience:

### 🎮 Multiplayer Mode

Experience the dungeon with friends! Our real-time multiplayer system supports both cooperative and competitive gameplay:

**Game Modes:**
- **Cooperative Mode**: Team up with up to 4 players! Share health pools and combine scores as you work together to survive the dungeon.
- **Competitive Mode**: Compete individually for the highest score. Each player has their own health and score - last adventurer standing wins!

**Features:**
- Real-time synchronization of player movements, attacks, and game events
- Room system: Create or join game rooms with custom names
- Lobby system: Easy room discovery and player management
- Player customization: Choose your color (Red, Blue, Green, Yellow, Purple, Orange)
- Socket.IO WebSocket communication for low-latency gameplay
- MobX state management for smooth reactive updates

**Setup:** Requires running a multiplayer server (see [MULTIPLAYER_SETUP.md](./MULTIPLAYER_SETUP.md) for details)

### ⚙️ Settings Function

Fully customizable gaming experience with a comprehensive settings menu:

**Audio Settings:**
- Master Volume control
- Separate Music and Sound Effects volume sliders
- Real-time audio adjustments

**Graphics Settings:**
- Pixel Art Mode toggle for crisp rendering
- FPS Counter display option
- Fullscreen mode support

**Gameplay Settings:**
- Difficulty levels: Easy, Normal, Hard
- Auto-save progress between sessions
- Health bars toggle for enemies and players
- Minimap display option

**Controls:**
- Adjustable movement speed (0.5x - 2.0x)
- Customizable attack cooldown (200ms - 1000ms)

All settings are automatically saved to localStorage and persist across sessions!

---

## 🌟 Future Scope

🔮 Our journey doesn't stop here! Planned future features include:

- Boss Fights: Face epic enemies with unique mechanics.
- More Loot, More Enemies, More Challenges: Expand the dungeon universe with richer gameplay.
- Advanced Multiplayer Features: Enhanced team mechanics, leaderboards, and competitive modes.

## Screenshots 📸

<table>
  <tr>
    <td valign="top" width="50%">
      <br>
      <img width="3326" height="2160" alt="1 (1)" src="https://github.com/user-attachments/assets/298efffb-9d07-43bf-8e0b-685ed89c0f8d" />
      
  <img width="3326" height="2160" alt="2 (1)" src="https://github.com/user-attachments/assets/dc712b76-21e1-4c21-ac06-2dcf0c694477" />

    

  </tr>
</table>

<table>
  <tr>
    <td valign="top" width="50%">
      <br>
            <img src="./assets/3.png" alt="" >
      <img width="3326" height="2160" alt="4 (1)" src="https://github.com/user-attachments/assets/b053ba34-820c-4f0d-8740-0577ae2ebf28" />

  <img width="3326" height="2160" alt="3 (1)" src="https://github.com/user-attachments/assets/cedff859-63bf-4d38-a0a6-752e501bff87" />




  </tr>
</table>

<table>
  <tr>
    <td valign="top" width="50%">
      <br><img width="3326" height="2160" alt="6 (1)" src="https://github.com/user-attachments/assets/83b4208c-22c2-4c13-9d1c-6315978d2826" />

        
   
  </tr>
</table>

## 🎥 Demo Video

[![Demo Video](https://img.youtube.com/vi/irDNxg45pvI/0.jpg)](https://drive.google.com/file/d/1Lvz8LfjYXmeXEXI58USYaiUbsz8eG1-9/view?usp=sharing)

## 🛠️ Tech Stack

This project is built with modern web technologies and Web3 integration:

**Frontend:**
- **React** + **Vite** - Fast, modern web framework
- **Phaser.js** - Professional game engine for 2D games
- **TanStack Router** - Type-safe routing
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn UI** - High-quality component library

**Multiplayer:**
- **Socket.IO** - Real-time WebSocket communication
- **MobX** - Reactive state management
- **Node.js** - Multiplayer server backend

**Web3 Integration:**
- **RainbowKit** - Beautiful wallet connection UI
- **Wagmi** - React hooks for Ethereum
- **Solidity** - Smart contract development
- **Foundry** - Smart contract development toolkit
- **OpenZeppelin** - Secure, audited smart contract libraries

**Blockchain:**
- **Flow Testnet** - Layer 1 blockchain for deployment
- **ERC721** - NFT standard for achievement tracking
- **ERC20** - Token standard for $DGN rewards

## Get Started 🚀

### Prerequisites

- Node.js (v18 or higher)
- pnpm package manager
- A Web3 wallet (RainbowKit compatible) for on-chain features

### Installation

First install the dependencies by running the following:

```bash
pnpm install
```

### Running the Game

Start the web application:

```bash
pnpm dev
```

The game will be available at `http://localhost:5173` (Vite default port).

### Running Multiplayer Mode

To use multiplayer features, you'll need to start the WebSocket server:

```bash
# Navigate to server directory
cd server

# Install server dependencies
pnpm install

# Start the server
pnpm start
```

The server runs on `http://localhost:3001` by default. See [MULTIPLAYER_SETUP.md](./MULTIPLAYER_SETUP.md) for detailed setup instructions.

### Game Controls

- **Movement**: Arrow keys or WASD
- **Attack**: Spacebar
- **Return to Menu**: ESC key (in multiplayer)

### Features Overview

- **Single Player**: Classic dungeon crawling experience
- **Multiplayer**: Real-time cooperative or competitive gameplay
- **Profile**: View your on-chain gaming history and achievements
- **Settings**: Customize audio, graphics, and gameplay to your preferences
- **Web3 Integration**: Connect your wallet to store scores and mint tokens on-chain

Happy Crawling! 🚪💎

---
