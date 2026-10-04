import {
  authorizationToken,
  createAppAuthorization,
} from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceContainer } from '@nocobase/service-provider';
import { expect, it } from 'vitest';

import {
  JOBS_EXAMPLE_SETTINGS,
  JobsExampleAuthorizationProvider,
} from '../server/authorization.js';

it('registers the schedules settings item with its update action', async () => {
  const authz = createAppAuthorization({ config: { plugins: [] } });
  const container = new ServiceContainer();
  container.instance(authorizationToken, authz);
  await new JobsExampleAuthorizationProvider({
    container,
  } as unknown as AppPluginApplication).boot();

  expect(
    authz.resourceTypes.get('settings').items?.get(JOBS_EXAMPLE_SETTINGS),
  ).toMatchObject({ actions: [expect.objectContaining({ name: 'update' })] });
  expect(
    authz.ui.placementOf({ type: 'settings', id: JOBS_EXAMPLE_SETTINGS }),
  ).toMatchObject({ section: 'jobsExample' });
});
