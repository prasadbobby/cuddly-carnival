// frontend/lib/api.js
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.data);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const apiClient = {
  // Health check
  healthCheck: async () => {
    const response = await api.get('/api/health');
    return response.data;
  },

  // Learner management
  createLearner: async (profileData) => {
    const response = await api.post('/api/learner/create', profileData);
    return response.data;
  },

  conductPretest: async (learnerId, subject) => {
    const response = await api.post(`/api/learner/${learnerId}/pretest`, { subject });
    return response.data;
  },

  submitPretest: async (pretestId, answers) => {
    const response = await api.post(`/api/pretest/${pretestId}/submit`, { answers });
    return response.data;
  },

  getLearningPath: async (learnerId) => {
    const response = await api.get(`/api/learner/${learnerId}/path`);
    return response.data;
  },

  getResource: async (resourceId) => {
    const response = await api.get(`/api/resource/${resourceId}`);
    return response.data;
  },

  getResourceQuiz: async (resourceId) => {
    const response = await api.get(`/api/resource/${resourceId}/quiz`);
    return response.data;
  },

  submitQuiz: async (quizId, learnerId, answers) => {
    const response = await api.post(`/api/quiz/${quizId}/submit`, { 
      quiz_id: quizId,
      learner_id: learnerId,
      answers 
    });
    return response.data;
  },

  getLearnerProgress: async (learnerId) => {
    const response = await api.get(`/api/learner/${learnerId}/progress`);
    return response.data;
  },

  getAllLearners: async () => {
    const response = await api.get('/api/admin/learners');
    return response.data;
  },

  getAdminStats: async () => {
    const response = await api.get('/api/admin/stats');
    return response.data;
  },

  deleteLearner: async (learnerId) => {
    const response = await api.delete(`/api/admin/learner/${learnerId}/delete`);
    return response.data;
  },

    addYouTubeVideos: async (resourceId) => {
    const response = await api.post(`/api/resource/${resourceId}/add-videos`);
    return response.data;
  },

  getVisualExample: async (resourceId) => {
  const response = await api.get(`/api/resource/${resourceId}/visual-example`);
  return response.data;
},

    searchYouTube: async (query) => {
    const response = await api.post('/api/youtube/search', { query });
    return response.data;
  },
 generateCustomFocusAreas: async (subject) => {
    const response = await api.post('/api/generate-custom-focus-areas', { subject });
    return response.data;
  },

  getAnalyticsDashboard: async () => {
    const response = await api.get('/api/analytics/dashboard');
    return response.data;
  }
};