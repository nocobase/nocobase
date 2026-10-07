import { useState } from 'react';
import { useAuthentication } from '../auth-provider.js';
import { useAuthenticationErrorResolver } from './errors.js';
import type {
  AuthenticationActionError,
  AuthenticationActionState,
  PasswordRegistrationInput,
} from './types.js';
export function usePasswordRegistration(): AuthenticationActionState<PasswordRegistrationInput> {
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
        await client.signUp.email(input, { throw: true });
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
