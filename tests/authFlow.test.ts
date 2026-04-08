import { AuthApiError } from '../src/features/auth/api/authApi.ts';
import { createAuthActions } from '../src/features/auth/state/authActions.ts';
import { authReducer, getAuthRouteMode } from '../src/features/auth/state/authReducer.ts';
import { initialAuthStoreState } from '../src/features/auth/state/authTypes.ts';

const runTest = async (name: string, fn: () => Promise<void> | void) => {
  try {
    await fn();
    console.log(`[ok] ${name}`);
  } catch (error) {
    console.error(`[fail] ${name}`);
    throw error;
  }
};

const createHarness = (api: Record<string, unknown> | null) => {
  let state = initialAuthStoreState;

  const dispatch = (event: Parameters<typeof authReducer>[1]) => {
    state = authReducer(state, event);
  };

  const actions = createAuthActions({
    api: api as never,
    dispatch,
    getState: () => state,
  });

  return {
    actions,
    getState: () => state,
  };
};

const run = async () => {
  await runTest('restore session success moves to AUTHENTICATED', async () => {
    const harness = createHarness({
      getSession: async () => ({
        authenticated: true as const,
        user: { id: 'usr_1', userId: 'rob', email: 'rob@example.com', displayName: 'Rob' },
      }),
    });

    await harness.actions.restoreSession();

    if (harness.getState().authState.type !== 'AUTHENTICATED') {
      throw new Error('Expected AUTHENTICATED state after successful session restore.');
    }
  });

  await runTest('restore session 401 moves to UNAUTHENTICATED', async () => {
    const harness = createHarness({
      getSession: async () => {
        throw new AuthApiError('Unauthorized', 401, 'session');
      },
    });

    await harness.actions.restoreSession();

    if (harness.getState().authState.type !== 'UNAUTHENTICATED') {
      throw new Error('Expected UNAUTHENTICATED state after 401 restore.');
    }
  });

  await runTest('register stores login state and info message', async () => {
    let receivedAvatarUrl: string | undefined;
    const harness = createHarness({
      register: async (payload: { avatarUrl?: string }) => {
        receivedAvatarUrl = payload.avatarUrl;
        return ({
        status: 'VERIFICATION_EMAIL_SENT' as const,
        maskedEmail: 'r***@example.com',
        });
      },
    });

    await harness.actions.register({
      rawEmail: ' Rob@Example.com ',
      rawPassword: 'secret123',
      rawHandle: 'rob',
      rawAvatarUrl: 'https://cdn.example.com/avatar.png',
    });

    const state = harness.getState();

    if (state.authView !== 'LOGIN') {
      throw new Error('Expected LOGIN auth view after successful registration.');
    }

    if (state.draftEmail !== 'rob@example.com') {
      throw new Error(`Expected normalized email, got ${state.draftEmail}`);
    }

    if (state.draftHandle !== 'rob') {
      throw new Error(`Expected normalized handle, got ${state.draftHandle}`);
    }

    if (state.draftAvatarUrl !== 'https://cdn.example.com/avatar.png') {
      throw new Error(`Expected draft avatar, got ${state.draftAvatarUrl}`);
    }

    if (receivedAvatarUrl !== 'https://cdn.example.com/avatar.png') {
      throw new Error(`Expected avatarUrl in register payload, got ${receivedAvatarUrl}`);
    }

    if (!state.infoMessage?.includes('r***@example.com')) {
      throw new Error('Expected verification email info message.');
    }
  });

  await runTest('verify email flow authenticates user', async () => {
    const harness = createHarness({
      verifyEmail: async () => ({
        status: 'AUTHENTICATED' as const,
        user: { id: 'usr_2', userId: 'anne', email: 'anne@example.com', displayName: 'Anne' },
      }),
    });

    await harness.actions.verifyEmail('token-123');

    if (harness.getState().authState.type !== 'AUTHENTICATED') {
      throw new Error('Expected AUTHENTICATED state after verifyEmail.');
    }
  });

  await runTest('login authenticates user', async () => {
    const harness = createHarness({
      login: async () => ({
        status: 'AUTHENTICATED' as const,
        user: {
          id: 'usr_login',
          userId: 'login_user',
          email: 'login@example.com',
          displayName: 'Login User',
        },
      }),
    });

    await harness.actions.login({
      rawEmail: 'login@example.com',
      rawPassword: 'secret123',
    });

    const state = harness.getState().authState;

    if (state.type !== 'AUTHENTICATED') {
      throw new Error('Expected AUTHENTICATED after login.');
    }
  });

  await runTest('protected route mode maps correctly', () => {
    const restoring = getAuthRouteMode({ type: 'RESTORING_SESSION' });
    const unauthenticated = getAuthRouteMode({ type: 'UNAUTHENTICATED' });
    const authenticated = getAuthRouteMode({
      type: 'AUTHENTICATED',
      user: { id: 'u', userId: 'a', email: 'a@b.com', displayName: 'A' },
    });

    if (restoring !== 'restoring' || unauthenticated !== 'auth' || authenticated !== 'app') {
      throw new Error('Route mode mapping failed.');
    }
  });

  await runTest('logout clears auth state even if backend logout fails', async () => {
    const harness = createHarness({
      verifyEmail: async () => ({
        status: 'AUTHENTICATED' as const,
        user: { id: 'usr_3', userId: 'rob', email: 'rob@example.com', displayName: 'Rob' },
      }),
      logout: async () => {
        throw new Error('network');
      },
    });

    await harness.actions.verifyEmail('token-456');
    await harness.actions.logout();

    const state = harness.getState();

    if (state.authState.type !== 'UNAUTHENTICATED') {
      throw new Error('Expected UNAUTHENTICATED after logout failure fallback.');
    }

    if (state.draftEmail !== 'rob@example.com') {
      throw new Error('Expected draftEmail to preserve signed-in email on logout.');
    }
  });

  console.log('auth flow tests passed');
};

void run();
