import { useState } from 'react';
import { useAuthentication } from '../auth-provider.js';
import { useAuthenticationErrorResolver } from './errors.js';
import type {
  AuthenticationActionError,
  PasswordRegistrationActionState,
} from './types.js';
export function usePasswordRegistration(): PasswordRegistrationActionState {
  const { client, refresh } = useAuthentication();
  const resolveError = useAuthenticationErrorResolver();
  const [state, setState] = useState<{
    error?: AuthenticationActionError;
    pending: boolean;
    success: boolean;
  }>({ pending: false, success: false });
  return {
    error: state.error,
    isPending: state.pending,
    isSuccess: state.success,
    submit: async (input) => {
      setState({ pending: true, success: false });
      try {
        await client.signUp.email(input, { throw: true });
        await refresh();
        setState({ pending: false, success: true });
      } catch (error) {
        setState({
          pending: false,
          success: false,
          error: resolveError(error),
        });
      }
    },
  };
}
