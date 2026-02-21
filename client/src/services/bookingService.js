import api from './api';

export const bookingService = {
  confirm: (data) => api.post('/bookings/confirm', data),
  getAll: () => api.get('/bookings'),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id) => api.post(`/bookings/${id}/cancel`),
};