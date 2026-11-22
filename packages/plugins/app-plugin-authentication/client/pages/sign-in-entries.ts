import type { AuthenticationSignInMethod } from '../settings/data.js';

/**
 * Which configured single sign-on and social providers the sign-in page shows a button for. The server knows what is
 * configured; only the application knows which buttons its sign-in page renders, which it declares with
 * `authentication({ signInButtons })`.
 */
export function providerEntries(
  methods: readonly AuthenticationSignInMethod[],
  signInButtons: readonly string[],
): {
  readonly shown: readonly string[];
  readonly withoutButton: readonly string[];
} {
  const configured = methods
    .filter((method) => method.status === 'enabled')
    .flatMap((method) => method.providers);
  const buttons = new Set(signInButtons);
  return {
    shown: configured.filter((id) => buttons.has(id)),
    withoutButton: configured.filter((id) => !buttons.has(id)),
  };
}
