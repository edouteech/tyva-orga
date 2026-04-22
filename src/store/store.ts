// Store Redux avec Redux Toolkit
import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { AuthState, LoginCredentials, Event } from '../lib';
import { authAPI } from '../api';

// Actions asynchrones
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const result = await authAPI.login(credentials);
      
      // Stocker dans localStorage
      localStorage.setItem('tyva_token', result.token);
      localStorage.setItem('tyva_user', JSON.stringify(result.user));
      
      return result;
    } catch (error: any) {
      // L'erreur a déjà été traitée dans authAPI.login()
      // et contient le bon message d'erreur
      const errorMessage = error.message || 
                          error.response?.data?.message || 
                          'Erreur de connexion';
      return rejectWithValue(errorMessage);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    await authAPI.logout();
    
    // Nettoyer localStorage
    localStorage.removeItem('tyva_token');
    localStorage.removeItem('tyva_user');
    
    return null;
  }
);

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('tyva_token');
      const userJson = localStorage.getItem('tyva_user');
      
      if (token && userJson) {
        const user = JSON.parse(userJson);
        
        // Optionnel : vérifier la validité du token
        try {
          const currentUser = await authAPI.getCurrentUser();
          return { user: currentUser, token };
        } catch {
          // Si la vérification échoue, utiliser les données stockées
          return { user, token };
        }
      }
      
      return null;
    } catch {
      // En cas d'erreur, nettoyer le localStorage
      localStorage.removeItem('tyva_token');
      localStorage.removeItem('tyva_user');
      return rejectWithValue('Échec de l\'initialisation');
    }
  }
);

// État initial
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// État de l'événement actuel
interface EventState {
  currentEvent: Event | null;
}

const eventInitialState: EventState = {
  currentEvent: (() => {
    try {
      const stored = localStorage.getItem('currentEvent');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),
};

// Slice de l'événement actuel
const eventSlice = createSlice({
  name: 'event',
  initialState: eventInitialState,
  reducers: {
    setCurrentEvent: (state, action) => {
      state.currentEvent = action.payload;
      // Sauvegarder dans localStorage
      if (action.payload) {
        localStorage.setItem('currentEvent', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('currentEvent');
      }
    },
    clearCurrentEvent: (state) => {
      state.currentEvent = null;
      localStorage.removeItem('currentEvent');
    },
  },
});

// Slice d'authentification
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      
      // Initialize
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
        }
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

// Actions
export const { clearError, resetAuth } = authSlice.actions;
export const { setCurrentEvent, clearCurrentEvent } = eventSlice.actions;

// Store
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    event: eventSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActionPaths: ['payload.user.created_at', 'payload.user.updated_at'],
        ignoredStatePaths: ['auth.user.created_at', 'auth.user.updated_at'],
      },
    }),
});

// Types pour TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Hooks typés pour une utilisation facile
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T>(selector: (state: RootState) => T): T => 
  useSelector(selector);
