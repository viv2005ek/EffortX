import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export const analyzeCommit = async (githubUrl) => {
  const response = await api.post('/analyze', { githubUrl });
  return response.data;
};

export default api;
