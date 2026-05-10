import axios from 'axios';

const api = axios.create({
  baseURL: 'https://effortx-commit-analyzer.vercel.app/api',
});

export const analyzeCommit = async (githubUrl) => {
  const response = await api.post('/analyze', { githubUrl });
  return response.data;
};

export default api;
