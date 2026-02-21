import { Link } from 'react-router-dom';
import { Clock, Star } from 'lucide-react';

export default function MovieCard({ movie }) {
  return (
    <Link to={`/movies/${movie.id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl aspect-[2/3] bg-brand-card border border-brand-border">
        {/* Poster */}
        {movie.poster_url ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-brand-card">
            <span className="text-brand-muted text-4xl">🎬</span>
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300
                        flex flex-col justify-end p-4">
          <button className="btn-primary w-full text-sm py-2">Book Now</button>
        </div>

        {/* Genre badge */}
        {movie.genre && (
          <div className="absolute top-3 left-3">
            <span className="badge bg-brand-red/90 text-white">{movie.genre}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-3 space-y-1">
        <h3 className="font-semibold text-white group-hover:text-brand-red transition-colors truncate">
          {movie.title}
        </h3>
        <div className="flex items-center gap-3 text-xs text-brand-muted">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {movie.duration_mins} min
          </span>
          <span>{movie.language}</span>
        </div>
      </div>
    </Link>
  );
}