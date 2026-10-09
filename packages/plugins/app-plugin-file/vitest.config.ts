import { cpSync, mkdirSync, symlinkSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { createReactVitestConfig } from '@nocobase/dev-config/vitest/react';

// Test the recipe in a receiving package, where its subpaths belong to that consumer rather than its publisher.
const fixture = path.join(import.meta.dirname, '.registry-test-app');
const template = path.resolve(
  import.meta.dirname,
  '../../templates/app-template-default',
);
rmSync(fixture, { force: true, recursive: true });
mkdirSync(path.join(fixture, 'client/components/ui'), { recursive: true });
cpSync(
  path.join(import.meta.dirname, 'registry/component-ui'),
  path.join(fixture, 'client/extensions/nocobase-file-component-ui'),
  { recursive: true },
);
for (const name of ['button', 'dialog']) {
  cpSync(
    path.join(template, `client/components/ui/${name}.tsx`),
    path.join(fixture, `client/components/ui/${name}.tsx`),
  );
}
symlinkSync(
  path.join(template, 'node_modules'),
  path.join(fixture, 'node_modules'),
  'dir',
);
writeFileSync(
  path.join(fixture, 'package.json'),
  JSON.stringify({
    name: 'file-registry-test-app',
    type: 'module',
    imports: { '#components/*': './client/components/*.js' },
  }),
);

export default createReactVitestConfig({
  test: { include: ['tests/**/*.test.{ts,tsx}'] },
});
