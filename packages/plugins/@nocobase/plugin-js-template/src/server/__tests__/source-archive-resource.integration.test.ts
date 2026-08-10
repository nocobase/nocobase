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
import JSZip from 'jszip';
import { vi } from 'vitest';

import { JsTemplateError } from '../../shared/errors';
import { createJsTemplateProjectsResource } from '../resources/jsTemplateProjects';
import type { JsTemplateProjectService } from '../services/JsTemplateProjectService';
import type { JsTemplateCompileService } from '../services/JsTemplateCompileService';
import { JsTemplateValidator } from '../services/JsTemplateValidator';

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
    const zip = new JSZip();
    zip.file('workspace/README.md', '# Inspected\n');
    zip.file('workspace/src/shared/value.ts', 'export const value = 1;\n');
    zip.file('workspace/src/client/js-pages/orders/entry.json', '{"schemaVersion":1,"key":"orders"}\n');
    zip.file('workspace/src/client/js-pages/orders/index.tsx', 'ctx.render(ctx.page.uid);\n');
    const ctx = createActionContext({
      projectId: 'jtp_inspect',
      zipBase64: await zip.generateAsync({ type: 'base64' }),
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
          path: 'src/client/js-pages/orders/entry.json',
          language: 'json',
        }),
        expect.objectContaining({
          path: 'src/client/js-pages/orders/index.tsx',
          content: 'ctx.render(ctx.page.uid);\n',
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

  it('rejects NUL bytes in source files', async () => {
    const projectService = {
      getProject: vi.fn(async () => ({ id: 'jtp_inspect', lifecycleStatus: 'enabled' })),
      getValidator: vi.fn(() => new JsTemplateValidator()),
    } as unknown as JsTemplateProjectService;
    const resource = createJsTemplateProjectsResource(
      {} as Database,
      projectService,
      {} as JsTemplateCompileService,
      {} as never,
      {} as never,
      'test',
      {} as never,
    );
    const zip = new JSZip();
    zip.file('src/shared/value.ts', Buffer.from('export\0const value = 1;'));
    const ctx = createActionContext({
      projectId: 'jtp_inspect',
      zipBase64: await zip.generateAsync({ type: 'base64' }),
    });

    await resource.actions?.inspectSourceArchive?.(
      ctx,
      vi.fn(async () => {}),
    );

    expect((ctx as { status?: number }).status).toBe(422);
    expect((ctx as { body?: unknown }).body).toMatchObject({
      errors: [expect.objectContaining({ code: 'JS_TEMPLATE_VALIDATION_FAILED' })],
    });
  });

  it('requires an existing project before parsing the ZIP', async () => {
    const getValidator = vi.fn(() => new JsTemplateValidator());
    const projectService = {
      getProject: vi.fn(async () => {
        throw new JsTemplateError('JS_TEMPLATE_PROJECT_NOT_FOUND', 'Project was not found');
      }),
      getValidator,
    } as unknown as JsTemplateProjectService;
    const resource = createJsTemplateProjectsResource(
      {} as Database,
      projectService,
      {} as JsTemplateCompileService,
      {} as never,
      {} as never,
      'test',
      {} as never,
    );
    const ctx = createActionContext({
      projectId: 'jtp_missing',
      zipBase64: 'not-base64',
    });

    await resource.actions?.inspectSourceArchive?.(
      ctx,
      vi.fn(async () => {}),
    );

    expect((ctx as { status?: number }).status).toBe(404);
    expect((ctx as { body?: unknown }).body).toMatchObject({
      errors: [expect.objectContaining({ code: 'JS_TEMPLATE_PROJECT_NOT_FOUND' })],
    });
    expect(getValidator).not.toHaveBeenCalled();
  });
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
