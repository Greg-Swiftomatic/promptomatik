import React, { createContext, useContext, useState, useEffect } from 'react';
import migrationService from '../services/migrationService.js';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AUTH_KEY = 'auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState({
    isNeeded: false,
    isRunning: false,
    progress: null,
    completed: false,
    error: null
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const raw = localStorage.getItem(AUTH_KEY);
        if (!raw || raw === 'undefined' || raw === 'null') {
          localStorage.removeItem(AUTH_KEY);
          setIsLoading(false);
          return { user: null, token: null };
        }
        
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") {
          localStorage.removeItem(AUTH_KEY);
          setIsLoading(false);
          return { user: null, token: null };
        }
        
        const { user: storedUser, token: storedToken } = parsed;
        
        if (storedToken && storedUser) {
          // Verify token is still valid by checking expiration
          try {
            const tokenPayload = JSON.parse(atob(storedToken.split('.')[1]));
            const isExpired = tokenPayload.exp * 1000 < Date.now();
            
            if (!isExpired) {
              setToken(storedToken);
              setUser(storedUser);
              setIsAuthenticated(true);
            } else {
              // Token expired, clear storage
              localStorage.removeItem(AUTH_KEY);
            }
          } catch (tokenError) {
            console.warn('Invalid token format, clearing storage');
            localStorage.removeItem(AUTH_KEY);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear invalid data on any JSON parsing error
        localStorage.removeItem(AUTH_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error?.message || data.error || 'Login failed';
        throw new Error(errorMessage);
      }

      // Store token and user data
      localStorage.setItem(AUTH_KEY, JSON.stringify({
        token: data.token,
        user: data.user
      }));
      
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);

      // Check if migration is needed after successful login
      setTimeout(() => {
        checkMigrationNeeded();
      }, 100);

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const register = async (firstName, email, password) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstName, email, password }),
      });

      const data = await response.json();

      // DEBUG: Log response data
      console.log('=== FRONTEND REGISTER RESPONSE ===');
      console.log('Response status:', response.status);
      console.log('Response data:', data);
      console.log('Error object:', data.error);
      console.log('Error type:', typeof data.error);
      console.log('Error message:', data.error?.message);

      if (!response.ok) {
        const errorMessage = data.error?.message || data.error || 'Registration failed';
        console.log('Final error message:', errorMessage);
        throw new Error(errorMessage);
      }

      // Store token and user data
      localStorage.setItem(AUTH_KEY, JSON.stringify({
        token: data.token,
        user: data.user
      }));
      
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);

      // Check if migration is needed after successful registration
      setTimeout(() => {
        checkMigrationNeeded();
      }, 100);

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint if token exists
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Clear local state and storage
      localStorage.removeItem(AUTH_KEY);
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const refreshToken = async () => {
    try {
      if (!token) return false;

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      const currentAuth = JSON.parse(localStorage.getItem(AUTH_KEY) || '{}');
      localStorage.setItem(AUTH_KEY, JSON.stringify({
        ...currentAuth,
        token: data.token
      }));
      setToken(data.token);
      
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout user
      await logout();
      return false;
    }
  };

  const getAuthHeaders = () => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  // Migration-related functions
  const checkMigrationNeeded = () => {
    const needed = migrationService.isMigrationNeeded();
    setMigrationStatus(prev => ({ ...prev, isNeeded: needed }));
    return needed;
  };

  const runMigration = async () => {
    if (migrationStatus.isRunning) {
      throw new Error('Migration is already running');
    }

    try {
      setMigrationStatus(prev => ({
        ...prev,
        isRunning: true,
        error: null,
        progress: { status: 'starting', total: 0, completed: 0, failed: 0 }
      }));

      // Set up progress listener
      const removeListener = migrationService.addProgressListener((progress) => {
        setMigrationStatus(prev => ({
          ...prev,
          progress
        }));
      });

      // Run the migration
      const result = await migrationService.migratePrompts();

      // Clean up listener
      removeListener();

      // Update final status
      setMigrationStatus(prev => ({
        ...prev,
        isRunning: false,
        completed: true,
        isNeeded: false,
        progress: {
          status: result.failed > 0 ? 'completed_with_errors' : 'completed',
          total: result.total,
          completed: result.migrated,
          failed: result.failed
        }
      }));

      return result;

    } catch (error) {
      console.error('Migration failed:', error);
      
      setMigrationStatus(prev => ({
        ...prev,
        isRunning: false,
        error: error.message,
        progress: {
          ...prev.progress,
          status: 'failed'
        }
      }));

      throw error;
    }
  };

  const skipMigration = () => {
    setMigrationStatus(prev => ({
      ...prev,
      isNeeded: false,
      completed: false
    }));
  };

  const retryMigration = async () => {
    return runMigration();
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshToken,
    getAuthHeaders,
    // Migration functions
    migrationStatus,
    checkMigrationNeeded,
    runMigration,
    skipMigration,
    retryMigration,
  };

  // API service no longer needs auth context - it gets tokens directly from localStorage

  return React.createElement(AuthContext.Provider, { value }, children);
};

export default AuthProvider;