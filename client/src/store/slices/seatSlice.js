import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { showService } from '../../services/showService';

export const fetchSeats = createAsyncThunk(
  'seats/fetch',
  async (showId, { rejectWithValue }) => {
    try {
      const { data } = await showService.getSeats(showId);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const lockSelectedSeats = createAsyncThunk(
  'seats/lock',
  async ({ showId, showSeatIds }, { rejectWithValue }) => {
    try {
      const { data } = await showService.lockSeats(showId, showSeatIds);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const releaseSelectedSeats = createAsyncThunk(
  'seats/release',
  async ({ showId, showSeatIds }, { rejectWithValue }) => {
    try {
      await showService.releaseSeats(showId, showSeatIds);
      return showSeatIds;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

const seatSlice = createSlice({
  name: 'seats',
  initialState: {
    seats: [],           // all seats for current show
    selectedIds: [],     // user's current selection (before locking)
    lockedIds: [],       // successfully locked by this user
    lockedUntil: null,   // TTL timestamp
    loading: false,
    lockLoading: false,
    error: null,
  },
  reducers: {
    // User clicks a seat to select/deselect (before locking)
    toggleSeatSelection: (state, action) => {
      const id = action.payload;
      const seat = state.seats.find((s) => s.show_seat_id === id);
      if (!seat || seat.status !== 'available') return;

      const MAX_SEATS = 8;
      if (state.selectedIds.includes(id)) {
        state.selectedIds = state.selectedIds.filter((s) => s !== id);
      } else {
        if (state.selectedIds.length >= MAX_SEATS) return;
        state.selectedIds.push(id);
      }
    },

    // Real-time update from Socket.io
    applySocketUpdate: (state, action) => {
      const { seats: updatedSeats } = action.payload;
      updatedSeats.forEach((update) => {
        const seat = state.seats.find((s) => s.show_seat_id === update.showSeatId);
        if (seat) {
          seat.status = update.status;
          // If a seat we selected got taken by someone else, deselect it
          if (update.status !== 'available' && state.selectedIds.includes(update.showSeatId)) {
            state.selectedIds = state.selectedIds.filter((id) => id !== update.showSeatId);
          }
        }
      });
    },

    clearSeatState: (state) => {
      state.seats = [];
      state.selectedIds = [];
      state.lockedIds = [];
      state.lockedUntil = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch seats
    builder
      .addCase(fetchSeats.pending, (state) => { state.loading = true; })
      .addCase(fetchSeats.fulfilled, (state, action) => {
        state.loading = false;
        state.seats = action.payload;
      })
      .addCase(fetchSeats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Lock seats
    builder
      .addCase(lockSelectedSeats.pending, (state) => { state.lockLoading = true; state.error = null; })
      .addCase(lockSelectedSeats.fulfilled, (state, action) => {
        state.lockLoading = false;
        state.lockedIds = action.payload.showSeatIds;
        state.lockedUntil = action.payload.lockedUntil;
        state.selectedIds = [];
        // Update local seat state optimistically
        action.payload.showSeatIds.forEach((id) => {
          const seat = state.seats.find((s) => s.show_seat_id === id);
          if (seat) seat.status = 'locked';
        });
      })
      .addCase(lockSelectedSeats.rejected, (state, action) => {
        state.lockLoading = false;
        state.error = action.payload;
      });

    // Release seats
    builder.addCase(releaseSelectedSeats.fulfilled, (state, action) => {
      const releasedIds = action.payload;
      state.lockedIds = [];
      state.lockedUntil = null;
      state.selectedIds = [];
      releasedIds.forEach((id) => {
        const seat = state.seats.find((s) => s.show_seat_id === id);
        if (seat) seat.status = 'available';
      });
    });
  },
});

export const { toggleSeatSelection, applySocketUpdate, clearSeatState } = seatSlice.actions;
export default seatSlice.reducer;