/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';

import { compileRunJSSourceWorkspace, createRunJSCompilerPaths, inspectRunJSSourceWorkspaceWithDependencies } from '..';

describe('@nocobase/runjs compiler paths', () => {
  it.each([
    [path.posix, '/tmp/nocobase-runjs', '/tmp/nocobase-runjs/runjs-bundle.js'],
    [path.win32, 'C:\\tmp\\nocobase-runjs', 'C:\\tmp\\nocobase-runjs\\runjs-bundle.js'],
  ])('creates native absolute compiler paths', (pathApi, workingDirectory, outfile) => {
    expect(createRunJSCompilerPaths(workingDirectory, pathApi)).toEqual({
      absWorkingDir: workingDirectory,
      outfile,
    });
  });

  it('keeps nested virtual paths and artifacts independent from the host working directory', async () => {
    const result = await compileRunJSSourceWorkspace({
      entry: 'src/pages/index.ts',
      files: [
        { path: 'src/pages/index.ts', content: `import { value } from '../shared/value'; return value;` },
        { path: 'src/shared/value.ts', content: `export const value = 'portable';` },
      ],
      surfaceStyle: 'value',
    });

    expect(result.failureCode, JSON.stringify(result.artifact.diagnostics, null, 2)).toBeUndefined();
    expect(result.artifact.entryPath).toBe('src/pages/index.ts');
    expect(result.artifact.sourceMap).toContain('src/pages/index.ts');
    expect(result.artifact.sourceMap).not.toContain(process.cwd());
    expect(result.artifact.code).not.toContain(process.cwd());
  });

  it('reports portable virtual diagnostic paths for nested imports', async () => {
    const result = await compileRunJSSourceWorkspace({
      entry: 'src/pages/index.ts',
      files: [{ path: 'src/pages/index.ts', content: `import value from '../missing/value'; return value;` }],
      surfaceStyle: 'value',
    });

    expect(result.failureCode).toBe('RUNJS_IMPORT_NOT_FOUND');
    expect(result.artifact.diagnostics).toContainEqual(
      expect.objectContaining({
        path: 'src/pages/index.ts',
        message: 'Import "../missing/value" could not be resolved',
      }),
    );
  });

  it('records relative ImportType edges and portable unresolved candidates', () => {
    const resolved = inspectRunJSSourceWorkspaceWithDependencies({
      entry: 'src/pages/index.ts',
      files: [
        {
          path: 'src/pages/index.ts',
          content: `type Row = import('../shared/types').Row;\nreturn null as unknown as Row;`,
        },
        { path: 'src/shared/types.ts', content: `export interface Row { id: number }` },
      ],
      surfaceStyle: 'value',
    });
    const unresolved = inspectRunJSSourceWorkspaceWithDependencies({
      entry: 'src/pages/index.ts',
      files: [
        {
          path: 'src/pages/index.ts',
          content: [
            `type Missing = import('../missing/types').Missing;`,
            `type Sdk = import('@nocobase/runjs/js-template/client').JsTemplate;`,
            `const dynamic = import('../dynamic/runtime');`,
            `return [null as unknown as Missing, null as unknown as Sdk, dynamic];`,
          ].join('\n'),
        },
      ],
      surfaceStyle: 'value',
    });

    expect(resolved.typeDependencies.edges).toContainEqual({
      importer: 'src/pages/index.ts',
      imported: 'src/shared/types.ts',
      kind: 'type',
    });
    expect(unresolved.typeDependencies.unresolved).toContainEqual({
      importer: 'src/pages/index.ts',
      specifier: '../missing/types',
      kind: 'type',
      candidatePaths: expect.arrayContaining([
        'src/missing/types.ts',
        'src/missing/types.tsx',
        'src/missing/types/index.ts',
      ]),
    });
    expect(unresolved.typeDependencies.unresolved).toHaveLength(1);
  });
});
