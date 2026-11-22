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

test('an entry is one line: name, kind, first sentence and plugins', () => {
  const entry = itemSection(
    { ...block, description: 'Approves a device. Wire it after sign-in.' },
    [example],
  );
  assert.equal(entry.split('\n').length, 1);
  assert.match(entry, /^- `device-approval` \(block\): Approves a device\. /u);
  assert.match(entry, /Plugins: `@nocobase\/app-plugin-authentication`\./u);
  assert.doesNotMatch(entry, /Wire it after sign-in/u);
  assert.doesNotMatch(entry, /Installs to/u);
  assert.doesNotMatch(entry, /No example/u);
});

test('a component in client/components names no location, plugins or example it lacks', () => {
  const entry = itemSection(component, []);
  assert.match(
    entry,
    /^- `route-dialog` \(component\): A child route as a dialog\./u,
  );
  assert.doesNotMatch(entry, /Plugins:|Installs to/u);
  assert.match(entry, /No example\./u);
});

test('the catalog groups items by their group, leaves examples out and stays small', () => {
  const catalog = renderCatalog([component, example, block]);
  assert.ok(
    catalog.indexOf('## Authentication') < catalog.indexOf('## Route overlays'),
  );
  assert.doesNotMatch(catalog, /`device-approval-demo`/u);
  assert.match(catalog, /pnpm exec shadcn add @nocobase\/<item>/u);
});

// An add-on can extend the base recipe in the base recipe's installed directory.
test('an add-on names its actual installed directory rather than inventing one from its item name', () => {
  const entry = itemSection(
    {
      ...block,
      name: 'agent-chat-details',
      files: [
        {
          path: 'linked-chat-panel.tsx',
          target: 'client/extensions/nocobase-agent-chat/linked-chat-panel.tsx',
        },
      ],
    },
    [],
  );
  assert.match(
    entry,
    /Installs to `client\/extensions\/nocobase-agent-chat\/`/u,
  );
  assert.doesNotMatch(entry, /nocobase-agent-chat-details\//u);
});
