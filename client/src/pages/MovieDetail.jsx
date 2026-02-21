import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Globe, Calendar } from 'lucide-react';
import { movieService } from '../services/movieService';
import { showService } from '../services/showService';
import { useDispatch } from 'react-redux';
import { setCurrentShow } from '../store/slices/bookingSlice';
import { clearSeatState } from '../store/slices/seatSlice';
import Spinner from '../components/ui/Spinner';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoggedIn } = useAuth();

  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [movieRes, showsRes] = await Promise.all([
          movieService.getById(id),
          showService.getByMovie(id),
        ]);
        setMovie(movieRes.data.data);
        setShows(showsRes.data.data);

        // Default to first available date
        if (showsRes.data.data.length > 0) {
          const firstDate = new Date(showsRes.data.data[0].start_time)
            .toISOString().split('T')[0];
          setSelectedDate(firstDate);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Group shows by date
  const showsByDate = shows.reduce((acc, show) => {
    const date = new Date(show.start_time).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(show);
    return acc;
  }, {});

  const uniqueDates = Object.keys(showsByDate).sort();
  const todaysShows = showsByDate[selectedDate] || [];

  // Group today's shows by theatre
  const showsByTheatre = todaysShows.reduce((acc, show) => {
    const key = show.theatre_name;
    if (!acc[key]) acc[key] = { location: show.theatre_location, shows: [] };
    acc[key].shows.push(show);
    return acc;
  }, {});

  const handleSelectShow = (show) => {
    if (!isLoggedIn) {
      toast.error('Please sign in to book tickets');
      navigate('/auth');
      return;
    }
    dispatch(setCurrentShow({ show, movie }));
    dispatch(clearSeatState());
    navigate(`/shows/${show.id}/seats`);
  };

  if (loading) return <div className="flex justify-center pt-40"><Spinner size="lg" /></div>;
  if (!movie) return <div className="text-center pt-40 text-brand-muted">Movie not found</div>;

  return (
    <div className="min-h-screen pt-16">
      {/* Hero banner */}
      <div className="relative h-[420px] overflow-hidden">
        {movie.poster_url ? (
          <>
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="w-full h-full object-cover blur-sm scale-110 opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/80 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-brand-card to-brand-dark" />
        )}

        {/* Movie info overlay */}
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 w-full flex gap-10 items-end pb-8">
            {/* Poster thumbnail */}
            {movie.poster_url && (
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="hidden md:block w-40 rounded-xl border-2 border-brand-border shadow-2xl flex-shrink-0"
              />
            )}
            <div className="flex-1 space-y-3">
              <div className="flex gap-2 flex-wrap">
                {movie.genre && <span className="badge bg-brand-red text-white">{movie.genre}</span>}
                {movie.language && <span className="badge bg-brand-card border border-brand-border text-brand-muted">{movie.language}</span>}
              </div>
              <h1 className="text-4xl font-extrabold text-white">{movie.title}</h1>
              <div className="flex items-center gap-5 text-brand-muted text-sm">
                <span className="flex items-center gap-1"><Clock size={14} />{movie.duration_mins} min</span>
                <span className="flex items-center gap-1"><Globe size={14} />{movie.language}</span>
                {movie.release_date && (
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(movie.release_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
              {movie.description && (
                <p className="text-brand-muted text-sm max-w-2xl line-clamp-2">{movie.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shows section */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-white mb-6">Book Tickets</h2>

        {shows.length === 0 ? (
          <div className="card p-12 text-center text-brand-muted">
            <p className="text-4xl mb-3">🎭</p>
            <p>No shows scheduled yet</p>
          </div>
        ) : (
          <>
            {/* Date selector */}
            <div className="flex gap-3 overflow-x-auto pb-3 mb-8">
              {uniqueDates.map((date) => {
                const d = new Date(date);
                const isSelected = selectedDate === date;
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`flex-shrink-0 px-5 py-3 rounded-xl border text-sm font-semibold transition-all ${
                      isSelected
                        ? 'bg-brand-red border-brand-red text-white'
                        : 'card text-brand-muted hover:border-brand-text hover:text-white'
                    }`}
                  >
                    <div className="text-xs opacity-75">
                      {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                    </div>
                    <div>{d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                  </button>
                );
              })}
            </div>

            {/* Shows by theatre */}
            <div className="space-y-4">
              {Object.entries(showsByTheatre).map(([theatreName, { location, shows: theatreShows }]) => (
                <div key={theatreName} className="card p-6">
                  <div className="mb-4">
                    <h3 className="font-bold text-white text-lg">{theatreName}</h3>
                    <p className="text-brand-muted text-sm">{location}</p>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {theatreShows
                      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
                      .map((show) => {
                        const time = new Date(show.start_time).toLocaleTimeString('en-IN', {
                          hour: '2-digit', minute: '2-digit',
                        });
                        const isFull = show.available_seats === 0;
                        return (
                          <button
                            key={show.id}
                            onClick={() => !isFull && handleSelectShow(show)}
                            disabled={isFull}
                            className={`px-5 py-3 rounded-lg border text-sm font-semibold transition-all ${
                              isFull
                                ? 'border-brand-border text-brand-muted cursor-not-allowed opacity-50'
                                : 'border-green-500/50 text-green-400 hover:bg-green-500/10'
                            }`}
                          >
                            <div className="text-base">{time}</div>
                            <div className="text-xs opacity-70 mt-0.5">
                              {isFull ? 'House Full' : `${show.available_seats} left · ₹${show.base_price}`}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}