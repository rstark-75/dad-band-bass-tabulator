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
