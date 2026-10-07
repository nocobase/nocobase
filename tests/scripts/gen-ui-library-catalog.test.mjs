import assert from 'node:assert/strict';
import test from 'node:test';

import {
  itemSection,
  renderCatalog,
} from '../../scripts/gen-ui-library-catalog.mjs';

const block = {
  name: 'device-approval',
  type: 'registry:block',
  description: 'Approves a device.',
  meta: { group: 'Authentication' },
  dependencies: [
    '@nocobase/app-plugin-authentication@^2.0.0-beta.0',
    'lucide-react@^0.487.0',
  ],
  registryDependencies: ['button', '@nocobase/auth-centered-layout'],
  docs: 'Enable deviceAuthorization().',
  files: [
    {
      path: 'device-approval/device-approval.tsx',
      target: 'client/extensions/nocobase-device-approval/device-approval.tsx',
    },
  ],
};

const component = {
  name: 'route-dialog',
  type: 'registry:component',
  description: 'A child route as a dialog.',
  meta: { group: 'Route overlays' },
  files: [
    { path: 'route-dialog.tsx', target: 'client/components/route-dialog.tsx' },
    {
      path: 'use-route-overlay.ts',
      target: 'client/components/use-route-overlay.ts',
    },
  ],
};

const example = {
  name: 'device-approval-demo',
  type: 'registry:example',
  description: 'Usage example.',
  files: [],
};

test('a block installs into its own directory and names its plugins, items, example and docs', () => {
  const section = itemSection(block, [example]);
  assert.match(section, /^### device-approval$/mu);
  assert.match(section, /- Kind: block/u);
  assert.match(
    section,
    /- Install: `yes n \| pnpm exec shadcn add @nocobase\/device-approval`/u,
  );
  assert.match(
    section,
    /- Installs to: `client\/extensions\/nocobase-device-approval\/`/u,
  );
  assert.match(
    section,
    /- Plugin dependencies: `@nocobase\/app-plugin-authentication`$/mu,
  );
  assert.match(section, /- Also installs: `@nocobase\/auth-centered-layout`/u);
  assert.match(section, /- Example: `@nocobase\/device-approval-demo`/u);
  assert.match(
    section,
    /- After installing: Enable deviceAuthorization\(\)\./u,
  );
});

test('a component lists each file it installs and has no plugin dependency', () => {
  const section = itemSection(component, []);
  assert.match(section, /- Kind: component/u);
  assert.match(
    section,
    /- Installs to: `client\/components\/route-dialog\.tsx`, `client\/components\/use-route-overlay\.ts`/u,
  );
  assert.match(section, /- Plugin dependencies: none/u);
  assert.doesNotMatch(section, /- Example:/u);
});

test('the catalog groups items by their group and leaves examples out as entries', () => {
  const catalog = renderCatalog([component, example, block]);
  assert.ok(
    catalog.indexOf('## Authentication') < catalog.indexOf('## Route overlays'),
  );
  assert.doesNotMatch(catalog, /^### device-approval-demo$/mu);
});
