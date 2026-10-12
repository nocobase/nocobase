import { useState } from 'react';
import { useAuthentication } from '../auth-provider.js';
import { useAuthenticationErrorResolver } from './errors.js';
import type {
  AuthenticationActionError,
  PasswordResetActionState,
} from './types.js';
export function usePasswordReset(): PasswordResetActionState {
  const { client } = useAuthentication();
  const resolveError = useAuthenticationErrorResolver();
  const [state, setState] = useState<{
    error?: AuthenticationActionError;
    pending: boolean;
    success?: boolean;
  }>({ pending: false });
  return {
    error: state.error,
    isPending: state.pending,
    isSuccess: state.success === true,
    submit: async (input) => {
      if (state.pending || state.success) return;
      setState({ pending: true });
      try {
        await client.resetPassword(
          { newPassword: input.password, token: input.token },
          { throw: true },
        );
        setState({ pending: false, success: true });
        // Refreshing the guest session here unmounts this page and loses its completed state.
      } catch (error) {
        setState({
          pending: false,
          error: resolveError(error),
        });
      }
    },
  };
}
