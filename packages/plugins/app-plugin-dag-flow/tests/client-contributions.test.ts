import { describe, expect, it } from 'vitest';

import packageJson from '../package.json' with { type: 'json' };
import workflow, { WORKFLOW_ROUTE_IDS } from '../client/index.js';
import routes from '../client/routes.js';

describe('workflow client contributions', () => {
  it('uses the explicit client plugin registration surface', () => {
    expect(packageJson).not.toHaveProperty('nocobase');
    expect(packageJson.exports).toHaveProperty('./client');
    expect(packageJson.publishConfig.exports).toHaveProperty('./client');
    expect(workflow().serviceProviders).toHaveLength(1);
    expect(workflow().locales).toMatchObject({
      'en-US': expect.any(Function),
      'zh-CN': expect.any(Function),
    });
  });

  it('keeps collection definitions internal to the plugin', () => {
    expect(packageJson.exports).not.toHaveProperty('./collections');
    expect(packageJson.publishConfig.exports).not.toHaveProperty(
      './collections',
    );
  });

  it('contributes workflow management settings and nested detail routes', () => {
    const settings = routes.find((route) => route.parent === 'settings');
    const appRoutes = routes.find((route) => route.parent === 'app');

    expect(settings?.routes[0]).toMatchObject({
      name: 'automation',

      navigation: { title: 'nav.automation' },
      children: [
        {
          name: 'workflows',
          path: '/workflow',
          navigation: { title: 'nav.workflows' },
        },
      ],
    });
    expect(settings?.routes[0]).not.toHaveProperty('path');
    expect(settings?.routes[0]).toHaveProperty('navigation.icon');
    expect(settings?.routes[0].children?.[0]).toHaveProperty('navigation.icon');
    expect(appRoutes?.routes.map(({ name, path }) => ({ name, path }))).toEqual(
      [
        {
          name: 'workflow-detail',
          path: '/settings/workflow/workflows/:id',
        },
        {
          name: 'workflow-run-detail',
          path: '/settings/workflow/runs/:id',
        },
      ],
    );
    expect(WORKFLOW_ROUTE_IDS).toEqual({
      workflowDetail: '@nocobase/app-plugin-dag-flow:workflow-detail',
      workflowRunDetail: '@nocobase/app-plugin-dag-flow:workflow-run-detail',
    });
  });
});
