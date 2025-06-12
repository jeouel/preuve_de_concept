import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadVideo = async (file) => {
  const formData = new FormData();
  formData.append('video', file);

  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const uploadToGemini = async (videoFilename, mimeType) => {
  // 1. Obtenir l'URL signée
  const response = await api.post('/gemini/upload', {
    videoFilename,
    mimeType
  });

  return response.data;
};

export const analyzeVideo = async (uri, prompt) => {
  const response = await api.post('/gemini/analyze', {
    uri,
    prompt
  });

  return response.data;
};

export const saveGuide = async (html, filename) => {
  const response = await api.post('/guides/save', { html, filename });
  return response.data;
};

export const listGuides = async () => {
  const response = await api.get('/guides/list');
  return response.data;
};

export const fetchGuide = async (filename) => {
  const response = await api.get(`/guides/${filename}`);
  return response.data;
};

export default api;
