import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSeats, lockSelectedSeats, releaseSelectedSeats } from '../../store/slices/seatSlice';
import { useSocket } from '../../hooks/useSocket';
import Seat from './Seat';
import Spinner from '../ui/Spinner';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import toast from 'react-hot-toast';

export default function SeatGrid({ showId, onSeatsLocked }) {
  const dispatch = useDispatch();
  const { seats, selectedIds, lockedIds, lockedUntil, loading, lockLoading, error } =
    useSelector((s) => s.seats);

  // Connect to Socket.io for this show's room
  useSocket(showId);

  useEffect(() => {
    dispatch(fetchSeats(showId));
  }, [showId, dispatch]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  // Group seats by row
  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row_label]) acc[seat.row_label] = [];
    acc[seat.row_label].push(seat);
    return acc;
  }, {});

  const handleLockSeats = async () => {
    const result = await dispatch(lockSelectedSeats({ showId, showSeatIds: selectedIds }));
    if (lockSelectedSeats.fulfilled.match(result)) {
      toast.success('Seats locked! Complete payment within 10 minutes.');
      onSeatsLocked?.();
    }
  };

  const handleReleaseSeats = async () => {
    await dispatch(releaseSelectedSeats({ showId, showSeatIds: lockedIds }));
    toast.success('Seats released');
  };

  const lockTimeRemaining = lockedUntil
    ? Math.max(0, Math.floor((new Date(lockedUntil) - Date.now()) / 1000))
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Screen */}
      <div className="text-center">
        <div className="mx-auto w-3/4 h-2 bg-gradient-to-r from-transparent via-brand-red to-transparent rounded-full mb-2" />
        <p className="text-brand-muted text-xs uppercase tracking-widest">Screen</p>
      </div>

      {/* Seat grid */}
      <div className="space-y-2 overflow-x-auto pb-4">
        {Object.entries(seatsByRow).map(([row, rowSeats]) => (
          <div key={row} className="flex items-center gap-2 justify-center">
            {/* Row label */}
            <span className="text-brand-muted text-sm font-bold w-6 text-center flex-shrink-0">
              {row}
            </span>
            {/* Seats */}
            <div className="flex gap-1.5 flex-wrap justify-center">
              {rowSeats
                .sort((a, b) => a.seat_number - b.seat_number)
                .map((seat) => (
                  <Seat key={seat.show_seat_id} seat={seat} />
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-brand-muted">
        {[
          { color: 'bg-brand-card border border-brand-border', label: 'Available' },
          { color: 'bg-green-500', label: 'Selected' },
          { color: 'bg-yellow-500/20 border border-yellow-500/50', label: 'Locked by others' },
          { color: 'bg-brand-border', label: 'Booked' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded ${item.color}`} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Category pricing */}
      <div className="flex items-center justify-center gap-6 text-xs">
        {[
          { label: 'VIP', color: 'text-brand-gold' },
          { label: 'Premium', color: 'text-blue-400' },
          { label: 'Standard', color: 'text-brand-muted' },
        ].map((cat) => (
          <span key={cat.label} className={`font-semibold ${cat.color}`}>{cat.label}</span>
        ))}
      </div>

      {/* Action panel */}
      <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Timer — shown when seats are locked */}
        {lockedIds.length > 0 && lockTimeRemaining > 0 ? (
          <div className="flex items-center gap-4">
            <CountdownCircleTimer
              isPlaying
              duration={600}
              initialRemainingTime={lockTimeRemaining}
              colors={['#06d6a0', '#f5c842', '#E50914']}
              colorsTime={[300, 120, 0]}
              size={64}
              strokeWidth={5}
              trailColor="#2A2A2A"
              onComplete={() => {
                toast.error('Seat lock expired! Please reselect.');
                handleReleaseSeats();
              }}
            >
              {({ remainingTime }) => (
                <span className="text-xs font-bold text-white">
                  {Math.floor(remainingTime / 60)}:{String(remainingTime % 60).padStart(2, '0')}
                </span>
              )}
            </CountdownCircleTimer>
            <div>
              <p className="text-white font-semibold text-sm">Seats held for you</p>
              <p className="text-brand-muted text-xs">Complete payment before timer expires</p>
            </div>
          </div>
        ) : (
          <div className="text-sm text-brand-muted">
            {selectedIds.length > 0
              ? `${selectedIds.length} seat${selectedIds.length > 1 ? 's' : ''} selected`
              : 'Select seats to continue'}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {lockedIds.length > 0 ? (
            <>
              <button onClick={handleReleaseSeats} className="btn-secondary text-sm py-2 px-4">
                Release
              </button>
              <button onClick={onSeatsLocked} className="btn-primary text-sm py-2 px-4">
                Proceed to Pay →
              </button>
            </>
          ) : (
            <button
              onClick={handleLockSeats}
              disabled={selectedIds.length === 0 || lockLoading}
              className="btn-primary text-sm py-2 px-4"
            >
              {lockLoading ? 'Locking...' : `Lock ${selectedIds.length > 0 ? selectedIds.length + ' Seat(s)' : 'Seats'}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}