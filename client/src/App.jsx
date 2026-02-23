import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import { fetchMe } from './store/slices/authSlice';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import MovieDetail from './pages/MovieDetail';
import SeatMap from './pages/SeatMap';
import BookingSummary from './pages/BookingSummary';
import BookingConfirmation from './pages/BookingConfirmation';
import MyBookings from './pages/MyBookings';
import Auth from './pages/Auth';

function ProtectedRoute({ children }) {
  const { user, initialized } = useSelector((s) => s.auth);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark">
        <div className="w-10 h-10 border-2 border-brand-border border-t-brand-red rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

function AppRoutes() {
  const dispatch = useDispatch();
  const { initialized } = useSelector((s) => s.auth);

  useEffect(() => {
    // Always try to restore session on app load
    dispatch(fetchMe());
  }, [dispatch]);

  // ── Wait for session check before rendering ANY route ──────────────
  // This prevents the flash where new users see a blank page or
  // get redirected to /auth before the session check completes
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-brand-border border-t-brand-red rounded-full animate-spin" />
          <p className="text-brand-muted text-sm">Starting CineBook...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movies/:id" element={<MovieDetail />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/shows/:id/seats" element={
          <ProtectedRoute><SeatMap /></ProtectedRoute>
        } />
        <Route path="/booking/summary" element={
          <ProtectedRoute><BookingSummary /></ProtectedRoute>
        } />
        <Route path="/booking/confirmation" element={
          <ProtectedRoute><BookingConfirmation /></ProtectedRoute>
        } />
        <Route path="/my-bookings" element={
          <ProtectedRoute><MyBookings /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1C1C1C',
              color: '#E5E5E5',
              border: '1px solid #2A2A2A',
              borderRadius: '8px',
            },
            success: { iconTheme: { primary: '#06d6a0', secondary: '#1C1C1C' } },
            error: { iconTheme: { primary: '#E50914', secondary: '#1C1C1C' } },
          }}
        />
      </BrowserRouter>
    </Provider>
  );
}