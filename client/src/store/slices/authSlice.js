import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';

// ── Async thunks ──────────────────────────────────────────────────────────

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await authService.login(credentials);
      localStorage.setItem('accessToken', data.data.accessToken);
      return data.data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await authService.register(userData);
      localStorage.setItem('accessToken', data.data.accessToken);
      return data.data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

export const fetchMe = createAsyncThunk(
  'auth/me',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await authService.getMe();
      return data.data.user;
    } catch {
      return rejectWithValue(null);
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
  localStorage.removeItem('accessToken');
});

// ── Slice ─────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false,
    initialized: false, // has app checked for existing session?
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch me (app init)
    builder
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.initialized = true;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.initialized = true;
      });

    // Logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
    });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;