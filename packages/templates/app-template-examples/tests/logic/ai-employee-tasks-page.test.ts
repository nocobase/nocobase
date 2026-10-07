import { AI_EMPLOYEE_EXAMPLE_ROUTE_IDS } from '@nocobase/app-plugin-ai-employee-example/client';
import { resolveAppRuntime } from '@nocobase/app-client/runtime';
import { describe, expect, it } from 'vitest';

import TasksPage from '../../client/extensions/nocobase-ai-employee-example-tasks-page/pages/ai-employee-tasks-page.js';
import appRuntime from '../../client/runtime.ts';

describe('AI employee tasks page', () => {
  it('replaces the example plugin’s fallback page through its Registry extension', async () => {
    const runtime = await resolveAppRuntime(appRuntime);
    const route = runtime.routes.find(
      ({ id }) => id === AI_EMPLOYEE_EXAMPLE_ROUTE_IDS.tasks,
    );

    // The route, its path and its menu entry stay with the plugin; only the component is the application's.
    expect(route).toMatchObject({
      packageName: '@nocobase/app-plugin-ai-employee-example',
      path: '/ai-employee-example',
      auth: 'required',
    });
    await expect(route?.componentLoader?.()).resolves.toMatchObject({
      default: TasksPage,
    });
  });
});
