// @vitest-environment node
import { createAuthEndpoint } from 'better-auth/api';
import { handleOAuthUserInfo } from 'better-auth/oauth2';
import type { BetterAuthPlugin } from 'better-auth';
import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { createAuthFixture } from './support.js';

/**
 * What the single sign-on guide generates (`client/pages/sso-config.ts`), checked against Better Auth's own account
 * matching: the step a provider's callback ends in, reached here without a provider round trip.
 */
const oauthCallback = {
  id: 'test-oauth-callback',
  endpoints: {
    testOAuthCallback: createAuthEndpoint(
      '/test/oauth-callback',
      {
        method: 'POST',
        body: z.object({
          accountId: z.string(),
          email: z.string(),
          disableSignUp: z.boolean(),
          linkTo: z.string().optional(),
        }),
      },
      async (context) => {
        const result = await handleOAuthUserInfo(context, {
          userInfo: {
            id: context.body.accountId,
            email: context.body.email,
            name: 'Ada',
            emailVerified: true,
          },
          account: {
            providerId: 'acme-sso',
            accountId: context.body.accountId,
            accessToken: 'access-token',
          },
          disableSignUp: context.body.disableSignUp,
          // The provider vouches for the email: the strongest case for linking by email.
          isTrustedProvider: true,
          ...(context.body.linkTo
            ? {
                selectedUser: {
                  userId: context.body.linkTo,
                  profile: 'preserve' as const,
                },
              }
            : {}),
        });
        return context.json({
          error: result.error ?? null,
          userId: result.data?.user.id ?? null,
        });
      },
    ),
  },
} satisfies BetterAuthPlugin;

describe('the account matching the single sign-on guide configures', () => {
  let dispose: (() => Promise<void>) | undefined;
  afterEach(async () => {
    await dispose?.();
    dispose = undefined;
  });

  async function setup() {
    const fixture = await createAuthFixture({
      plugins: [oauthCallback],
      account: { accountLinking: { disableImplicitLinking: true } },
      emailAndPassword: { enabled: true, autoSignIn: true },
    });
    dispose = fixture.dispose;
    const signUp = await fixture.signUp({ email: 'ada@example.com' });
    const userId = ((await signUp.response.json()) as { user: { id: string } })
      .user.id;
    // The local email is verified, so nothing but the setting stands between the provider and the account.
    await fixture.connection.query
      .updateTable('user')
      .set({ emailVerified: true })
      .where('id', '=', userId)
      .execute();
    const callback = async (body: Record<string, unknown>) =>
      (await (
        await fixture.router.request('/api/auth/test/oauth-callback', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        })
      ).json()) as { error: string | null; userId: string | null };
    const accounts = () =>
      fixture.connection.query
        .selectFrom('account')
        .select(['providerId', 'userId'])
        .where('providerId', '=', 'acme-sso')
        .execute();
    return { userId, callback, accounts };
  }

  it('does not link a provider identity with the same email to an existing user', async () => {
    const { callback, accounts } = await setup();
    expect(
      await callback({
        accountId: 'subject-1',
        email: 'ada@example.com',
        disableSignUp: false,
      }),
    ).toEqual({ error: 'account not linked', userId: null });
    expect(await accounts()).toEqual([]);
  });

  it('still links the provider the person asks to link while signed in', async () => {
    const { userId, callback, accounts } = await setup();
    expect(
      await callback({
        accountId: 'subject-1',
        email: 'ada@example.com',
        disableSignUp: true,
        linkTo: userId,
      }),
    ).toEqual({ error: null, userId });
    expect(await accounts()).toEqual([{ providerId: 'acme-sso', userId }]);
  });

  it('creates no user for an unknown identity when only existing accounts may sign in', async () => {
    const { callback, accounts } = await setup();
    expect(
      await callback({
        accountId: 'subject-2',
        email: 'grace@example.com',
        disableSignUp: true,
      }),
    ).toEqual({ error: 'signup disabled', userId: null });
    expect(await accounts()).toEqual([]);
  });
});
