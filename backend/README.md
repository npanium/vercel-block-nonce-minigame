# Backend routes testing

Backend needs to be running in order to play the game.
Run the following command to start.

```zsh
npm start
```

To test just the backend, try out the following routes in Postman or via curl requests in the terminal to [http://localhost:3001](http://localhost:3001).

### Start game

```
POST <localhost>/api/game/start-game
Body: { address: "0x..." }
```

### Handle click

```POST <localhost>/api/game/click
Body: { gameId: "...", x: 0, y: 0, address: "0x..." }
```

### End game

```
POST <localhost>/api/game/end-game
Body: { gameId: "...", signedTransaction: "...", address: "0x..." }
```

### Get results

```
GET <localhost>/api/game/game-result/:gameId
```

### Check active game

```
GET <localhost>/api/game/active-game/:address
```

### Get game state

```
GET <localhost>/api/game/game-state/:gameId?address=0x...
```

### File functions

#### GameService:

- Handles game logic (creating games, processing moves, etc.)
- Coordinates between components
- Manages game rules and configuration

#### GameStateManager:

- Purely handles state management
- Stores and retrieves game states
- Manages player-game associations

#### config.js:

- Environment variables
- Network configuration
- Other app-wide settings

## To-dos

- Add a DB to log and store player game states, scores, etc.
- Points/Tokens based on the ratio of number of correct guesses and number of clicks
