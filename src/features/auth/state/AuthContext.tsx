import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';

import { createAuthApiFromEnv } from '../api/authApi.ts';
import { subscribeBassTabApiUnauthorized } from '../../../api/bassTabApi';
import { createAuthActions } from './authActions.ts';
import { authReducer } from './authReducer.ts';
import { initialAuthStoreState } from './authTypes.ts';
import type { AuthStoreState } from './authTypes.ts';

type AuthActions = ReturnType<typeof createAuthActions>;

interface AuthContextValue extends AuthStoreState, AuthActions {}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const api = useMemo(() => createAuthApiFromEnv(), []);
  const [state, dispatch] = useReducer(authReducer, initialAuthStoreState);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const actions = useMemo(
    () =>
      createAuthActions({
        api,
        dispatch,
        getState: () => stateRef.current,
      }),
    [api],
  );

  useEffect(() => {
    void actions.restoreSession();
  }, [actions]);

  useEffect(() => {
    const unsubscribe = subscribeBassTabApiUnauthorized(() => {
      const current = stateRef.current.authState;

      if (current.type !== 'AUTHENTICATED') {
        return;
      }

      dispatch({
        type: 'setDraftSignIn',
        userId: current.user.userId,
        email: current.user.email,
        avatarUrl: current.user.avatarUrl ?? '',
      });
      dispatch({ type: 'setUnauthenticated' });
      dispatch({ type: 'setError', errorMessage: 'Session expired. Please sign in again.' });
      dispatch({ type: 'setLoading', loadingAction: null });
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      ...actions,
    }),
    [actions, state],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used inside AuthProvider.');
  }

  return context;
};
