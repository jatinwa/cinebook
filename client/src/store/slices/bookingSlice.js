import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { bookingService } from '../../services/bookingService';

export const confirmBooking = createAsyncThunk(
  'booking/confirm',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await bookingService.confirm(payload);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Booking failed');
    }
  }
);

export const fetchMyBookings = createAsyncThunk(
  'booking/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await bookingService.getAll();
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'booking/cancel',
  async (bookingId, { rejectWithValue }) => {
    try {
      await bookingService.cancel(bookingId);
      return bookingId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    // Current booking flow state
    currentShow: null,
    currentBooking: null,

    // Booking history
    bookings: [],

    loading: false,
    error: null,
  },
  reducers: {
    setCurrentShow: (state, action) => { state.currentShow = action.payload; },
    clearCurrentBooking: (state) => {
      state.currentShow = null;
      state.currentBooking = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Confirm
    builder
      .addCase(confirmBooking.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(confirmBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload;
      })
      .addCase(confirmBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch all
    builder
      .addCase(fetchMyBookings.pending, (state) => { state.loading = true; })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload;
      })
      .addCase(fetchMyBookings.rejected, (state) => { state.loading = false; });

    // Cancel
    builder.addCase(cancelBooking.fulfilled, (state, action) => {
      const id = action.payload;
      const booking = state.bookings.find((b) => b.id === id);
      if (booking) booking.status = 'cancelled';
    });
  },
});

export const { setCurrentShow, clearCurrentBooking } = bookingSlice.actions;
export default bookingSlice.reducer;