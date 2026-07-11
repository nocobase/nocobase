/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdir, mkdtemp, rm, symlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { extractFlowSurfacePluginCapabilities } from '../flow-surfaces/extractor/cli';

const generatedAt = '2026-07-10T00:00:00.000Z';
const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function createPackage(name: string) {
  const packageRoot = await mkdtemp(join(tmpdir(), 'flow-surfaces-source-selection-'));
  tempDirs.push(packageRoot);
  await writeFile(join(packageRoot, 'package.json'), JSON.stringify({ name, version: '1.0.0' }), 'utf8');
  return packageRoot;
}

const blockModelSource = (modelUse: string) => `
  class ${modelUse} {}
  flowEngine.registerModels({ ${modelUse} });
  ${modelUse}.define({ createModelOptions: { use: '${modelUse}' } });
`;

describe('flow surface extractor source selection', () => {
  it('extracts only production modules reachable from the client-v2 entry', async () => {
    const packageRoot = await createPackage('@example/plugin-source-selection');
    const sourceRoot = join(packageRoot, 'src/client-v2');
    await mkdir(join(sourceRoot, '__tests__'), { recursive: true });
    await mkdir(join(sourceRoot, 'fixtures'), { recursive: true });
    await writeFile(
      join(sourceRoot, 'index.ts'),
      [
        "import './live';",
        "import type { DeadType } from './type-only';",
        "import { type InlineDeadType } from './inline-type-only';",
        "export { type ExportedDeadType } from './export-type-only';",
        '',
      ].join('\n'),
      'utf8',
    );
    await writeFile(
      join(sourceRoot, 'live.ts'),
      `import { liveFlow } from './live-flow';\n${blockModelSource(
        'LiveBlockModel',
      )}\nLiveBlockModel.registerFlow(liveFlow);`,
      'utf8',
    );
    await writeFile(
      join(sourceRoot, 'live-flow.ts'),
      "export const liveFlow = defineFlow({ key: 'liveSettings', steps: {} });",
      'utf8',
    );
    await writeFile(join(sourceRoot, 'dead.ts'), blockModelSource('DeadBlockModel'), 'utf8');
    await writeFile(
      join(sourceRoot, 'type-only.ts'),
      `export type DeadType = string;\n${blockModelSource('TypeOnlyBlockModel')}`,
      'utf8',
    );
    await writeFile(
      join(sourceRoot, 'inline-type-only.ts'),
      `export type InlineDeadType = string;\n${blockModelSource('InlineTypeOnlyBlockModel')}`,
      'utf8',
    );
    await writeFile(
      join(sourceRoot, 'export-type-only.ts'),
      `export type ExportedDeadType = string;\n${blockModelSource('ExportTypeOnlyBlockModel')}`,
      'utf8',
    );
    await writeFile(join(sourceRoot, '__tests__/FakeBlockModel.test.ts'), blockModelSource('TestBlockModel'), 'utf8');
    await writeFile(join(sourceRoot, 'fixtures/FakeBlockModel.ts'), blockModelSource('FixtureBlockModel'), 'utf8');

    const first = await extractFlowSurfacePluginCapabilities(
      { plugin: '@example/plugin-source-selection', packageRoot },
      { generatedAt, extractorVersion: 'test' },
    );
    await writeFile(join(sourceRoot, 'dead.ts'), blockModelSource('ChangedDeadBlockModel'), 'utf8');
    await writeFile(
      join(sourceRoot, '__tests__/FakeBlockModel.test.ts'),
      blockModelSource('ChangedTestBlockModel'),
      'utf8',
    );
    const second = await extractFlowSurfacePluginCapabilities(
      { plugin: '@example/plugin-source-selection', packageRoot },
      { generatedAt, extractorVersion: 'test' },
    );

    expect(first.snapshot.resolvedEntry).toBe('src/client-v2/index.ts');
    expect(first.snapshot.sourceHash).toBe(second.snapshot.sourceHash);
    expect(first.snapshot.models.map((model) => model.modelUse)).toEqual(['LiveBlockModel']);
    expect(first.snapshot.flows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ modelUse: 'LiveBlockModel', flowKey: 'liveSettings', staticStatus: 'static' }),
      ]),
    );
    expect(first.snapshot.models[0].sourceRefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: 'src/client-v2/live.ts',
          evidenceSource: 'ast',
        }),
      ]),
    );
    const serializedSnapshot = JSON.stringify(first.snapshot);
    expect(serializedSnapshot).not.toContain(packageRoot);
    expect(serializedSnapshot).not.toContain('__tests__');
    expect(serializedSnapshot).not.toContain('fixtures');
    expect(serializedSnapshot).not.toContain('DeadBlockModel');
    expect(first.candidateCount).toBe(1);
  });

  it('supports the core client-v2 source layout', async () => {
    const packageRoot = await createPackage('@nocobase/client-v2');
    await mkdir(join(packageRoot, 'src/models'), { recursive: true });
    await writeFile(join(packageRoot, 'src/index.ts'), "export * from './models';\n", 'utf8');
    await writeFile(join(packageRoot, 'src/models/index.ts'), blockModelSource('CoreBlockModel'), 'utf8');

    const extraction = await extractFlowSurfacePluginCapabilities(
      {
        plugin: '@nocobase/client-v2',
        packageRoot,
        sourceEntry: 'src/index.ts',
        sourceRoot: 'src',
      },
      { generatedAt, extractorVersion: 'test' },
    );

    expect(extraction.snapshot.resolvedEntry).toBe('src/index.ts');
    expect(extraction.snapshot.models.map((model) => model.modelUse)).toEqual(['CoreBlockModel']);
    expect(extraction.candidateCount).toBe(1);
  });

  it('ignores reachable source symlinks that resolve outside the package root', async () => {
    const packageRoot = await createPackage('@example/plugin-source-symlink');
    const externalRoot = await mkdtemp(join(tmpdir(), 'flow-surfaces-source-external-'));
    tempDirs.push(externalRoot);
    const sourceRoot = join(packageRoot, 'src/client-v2');
    await mkdir(sourceRoot, { recursive: true });
    await writeFile(
      join(sourceRoot, 'index.ts'),
      `import './outside';\n${blockModelSource('InsideBlockModel')}`,
      'utf8',
    );
    await writeFile(join(externalRoot, 'outside.ts'), blockModelSource('OutsideBlockModel'), 'utf8');
    await symlink(join(externalRoot, 'outside.ts'), join(sourceRoot, 'outside.ts'));

    const extraction = await extractFlowSurfacePluginCapabilities(
      { plugin: '@example/plugin-source-symlink', packageRoot },
      { generatedAt, extractorVersion: 'test' },
    );

    expect(extraction.snapshot.models.map((model) => model.modelUse)).toEqual(['InsideBlockModel']);
  });
});
