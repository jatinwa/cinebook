import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyBookings, cancelBooking } from '../store/slices/bookingSlice';
import { Calendar, MapPin, Ticket, X } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function MyBookings() {
  const dispatch = useDispatch();
  const { bookings, loading } = useSelector((s) => s.booking);

  useEffect(() => {
    dispatch(fetchMyBookings());
  }, [dispatch]);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    const result = await dispatch(cancelBooking(id));
    if (cancelBooking.fulfilled.match(result)) toast.success('Booking cancelled');
    else toast.error('Could not cancel booking');
  };

  const statusColors = {
    confirmed: 'text-green-400 bg-green-500/10 border-green-500/30',
    cancelled: 'text-red-400 bg-red-500/10 border-red-500/30',
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Ticket size={24} className="text-brand-red" />
          <h1 className="text-2xl font-bold text-white">My Bookings</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : bookings.length === 0 ? (
          <div className="card p-16 text-center text-brand-muted">
            <Ticket size={40} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">No bookings yet</p>
            <p className="text-sm mt-1">Book your first movie!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="card p-6">
                <div className="flex gap-5">
                  {booking.poster_url && (
                    <img src={booking.poster_url} alt={booking.movie_title}
                      className="w-16 rounded-lg flex-shrink-0 object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-white text-lg truncate">{booking.movie_title}</h3>
                        <div className="flex items-center gap-2 text-brand-muted text-sm mt-1">
                          <MapPin size={13} />
                          <span>{booking.theatre_name} · {booking.screen_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-brand-muted text-sm">
                          <Calendar size={13} />
                          <span>
                            {new Date(booking.start_time).toLocaleString('en-IN', {
                              dateStyle: 'medium', timeStyle: 'short',
                            })}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {booking.seats?.map((seat, i) => (
                            <span key={i} className="badge bg-brand-card border border-brand-border text-white text-xs px-2 py-1">
                              {seat}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`badge border text-xs ${statusColors[booking.status]}`}>
                          {booking.status}
                        </span>
                        <p className="text-brand-gold font-bold text-lg mt-2">₹{booking.total_amount}</p>
                      </div>
                    </div>

                    {booking.status === 'confirmed' &&
                      new Date(booking.start_time) > new Date() && (
                        <button
                          onClick={() => handleCancel(booking.id)}
                          className="mt-3 flex items-center gap-1.5 text-red-400 hover:text-red-300 text-sm transition-colors"
                        >
                          <X size={14} /> Cancel Booking
                        </button>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}