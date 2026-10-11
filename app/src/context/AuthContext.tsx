import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api, { setUnauthorizedCallback, setNetworkErrorCallback } from '../services/api';
import { registerForPushNotificationsAsync } from '../services/notifications';

import { User } from '@planora/shared';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, refreshToken: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.data.user);
            registerForPushNotificationsAsync();
          }
        }
      } catch (error) {
        console.log('User not authenticated');
        await SecureStore.deleteItemAsync('token');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Setup unauthorized callback to handle token expiry across the app
    setUnauthorizedCallback(() => {
      setUser(null);
      setGlobalError('Your session has expired. Please log in again.');
    });

    setNetworkErrorCallback(() => {
      setGlobalError('Network error. Please check your connection.');
    });
  }, []);

  const login = async (token: string, refreshToken: string, user: User) => {
    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    setUser(user);
    setGlobalError(null);
    registerForPushNotificationsAsync();
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {}
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('refreshToken');
    setUser(null);
    setGlobalError(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {globalError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{globalError}</Text>
          <TouchableOpacity onPress={() => setGlobalError(null)}>
            <Text style={styles.dismissBtn}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {children}
    </AuthContext.Provider>
  );
};

const styles = StyleSheet.create({
  errorBanner: {
    backgroundColor: '#ff4d4f',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40, // For notch/status bar safety if needed
  },
  errorText: {
    color: 'white',
    flex: 1,
  },
  dismissBtn: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
    padding: 5,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 5,
  }
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
