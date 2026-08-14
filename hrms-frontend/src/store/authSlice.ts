import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../api/axios';
import type { User, AuthTokens, LoginResponse } from '../types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  loginType: 'admin' | 'employee' | null;
}

const access = localStorage.getItem('access_token');
const refresh = localStorage.getItem('refresh_token');

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  tokens: access || refresh ? {
    access: access || '',
    refresh: refresh || '',
  } : null,
  isAuthenticated: !!access,
  loading: false,
  error: null,
  loginType: (localStorage.getItem('login_type') as 'admin' | 'employee') || null,
};

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await api.post('/accounts/login/', { email, password });
      const user = res.data.data.user;
      const loginType = user?.role === 'EMPLOYEE' ? ('employee' as const) : ('admin' as const);
      return { ...res.data.data, loginType };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const employeeLogin = createAsyncThunk(
  'auth/employeeLogin',
  async ({ employee_id, password }: { employee_id: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await api.post('/accounts/employee-login/', { employee_id, password });
      const user = res.data.data.user;
      const loginType = user?.role === 'EMPLOYEE' ? ('employee' as const) : ('admin' as const);
      return { ...res.data.data, loginType };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (data: { email: string; first_name: string; last_name: string; password: string; password_confirm: string }, { rejectWithValue }) => {
    try {
      const res = await api.post('/accounts/register/', data);
      return { ...res.data.data, loginType: 'admin' as const };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

export const fetchProfile = createAsyncThunk('auth/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/accounts/profile/');
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch profile');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.tokens = null;
      state.isAuthenticated = false;
      state.loginType = null;
      localStorage.removeItem('user');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('login_type');
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const handleAuth = (state: AuthState, payload: { user: User; tokens: AuthTokens; loginType: 'admin' | 'employee' }) => {
      state.loading = false;
      state.user = payload.user;
      state.tokens = payload.tokens;
      state.isAuthenticated = true;
      state.loginType = payload.loginType;
      localStorage.setItem('user', JSON.stringify(payload.user));
      localStorage.setItem('access_token', payload.tokens.access);
      localStorage.setItem('refresh_token', payload.tokens.refresh);
      localStorage.setItem('login_type', payload.loginType);
    };

    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => { handleAuth(state, action.payload); })
      .addCase(login.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(employeeLogin.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(employeeLogin.fulfilled, (state, action) => { handleAuth(state, action.payload); })
      .addCase(employeeLogin.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(register.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(register.fulfilled, (state, action) => { handleAuth(state, action.payload); })
      .addCase(register.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem('user', JSON.stringify(action.payload));
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
