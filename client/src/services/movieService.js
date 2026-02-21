import api from './api';

export const movieService = {
  getAll: (params) => api.get('/movies', { params }),
  getById: (id) => api.get(`/movies/${id}`),
};