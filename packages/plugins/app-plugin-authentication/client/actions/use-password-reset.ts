import { useState } from 'react';
import { useAuthentication } from '../auth-provider.js';
import { useAuthenticationErrorResolver } from './errors.js';
import type {
  AuthenticationActionError,
  AuthenticationActionState,
  PasswordResetInput,
} from './types.js';
export function usePasswordReset(): AuthenticationActionState<PasswordResetInput> {
  const { client, refresh } = useAuthentication();
  const resolveError = useAuthenticationErrorResolver();
  const [state, setState] = useState<{
    error?: AuthenticationActionError;
    pending: boolean;
  }>({ pending: false });
  return {
    error: state.error,
    isPending: state.pending,
    submit: async (input) => {
      setState({ pending: true });
      try {
        await client.resetPassword(
          { newPassword: input.password, token: input.token },
          { throw: true },
        );
        await refresh();
        setState({ pending: false });
      } catch (error) {
        setState({
          pending: false,
          error: resolveError(error),
        });
      }
    },
  };
}
