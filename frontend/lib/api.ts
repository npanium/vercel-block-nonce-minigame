import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export const createGame = async (gridSize: number) => {
  const response = await axios.post(`${API_BASE_URL}/game`, { gridSize });
  return response.data;
};

export const getGameState = async (gameId: string) => {
  const response = await axios.get(`${API_BASE_URL}/game/${gameId}`);
  return response.data;
};

export const updateGameState = async (gameId: string, update: any) => {
  const response = await axios.patch(`${API_BASE_URL}/game/${gameId}`, update);
  return response.data;
};

export const endGame = async (gameId: string) => {
  const response = await axios.post(`${API_BASE_URL}/game/${gameId}/end`);
  return response.data;
};
