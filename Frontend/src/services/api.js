import axios from 'axios';

const api = axios.create({
  baseURL: 'https://effortx-commit-analyzer.vercel.app/api',
});

export const analyzeCommit = async (githubUrl) => {
  const response = await api.post('/analyze', { githubUrl });
  return response.data;
};

export const estimatePlaygroundTokens = async (messages) => {
  const response = await api.post('/playground/estimate', { messages });
  return response.data;
};

export const chatWithPlayground = async (messages, walletAddress, model) => {
  const response = await api.post('/playground/chat', { messages, walletAddress, model });
  return response.data;
};

export default api;
