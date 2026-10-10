import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import { buildApplicationWorkflows } from '../build/index.js';
import { echoInstruction } from './fixtures/instructions.js';

const authoringEntry = fileURLToPath(new URL('../index.ts', import.meta.url));
const roots: string[] = [];

afterEach(async () => {
  await Promise.all(
    roots
      .splice(0)
      .map((root) => fs.rm(root, { recursive: true, force: true })),
  );
});

describe('application workflow builder', () => {
  it('treats a missing source root as an application with no workflows', async () => {
    const root = await fs.mkdtemp(
      path.join(os.tmpdir(), 'workflow-application-build-empty-'),
    );
    roots.push(root);
    const distRoot = path.join(root, 'dist/workflows');

    await expect(
      buildApplicationWorkflows({
        sourceRoot: path.join(root, 'workflows'),
        distRoot,
      }),
    ).resolves.toEqual({ packages: 0, artifacts: [] });
    await expect(fs.readdir(distRoot)).resolves.toEqual([]);
  });

  it('builds workflow package directories and replaces stale output', async () => {
    const root = await fs.mkdtemp(
      path.join(os.tmpdir(), 'workflow-application-build-'),
    );
    roots.push(root);
    const sourceRoot = path.join(root, 'workflows');
    const distRoot = path.join(root, 'dist/workflows');
    const packageRoot = path.join(sourceRoot, 'sample');
    await fs.mkdir(packageRoot, { recursive: true });
    await fs.mkdir(path.join(distRoot, 'stale'), { recursive: true });
    await fs.writeFile(path.join(distRoot, 'stale/workflow.json'), '{}');
    await fs.writeFile(
      path.join(packageRoot, 'workflow.ts'),
      `import { defineWorkflow } from ${JSON.stringify(authoringEntry)};\nexport default defineWorkflow({ title: 'Sample', nodes: [] });\n`,
    );

    const result = await buildApplicationWorkflows({ sourceRoot, distRoot });

    expect(result.packages).toBe(1);
    expect(result.artifacts).toHaveLength(1);
    await expect(fs.readdir(distRoot)).resolves.toEqual(['sample']);
    await expect(
      fs.readFile(path.join(result.artifacts[0], 'workflow.json'), 'utf8'),
    ).resolves.toContain('"key": "sample"');
    await expect(
      fs.readFile(path.join(result.artifacts[0], 'workflow.ts'), 'utf8'),
    ).resolves.toContain('defineWorkflow');
  });

  it('builds workflows that use application-registered instructions', async () => {
    const root = await fs.mkdtemp(
      path.join(os.tmpdir(), 'workflow-application-build-instruction-'),
    );
    roots.push(root);
    const sourceRoot = path.join(root, 'workflows');
    const distRoot = path.join(root, 'dist/workflows');
    const packageRoot = path.join(sourceRoot, 'custom');
    await fs.mkdir(packageRoot, { recursive: true });
    await fs.writeFile(
      path.join(packageRoot, 'workflow.ts'),
      `import { defineWorkflow, type NodeExpression } from ${JSON.stringify(authoringEntry)};
const echo: NodeExpression = { key: 'echo', type: 'echo', config: { value: 'custom' } };
export default defineWorkflow({ title: 'Custom instruction', nodes: [echo] });
`,
    );

    const result = await buildApplicationWorkflows({
      sourceRoot,
      distRoot,
      instructions: new Map([['echo', echoInstruction]]),
    });

    expect(result.packages).toBe(1);
    await expect(
      fs.readFile(path.join(result.artifacts[0], 'workflow.json'), 'utf8'),
    ).resolves.toContain('"type": "echo"');
  });

  it('collects default-build modules without changing their relative paths', async () => {
    const root = await fs.mkdtemp(
      path.join(os.tmpdir(), 'workflow-application-build-resources-'),
    );
    roots.push(root);
    const sourceRoot = path.join(root, 'workflows');
    const resourceRoot = path.join(root, 'compiled/workflows');
    const distRoot = path.join(root, 'dist/workflows');
    const sourcePackage = path.join(sourceRoot, 'sample');
    const compiledPackage = path.join(resourceRoot, 'sample');
    await fs.mkdir(path.join(sourcePackage, 'server'), { recursive: true });
    await fs.mkdir(path.join(compiledPackage, 'server'), { recursive: true });
    await fs.writeFile(
      path.join(sourcePackage, 'workflow.ts'),
      `import { defineWorkflow, RunInstruction } from ${JSON.stringify(authoringEntry)};\nexport default defineWorkflow({ title: 'Sample', nodes: [RunInstruction.create({ key: 'record', config: { module: './server/record-step' } })] });\n`,
    );
    await fs.writeFile(
      path.join(sourcePackage, 'server/record-step.ts'),
      'export function run() { return "source"; }',
    );
    await fs.writeFile(
      path.join(compiledPackage, 'workflow.js'),
      'export default {};',
    );
    await fs.writeFile(
      path.join(compiledPackage, 'server/record-step.js'),
      'export function run() { return "compiled"; }',
    );
    const previousArtifact = path.join(compiledPackage, 'a'.repeat(64));
    await fs.mkdir(path.join(previousArtifact, 'server'), { recursive: true });
    await fs.writeFile(
      path.join(previousArtifact, 'server/stale.js'),
      'export const stale = true;',
    );

    const result = await buildApplicationWorkflows({
      sourceRoot,
      resourceRoot,
      distRoot,
    });

    const artifact = result.artifacts[0];
    await expect(
      fs.readFile(path.join(artifact, 'server/record-step.js'), 'utf8'),
    ).resolves.toContain('compiled');
    await expect(
      fs.readFile(path.join(artifact, 'workflow.js'), 'utf8'),
    ).resolves.toContain('export default');
    await expect(
      fs.access(path.join(artifact, 'server/record-step.ts')),
    ).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(
      fs.access(path.join(artifact, 'a'.repeat(64))),
    ).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(
      fs.readFile(path.join(artifact, 'package.json'), 'utf8'),
    ).resolves.toBe('{"type":"module"}\n');
    await expect(
      fs.readFile(path.join(artifact, 'workflow.json'), 'utf8'),
    ).resolves.not.toContain('"server"');
  });
});
