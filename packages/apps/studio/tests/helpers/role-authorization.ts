import type { ClientApplication } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import { ServiceContainer } from '@nocobase/service-provider';

/** Role page fixtures grant only the Studio role-definition action they exercise. */
export function createRoleTestApp(): ClientApplication {
  const container = new ServiceContainer();
  container.instance(
    authorizationClientToken,
    new AuthorizationClient({
      request: async () => ({
        data: {
          permissions: [
            {
              resource: { type: 'settings', id: 'studio.roles' },
              actions: ['manage'],
            },
          ],
        },
      }),
    } as never),
  );
  return { services: container } as unknown as ClientApplication;
}
