# Block-Nonce (Mini Game) Backend

A Node.js backend service for the Block-Nonce game, handling game state management, proof verification integration, and real-time game updates using Socket.IO.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Socket Events](#socket-events)
- [Services](#services)
- [Future Development](#future-development)

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- Access to a Rust verification server
- Ethereum provider (for blockchain interactions)

## Installation

1. Clone the repository

```bash
git clone <repository-url>
cd <project-directory>/backend
```

2. Install dependencies

```bash
npm install
```

3. Create an optional `.env` file in the root directory with the following variables:

```env
PORT=3001
RUST_SERVER_URL=http://127.0.0.1:8080
NETWORK=holesky
NODE_ENV=development
```

4. Start the server

```bash
npm start
```

The server will start on `http://localhost:3001` by default.

## Architecture

The backend is structured into several key components:

### Core Services

- **GameService**: Manages game logic, state transitions, and proof verification
- **GameStateManager**: Handles in-memory game state and player statistics
- **ProofVerifier**: Interfaces with the Rust backend for ZK proof verification

### Key Features

- Real-time game updates using Socket.IO
- In-memory game state management
- Integration with ZK proof verification system
- Ethereum blockchain integration for on-chain verification

## API Documentation

### Game Management Endpoints

#### Create Game

```
POST /api/game/create-game
Body: { address: string }
Response: { gameId: string }
```

#### Start Game

```
POST /api/game/start-game/:gameId
Body: { address: string }
Response: { gameId, gridSize, bugs, numBugs, startTime, duration }
```

#### Handle Cell Click

```
POST /api/game/click
Body: { gameId: string, x: number, y: number, address: string }
Response: { success: boolean }
```

#### End Game

```
POST /api/game/end-game
Body: { gameId: string, address: string }
Response: { success: boolean, gameId: string, result: GameResult }
```

#### Full Verification

```
POST /api/game/end-game/full
Body: { gameId: string, address: string }
Response: { success: boolean, gameId: string, result: GameResult }
```

### Query Endpoints

#### Get Game State

```
GET /api/game/game-state/:gameId?address=<player-address>
Response: GameState
```

#### Get Active Game

```
GET /api/game/active-game/:address
Response: { hasActiveGame: boolean, gameId?: string, remainingTime?: number }
```

#### Get Player Stats

```
GET /api/game/stats/:address
Response: { gamesPlayed: number }
```

## Socket Events

### Server -> Client Events

- `gameEnded`: Emitted when a game ends with local verification
- `gameEndedFull`: Emitted when a game ends with full on-chain verification

### Client -> Server Events

- `joinGame`: Client joins a specific game room
- `disconnect`: Client disconnection handling

## Services

### GameService

Handles core game logic including:

- Game creation and initialization
- Game state management
- Move validation
- Proof verification coordination
- Game termination and result calculation

### GameStateManager

Manages:

- Active games tracking
- Player statistics
- Game state persistence
- Game cleanup

### ProofVerifier

Handles:

- Local proof verification
- Full on-chain proof verification
- Communication with Rust verification server

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Future Development

### Persistence & Data Management

- [ ] Implement PostgreSQL/MongoDB database integration
  - Store game states, player statistics, and session data
  - Enable historical analysis and leaderboards
  - Track player progress and achievements

### Performance Optimization

- [ ] Implement batch verification system
  - Buffer game results during player sessions
  - Perform parallel verification on Aligned at session end
  - Reduce gas costs through batched reward distribution
  - Optimize proof generation and verification pipeline

### Tokenomics & Rewards

- [ ] Implement sophisticated scoring system
  - Calculate points based on accuracy ratio (correct guesses/total clicks)
  - Apply time-based multipliers for faster completions
  - Award bonus points for streak completions
- [ ] Smart contract integration for token rewards
  - Batch reward distributions for gas efficiency
  - Implement token vesting/cooldown periods
  - Add anti-gaming mechanisms

### Game Mechanics

- [ ] Session-based gameplay
  - Track multi-game sessions
  - Implement progressive difficulty scaling
  - Add combo bonuses for consecutive successful games
- [ ] Enhanced statistics tracking
  - Track player performance metrics
  - Generate player skill profiles
  - Create global and friend-based leaderboards

### API Enhancements

- [ ] Add endpoints for:
  - Session management
  - Batch verification status
  - Token claim/distribution
  - Player rankings and achievements

## License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details
