/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import { describe, expect, it, vi } from 'vitest';

import { LightExtensionError } from '../../shared/errors';
import { createLightExtensionsResource } from '../resources/lightExtensions';
import type { LightExtensionCompilePreviewService } from '../services/LightExtensionCompilePreviewService';
import type { MoveToInlineService } from '../services/MoveToInlineService';

// Old case -> new owner:
// move-to-inline / normalizes the moveToInline resource input and request context -> this suite.
// New owner: service errors are mapped to the stable HTTP response contract by the public resource.

const locator = {
  kind: 'flowModel.step',
  modelUid: 'fm_js_block',
  flowKey: 'jsSettings',
  stepKey: 'runJs',
  paramPath: ['code'],
} as const;

const binding = {
  type: 'light-extension-entry',
  repoId: 'ler_sales',
  entryId: 'lee_sales',
  kind: 'js-block',
} as const;

const entryPath = 'src/client/js-blocks/sales/index.tsx';

describe('move-to-inline resource', () => {
  it('normalizes the moveToInline resource input and request context', async () => {
    const moveToInline = vi.fn(async () => ({ code: 'ctx.render(<div />);', version: 'v2' }));
    const resource = createLightExtensionsResource({} as LightExtensionCompilePreviewService, undefined, {
      moveToInline,
    } as unknown as MoveToInlineService);
    const can = vi.fn().mockReturnValue({});
    const ctx = {
      action: {
        params: {
          values: {
            locator,
            repoId: binding.repoId,
            entryId: binding.entryId,
            entryPath,
            kind: 'js-block',
            version: 'v2',
            files: [{ path: entryPath, content: 'ctx.render(<div />);' }],
          },
        },
      },
      auth: { user: { id: 9 } },
      can,
      request: {
        headers: {
          'x-request-id': 'req_move_inline',
          'x-request-source': 'unit-resource',
        },
      },
    } as unknown as Context;

    await resource.actions?.moveToInline?.(ctx, async () => undefined);

    expect(moveToInline).toHaveBeenCalledWith(
      {
        locator,
        repoId: binding.repoId,
        entryId: binding.entryId,
        entryPath,
        kind: 'js-block',
        version: 'v2',
        files: [
          {
            path: entryPath,
            content: 'ctx.render(<div />);',
            language: undefined,
            mode: undefined,
          },
        ],
      },
      expect.objectContaining({
        actorUserId: '9',
        requestId: 'req_move_inline',
        requestSource: 'unit-resource',
        can,
        adapterContext: expect.objectContaining({ currentUser: { id: 9 } }),
      }),
    );
    expect((ctx as { body?: unknown }).body).toEqual({ code: 'ctx.render(<div />);', version: 'v2' });
  });

  it('maps move-to-inline service errors to the public HTTP response contract', async () => {
    const error = new LightExtensionError(
      'LIGHT_EXTENSION_BINDING_OUTDATED',
      'The binding changed before the move completed',
      {
        details: { repoId: binding.repoId, entryId: binding.entryId },
      },
    );
    const moveToInline = vi.fn(async () => {
      throw error;
    });
    const resource = createLightExtensionsResource({} as LightExtensionCompilePreviewService, undefined, {
      moveToInline,
    } as unknown as MoveToInlineService);
    const ctx = {
      action: {
        params: {
          values: {
            locator,
            repoId: binding.repoId,
            entryId: binding.entryId,
            entryPath,
            kind: 'js-block',
            version: 'v2',
            files: [{ path: entryPath, content: 'ctx.render(<div />);' }],
          },
        },
      },
      auth: { user: { id: 9 } },
      request: { headers: {} },
    } as unknown as Context;

    await resource.actions?.moveToInline?.(ctx, async () => undefined);

    expect((ctx as { withoutDataWrapping?: boolean }).withoutDataWrapping).toBe(true);
    expect((ctx as { type?: string }).type).toBe('application/json');
    expect((ctx as { status?: number }).status).toBe(409);
    expect((ctx as { body?: unknown }).body).toEqual(error.toResponseBody());
  });
});
