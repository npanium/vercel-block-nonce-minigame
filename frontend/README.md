# Block-Nonce (Mini Game) - Frontend

A Next.js-based frontend for Block-Nonce, an interactive bug-hunting game that demonstrates zero-knowledge proof verification through gameplay. Players need to find and eliminate bugs within a grid before time runs out, with their success verified through ZK proofs.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Architecture](#architecture)
- [Components](#components)
- [Game Flow](#game-flow)
- [Future Development](#future-development)

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Running instances of:
  - Node.js backend (port 3001)
  - Rust verification server (port 8080)
- Web3 wallet (e.g., MetaMask)

## Installation

1. Clone the repository

```bash
git clone <repository-url>
cd <project-directory>/frontend
```

2. Install dependencies

```bash
npm install
# or
yarn install
```

3. Create an optional `.env.local` file:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

4. Start the development server

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`.

## Architecture

### Key Features

- Real-time game state management using Socket.IO
- Web3 wallet integration using RainbowKit
- Interactive grid-based gameplay
- ZK proof verification integration
- Isometric visual effects

### Core Technologies

- Next.js 13+ (App Router)
- TypeScript
- Socket.IO Client
- RainbowKit & Wagmi
- TailwindCSS
- Shadcn/ui Components

## Components

### Game Interface

- **GridGame**: Main game grid component
- **IsometricGrid**: Visual enhancement layer
- **CountdownTimer**: Game session timer
- **SwishSpinner**: Loading animation

### State Management

- Custom hooks for:
  - Game initialization
  - State polling
  - Time management
  - Game creation

### Web3 Integration

- Wallet connection
- Transaction management
- On-chain verification

## Game Flow

1. **Connection**: Players connect their Web3 wallet
2. **Game Start**: New game instance is created with a unique gameId
3. **Gameplay**: Players click grid cells to find hidden bugs
4. **Verification**:
   - Local verification of findings
   - Optional on-chain verification through Aligned Layer
5. **Results**: Display of game outcome and verification status

## API Integration

### Socket Events

```typescript
// Initialization
socket.emit("joinGame", gameId);

// Listening for game events
socket.on("gameEnded", (data: GameEndData) => {
  // Handle game end
});
```

### REST Endpoints

- Game Creation: `POST /api/game/create-game`
- Game Start: `POST /api/game/start-game/:gameId`
- Cell Click: `POST /api/game/click`
- Game End: `POST /api/game/end-game`
- Full Verification: `POST /api/game/end-game/full`

## Future Development

### User Experience

- [ ] Add tutorial mode for new players
- [ ] Implement progressive difficulty levels
- [ ] Add visual feedback for verification status
- [ ] Create player profile dashboard
- [ ] Add sound effects and background music

### Gameplay Features

- [ ] Multiple game modes
  - Practice Mode
  - Time Attack Mode
  - Challenge Mode
- [ ] Power-ups and special abilities
- [ ] Achievement system
- [ ] Leaderboards

### Technical Enhancements

- [ ] Implement client-side caching
- [ ] Add offline support
- [ ] Optimize real-time updates
- [ ] Enhanced error handling
- [ ] Responsive design for mobile

### Social Features

- [ ] Player profiles
- [ ] Friend system
- [ ] Challenge system
- [ ] Social sharing
- [ ] Multiplayer modes

### Web3 Integration

- [ ] Token rewards system
- [ ] NFT achievements
- [ ] DAO governance integration
- [ ] Cross-chain support

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Running the Complete Stack

To run the complete application:

1. Start the Rust verification server:

```bash
cd ../zk-service/script
cargo run -r --bin server
```

2. Start the Node.js backend:

```bash
cd ../backend
npm start
```

3. Start the frontend development server:

```bash
npm run dev
```

## License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details
