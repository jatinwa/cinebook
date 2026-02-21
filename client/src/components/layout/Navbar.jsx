import { Link, useNavigate } from 'react-router-dom';
import { Film, Ticket, User, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-brand-dark/95 backdrop-blur-sm border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-brand-red rounded flex items-center justify-center">
            <Film size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white group-hover:text-brand-red transition-colors">
            CineBook
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-6">
          {isLoggedIn ? (
            <>
              <Link
                to="/my-bookings"
                className="flex items-center gap-1.5 text-brand-muted hover:text-white transition-colors text-sm font-medium"
              >
                <Ticket size={16} />
                My Bookings
              </Link>

              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 text-brand-gold hover:text-yellow-300 transition-colors text-sm font-medium"
                >
                  <Shield size={16} />
                  Admin
                </Link>
              )}

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center text-white font-bold">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-brand-text hidden sm:block">{user?.name}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-brand-muted hover:text-brand-red transition-colors text-sm"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <Link to="/auth" className="btn-primary py-2 px-4 text-sm">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}