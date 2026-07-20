/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import { vi } from 'vitest';

import { createLightExtensionFilesResource } from '../resources/lightExtensionFiles';
import type { LightExtensionFileService } from '../services/LightExtensionFileService';
import type { LightExtensionRuntimeCompileService } from '../services/LightExtensionRuntimeCompileService';

const currentSource = {
  repo: { id: 'repo-1' },
  commit: { id: 'commit-1' },
  tree: { hash: 'tree-1' },
  unchanged: false,
};

describe('lightExtensionFiles JS Portal workspace bridge', () => {
  it('removes Portal changes from the VSC save and replaces the complete Portal snapshot afterward', async () => {
    const portalSnapshot = [
      {
        path: 'src/client/js-portals/customer/logo.png',
        content: 'iVBORw==',
        encoding: 'base64' as const,
      },
    ];
    const fileService = createFileService({ portalSnapshot });
    const saveSource = vi.fn(async () => ({ ok: true }));
    const resource = createLightExtensionFilesResource(
      fileService as unknown as LightExtensionFileService,
      { saveSource } as unknown as LightExtensionRuntimeCompileService,
    );
    const ctx = createActionContext([
      { path: 'README.md', content: '# Updated\n' },
      {
        path: 'src/client/js-portals/customer/logo.png',
        content: 'iVBORw==',
        encoding: 'base64',
      },
    ]);

    await resource.actions?.saveSource?.(
      ctx,
      vi.fn(async () => {}),
    );

    expect(fileService.prepareJsPortalSnapshot).toHaveBeenCalledWith('repo-1', [
      expect.objectContaining({ path: 'src/client/js-portals/customer/logo.png', encoding: 'base64' }),
    ]);
    expect(saveSource).toHaveBeenCalledWith(
      expect.objectContaining({
        files: [expect.objectContaining({ path: 'README.md', content: '# Updated\n' })],
      }),
      expect.any(Object),
    );
    expect(fileService.replaceJsPortalFiles).toHaveBeenCalledWith('repo-1', portalSnapshot);
  });

  it('supports Portal-only saves without creating a VSC commit', async () => {
    const portalSnapshot = [
      {
        path: 'src/client/js-portals/customer/index.html',
        content: '<main>Customer</main>',
        encoding: 'utf8' as const,
      },
    ];
    const fileService = createFileService({ portalSnapshot });
    const saveSource = vi.fn();
    const resource = createLightExtensionFilesResource(
      fileService as unknown as LightExtensionFileService,
      { saveSource } as unknown as LightExtensionRuntimeCompileService,
    );
    const ctx = createActionContext([
      {
        path: 'src/client/js-portals/customer/index.html',
        content: '<main>Customer</main>',
      },
    ]);

    await resource.actions?.saveSource?.(
      ctx,
      vi.fn(async () => {}),
    );

    expect(saveSource).not.toHaveBeenCalled();
    expect(fileService.assertWritableHead).toHaveBeenCalledWith('repo-1', 'commit-1', expect.any(Object));
    expect(fileService.pull).toHaveBeenCalledWith({ repoId: 'repo-1', includeContent: 'none' }, expect.any(Object));
    expect((ctx as { body?: unknown }).body).toMatchObject({
      commit: currentSource.commit,
      tree: currentSource.tree,
      compile: { status: 'skipped', entries: [] },
    });
    expect(fileService.replaceJsPortalFiles).toHaveBeenCalledWith('repo-1', portalSnapshot);
  });

  it('rejects base64 metadata on ordinary source files', async () => {
    const fileService = createFileService({ portalSnapshot: [] });
    const saveSource = vi.fn();
    const resource = createLightExtensionFilesResource(
      fileService as unknown as LightExtensionFileService,
      { saveSource } as unknown as LightExtensionRuntimeCompileService,
    );
    const ctx = createActionContext([{ path: 'README.md', content: 'SGVsbG8=', encoding: 'base64' }]);

    await resource.actions?.saveSource?.(
      ctx,
      vi.fn(async () => {}),
    );

    expect((ctx as { status?: number }).status).toBe(400);
    expect(saveSource).not.toHaveBeenCalled();

    const nulContext = createActionContext([{ path: 'README.md', content: 'bad\0source' }]);
    await resource.actions?.saveSource?.(
      nulContext,
      vi.fn(async () => {}),
    );
    expect((nulContext as { status?: number }).status).toBe(400);
    expect(saveSource).not.toHaveBeenCalled();
  });
});

function createFileService(options: { portalSnapshot: unknown[] }) {
  return {
    prepareJsPortalSnapshot: vi.fn(async () => options.portalSnapshot),
    replaceJsPortalFiles: vi.fn(async () => undefined),
    assertWritableHead: vi.fn(async () => undefined),
    pull: vi.fn(async () => currentSource),
  };
}

function createActionContext(files: unknown[]): Context {
  return {
    action: {
      params: {
        values: {
          repoId: 'repo-1',
          expectedHeadCommitId: 'commit-1',
          message: 'Save workspace',
          files,
        },
      },
    },
    request: { headers: {} },
  } as unknown as Context;
}
