import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Download, Home } from 'lucide-react';

export default function BookingConfirmation() {
  const navigate = useNavigate();
  const { currentBooking, currentShow } = useSelector((s) => s.booking);

  if (!currentBooking) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen pt-20 pb-12 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-4">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-white">Booking Confirmed!</h1>
          <p className="text-brand-muted mt-2">
            Check your email for the confirmation details.
          </p>
        </div>

        {/* Ticket */}
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="bg-brand-red p-5 text-center">
            <p className="text-white/80 text-sm">Booking ID</p>
            <p className="text-white font-mono font-bold text-lg mt-1">
              #{currentBooking.booking?.id?.slice(0, 8).toUpperCase()}
            </p>
          </div>

          {/* Dashed divider with circles */}
          <div className="relative border-t border-dashed border-brand-border">
            <div className="absolute -left-3 -top-3 w-6 h-6 bg-brand-dark rounded-full border border-brand-border" />
            <div className="absolute -right-3 -top-3 w-6 h-6 bg-brand-dark rounded-full border border-brand-border" />
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div>
              <p className="text-brand-muted text-xs uppercase tracking-wider mb-1">Movie</p>
              <p className="text-white font-semibold">{currentShow?.movie?.title}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-brand-muted text-xs uppercase tracking-wider mb-1">Date & Time</p>
                <p className="text-white text-sm">
                  {new Date(currentShow?.show?.start_time).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </p>
                <p className="text-white text-sm">
                  {new Date(currentShow?.show?.start_time).toLocaleTimeString('en-IN', {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <p className="text-brand-muted text-xs uppercase tracking-wider mb-1">Seats</p>
                <div className="flex flex-wrap gap-1">
                  {currentBooking.seats?.map((s) => (
                    <span key={s.id} className="badge bg-brand-card border border-brand-border text-white text-xs">
                      {s.row_label}{s.seat_number}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t border-brand-border pt-4 flex justify-between items-center">
              <span className="text-brand-muted text-sm">Total Paid</span>
              <span className="text-brand-gold font-bold text-xl">₹{currentBooking.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => navigate('/')}
            className="btn-secondary flex-1 flex items-center justify-center gap-2"
          >
            <Home size={16} /> Home
          </button>
          <button
            onClick={() => navigate('/my-bookings')}
            className="btn-primary flex-1"
          >
            My Bookings
          </button>
        </div>
      </div>
    </div>
  );
}