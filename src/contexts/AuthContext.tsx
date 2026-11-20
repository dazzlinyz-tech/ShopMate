import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseClient } from '../lib/supabaseClient';

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  provider: string | null;
  last_sign_in_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthActionLoading: boolean;
  authError: string | null;
  isLoginModalOpen: boolean;
  lastSignInEventAt: number | null;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function extractProfileFields(authUser: User) {
  const meta = authUser.user_metadata || {};
  const appMeta = authUser.app_metadata || {};
  const fallbackName = authUser.email ? authUser.email.split('@')[0] : 'ShopMate User';

  return {
    id: authUser.id,
    email: authUser.email ?? null,
    full_name:
      (meta.full_name as string | undefined) ||
      (meta.name as string | undefined) ||
      fallbackName,
    avatar_url:
      (meta.avatar_url as string | undefined) ||
      (meta.picture as string | undefined) ||
      null,
    provider: (appMeta.provider as string | undefined) || 'google',
    last_sign_in_at: authUser.last_sign_in_at ?? new Date().toISOString(),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthActionLoading, setIsAuthActionLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [lastSignInEventAt, setLastSignInEventAt] = useState<number | null>(null);

  const previousUserIdRef = useRef<string | null>(null);

  const syncAndFetchUserProfile = useCallback(async (authUser: User) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const { data: existingRow, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (selectError) {
        console.warn('Failed to fetch public.users profile:', selectError.message);
      }

      if (existingRow) {
        setProfile(existingRow as UserProfile);
        return;
      }

      // Fallback upsert in case the DB trigger hasn't populated this user yet
      const payload = extractProfileFields(authUser);
      const { data: upsertedRow, error: upsertError } = await supabase
        .from('users')
        .upsert(
          {
            ...payload,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (upsertError) {
        console.warn('Failed to sync public.users profile:', upsertError.message);
        return;
      }

      if (upsertedRow) {
        setProfile(upsertedRow as UserProfile);
      }
    } catch (err) {
      console.warn('Unexpected error syncing user profile:', err);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    await syncAndFetchUserProfile(user);
  }, [user, syncAndFetchUserProfile]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const cleanOAuthCallbackUrl = () => {
      const url = new URL(window.location.href);
      const hasOAuthParams =
        url.searchParams.has('code') ||
        url.searchParams.has('error') ||
        url.hash.includes('access_token=') ||
        url.hash.includes('refresh_token=');

      if (hasOAuthParams) {
        window.history.replaceState({}, document.title, '/');
      }
    };

    const initializeAuth = async () => {
      try {
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          setAuthError(error.message);
        }

        const initialUser = initialSession?.user ?? null;
        setSession(initialSession ?? null);
        setUser(initialUser);
        previousUserIdRef.current = initialUser?.id ?? null;

        if (initialUser) {
          await syncAndFetchUserProfile(initialUser);
          cleanOAuthCallbackUrl();
        }
      } catch (err) {
        if (isMounted) {
          setAuthError(err instanceof Error ? err.message : '인증 상태를 불러오지 못했습니다.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isMounted) return;

      const nextUser = nextSession?.user ?? null;
      const prevUserId = previousUserIdRef.current;

      setSession(nextSession ?? null);
      setUser(nextUser);
      setAuthError(null);

      if (nextUser) {
        previousUserIdRef.current = nextUser.id;
        void syncAndFetchUserProfile(nextUser);

        if (event === 'SIGNED_IN' || (!prevUserId && nextUser.id)) {
          setIsLoginModalOpen(false);
          setLastSignInEventAt(Date.now());
          cleanOAuthCallbackUrl();
        }
      } else {
        previousUserIdRef.current = null;
        setProfile(null);
      }

      setIsLoading(false);
      setIsAuthActionLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [syncAndFetchUserProfile]);

  const openLoginModal = useCallback(() => {
    setAuthError(null);
    setIsLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setAuthError(null);
    setIsLoginModalOpen(false);
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setAuthError('Supabase 환경변수가 설정되지 않았습니다.');
      return;
    }

    setAuthError(null);
    setIsAuthActionLoading(true);

    try {
      const redirectTo = `${window.location.origin}/`;
      const isInIframe = window.self !== window.top;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: isInIframe,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        setAuthError(error.message);
        setIsAuthActionLoading(false);
        return;
      }

      if (isInIframe && data?.url) {
        try {
          if (window.top) {
            window.top.location.href = data.url;
            return;
          }
        } catch {
          // Cross-origin frame restriction fallback
        }
        window.location.assign(data.url);
      }
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Google 로그인 중 오류가 발생했습니다.'
      );
      setIsAuthActionLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setAuthError(null);
    setIsAuthActionLoading(true);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setAuthError(error.message);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : '로그아웃 중 오류가 발생했습니다.');
    } finally {
      setIsAuthActionLoading(false);
    }
  }, []);

  const value: AuthContextValue = {
    user,
    session,
    profile,
    isAuthenticated: Boolean(user && session),
    isLoading,
    isAuthActionLoading,
    authError,
    isLoginModalOpen,
    lastSignInEventAt,
    openLoginModal,
    closeLoginModal,
    clearAuthError,
    signInWithGoogle,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
