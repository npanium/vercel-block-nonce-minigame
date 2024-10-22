# Backend routes testing

### Start game

```
POST /api/game/start-game
Body: { address: "0x..." }
```

### Handle click

```POST /api/game/click
Body: { gameId: "...", x: 0, y: 0, address: "0x..." }
```

### End game

```
POST /api/game/end-game
Body: { gameId: "...", signedTransaction: "...", address: "0x..." }
```

### Get results

```
GET /api/game/game-result/:gameId
```

### Check active game

```
GET /api/game/active-game/:address
```

### Get game state

```
GET /api/game/game-state/:gameId?address=0x...
```
