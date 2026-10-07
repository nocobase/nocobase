import { useState } from 'react';
import { resolveAppUrl } from '@nocobase/app-client';
import { useAuthentication } from '../auth-provider.js';
import { useAuthenticationErrorResolver } from './errors.js';
import type {
  AuthenticationActionError,
  PasswordResetRequestActionState,
} from './types.js';
export function usePasswordResetRequest(): PasswordResetRequestActionState {
  const { client } = useAuthentication();
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
        await client.requestPasswordReset(
          {
            ...input,
            redirectTo: `${window.location.origin}${resolveAppUrl('/reset-password')}`,
          },
          { throw: true },
        );
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
