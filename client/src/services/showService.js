import api from './api';

export const showService = {
  getByMovie: (movieId) => api.get(`/shows/movie/${movieId}`),
  getById: (id) => api.get(`/shows/${id}`),
  getSeats: (showId) => api.get(`/shows/${showId}/seats`),
  lockSeats: (showId, showSeatIds) =>
    api.post(`/shows/${showId}/lock`, { showSeatIds }),
  releaseSeats: (showId, showSeatIds) =>
    api.post(`/shows/${showId}/release`, { showSeatIds }),
};