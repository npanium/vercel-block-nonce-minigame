export interface GameConfig {
  startTime: number;
  duration: number;
  gridSize: number;
  bugs: Position[];
}

export interface GameState {
  isEnded: boolean;
  remainingTime: number;
  clickedCells: Position[];
  gridSize: number;
  startTime?: number;
  duration?: number;
  bugs?: Position[];
}

export interface Position {
  x: number;
  y: number;
}

export interface PlayerStats {
  gamesPlayed: number;
}

export interface GameEndData {
  gameId: string;
  result: {
    bugsFound: number;
    totalBugs: number;
    clickedCells: number;
    duration: number;
    endType: "timeout" | "manual";
  };
}
