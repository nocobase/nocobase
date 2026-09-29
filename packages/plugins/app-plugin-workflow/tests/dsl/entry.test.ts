import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { build } from 'vite';

it('bundles the dedicated DSL entry without server implementations', async () => {
  const modules: string[] = [];
  await build({
    configFile: false,
    logLevel: 'silent',
    plugins: [
      {
        name: 'inspect-dsl-module-boundary',
        generateBundle() {
          modules.push(...this.getModuleIds());
        },
      },
    ],
    build: {
      write: false,
      minify: false,
      rollupOptions: {
        input: fileURLToPath(new URL('../../dsl/index.ts', import.meta.url)),
        preserveEntrySignatures: 'strict',
      },
    },
  });
  expect(
    modules.filter((id) => id.includes('/app-plugin-workflow/server/')),
  ).toEqual([]);
  expect(modules.some((id) => id.includes('/dsl/instructions/run.ts'))).toBe(
    true,
  );
});
