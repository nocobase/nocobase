import { useState } from 'react';
import { useAuthentication } from '../auth-provider.js';
import { useAuthenticationErrorResolver } from './errors.js';
import type {
  AuthenticationActionError,
  AuthenticationActionState,
  PasswordLoginInput,
} from './types.js';
export function usePasswordLogin(): AuthenticationActionState<PasswordLoginInput> {
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
        const id = input.identifier;
        if (id.includes('@'))
          await client.signIn.email(
            { email: id, password: input.password },
            { throw: true },
          );
        else
          await client.signIn.username(
            { username: id, password: input.password },
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
