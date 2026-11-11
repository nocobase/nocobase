// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';
import { createAuthFixture } from './support.js';

describe('password registration outcomes', () => {
  const combinations = [true, false].flatMap((autoSignIn) =>
    [true, false].flatMap((requireEmailVerification) =>
      [true, false].map((notifyExisting) => ({
        autoSignIn,
        requireEmailVerification,
        notifyExisting,
      })),
    ),
  );

  it.each(combinations)(
    'preserves accounts and reports sessions: %j',
    async ({ autoSignIn, requireEmailVerification, notifyExisting }) => {
      const sendVerificationEmail = vi.fn();
      const onExistingUserSignUp = vi.fn();
      const fixture = await createAuthFixture({
        emailAndPassword: {
          enabled: true,
          autoSignIn,
          requireEmailVerification,
          ...(notifyExisting ? { onExistingUserSignUp } : {}),
        },
        emailVerification: { sendVerificationEmail },
      });
      const { connection, router, signUp } = fixture;
      const post = (path: string, body: unknown) =>
        router.request(`/api/auth/${path}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        });
      try {
        const first = await signUp();
        expect(first.response.status).toBe(200);
        const firstBody = await first.response.json();
        expect(Boolean(firstBody.token)).toBe(
          autoSignIn && !requireEmailVerification,
        );
        expect(first.cookie.includes('session_token')).toBe(
          autoSignIn && !requireEmailVerification,
        );
        expect(
          (
            await router.request('/private', {
              headers: { cookie: first.cookie },
            })
          ).status,
        ).toBe(autoSignIn && !requireEmailVerification ? 200 : 401);
        expect(sendVerificationEmail).toHaveBeenCalledTimes(
          requireEmailVerification ? 1 : 0,
        );
        if (requireEmailVerification) {
          const url = sendVerificationEmail.mock.calls[0]![0].url as string;
          const verified = await router.request(url);
          expect(verified.status).toBe(302);
          expect(
            await connection.query
              .selectFrom('user')
              .select('emailVerified')
              .executeTakeFirst(),
          ).toMatchObject({ emailVerified: true });
        }
        const users = await connection.query
          .selectFrom('user')
          .selectAll()
          .execute();
        const accounts = await connection.query
          .selectFrom('account')
          .selectAll()
          .execute();
        const sessions = await connection.query
          .selectFrom('session')
          .selectAll()
          .execute();
        const duplicate = await signUp({
          username: 'replacement',
          password: 'replacement-password',
        });
        const generic = !autoSignIn || requireEmailVerification;
        expect(duplicate.response.status).toBe(generic ? 200 : 422);
        expect(duplicate.cookie).not.toContain('session_token');
        const duplicateBody = await duplicate.response.json();
        if (generic) {
          expect(duplicateBody.token).toBeNull();
          expect(duplicateBody.user.id).not.toBe(firstBody.user.id);
        } else {
          expect(duplicateBody.code).toBe(
            'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL',
          );
        }
        expect(
          await connection.query.selectFrom('user').selectAll().execute(),
        ).toEqual(users);
        expect(
          await connection.query.selectFrom('account').selectAll().execute(),
        ).toEqual(accounts);
        expect(
          await connection.query.selectFrom('session').selectAll().execute(),
        ).toEqual(sessions);
        expect(onExistingUserSignUp).toHaveBeenCalledTimes(
          generic && notifyExisting ? 1 : 0,
        );
        expect(sendVerificationEmail).toHaveBeenCalledTimes(
          requireEmailVerification ? 1 : 0,
        );
        expect(
          (
            await post('sign-in/username', {
              username: 'replacement',
              password: 'replacement-password',
            })
          ).status,
        ).toBe(401);
        expect(
          (
            await post('sign-in/username', {
              username: 'alice.admin',
              password: 'correct horse battery staple',
            })
          ).status,
        ).toBe(200);
      } finally {
        await fixture.dispose();
      }
    },
  );

  it.each([{ enabled: false }, { enabled: true, disableSignUp: true }])(
    'refuses registration without records when %j',
    async (emailAndPassword) => {
      const fixture = await createAuthFixture({ emailAndPassword });
      try {
        expect((await fixture.signUp()).response.ok).toBe(false);
        expect(
          await fixture.connection.query
            .selectFrom('user')
            .selectAll()
            .execute(),
        ).toEqual([]);
        expect(
          await fixture.connection.query
            .selectFrom('session')
            .selectAll()
            .execute(),
        ).toEqual([]);
      } finally {
        await fixture.dispose();
      }
    },
  );
});
