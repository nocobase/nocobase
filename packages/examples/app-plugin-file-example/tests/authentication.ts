import { Auth, authenticationToken } from '@nocobase/app-plugin-authentication';
import type { DatabaseManager } from '@nocobase/db';
import type { ServiceContainer } from '@nocobase/service-provider';
import { vi } from 'vitest';

/** The header a test sends to be treated as signed in. */
export const signedIn: Readonly<Record<string, string>> = {
  'x-test-user': 'tester',
};

/**
 * Register an authentication service whose session is decided by the `x-test-user` header, so a test signs in by
 * sending `signedIn` and stays anonymous by leaving it out.
 */
export function registerTestAuthentication(
  container: ServiceContainer,
  database: DatabaseManager,
): void {
  const authentication = new Auth({
    connection: database.connection(),
    secret: 'file-example-test-secret-at-least-32-characters',
    baseURL: 'http://example.test',
  });
  vi.spyOn(authentication, 'getSession').mockImplementation(async (headers) =>
    headers.get('x-test-user')
      ? {
          user: {
            id: 'tester',
            name: 'Tester',
            email: 'tester@example.test',
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          session: {
            id: 'test-session',
            token: 'test-token',
            userId: 'tester',
            expiresAt: new Date(Date.now() + 60000),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        }
      : null,
  );
  container.instance(authenticationToken, authentication);
}
