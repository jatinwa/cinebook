import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Search, SlidersHorizontal } from 'lucide-react';
import { movieService } from '../services/movieService';
import MovieCard from '../components/movies/MovieCard';
import Spinner from '../components/ui/Spinner';

const GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Thriller', 'Romance', 'Sci-Fi', 'Animation'];
const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam'];

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [language, setLanguage] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => fetchMovies(), 300);
    return () => clearTimeout(timeout);
  }, [search, genre, language]);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const { data } = await movieService.getAll({
        ...(search && { search }),
        ...(genre && { genre }),
        ...(language && { language }),
      });
      setMovies(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      {/* Hero */}
      <div className="relative bg-gradient-to-b from-brand-red/10 to-brand-dark py-16 px-4 mb-10 text-center">
        <h1 className="text-5xl font-extrabold text-white mb-3 tracking-tight">
          What are you watching <span className="text-brand-red">tonight?</span>
        </h1>
        <p className="text-brand-muted text-lg mb-8">
          Book tickets for the latest movies across top theatres
        </p>

        {/* Search */}
        <div className="max-w-xl mx-auto relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            className="input pl-11 text-base"
            placeholder="Search movies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <div className="flex items-center gap-2 text-brand-muted text-sm">
            <SlidersHorizontal size={16} />
            <span>Filter:</span>
          </div>

          {/* Genre pills */}
          <div className="flex gap-2 flex-wrap">
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => setGenre(genre === g ? '' : g)}
                className={`badge border transition-colors ${
                  genre === g
                    ? 'bg-brand-red border-brand-red text-white'
                    : 'bg-transparent border-brand-border text-brand-muted hover:border-brand-text hover:text-white'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Language filter */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="input py-1.5 px-3 text-sm w-auto"
          >
            <option value="">All Languages</option>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        {/* Movie grid */}
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : movies.length === 0 ? (
          <div className="text-center py-20 text-brand-muted">
            <p className="text-5xl mb-4">🎬</p>
            <p className="text-lg">No movies found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}