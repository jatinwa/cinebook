import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import SeatGrid from '../components/seats/SeatGrid';
import { ArrowLeft } from 'lucide-react';

export default function SeatMap() {
  const { id: showId } = useParams();
  const navigate = useNavigate();
  const { currentShow } = useSelector((s) => s.booking);

  const handleSeatsLocked = () => {
    navigate('/booking/summary');
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-brand-muted hover:text-white transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          {currentShow && (
            <div>
              <h1 className="text-xl font-bold text-white">{currentShow.movie?.title}</h1>
              <p className="text-brand-muted text-sm">
                {currentShow.show?.theatre_name} · {currentShow.show?.screen_name} ·{' '}
                {new Date(currentShow.show?.start_time).toLocaleString('en-IN', {
                  dateStyle: 'medium', timeStyle: 'short',
                })}
              </p>
            </div>
          )}
        </div>

        {/* Seat grid */}
        <div className="card p-6">
          <SeatGrid showId={showId} onSeatsLocked={handleSeatsLocked} />
        </div>
      </div>
    </div>
  );
}