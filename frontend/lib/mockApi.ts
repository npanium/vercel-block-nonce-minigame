import {
  GameConfig,
  GameEndData,
  GameState,
  PlayerStats,
  Position,
  GameStateResponse,
  RoundSummary,
  GameSummary,
  LevelStat,
  RoundStats,
} from "@/types/game";

// Local storage keys
const STORAGE_KEYS = {
  GAMES: "demo_games",
  PLAYER_STATS: "demo_player_stats",
  CURRENT_GAME: "demo_current_game",
};

// Game configuration constants
const GAME_CONFIG = {
  GRID_SIZE: 10,
  NUM_BUGS: 10,
  LEVEL_DURATION: 35, // seconds
  LEVELS_PER_ROUND: 5,
  POINTS_PER_BUG: 100,
  TIME_BONUS_MULTIPLIER: 2,
};

interface LocalGameState extends GameState {
  gameId: string;
  bugs: Position[];
  gridSize: number;
  duration: number;
}

class MockApiService {
  private currentGame: LocalGameState | null = null;
  private gameStateListeners: ((state: string, actions: string[]) => void)[] =
    [];

  constructor() {
    this.loadCurrentGame();
  }

  // Subscribe to game state changes
  onGameStateChange(callback: (state: string, actions: string[]) => void) {
    this.gameStateListeners.push(callback);
  }

  private notifyStateChange(state: string, actions: string[]) {
    this.gameStateListeners.forEach((callback) => callback(state, actions));
  }

  private loadCurrentGame() {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_GAME);
    if (saved) {
      this.currentGame = JSON.parse(saved);
    }
  }

  private saveCurrentGame() {
    if (typeof window === "undefined" || !this.currentGame) return;
    localStorage.setItem(
      STORAGE_KEYS.CURRENT_GAME,
      JSON.stringify(this.currentGame),
    );
  }

  private generateBugPositions(gridSize: number, numBugs: number): Position[] {
    const positions: Position[] = [];
    const usedPositions = new Set<string>();

    while (positions.length < numBugs) {
      const x = Math.floor(Math.random() * gridSize);
      const y = Math.floor(Math.random() * gridSize);
      const key = `${x},${y}`;

      if (!usedPositions.has(key)) {
        positions.push({ x, y });
        usedPositions.add(key);
      }
    }

    return positions;
  }

  private calculateScore(
    bugsFound: number,
    totalBugs: number,
    timeRemaining: number,
    duration: number,
  ): number {
    const baseScore = bugsFound * GAME_CONFIG.POINTS_PER_BUG;
    const accuracyBonus =
      bugsFound === totalBugs ? GAME_CONFIG.POINTS_PER_BUG : 0;
    const timeBonus = Math.floor(
      (timeRemaining / duration) *
        GAME_CONFIG.POINTS_PER_BUG *
        GAME_CONFIG.TIME_BONUS_MULTIPLIER,
    );

    return baseScore + accuracyBonus + timeBonus;
  }

  async createGame(playerAddress?: string): Promise<{ gameId: string }> {
    const gameId = `game_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    this.currentGame = {
      gameId,
      address: playerAddress || `guest_${Date.now()}`,
      startTime: 0,
      isEnded: false,
      clickedCells: [],
      currentRound: 1,
      currentLevel: 1,
      roundStats: [],
      totalScore: 0,
      createdAt: Date.now(),
      highestRound: 1,
      bugs: [],
      gridSize: GAME_CONFIG.GRID_SIZE,
      duration: GAME_CONFIG.LEVEL_DURATION,
    };

    this.saveCurrentGame();
    this.notifyStateChange("CREATED", ["startGame"]);

    return { gameId };
  }

  async startGame(address: string, gameId: string): Promise<GameConfig> {
    if (!this.currentGame || this.currentGame.gameId !== gameId) {
      throw new Error("Game not found");
    }

    // Generate bugs for first level
    const bugs = this.generateBugPositions(
      GAME_CONFIG.GRID_SIZE,
      GAME_CONFIG.NUM_BUGS,
    );

    this.currentGame.bugs = bugs;
    this.currentGame.startTime = Date.now();
    this.currentGame.clickedCells = [];

    this.saveCurrentGame();
    this.notifyStateChange("LEVEL_STARTED", ["handleClick", "endLevel"]);

    return {
      startTime: this.currentGame.startTime,
      duration: GAME_CONFIG.LEVEL_DURATION,
      gridSize: GAME_CONFIG.GRID_SIZE,
      bugs: bugs,
      currentLevel: this.currentGame.currentLevel,
      currentRound: this.currentGame.currentRound,
    };
  }

  async startLevel(address: string, gameId: string): Promise<GameConfig> {
    if (!this.currentGame || this.currentGame.gameId !== gameId) {
      throw new Error("Game not found");
    }

    // Generate new bugs for the level
    const bugs = this.generateBugPositions(
      GAME_CONFIG.GRID_SIZE,
      GAME_CONFIG.NUM_BUGS,
    );

    this.currentGame.bugs = bugs;
    this.currentGame.startTime = Date.now();
    this.currentGame.clickedCells = [];

    this.saveCurrentGame();
    this.notifyStateChange("LEVEL_STARTED", ["handleClick", "endLevel"]);

    return {
      startTime: this.currentGame.startTime,
      duration: GAME_CONFIG.LEVEL_DURATION,
      gridSize: GAME_CONFIG.GRID_SIZE,
      bugs: bugs,
      currentLevel: this.currentGame.currentLevel,
      currentRound: this.currentGame.currentRound,
    };
  }

  async clickCell(
    gameId: string,
    position: Position,
    address: string,
  ): Promise<{ success: boolean }> {
    if (!this.currentGame || this.currentGame.gameId !== gameId) {
      throw new Error("Game not found");
    }

    const cellKey = `${position.x},${position.y}`;
    const alreadyClicked = this.currentGame.clickedCells.some(
      (cell) => cell.x === position.x && cell.y === position.y,
    );

    if (!alreadyClicked) {
      this.currentGame.clickedCells.push(position);
      this.saveCurrentGame();
    }

    return { success: true };
  }

  async endLevel(gameId: string, address: string): Promise<{ gameId: string }> {
    if (!this.currentGame || this.currentGame.gameId !== gameId) {
      throw new Error("Game not found");
    }

    const timePassed = Math.floor(
      (Date.now() - this.currentGame.startTime) / 1000,
    );
    const timeRemaining = Math.max(0, GAME_CONFIG.LEVEL_DURATION - timePassed);

    // Calculate bugs found
    const bugsFound = this.currentGame.clickedCells.filter((clicked) =>
      this.currentGame!.bugs.some(
        (bug) => bug.x === clicked.x && bug.y === clicked.y,
      ),
    ).length;

    const score = this.calculateScore(
      bugsFound,
      GAME_CONFIG.NUM_BUGS,
      timeRemaining,
      GAME_CONFIG.LEVEL_DURATION,
    );

    // Create level stat
    const levelStat: LevelStat = {
      level: this.currentGame.currentLevel,
      bugsFound,
      totalBugs: GAME_CONFIG.NUM_BUGS,
      score,
      duration: timePassed * 1000,
      clickedCells: this.currentGame.clickedCells.length,
    };

    this.currentGame.roundStats.push(levelStat);
    this.currentGame.totalScore += score;

    // Check if round is complete
    const isRoundComplete =
      this.currentGame.currentLevel % GAME_CONFIG.LEVELS_PER_ROUND === 0;

    if (isRoundComplete) {
      this.notifyStateChange("ROUND_COMPLETE", ["startLevel", "endGame"]);

      // Trigger round complete event
      setTimeout(() => {
        this.triggerRoundComplete();
      }, 100);
    } else {
      this.currentGame.currentLevel++;
      this.notifyStateChange("LEVEL_ENDED", ["startLevel", "endGame"]);

      // Trigger level ended event
      setTimeout(() => {
        this.triggerLevelEnded(levelStat);
      }, 100);
    }

    this.saveCurrentGame();

    return { gameId };
  }

  private triggerLevelEnded(levelStat: LevelStat) {
    // Simulate socket event
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("levelEnded", {
          detail: {
            gameId: this.currentGame?.gameId,
            levelStat,
            state: "LEVEL_ENDED",
            validActions: ["startLevel", "endGame"],
          },
        }),
      );
    }
  }

  private triggerRoundComplete() {
    if (!this.currentGame) return;

    // Get stats for current round
    const roundStart =
      (this.currentGame.currentRound - 1) * GAME_CONFIG.LEVELS_PER_ROUND;
    const roundEnd =
      this.currentGame.currentRound * GAME_CONFIG.LEVELS_PER_ROUND;
    const roundLevels = this.currentGame.roundStats.slice(roundStart, roundEnd);

    const roundStats: RoundStats = {
      round: this.currentGame.currentRound,
      totalScore: roundLevels.reduce((sum, stat) => sum + stat.score, 0),
      levels: roundLevels,
    };

    const roundSummary: RoundSummary = {
      gameId: this.currentGame.gameId,
      roundStats,
      nextRound: this.currentGame.currentRound + 1,
      totalScore: this.currentGame.totalScore,
      state: "ROUND_COMPLETE",
      validActions: "startLevel,endGame",
    };

    // Move to next round
    this.currentGame.currentRound++;
    this.currentGame.currentLevel++;
    this.currentGame.highestRound = Math.max(
      this.currentGame.highestRound,
      this.currentGame.currentRound,
    );

    this.saveCurrentGame();

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("roundComplete", {
          detail: roundSummary,
        }),
      );
    }
  }

  async endGame(gameId: string, address: string): Promise<GameEndData> {
    if (!this.currentGame || this.currentGame.gameId !== gameId) {
      throw new Error("Game not found");
    }

    this.currentGame.isEnded = true;
    this.saveCurrentGame();

    // Update player stats
    this.updatePlayerStats(address, this.currentGame);

    this.notifyStateChange("GAME_COMPLETE", []);

    // Trigger game complete event
    setTimeout(() => {
      this.triggerGameComplete();
    }, 100);

    const lastLevel =
      this.currentGame.roundStats[this.currentGame.roundStats.length - 1];

    return {
      success: true,
      gameId,
      status: "complete",
      result: {
        bugsFound: lastLevel?.bugsFound || 0,
        totalBugs: GAME_CONFIG.NUM_BUGS,
        clickedCells: lastLevel?.clickedCells || 0,
        duration: lastLevel?.duration || 0,
        endType: "manual",
        proofVerified: false,
        verificationInProgress: false,
      },
    };
  }

  private triggerGameComplete() {
    if (!this.currentGame) return;

    const gameSummary: GameSummary = {
      gameId: this.currentGame.gameId,
      gameStats: this.currentGame.roundStats,
      finalScore: this.currentGame.totalScore,
      state: "GAME_COMPLETE",
      validActions: "",
    };

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("gameComplete", {
          detail: gameSummary,
        }),
      );
    }
  }

  private updatePlayerStats(address: string, game: LocalGameState) {
    if (typeof window === "undefined") return;

    const statsKey = `${STORAGE_KEYS.PLAYER_STATS}_${address}`;
    const savedStats = localStorage.getItem(statsKey);

    const stats: PlayerStats = savedStats
      ? JSON.parse(savedStats)
      : {
          gamesPlayed: 0,
          highestScore: 0,
          highestRound: 0,
        };

    stats.gamesPlayed++;
    stats.highestScore = Math.max(stats.highestScore, game.totalScore);
    stats.highestRound = Math.max(stats.highestRound, game.highestRound);

    localStorage.setItem(statsKey, JSON.stringify(stats));
  }

  async getGameState(
    address: string,
    gameId: string,
  ): Promise<GameStateResponse> {
    if (!this.currentGame || this.currentGame.gameId !== gameId) {
      throw new Error("Game not found");
    }

    let currentState = "CREATED";
    let validActions = ["startGame"];

    if (this.currentGame.startTime > 0 && !this.currentGame.isEnded) {
      currentState = "LEVEL_STARTED";
      validActions = ["handleClick", "endLevel"];
    } else if (this.currentGame.isEnded) {
      currentState = "GAME_COMPLETE";
      validActions = [];
    }

    return {
      ...this.currentGame,
      currentState,
      validActions,
      config: {
        gridSize: this.currentGame.gridSize,
        bugs: this.currentGame.bugs,
        gameDuration: this.currentGame.duration,
      },
    };
  }

  async getPlayerStats(address: string): Promise<PlayerStats> {
    if (typeof window === "undefined") {
      return { gamesPlayed: 0, highestScore: 0, highestRound: 0 };
    }

    const statsKey = `${STORAGE_KEYS.PLAYER_STATS}_${address}`;
    const savedStats = localStorage.getItem(statsKey);

    return savedStats
      ? JSON.parse(savedStats)
      : { gamesPlayed: 0, highestScore: 0, highestRound: 0 };
  }
}

// Singleton instance
let mockApiInstance: MockApiService | null = null;

export const getMockApi = () => {
  if (!mockApiInstance) {
    mockApiInstance = new MockApiService();
  }
  return mockApiInstance;
};

// Mock API functions that match the original API interface
export const mockApi = {
  createGame: async (playerAddress?: string) => {
    return getMockApi().createGame(playerAddress);
  },

  startGame: async (address: string, gameId: string) => {
    return getMockApi().startGame(address, gameId);
  },

  startLevel: async (address: string, gameId: string) => {
    return getMockApi().startLevel(address, gameId);
  },

  clickCell: async (gameId: string, position: Position, address: string) => {
    return getMockApi().clickCell(gameId, position, address);
  },

  endLevel: async (gameId: string, address: string) => {
    return getMockApi().endLevel(gameId, address);
  },

  endGame: async (gameId: string, address: string) => {
    return getMockApi().endGame(gameId, address);
  },

  getGameState: async (address: string, gameId: string) => {
    return getMockApi().getGameState(address, gameId);
  },

  getPlayerStats: async (address: string) => {
    return getMockApi().getPlayerStats(address);
  },

  // Socket simulation
  initializeSocket: () => {
    return null;
  },

  joinGameRoom: (gameId: string) => {
    // No-op for mock
  },

  setupLevelEndListener: (gameId: string, callback: (data: any) => void) => {
    if (typeof window !== "undefined") {
      window.addEventListener("levelEnded", ((event: CustomEvent) => {
        if (event.detail.gameId === gameId) {
          callback(event.detail);
        }
      }) as EventListener);
    }
  },

  setupRoundCompleteListener: (
    gameId: string,
    callback: (data: RoundSummary) => void,
  ) => {
    if (typeof window !== "undefined") {
      window.addEventListener("roundComplete", ((event: CustomEvent) => {
        if (event.detail.gameId === gameId) {
          callback(event.detail);
        }
      }) as EventListener);
    }
  },

  setupGameCompleteListener: (
    gameId: string,
    callback: (data: GameSummary) => void,
  ) => {
    if (typeof window !== "undefined") {
      window.addEventListener("gameComplete", ((event: CustomEvent) => {
        if (event.detail.gameId === gameId) {
          callback(event.detail);
        }
      }) as EventListener);
    }
  },

  cleanupGameListeners: (gameId: string) => {
    if (typeof window !== "undefined") {
      window.removeEventListener("levelEnded", () => {});
      window.removeEventListener("roundComplete", () => {});
      window.removeEventListener("gameComplete", () => {});
    }
  },

  onGameStateChange: (callback: (state: string, actions: string[]) => void) => {
    getMockApi().onGameStateChange(callback);
  },
};
