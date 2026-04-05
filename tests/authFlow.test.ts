import { AuthApiError } from '../src/features/auth/api/authApi.ts';
import { createAuthActions } from '../src/features/auth/state/authActions.ts';
import { authReducer, getAuthRouteMode } from '../src/features/auth/state/authReducer.ts';
import { initialAuthStoreState } from '../src/features/auth/state/authTypes.ts';
import { sanitizeCode } from '../src/features/auth/utils/codeInput.ts';

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

  await runTest('start auth transitions to CHECK_EMAIL', async () => {
    const harness = createHarness({
      startAuth: async () => ({
        status: 'EMAIL_SENT' as const,
        maskedEmail: 'r***@example.com',
        nextAllowedResendAt: null,
      }),
    });

    await harness.actions.startAuth({
      rawUserId: 'rob',
      rawEmail: ' Rob@Example.com ',
      intent: 'LOGIN',
    });

    const state = harness.getState().authState;

    if (state.type !== 'CHECK_EMAIL') {
      throw new Error('Expected CHECK_EMAIL state after startAuth.');
    }

    if (state.email !== 'rob@example.com') {
      throw new Error(`Expected normalized email, got ${state.email}`);
    }

    if (state.userId !== 'rob') {
      throw new Error(`Expected normalized userId, got ${state.userId}`);
    }
  });

  await runTest('code sanitization keeps six digits only', () => {
    const sanitized = sanitizeCode(' 12a3-45 67 ');

    if (sanitized !== '123456') {
      throw new Error(`Expected 123456, got ${sanitized}`);
    }
  });

  await runTest('verify link flow authenticates user', async () => {
    const harness = createHarness({
      verifyLink: async () => ({
        status: 'AUTHENTICATED' as const,
        user: { id: 'usr_2', userId: 'anne', email: 'anne@example.com', displayName: 'Anne' },
      }),
      getSession: async () => ({
        authenticated: true as const,
        user: { id: 'usr_2', userId: 'anne', email: 'anne@example.com', displayName: 'Anne' },
      }),
    });

    await harness.actions.verifyLink('token-123');

    if (harness.getState().authState.type !== 'AUTHENTICATED') {
      throw new Error('Expected AUTHENTICATED state after verifyLink.');
    }
  });

  await runTest('verify code falls back to session and authenticates when verify payload is unexpected', async () => {
    const harness = createHarness({
      verifyCode: async () => {
        throw new Error('Unexpected verify payload shape');
      },
      getSession: async () => ({
        authenticated: true as const,
        user: {
          id: 'usr_session',
          userId: 'session_user',
          email: 'session@example.com',
          displayName: 'Session User',
        },
      }),
    });

    await harness.actions.verifyCode({
      rawUserId: 'session_user',
      rawEmail: 'session@example.com',
      rawCode: '123456',
    });

    const state = harness.getState().authState;

    if (state.type !== 'AUTHENTICATED') {
      throw new Error('Expected AUTHENTICATED via session fallback after verifyCode failure.');
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
      verifyLink: async () => ({
        status: 'AUTHENTICATED' as const,
        user: { id: 'usr_3', userId: 'rob', email: 'rob@example.com', displayName: 'Rob' },
      }),
      getSession: async () => ({
        authenticated: true as const,
        user: { id: 'usr_3', userId: 'rob', email: 'rob@example.com', displayName: 'Rob' },
      }),
      logout: async () => {
        throw new Error('network');
      },
    });

    await harness.actions.verifyLink('token-456');
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
