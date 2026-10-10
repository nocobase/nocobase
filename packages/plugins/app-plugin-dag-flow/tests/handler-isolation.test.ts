import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { createServer } from 'vite';
import { checkWorkflowPackage } from '../build/source-check.js';
import { coreInstructions } from '../server/instructions/index.js';
import { loadWorkflowSourcePackages } from '../build/dev-source.js';
import workflowVitePlugin, {
  WORKFLOW_CLIENT_VIRTUAL_ID,
} from '../build/vite.js';

it('keeps handler dependency side effects out of check, dev and Vite definition evaluation', async () => {
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), 'workflow-handler-isolation-'),
  );
  const sourceRoot = path.join(root, 'workflows');
  const packageRoot = path.join(sourceRoot, 'isolated');
  const marker = path.join(root, 'handler-loaded');
  try {
    await fs.mkdir(path.join(packageRoot, 'server'), { recursive: true });
    await fs.mkdir(path.join(packageRoot, 'client'));
    await fs.writeFile(path.join(root, 'package.json'), '{"type":"module"}');
    const entry = fileURLToPath(new URL('../dsl/index.ts', import.meta.url));
    await fs.writeFile(
      path.join(packageRoot, 'workflow.ts'),
      `
      import { workflow, defineHandler, createRunInstruction, createConditionInstruction } from ${JSON.stringify(entry)};
      import type { run } from './server/run.js';
      const handler = defineHandler<typeof run>('./server/run');
      export default workflow({ key: 'isolated', title: 'Isolated', input: { schema: { type: 'object' }, form: './client/form.ts' } })
        .addNode(createRunInstruction({ key: 'run' }).run(handler))
        .addNode(createConditionInstruction({ key: 'check' }).check(handler).branch({}))
        .finalize();
    `,
    );
    await fs.writeFile(
      path.join(packageRoot, 'server/run.d.ts'),
      'export declare function run(): boolean;',
    );
    await fs.writeFile(
      path.join(packageRoot, 'server/run.js'),
      "import './dependency.js'; export function run() { return true; }",
    );
    await fs.writeFile(
      path.join(packageRoot, 'server/dependency.js'),
      `import { writeFileSync } from 'node:fs'; writeFileSync(${JSON.stringify(marker)}, 'loaded');`,
    );
    await fs.writeFile(
      path.join(packageRoot, 'client/form.ts'),
      'export default function Form() { return null; }',
    );

    expect((await checkWorkflowPackage(packageRoot)).ast.nodes).toHaveLength(2);
    await expect(fs.access(marker)).rejects.toMatchObject({ code: 'ENOENT' });
    expect(
      await loadWorkflowSourcePackages(sourceRoot, {
        instructions: coreInstructions,
      }),
    ).toHaveLength(1);
    await expect(fs.access(marker)).rejects.toMatchObject({ code: 'ENOENT' });

    const server = await createServer({
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: [
        workflowVitePlugin({
          appRoot: root,
          environment: { command: 'serve' },
        }),
      ],
      server: { middlewareMode: true, hmr: false },
      optimizeDeps: { noDiscovery: true, include: [] },
    });
    try {
      expect(
        (await server.transformRequest(WORKFLOW_CLIENT_VIRTUAL_ID))?.code,
      ).toContain('./client/form.ts');
      await expect(fs.access(marker)).rejects.toMatchObject({ code: 'ENOENT' });
    } finally {
      await server.close();
    }
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
