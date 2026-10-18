// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = new URL('../../', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');
const groups = [
  'registry/components/registry.json',
  'registry/lifecycle/registry.json',
].map((path) => JSON.parse(read(path)));
const names = new Set([
  'data-table',
  'flow-diagram',
  'lifecycle-diagram',
  'workflow-management',
]);
describe('preinstalled process components', () => {
  for (const template of ['default', 'examples']) {
    for (const item of groups
      .flatMap((group) => group.items)
      .filter((item) => names.has(item.name))) {
      for (const file of item.files) {
        const registry =
          item.name === 'lifecycle-diagram' ||
          item.name === 'workflow-management'
            ? 'registry/lifecycle/'
            : 'registry/components/';
        it(`${template} ships the canonical ${item.name}/${file.path}`, () => {
          expect(
            read(
              `../packages/templates/app-template-${template}/${file.target}`,
            ),
          ).toBe(read(registry + file.path));
        });
      }
    }
    it(`${template} declares the graph dependencies in client devDependencies`, () => {
      const manifest = JSON.parse(
        read(`../packages/templates/app-template-${template}/package.json`),
      );
      expect(manifest.devDependencies).toMatchObject({
        '@xyflow/react': '^12.11.5',
        elkjs: '^0.10.2',
      });
    });
  }
  it('keeps Default business and settings routes unregistered', () => {
    const routes = read(
      '../packages/templates/app-template-default/client/routes.ts',
    );
    expect(routes).not.toMatch(/workflows|processes|settingsRoutes/);
  });
});
