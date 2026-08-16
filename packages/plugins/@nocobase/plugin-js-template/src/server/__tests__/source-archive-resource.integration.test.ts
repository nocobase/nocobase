/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { Database } from '@nocobase/database';
import { vi } from 'vitest';

import { createJsTemplateProjectsResource } from '../resources/jsTemplateProjects';
import type { JsTemplateProjectService } from '../services/JsTemplateProjectService';
import type { JsTemplateCompileService } from '../services/JsTemplateCompileService';
import { JsTemplateValidator } from '../services/JsTemplateValidator';
import { createSymlinkZipBase64, createUnsignedSessionToken, createZipBase64 } from './security-test-fixtures';

describe('jsTemplateProjects:inspectSourceArchive', () => {
  it('parses the ZIP without invoking persistence or compilation services', async () => {
    const getProject = vi.fn(async () => ({
      id: 'jtp_inspect',
      lifecycleStatus: 'disabled',
    }));
    const getValidator = vi.fn(() => new JsTemplateValidator());
    const projectService = {
      getProject,
      getValidator,
    } as unknown as JsTemplateProjectService;
    const runtimeCompileService = {
      compileCurrentRuntime: vi.fn(),
      prepareRemoteSnapshot: vi.fn(),
      saveSource: vi.fn(),
    } as unknown as JsTemplateCompileService;
    const resource = createJsTemplateProjectsResource(
      {} as Database,
      projectService,
      runtimeCompileService,
      {} as never,
      {} as never,
      'test',
      {} as never,
    );
    const ctx = createActionContext({
      projectId: 'jtp_inspect',
      zipBase64: await createZipBase64({
        'workspace/README.md': '# Inspected\n',
        'workspace/src/shared/value.ts': 'export const value = 1;\n',
        'workspace/src/client/js-blocks/orders/entry.json':
          '{"schemaVersion":1,"key":"orders","settings":{"region":{"type":"string","default":"APAC"}}}\n',
        'workspace/src/client/js-blocks/orders/index.tsx': 'ctx.render(String(ctx.record?.id ?? ""));\n',
      }),
    });
    const next = vi.fn(async () => {});

    await resource.actions?.inspectSourceArchive?.(ctx, next);

    expect((ctx as { body?: unknown }).body).toEqual({
      files: expect.arrayContaining([
        expect.objectContaining({
          path: 'README.md',
          content: '# Inspected\n',
          language: 'markdown',
        }),
        expect.objectContaining({
          path: 'src/shared/value.ts',
          content: 'export const value = 1;\n',
          language: 'typescript',
        }),
        expect.objectContaining({
          path: 'src/client/js-blocks/orders/entry.json',
          content: '{"schemaVersion":1,"key":"orders","settings":{"region":{"type":"string","default":"APAC"}}}\n',
          language: 'json',
        }),
        expect.objectContaining({
          path: 'src/client/js-blocks/orders/index.tsx',
          content: 'ctx.render(String(ctx.record?.id ?? ""));\n',
          language: 'typescript',
        }),
      ]),
    });
    expect(getProject).toHaveBeenCalledWith('jtp_inspect', expect.objectContaining({ actorUserId: null }));
    expect(getValidator).toHaveBeenCalledTimes(1);
    expect(runtimeCompileService.compileCurrentRuntime).not.toHaveBeenCalled();
    expect(runtimeCompileService.prepareRemoteSnapshot).not.toHaveBeenCalled();
    expect(runtimeCompileService.saveSource).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it.each([
    {
      label: 'path traversal',
      createZip: () => createZipBase64({ '../escape.ts': 'export default true;\n' }),
      limits: undefined,
    },
    {
      label: 'absolute path',
      createZip: () => createZipBase64({ '/escape.ts': 'export default true;\n' }),
      limits: undefined,
    },
    {
      label: 'backslash path',
      createZip: () => createZipBase64({ 'src\\escape.ts': 'export default true;\n' }),
      limits: undefined,
    },
    {
      label: 'case duplicate',
      createZip: () => createZipBase64({ 'README.md': '# One\n', 'readme.md': '# Two\n' }),
      limits: undefined,
    },
    {
      label: 'invalid UTF-8',
      createZip: () => createZipBase64({ 'src/shared/binary.bin': Buffer.from([0, 255, 1]) }),
      limits: undefined,
    },
    {
      label: 'NUL byte',
      createZip: () => createZipBase64({ 'src/shared/value.ts': Buffer.from('export\0const value = 1;') }),
      limits: undefined,
    },
    {
      label: 'symbolic link',
      createZip: () => createSymlinkZipBase64('src/shared/link.ts', '../target.ts'),
      limits: undefined,
    },
    {
      label: 'file count overrun',
      createZip: () => createZipBase64({ 'one.ts': 'export {};', 'two.ts': 'export {};' }),
      limits: { maxProjectFiles: 1 },
    },
    {
      label: 'single-file byte overrun',
      createZip: () => createZipBase64({ 'large.ts': 'export const value = 12345;' }),
      limits: { maxFileBytes: 8 },
    },
    {
      label: 'total byte overrun',
      createZip: () => createZipBase64({ 'one.ts': '12345', 'two.ts': '67890' }),
      limits: { maxProjectBytes: 8 },
    },
    {
      label: 'compression ratio overrun',
      createZip: () => createZipBase64({ 'compressed.ts': 'a'.repeat(1024) }),
      limits: { maxZipCompressionRatio: 1 },
    },
  ])(
    'rejects a $label archive before enqueue, publish, audit, transaction, or compile',
    async ({ label, createZip, limits }) => {
      const enqueue = vi.fn();
      const publish = vi.fn();
      const recordCreateJobEvent = vi.fn();
      const transaction = vi.fn();
      const prepareInitialWorkspace = vi.fn();
      const resource = createJsTemplateProjectsResource(
        { sequelize: { transaction } } as unknown as Database,
        {
          normalizeCreateMetadata: vi.fn(),
          getValidator: vi.fn(() => new JsTemplateValidator({ limits })),
        } as unknown as JsTemplateProjectService,
        { prepareInitialWorkspace } as unknown as JsTemplateCompileService,
        { enqueue } as never,
        { publish } as never,
        'main',
        { recordCreateJobEvent } as never,
      );
      const ctx = {
        action: {
          params: {
            values: {
              idempotencyKey: `attack-${label}`,
              name: `Attack ${label}`,
              zipBase64: await createZip(),
            },
          },
        },
        auth: { user: { id: 7 } },
        getBearerToken: () => createUnsignedSessionToken('session-attack'),
        request: { headers: {} },
        state: { currentRole: 'member', currentRoles: ['member'] },
      };

      await resource.actions?.create?.(
        ctx as never,
        vi.fn(async () => undefined),
      );

      expect((ctx as { status?: number }).status).toBe(422);
      expect(enqueue).not.toHaveBeenCalled();
      expect(publish).not.toHaveBeenCalled();
      expect(recordCreateJobEvent).not.toHaveBeenCalled();
      expect(transaction).not.toHaveBeenCalled();
      expect(prepareInitialWorkspace).not.toHaveBeenCalled();
    },
  );
});

function createActionContext(values: Record<string, unknown>): Context {
  return {
    action: {
      params: { values },
    },
    request: {
      headers: {},
    },
  } as unknown as Context;
}
