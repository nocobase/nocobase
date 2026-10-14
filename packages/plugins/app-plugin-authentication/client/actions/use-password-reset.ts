import { useState } from 'react';
import { useAuthentication } from '../auth-provider.js';
import { useAuthenticationErrorResolver } from './errors.js';
import type {
  AuthenticationActionError,
  PasswordResetActionState,
} from './types.js';
export function usePasswordReset(): PasswordResetActionState {
  const { client, refresh, session } = useAuthentication();
  const resolveError = useAuthenticationErrorResolver();
  const [state, setState] = useState<{
    error?: AuthenticationActionError;
    pending: boolean;
    success?: boolean;
  }>({ pending: false });
  return {
    error: state.error,
    isSuccess: state.success === true,
    isPending: state.pending,
    submit: async (input) => {
      setState({ pending: true });
      try {
        await client.resetPassword(
          { newPassword: input.password, token: input.token },
          { throw: true },
        );
        setState({ pending: false, success: true });
        // A guest's session remains empty. Refreshing it hides the guest route and discards its success state.
        if (session) await refresh().catch(() => undefined);
      } catch (error) {
        setState({
          pending: false,
          error: resolveError(error),
        });
      }
    },
  };
}
