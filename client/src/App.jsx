import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from './store/slices/authSlice';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import MovieDetail from './pages/MovieDetail';
import SeatMap from './pages/SeatMap';
import BookingSummary from './pages/BookingSummary';
import BookingConfirmation from './pages/BookingConfirmation';
import MyBookings from './pages/MyBookings';
import Auth from './pages/Auth';
import Spinner from './components/ui/Spinner';

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { user, initialized } = useSelector((s) => s.auth);
  if (!initialized) return <div className="flex justify-center pt-40"><Spinner size="lg" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

function AppRoutes() {
  const dispatch = useDispatch();

  // On app load, try to restore session via refresh token cookie
  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

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