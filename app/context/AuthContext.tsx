import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { setAuthToken } from '../api/client';

export interface AuthUser {
  id: number;
  userName: string;
  email: string | null;
  role: 0 | 1;
}

interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (token: string, user?: AuthUser) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.multiGet(['userToken', 'userInfo'])
      .then(([tokenEntry, userEntry]) => {
        const savedToken = tokenEntry[1];
        const savedUser = userEntry[1];
        if (savedToken) {
          setToken(savedToken);
          setAuthToken(savedToken);
        }
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch {}
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = useCallback(async (newToken: string, newUser?: AuthUser) => {
    const entries: [string, string][] = [['userToken', newToken]];
    if (newUser) entries.push(['userInfo', JSON.stringify(newUser)]);
    await AsyncStorage.multiSet(entries);
    setToken(newToken);
    setUser(newUser ?? null);
    setAuthToken(newToken);
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.multiRemove(['userToken', 'userInfo']);
    setToken(null);
    setUser(null);
    setAuthToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, user, isAuthenticated: !!token, isLoading, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
