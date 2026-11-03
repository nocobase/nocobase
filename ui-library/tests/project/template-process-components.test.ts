// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = new URL('../../', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');
describe('preinstalled process components', () => {
  for (const template of ['default', 'examples']) {
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
