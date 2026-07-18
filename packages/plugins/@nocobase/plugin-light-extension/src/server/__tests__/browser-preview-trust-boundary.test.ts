/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ResourcerActionContext } from '@nocobase/resourcer';
import { describe, expect, it, vi } from 'vitest';

import { createLightExtensionFilesResource } from '../resources/lightExtensionFiles';
import type { LightExtensionFileService } from '../services/LightExtensionFileService';
import type { LightExtensionRuntimeCompileService } from '../services/LightExtensionRuntimeCompileService';

describe('browser provisional preview Save trust boundary', () => {
  it('drops client compile keys, affected hints, bundles, metafiles, and source maps before canonical Save', async () => {
    const saveResult = { commit: { id: 'canonical-commit' } };
    const saveSource = vi.fn(async () => saveResult);
    const resource = createLightExtensionFilesResource(
      {} as LightExtensionFileService,
      { saveSource } as unknown as LightExtensionRuntimeCompileService,
    );
    const action = resource.actions?.saveSource;
    if (typeof action !== 'function') {
      throw new Error('Expected lightExtensionFiles:saveSource to be a resource action handler');
    }
    const next = vi.fn(async () => undefined);
    const ctx = {
      action: {
        params: {
          values: {
            repoId: ' repo-1 ',
            expectedHeadCommitId: ' head-1 ',
            message: ' canonical save ',
            files: [
              {
                path: ' src/client/js-blocks/example/index.tsx ',
                content: 'ctx.render(<div>canonical source</div>);',
                language: 'typescript',
                localCompileKey: 'attacker-file-key',
                bundle: 'globalThis.attackerFileBundle = true;',
                sourceMap: 'attacker-file-source-map',
              },
            ],
            localCompileKey: 'attacker-key',
            compilerBuildId: 'attacker-compiler',
            affectedEntries: ['attacker-entry'],
            affectedEntryHints: ['attacker-entry'],
            bundle: 'globalThis.attackerBundle = true;',
            provisionalBundle: 'globalThis.attackerProvisionalBundle = true;',
            metafile: { inputs: { 'attacker.ts': {} } },
            sourceMap: 'attacker-source-map',
          },
        },
      },
      auth: { user: { id: 42 } },
      request: {
        headers: {
          'x-request-id': 'request-1',
          'x-request-source': 'browser-preview-test',
        },
      },
    } as unknown as ResourcerActionContext;

    await action(ctx, next);

    expect(saveSource).toHaveBeenCalledTimes(1);
    expect(saveSource).toHaveBeenCalledWith(
      {
        repoId: 'repo-1',
        expectedHeadCommitId: 'head-1',
        message: 'canonical save',
        files: [
          {
            path: 'src/client/js-blocks/example/index.tsx',
            content: 'ctx.render(<div>canonical source</div>);',
            language: 'typescript',
          },
        ],
      },
      {
        actorUserId: '42',
        requestId: 'request-1',
        requestSource: 'browser-preview-test',
      },
    );
    expect(JSON.stringify(saveSource.mock.calls[0])).not.toMatch(
      /attacker|localCompileKey|affectedEntr|bundle|metafile|sourceMap|compilerBuildId/u,
    );
    expect(ctx.body).toEqual(saveResult);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
