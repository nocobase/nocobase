import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, it } from 'vitest';
import { buildApplicationWorkflows } from '../build/index.js';

const authoring = fileURLToPath(new URL('../index.ts', import.meta.url));
const roots: string[] = [];
afterEach(async () =>
  Promise.all(
    roots
      .splice(0)
      .map((root) => fs.rm(root, { recursive: true, force: true })),
  ),
);

it.each(['inputForm', 'parameterForm'])(
  'builds an Artifact for a workflow with only %s',
  async (form) => {
    const root = await fs.mkdtemp(
      path.join(os.tmpdir(), 'workflow-client-build-'),
    );
    roots.push(root);
    const sourceRoot = path.join(root, 'workflows');
    const packageRoot = path.join(sourceRoot, 'sample');
    await fs.mkdir(path.join(packageRoot, 'client'), { recursive: true });
    await fs.writeFile(
      path.join(packageRoot, 'workflow.ts'),
      `import { defineWorkflow } from ${JSON.stringify(authoring)}; export default defineWorkflow({ title: 'Sample', client: { ${form}: './client/form.ts' }, nodes: [] });`,
    );
    await fs.writeFile(
      path.join(packageRoot, 'client/form.ts'),
      'export default function Form() { return "test"; }',
    );
    const distRoot = path.join(root, 'dist/workflows');
    const first = await buildApplicationWorkflows({ sourceRoot, distRoot });
    const artifact = first.artifacts[0];
    const manifest = JSON.parse(
      await fs.readFile(path.join(artifact, 'client/manifest.json'), 'utf8'),
    ) as { entries: Record<string, { js: string }>; files: string[] };
    expect(manifest.entries[`workflow.${form}`]?.js).toMatch(
      /^client\/entry0-[\w-]+\.js$/,
    );
    expect(manifest.files).toContain(manifest.entries[`workflow.${form}`].js);
    await expect(
      fs.readFile(path.join(artifact, 'client/form.ts')),
    ).rejects.toMatchObject({ code: 'ENOENT' });
    await fs.writeFile(
      path.join(packageRoot, 'client/form.ts'),
      'export default function Form() { return "changed"; }',
    );
    const second = await buildApplicationWorkflows({ sourceRoot, distRoot });
    const secondManifest = JSON.parse(
      await fs.readFile(
        path.join(second.artifacts[0], 'client/manifest.json'),
        'utf8',
      ),
    ) as typeof manifest;
    expect(
      await fs.readFile(
        path.join(
          second.artifacts[0],
          secondManifest.entries[`workflow.${form}`].js,
        ),
        'utf8',
      ),
    ).toContain('changed');
    expect(path.basename(second.artifacts[0])).not.toBe(
      path.basename(artifact),
    );
  },
);
