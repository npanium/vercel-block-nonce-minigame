class GameStateManager {
  constructor() {
    this.activeGames = new Map();
    this.activePlayerGames = new Map();
  }

  createGame(gameId, gameState) {
    this.activeGames.set(gameId, gameState);
    this.activePlayerGames.set(gameState.address, gameId);
  }

  getGame(gameId) {
    return this.activeGames.get(gameId);
  }

  getPlayerGame(address) {
    const gameId = this.activePlayerGames.get(address);
    return gameId ? this.activeGames.get(gameId) : null;
  }

  hasActiveGame(address) {
    const gameId = this.activePlayerGames.get(address);
    const game = gameId ? this.activeGames.get(gameId) : null;
    return game && !game.isEnded;
  }

  endGame(gameId) {
    const game = this.activeGames.get(gameId);
    if (game) {
      game.isEnded = true;
      this.activePlayerGames.delete(game.address);
    }
  }

  removeGame(gameId) {
    const game = this.activeGames.get(gameId);
    if (game) {
      this.activeGames.delete(gameId);
      this.activePlayerGames.delete(game.address);
    }
  }
}

module.exports = GameStateManager;
