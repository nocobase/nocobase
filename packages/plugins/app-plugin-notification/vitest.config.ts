import { cpSync, mkdirSync, symlinkSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { createReactVitestConfig } from '@nocobase/dev-config/vitest/react';

// Registry subpaths resolve in the receiving application's package scope.
const fixture = path.join(import.meta.dirname, '.registry-test-app');
const template = path.resolve(
  import.meta.dirname,
  '../../templates/app-template-default',
);
rmSync(fixture, { force: true, recursive: true });
mkdirSync(path.join(fixture, 'client/components/ui'), { recursive: true });
cpSync(
  path.join(import.meta.dirname, 'registry/logs-ui'),
  path.join(fixture, 'client/extensions/nocobase-notification-logs-ui'),
  { recursive: true },
);
for (const name of ['alert', 'badge', 'button', 'button-variants', 'table']) {
  const extension = name === 'button-variants' ? 'ts' : 'tsx';
  cpSync(
    path.resolve(
      import.meta.dirname,
      `../app-plugin-hub/client/components/ui/${name}.${extension}`,
    ),
    path.join(fixture, `client/components/ui/${name}.${extension}`),
  );
}
cpSync(
  path.resolve(
    import.meta.dirname,
    '../app-plugin-ai-employee/registry/nocobase-ai/shared/ui/card.tsx',
  ),
  path.join(fixture, 'client/components/ui/card.tsx'),
);
symlinkSync(
  path.join(template, 'node_modules'),
  path.join(fixture, 'node_modules'),
  'dir',
);
writeFileSync(
  path.join(fixture, 'package.json'),
  JSON.stringify({
    name: 'notification-registry-test-app',
    type: 'module',
    imports: { '#components/*': './client/components/*.js' },
  }),
);

export default createReactVitestConfig({});
