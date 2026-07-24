/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  buildRunJSFilesHash as buildCoreFilesHash,
  buildRunJSRuntimeCodeHash as buildCoreRuntimeCodeHash,
} from '@nocobase/runjs';
import { compileRunJSSourceWorkspace as compileCoreWorkspace } from '@nocobase/runjs/compiler';

import { buildRunJSFilesHash, buildRunJSRuntimeCodeHash, compileRunJSSourceWorkspace } from '../../index';

describe('plugin-vsc-file RunJS compatibility exports', () => {
  it('keeps old compiler and hash imports behaviorally compatible', async () => {
    const files = [{ path: 'index.ts', content: 'return 42;' }];
    const input = { entry: 'index.ts', files, surfaceStyle: 'value' as const };
    const [compatResult, coreResult] = await Promise.all([
      compileRunJSSourceWorkspace(input),
      compileCoreWorkspace(input),
    ]);

    expect(compatResult).toEqual(coreResult);
    expect(buildRunJSFilesHash(files)).toBe(buildCoreFilesHash(files));
    expect(buildRunJSRuntimeCodeHash(compatResult.artifact.code)).toBe(
      buildCoreRuntimeCodeHash(coreResult.artifact.code),
    );
  });
});
