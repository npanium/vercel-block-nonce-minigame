# Bug Hunt Game Backend

A Node.js backend service for the Bug Hunt game, handling game state management, proof verification integration, and real-time game updates using Socket.IO.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Socket Events](#socket-events)
- [Services](#services)

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

3. Create a `.env` file in the root directory with the following variables:

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

## License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details

## To-dos

- Add a DB to log and store player game states, scores, etc.
- Points/Tokens based on the ratio of number of correct guesses and number of clicks
- Parallel verification on Aligned at the end of a session (consisting of several games). Save all the secrets and guesses as pairs and send them to batcher at the end of a session. Batch the rewards token reques.
