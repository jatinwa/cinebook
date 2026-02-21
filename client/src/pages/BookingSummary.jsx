import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { confirmBooking } from '../store/slices/bookingSlice';
import { Ticket, Clock, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookingSummary() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentShow, loading } = useSelector((s) => s.booking);
  const { lockedIds, seats, lockedUntil } = useSelector((s) => s.seats);

  const lockedSeats = seats.filter((s) => lockedIds.includes(s.show_seat_id));
  const totalAmount = lockedSeats.reduce((sum, s) => sum + parseFloat(s.price), 0).toFixed(2);

  if (!currentShow || lockedIds.length === 0) {
    navigate('/');
    return null;
  }

  const handleConfirm = async () => {
    const result = await dispatch(confirmBooking({
      showId: currentShow.show.id,
      showSeatIds: lockedIds,
      paymentId: `PAY_${Date.now()}`, // In production, this comes from payment gateway
    }));

    if (confirmBooking.fulfilled.match(result)) {
      toast.success('Booking confirmed! 🎉');
      navigate('/booking/confirmation');
    } else {
      toast.error(result.payload || 'Booking failed');
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-lg mx-auto px-4">
        <h1 className="text-2xl font-bold text-white mb-8">Booking Summary</h1>

        {/* Ticket card */}
        <div className="card overflow-hidden mb-6">
          {/* Movie info */}
          <div className="bg-brand-red/10 border-b border-brand-border p-6">
            <div className="flex gap-4 items-start">
              {currentShow.movie?.poster_url && (
                <img
                  src={currentShow.movie.poster_url}
                  alt={currentShow.movie.title}
                  className="w-16 rounded-lg flex-shrink-0"
                />
              )}
              <div>
                <h2 className="text-xl font-bold text-white">{currentShow.movie?.title}</h2>
                <div className="flex items-center gap-2 text-brand-muted text-sm mt-1">
                  <MapPin size={13} />
                  <span>{currentShow.show?.theatre_name}</span>
                </div>
                <div className="flex items-center gap-2 text-brand-muted text-sm">
                  <Clock size={13} />
                  <span>
                    {new Date(currentShow.show?.start_time).toLocaleString('en-IN', {
                      dateStyle: 'full', timeStyle: 'short',
                    })}
                  </span>
                </div>
                <p className="text-brand-muted text-sm mt-0.5">{currentShow.show?.screen_name}</p>
              </div>
            </div>
          </div>

          {/* Seat details */}
          <div className="p-6 border-b border-brand-border border-dashed">
            <h3 className="text-brand-muted text-sm font-medium mb-3">SELECTED SEATS</h3>
            <div className="flex flex-wrap gap-2">
              {lockedSeats.map((seat) => (
                <div key={seat.show_seat_id} className="flex flex-col items-center">
                  <span className="badge bg-brand-card border border-brand-border text-white font-bold px-3 py-1.5">
                    {seat.row_label}{seat.seat_number}
                  </span>
                  <span className={`text-xs mt-1 ${
                    seat.category === 'vip' ? 'text-brand-gold' :
                    seat.category === 'premium' ? 'text-blue-400' : 'text-brand-muted'
                  }`}>
                    {seat.category}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="p-6 space-y-2">
            {lockedSeats.map((seat) => (
              <div key={seat.show_seat_id} className="flex justify-between text-sm">
                <span className="text-brand-muted">
                  {seat.row_label}{seat.seat_number} ({seat.category})
                </span>
                <span className="text-white">₹{seat.price}</span>
              </div>
            ))}
            <div className="border-t border-brand-border pt-3 mt-3 flex justify-between font-bold text-lg">
              <span className="text-white">Total</span>
              <span className="text-brand-gold">₹{totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Note about payment */}
        <p className="text-brand-muted text-xs text-center mb-6">
          Payment gateway integration ready (Razorpay/Stripe).
          Currently simulating payment confirmation.
        </p>

        <button onClick={handleConfirm} disabled={loading} className="btn-primary w-full text-base py-4">
          {loading ? 'Confirming Booking...' : `Pay ₹${totalAmount} & Confirm`}
        </button>
      </div>
    </div>
  );
}