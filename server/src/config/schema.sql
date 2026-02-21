-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Refresh tokens
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Movies
CREATE TABLE movies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    duration_mins INT NOT NULL,
    genre VARCHAR(100),
    language VARCHAR(50),
    poster_url TEXT,
    release_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Theatres
CREATE TABLE theatres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    location TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Screens
CREATE TABLE screens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theatre_id UUID REFERENCES theatres(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    total_seats INT NOT NULL
);

-- Seats (fixed physical seats per screen)
CREATE TABLE seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    screen_id UUID REFERENCES screens(id) ON DELETE CASCADE,
    row_label VARCHAR(5) NOT NULL,
    seat_number INT NOT NULL,
    category VARCHAR(20) DEFAULT 'standard',
    UNIQUE(screen_id, row_label, seat_number)
);

-- Shows
CREATE TABLE shows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
    screen_id UUID REFERENCES screens(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'active'
);

-- Show seats (availability state per show)
CREATE TABLE show_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    show_id UUID REFERENCES shows(id) ON DELETE CASCADE,
    seat_id UUID REFERENCES seats(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'available',
    price DECIMAL(10,2) NOT NULL,
    locked_by UUID REFERENCES users(id),
    locked_until TIMESTAMP,
    UNIQUE(show_id, seat_id)
);

-- Bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    show_id UUID REFERENCES shows(id),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed',
    payment_id TEXT,
    booked_at TIMESTAMP DEFAULT NOW()
);

-- Booking seats (which seats belong to a booking)
CREATE TABLE booking_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    show_seat_id UUID REFERENCES show_seats(id),
    UNIQUE(booking_id, show_seat_id)
);

-- ── Indexes for performance ──────────────────────────────────────────────────

-- Fast seat availability lookup per show
CREATE INDEX idx_show_seats_show_id ON show_seats(show_id);
CREATE INDEX idx_show_seats_status ON show_seats(show_id, status);

-- Fast show lookup per movie
CREATE INDEX idx_shows_movie_id ON shows(movie_id);

-- Fast booking lookup per user
CREATE INDEX idx_bookings_user_id ON bookings(user_id);

-- Fast token validation
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
```

---

**Complete API surface now:**
```
AUTH
  POST  /api/auth/register
  POST  /api/auth/login
  POST  /api/auth/refresh
  POST  /api/auth/logout
  GET   /api/auth/me

MOVIES (public read, admin write)
  GET   /api/movies
  GET   /api/movies/:id
  POST  /api/movies
  PUT   /api/movies/:id
  DELETE /api/movies/:id

SHOWS
  GET   /api/shows/movie/:movieId
  GET   /api/shows/:id
  GET   /api/shows/:id/seats
  POST  /api/shows/:id/lock      ← seat locking
  POST  /api/shows/:id/release   ← seat release

BOOKINGS (all protected)
  POST  /api/bookings/confirm    ← atomic booking
  GET   /api/bookings
  GET   /api/bookings/:id
  POST  /api/bookings/:id/cancel

ADMIN (admin only)
  POST  /api/admin/theatres
  GET   /api/admin/theatres
  POST  /api/admin/theatres/:id/screens
  GET   /api/admin/theatres/:id/screens
  POST  /api/admin/shows