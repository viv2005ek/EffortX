import axios from 'axios';

const api = axios.create({
  baseURL: 'https://effortx-commit-analyzer.vercel.app/api',
});

export const analyzeCommit = async (githubUrl) => {
  const response = await api.post('/analyze', { githubUrl });
  return response.data;
};

export const estimatePlaygroundTokens = async (messages) => {
  // Use local backend or current api baseURL (might need to change to local if testing)
  const response = await api.post('http://localhost:5000/api/playground/estimate', { messages });
  return response.data;
};

export const chatWithPlayground = async (messages, walletAddress, model) => {
  const response = await api.post('http://localhost:5000/api/playground/chat', { messages, walletAddress, model });
  return response.data;
};

export default api;
