import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import routes from '../client/routes.js';
import { AI_EMPLOYEE_EXAMPLE_ROUTE_IDS } from '../client/index.js';
import packageMetadata from '../package.json' with { type: 'json' };

interface RegistryItem {
  readonly dependencies: readonly string[];
  readonly name: string;
  readonly registryDependencies: readonly string[];
  readonly source: { readonly root: string; readonly target: string };
}

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const read = (file: string): string =>
  fs.readFileSync(path.join(packageRoot, file), 'utf8');

describe('AI employee example Registry contract', () => {
  const config = JSON.parse(read('registry.config.json')) as {
    readonly items: readonly RegistryItem[];
  };

  it('publishes the tasks page as the only item, declared in the manifest', () => {
    expect(config.items.map(({ name }) => name)).toEqual(['tasks-page']);
    expect(config.items[0]).toMatchObject({
      registryDependencies: ['badge', 'button', 'card'],
      source: {
        root: 'registry/tasks-page',
        target: 'client/extensions/nocobase-ai-employee-example-tasks-page',
      },
    });
    expect(config.items[0].dependencies).toContain(
      '@nocobase/app-plugin-ai-employee-example@^0.0.1',
    );
    expect(packageMetadata.nocobase.registry.items).toEqual({
      'tasks-page': './registry/tasks-page',
    });
  });

  it('overrides the route the plugin declares, by its stable id', () => {
    const [contribution] = routes as readonly {
      readonly routes: readonly { readonly name: string }[];
    }[];
    const [route] = contribution.routes;
    expect(`${packageMetadata.name}:${route.name}`).toBe(
      AI_EMPLOYEE_EXAMPLE_ROUTE_IDS.tasks,
    );

    const extension = read('registry/tasks-page/extension.ts');
    expect(extension).toContain('AI_EMPLOYEE_EXAMPLE_ROUTE_IDS.tasks');
    expect(extension).toContain(
      "'./client/extensions/nocobase-ai-employee-example-tasks-page/pages/ai-employee-tasks-page'",
    );
  });

  it('reaches the chat only through the application-owned nocobase-ai item', () => {
    const page = read('registry/tasks-page/pages/ai-employee-tasks-page.tsx');
    expect(page).toContain("from '@/extensions/nocobase-ai'");
    expect(page).not.toContain('@nocobase/app-plugin-ai-employee/');
  });
});
