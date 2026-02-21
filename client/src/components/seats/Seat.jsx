import { useDispatch, useSelector } from 'react-redux';
import { toggleSeatSelection } from '../../store/slices/seatSlice';

const STATUS_STYLES = {
  available:  'bg-brand-card border-brand-border hover:border-green-500 hover:bg-green-500/10 cursor-pointer',
  selected:   'bg-green-500 border-green-500 cursor-pointer scale-110',
  locked:     'bg-yellow-500/20 border-yellow-500/50 cursor-not-allowed opacity-60',
  booked:     'bg-brand-border border-brand-border cursor-not-allowed opacity-40',
};

const CATEGORY_COLORS = {
  vip:      'text-brand-gold',
  premium:  'text-blue-400',
  standard: 'text-brand-muted',
};

export default function Seat({ seat }) {
  const dispatch = useDispatch();
  const { selectedIds, lockedIds } = useSelector((s) => s.seats);

  const isSelected = selectedIds.includes(seat.show_seat_id);
  const isMyLocked = lockedIds.includes(seat.show_seat_id);

  // Determine effective status from user's perspective
  let displayStatus = seat.status;
  if (isSelected) displayStatus = 'selected';
  if (isMyLocked) displayStatus = 'selected'; // show locked by me as selected

  const isClickable = seat.status === 'available' && !isMyLocked;

  const handleClick = () => {
    if (!isClickable) return;
    dispatch(toggleSeatSelection(seat.show_seat_id));
  };

  return (
    <button
      onClick={handleClick}
      disabled={!isClickable}
      title={`${seat.row_label}${seat.seat_number} · ${seat.category} · ₹${seat.price}`}
      className={`
        w-9 h-9 rounded-t-lg border text-xs font-bold
        transition-all duration-150 flex items-center justify-center
        ${STATUS_STYLES[displayStatus]}
        ${CATEGORY_COLORS[seat.category]}
      `}
    >
      {seat.seat_number}
    </button>
  );
}