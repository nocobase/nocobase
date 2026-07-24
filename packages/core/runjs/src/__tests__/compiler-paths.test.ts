/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';

import { compileRunJSSourceWorkspace, createRunJSCompilerPaths } from '../compiler';

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
});
