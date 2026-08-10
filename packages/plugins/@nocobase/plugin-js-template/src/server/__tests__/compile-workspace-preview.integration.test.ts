/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type JsTemplatePulledFile, type JsTemplateProject, type JsTemplateTreeEntryInput } from '../../shared/types';
import { createJsTemplatesResource } from '../resources/jsTemplates';
import { JsTemplateAuditService } from '../services/JsTemplateAuditService';
import { JsTemplateCompilePreviewService } from '../services/JsTemplateCompilePreviewService';
import { JsTemplateFileService } from '../services/JsTemplateFileService';
import { JsTemplatePermissionService } from '../services/JsTemplatePermissionService';
import { JsTemplateWorkspaceCompilerBridge } from '../services/JsTemplateWorkspaceCompilerBridge';
import { type Context } from '@nocobase/actions';
import { type Database, type Model } from '@nocobase/database';
import { sha256Hex } from '@nocobase/runjs/server';
import { vi } from 'vitest';

// Consolidated from compile-preview.test.ts.
function registerCompilePreviewTests() {
  describe('plugin-js-template compile preview', () => {
    it('previews good and bad templates without runtime state mutations', async () => {
      const project = createProject();
      const { db, templatesRepository } = createDbStub([
        createTemplateRecord({ id: 'jtt_sales_kpi', projectId: project.id, templateName: 'sales-kpi' }),
        createTemplateRecord({
          id: 'jtt_sales_trend',
          projectId: project.id,
          templateName: 'sales-trend',
          compiledCommitId: 'commit_keep_existing',
        }),
      ]);
      const fileService = createFileServiceStub(project, [
        ...validSalesKpiFiles(),
        {
          path: 'src/client/js-blocks/sales-trend/index.tsx',
          content: "import { missing } from './missing';\nctx.render(<div>{missing}</div>);\n",
        },
        {
          path: 'src/client/js-blocks/sales-trend/entry.json',
          content: '{"schemaVersion":1,"key":"sales-trend"}',
        },
      ]);
      const { service, recordCompileEvent } = createPreviewService(db, fileService);

      const result = await service.compilePreview(
        {
          projectId: project.id,
        },
        {
          requestId: 'req_compile_preview_mixed',
          actorUserId: '1',
        },
      );

      const salesKpi = result.templates.find((template) => template.templateName === 'sales-kpi');
      const salesTrend = result.templates.find((template) => template.templateName === 'sales-trend');
      expect(result.accepted).toBe(false);
      expect(result.commitId).toBe('vsc_commit_1');
      expect(salesKpi).toMatchObject({
        templateId: 'jtt_sales_kpi',
        status: 'success',
        accepted: true,
        artifact: {
          runtimeVersion: 'v2',
          entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
          metadata: expect.objectContaining({
            projectId: project.id,
            templateId: 'jtt_sales_kpi',
            kind: 'js-block',
            templateName: 'sales-kpi',
          }),
        },
      });
      expect(JSON.stringify(salesKpi?.artifact)).not.toContain('ctx.render');
      expect(JSON.stringify(salesKpi?.artifact)).not.toContain('sourceMap');
      expect(salesTrend).toMatchObject({
        templateId: 'jtt_sales_trend',
        status: 'failed',
        accepted: false,
      });
      expect(salesTrend?.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'src/client/js-blocks/sales-trend/index.tsx',
            line: expect.any(Number),
            column: expect.any(Number),
          }),
        ]),
      );
      expect(templatesRepository.create).not.toHaveBeenCalled();
      expect(templatesRepository.update).not.toHaveBeenCalled();
      expect(recordCompileEvent).toHaveBeenCalledTimes(1);
      expect(recordCompileEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: project.id,
          result: 'blocked',
          reasonCode: 'unsafe_import_denied',
          details: expect.objectContaining({
            templateCount: 2,
            templates: expect.arrayContaining([
              expect.objectContaining({ templateId: 'jtt_sales_kpi', accepted: true }),
              expect.objectContaining({ templateId: 'jtt_sales_trend', accepted: false }),
            ]),
          }),
        }),
      );
      expect(JSON.stringify(recordCompileEvent.mock.calls)).not.toContain('ctx.render(<div>{missing}</div>)');
      expect(JSON.stringify(recordCompileEvent.mock.calls)).not.toContain('const title');
      expect(JSON.stringify(recordCompileEvent.mock.calls)).not.toContain('sourceMap');
    });

    it('compiles an unsaved workspace into a temporary preview artifact without pulling or persisting source', async () => {
      const project = createProject();
      const { db, templatesRepository, persistenceRepositories } = createDbStub([]);
      const fileService = createFileServiceStub(project, validSalesKpiFiles());
      const { service } = createPreviewService(db, fileService);

      const result = await service.compileWorkspacePreview(
        {
          projectId: project.id,
          expectedHeadCommitId: project.headCommitId,
          templateId: 'jtt_sales_kpi',
          kind: 'js-block',
          entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
          runtimeVersion: 'v2',
          files: [
            {
              path: 'src/client/js-blocks/sales-kpi/index.tsx',
              content: "const title = 'Unsaved preview';\nctx.render(<div>{title}</div>);\n",
              language: 'typescript',
            },
            {
              path: 'src/client/js-blocks/sales-kpi/entry.json',
              content: JSON.stringify({ schemaVersion: 1, key: 'sales-kpi', title: 'Sales KPI' }),
              language: 'json',
            },
          ],
        },
        {
          requestId: 'req_workspace_preview',
        },
      );

      expect(result).toMatchObject({
        accepted: true,
        diagnostics: [],
        artifact: {
          runtimeVersion: 'v2',
          entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
          metadata: expect.objectContaining({
            projectId: project.id,
            templateId: 'jtt_sales_kpi',
            kind: 'js-block',
          }),
        },
      });
      expect(result.artifact?.code).toContain('Unsaved preview');
      expect(result).not.toHaveProperty('candidate');
      expect(result).not.toHaveProperty('workspace');
      expect(result).not.toHaveProperty('preparedSave');
      expect(fileService.pull).not.toHaveBeenCalled();
      expect(templatesRepository.create).not.toHaveBeenCalled();
      expect(templatesRepository.update).not.toHaveBeenCalled();
      for (const repository of Object.values(persistenceRepositories)) {
        expect(repository.create).not.toHaveBeenCalled();
        expect(repository.update).not.toHaveBeenCalled();
        expect(repository.destroy).not.toHaveBeenCalled();
      }
    });

    it('compiles relative imports from unsaved workspace files', async () => {
      const project = createProject();
      const { db } = createDbStub([]);
      const fileService = createFileServiceStub(project, []);
      const { service } = createPreviewService(db, fileService);

      const result = await service.compileWorkspacePreview({
        projectId: project.id,
        expectedHeadCommitId: project.headCommitId,
        templateId: 'jtt_sales_kpi',
        kind: 'js-block',
        entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
        runtimeVersion: 'v2',
        files: [
          {
            path: 'src/client/js-blocks/sales-kpi/index.tsx',
            content: 'import { title } from "./message";\nctx.render(<div>{title}</div>);\n',
            language: 'typescript',
          },
          {
            path: 'src/client/js-blocks/sales-kpi/message.ts',
            content: 'export const title = "Unsaved relative import";\n',
            language: 'typescript',
          },
          {
            path: 'src/client/js-blocks/sales-kpi/entry.json',
            content: JSON.stringify({ schemaVersion: 1, key: 'sales-kpi', title: 'Sales KPI' }),
            language: 'json',
          },
        ],
      });

      expect(result).toMatchObject({
        accepted: true,
        diagnostics: [],
        artifact: {
          runtimeVersion: 'v2',
          entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
        },
      });
      expect(result.artifact?.code).toContain('Unsaved relative import');
      expect(fileService.pull).not.toHaveBeenCalled();
    });

    it('rejects an unsaved workspace check when the pulled Head is stale', async () => {
      const project = createProject();
      const { db } = createDbStub([]);
      const fileService = createFileServiceStub(project, validSalesKpiFiles());
      const { service } = createPreviewService(db, fileService);

      await expect(
        service.compileWorkspacePreview({
          projectId: project.id,
          expectedHeadCommitId: 'stale_commit',
          files: validSalesKpiFiles().map((file) => ({ path: file.path, content: file.content || '' })),
        }),
      ).rejects.toMatchObject({ code: 'JS_TEMPLATE_SOURCE_OUTDATED' });
    });

    it('rejects invalid settings visibility conditions before compiling an unsaved preview', async () => {
      const project = createProject();
      const { db } = createDbStub([]);
      const fileService = createFileServiceStub(project, []);
      const { service } = createPreviewService(db, fileService);

      const result = await service.compileWorkspacePreview({
        projectId: project.id,
        templateId: 'jtt_sales_kpi',
        kind: 'js-block',
        entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
        runtimeVersion: 'v2',
        files: [
          {
            path: 'src/client/js-blocks/sales-kpi/index.tsx',
            content: 'ctx.render(<div />);\n',
          },
          {
            path: 'src/client/js-blocks/sales-kpi/entry.json',
            content: JSON.stringify({
              schemaVersion: 1,
              key: 'sales-kpi',
              settings: {
                mode: { type: 'integer' },
                target: {
                  type: 'string',
                  'x-visible-when': { path: 'mode', operator: '$in', value: 1 },
                },
              },
            }),
          },
        ],
      });

      expect(result).toMatchObject({
        accepted: false,
        failureCode: 'JS_TEMPLATE_VALIDATION_FAILED',
        diagnostics: [
          expect.objectContaining({
            code: 'settings_condition_value_invalid',
            path: 'src/client/js-blocks/sales-kpi/entry.json',
            details: expect.objectContaining({ schemaPath: expect.stringContaining('x-visible-when') }),
          }),
        ],
      });
      expect(result.artifact).toBeUndefined();
      expect(fileService.pull).not.toHaveBeenCalled();
    });

    it('compiles every template in an unsaved workspace before save', async () => {
      const project = createProject();
      const { db } = createDbStub([
        createTemplateRecord({ id: 'jtt_sales_kpi', projectId: project.id, templateName: 'sales-kpi' }),
        createTemplateRecord({ id: 'jtt_sales_trend', projectId: project.id, templateName: 'sales-trend' }),
      ]);
      const fileService = createFileServiceStub(project, []);
      const { service } = createPreviewService(db, fileService);

      const result = await service.compileWorkspacePreview({
        projectId: project.id,
        runtimeVersion: 'v2',
        files: [
          ...validSalesKpiFiles(),
          {
            path: 'src/client/js-blocks/sales-trend/index.tsx',
            content: "const count: number = 'invalid';\nctx.render(<div>{count}</div>);\n",
          },
          {
            path: 'src/client/js-blocks/sales-trend/entry.json',
            content: JSON.stringify({ schemaVersion: 1, key: 'sales-trend', title: 'Sales trend' }),
          },
        ].map((file) => ({
          path: file.path,
          content: file.content || '',
          language: file.language,
          mode: file.mode,
        })),
      });

      expect(result).toMatchObject({ accepted: false, httpStatus: 207 });
      expect(result.templates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ templateName: 'sales-kpi', accepted: true, status: 'success' }),
          expect.objectContaining({ templateName: 'sales-trend', accepted: false, status: 'failed' }),
        ]),
      );
      expect(result.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'src/client/js-blocks/sales-trend/index.tsx',
            message: expect.stringContaining("Type 'string' is not assignable to type 'number'"),
          }),
        ]),
      );
      expect(fileService.pull).not.toHaveBeenCalled();
    });

    it('checks a selected template against referenced settings from the current unsaved workspace', async () => {
      const project = createProject();
      const { db } = createDbStub([
        createTemplateRecord({ id: 'jtt_consumer', projectId: project.id, templateName: 'consumer' }),
        createTemplateRecord({ id: 'jtt_provider', projectId: project.id, templateName: 'provider' }),
      ]);
      const fileService = createFileServiceStub(project, []);
      const { service } = createPreviewService(db, fileService);
      const check = (providerType: 'string' | 'number') =>
        service.compileWorkspacePreview({
          projectId: project.id,
          expectedHeadCommitId: project.headCommitId,
          templateId: 'jtt_consumer',
          kind: 'js-block',
          entryPath: 'src/client/js-blocks/consumer/index.tsx',
          runtimeVersion: 'v2',
          files: [
            {
              path: 'src/client/js-blocks/consumer/index.tsx',
              content: [
                'import type { Settings as ProviderSettings } from "js-template:settings/client/js-block/provider";',
                'const provider: ProviderSettings = { value: "valid" };',
                'ctx.render(<div>{provider.value}</div>);',
                '',
              ].join('\n'),
            },
            {
              path: 'src/client/js-blocks/consumer/entry.json',
              content: JSON.stringify({ schemaVersion: 1, key: 'consumer', settings: {} }),
            },
            {
              path: 'src/client/js-blocks/provider/index.tsx',
              content: 'ctx.render(<div />);\n',
            },
            {
              path: 'src/client/js-blocks/provider/entry.json',
              content: JSON.stringify({
                schemaVersion: 1,
                key: 'provider',
                settings: { value: { type: providerType, required: true } },
              }),
            },
          ],
        });

      const valid = await check('string');
      const changedProvider = await check('number');

      expect(valid).toMatchObject({ accepted: true, diagnostics: [] });
      expect(changedProvider).toMatchObject({ accepted: false });
      expect(changedProvider.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'src/client/js-blocks/consumer/index.tsx',
            message: expect.stringContaining("Type 'string' is not assignable to type 'number'"),
          }),
        ]),
      );
      expect(fileService.pull).not.toHaveBeenCalled();
    });

    it('rejects invalid unsaved workspace paths before compiling the preview', async () => {
      const project = createProject();
      const { db } = createDbStub([]);
      const fileService = createFileServiceStub(project, []);
      const { service } = createPreviewService(db, fileService);

      const result = await service.compileWorkspacePreview({
        projectId: project.id,
        kind: 'js-block',
        entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
        files: [
          {
            path: 'src/client/js-blocks/sales-kpi/index.tsx',
            content: 'ctx.render(<div />);\n',
          },
          {
            path: 'src/client/js-blocks/sales-kpi/entry.json',
            content: '{"schemaVersion":1,"key":"sales-kpi"}',
          },
          {
            path: 'src/client/not-allowed.ts',
            content: 'export const secret = true;\n',
          },
        ],
      });

      expect(result).toMatchObject({
        accepted: false,
        failureCode: 'JS_TEMPLATE_VALIDATION_FAILED',
        diagnostics: [
          expect.objectContaining({
            code: 'workspace_path_not_allowed',
            path: 'src/client/not-allowed.ts',
          }),
        ],
      });
      expect(result.artifact).toBeUndefined();
    });

    it('blocks compile preview templates when workspace validator failures are present', async () => {
      const project = createProject();
      const { db } = createDbStub([
        createTemplateRecord({ id: 'jtt_sales_kpi', projectId: project.id, templateName: 'sales-kpi' }),
      ]);
      const fileService = createFileServiceStub(project, [
        ...validSalesKpiFiles(),
        {
          path: 'src/client/not-allowed.js',
          content: "const secret = 'secret-source';\n",
        },
      ]);
      const { service, recordCompileEvent } = createPreviewService(db, fileService);

      const result = await service.compilePreview(
        {
          projectId: project.id,
        },
        {
          requestId: 'req_compile_preview_validator',
        },
      );

      expect(result.accepted).toBe(false);
      const salesKpi = result.templates.find((template) => template.templateName === 'sales-kpi');
      expect(salesKpi).toMatchObject({
        status: 'failed',
        accepted: false,
        failureCode: 'JS_TEMPLATE_VALIDATION_FAILED',
      });
      expect(salesKpi?.artifact).toBeUndefined();
      expect(salesKpi?.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'workspace_path_not_allowed',
            path: 'src/client/not-allowed.js',
          }),
        ]),
      );
      expect(result.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'workspace_path_not_allowed',
            path: 'src/client/not-allowed.js',
          }),
        ]),
      );
      expect(recordCompileEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          result: 'blocked',
          reasonCode: 'validation_failed',
          requestId: 'req_compile_preview_validator',
        }),
      );
      expect(recordCompileEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({
          templateId: 'jtt_sales_kpi',
          result: 'success',
        }),
      );
      expect(JSON.stringify(recordCompileEvent.mock.calls)).not.toContain('secret-source');
    });

    it('returns preview diagnostics when audit persistence fails', async () => {
      const project = createProject();
      const { db } = createDbStub([
        createTemplateRecord({ id: 'jtt_sales_kpi', projectId: project.id, templateName: 'sales-kpi' }),
      ]);
      const fileService = createFileServiceStub(project, [
        ...validSalesKpiFiles(),
        {
          path: 'src/client/not-allowed.js',
          content: 'export const invalid = true;\n',
        },
      ]);
      const { service, recordCompileEvent } = createPreviewService(db, fileService);
      recordCompileEvent.mockRejectedValueOnce(new Error('forced preview audit persistence failure'));

      const result = await service.compilePreview(
        { projectId: project.id },
        { requestId: 'req_compile_preview_audit_failure' },
      );

      expect(result).toMatchObject({
        accepted: false,
        diagnostics: [
          expect.objectContaining({
            code: 'workspace_path_not_allowed',
            path: 'src/client/not-allowed.js',
          }),
        ],
      });
      expect(recordCompileEvent).toHaveBeenCalledTimes(1);
    });

    it('ignores unselected template validation errors when previewing a selected valid template', async () => {
      const project = createProject();
      const { db } = createDbStub([
        createTemplateRecord({ id: 'jtt_sales_kpi', projectId: project.id, templateName: 'sales-kpi' }),
      ]);
      const fileService = createFileServiceStub(project, [
        ...validSalesKpiFiles(),
        {
          path: 'src/client/js-fields/phone-link/index.tsx',
          content: 'export default function PhoneLink() {\n  const value = ;\n  return value;\n}\n',
        },
      ]);
      const { service, recordCompileEvent } = createPreviewService(db, fileService);

      const result = await service.compilePreview(
        {
          projectId: project.id,
          templateIds: ['jtt_sales_kpi'],
        },
        {
          requestId: 'req_compile_preview_selected_only',
        },
      );

      expect(result.accepted).toBe(true);
      expect(result.templates).toHaveLength(1);
      expect(result.templates[0]).toMatchObject({
        templateId: 'jtt_sales_kpi',
        status: 'success',
        accepted: true,
      });
      expect(result.diagnostics).toEqual([]);
      expect(recordCompileEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          templateId: 'jtt_sales_kpi',
          result: 'success',
        }),
      );
      expect(recordCompileEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({
          reasonCode: 'validation_failed',
          requestId: 'req_compile_preview_selected_only',
        }),
      );
    });

    it('previews JS Item templates after template preparation recognizes the js-item kind', async () => {
      const project = createProject();
      const { db } = createDbStub([
        {
          ...createTemplateRecord({
            id: 'jtt_customer_menu',
            projectId: project.id,
            templateName: 'customer-menu',
          }),
          kind: 'js-item',
          entryPath: 'src/client/js-items/customer-menu/index.tsx',
        },
      ]);
      const fileService = createFileServiceStub(project, [
        {
          path: 'src/client/js-items/customer-menu/index.tsx',
          content: 'ctx.render(<button>{String(ctx.record?.name)}</button>);\n',
        },
        {
          path: 'src/client/js-items/customer-menu/entry.json',
          content: '{"schemaVersion":1,"key":"customer-menu"}',
        },
      ]);
      const { service, recordCompileEvent } = createPreviewService(db, fileService);

      const result = await service.compilePreview(
        {
          projectId: project.id,
          templateIds: ['jtt_customer_menu'],
        },
        {
          requestId: 'req_compile_preview_js_item',
        },
      );

      expect(result.accepted).toBe(true);
      expect(result.templates).toHaveLength(1);
      expect(result.templates[0]).toMatchObject({
        templateId: 'jtt_customer_menu',
        kind: 'js-item',
        status: 'success',
        accepted: true,
        artifact: expect.objectContaining({
          entryPath: 'src/client/js-items/customer-menu/index.tsx',
          metadata: expect.objectContaining({
            kind: 'js-item',
            templateName: 'customer-menu',
            compilerSurfaceStyle: 'render',
          }),
        }),
      });
      expect(recordCompileEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          templateId: 'jtt_customer_menu',
          result: 'success',
          requestId: 'req_compile_preview_js_item',
        }),
      );
    });

    it('previews JS Page templates with the render surface and shared helpers', async () => {
      const project = createProject();
      const { db } = createDbStub([
        {
          ...createTemplateRecord({ id: 'jtt_orders', projectId: project.id, templateName: 'orders' }),
          kind: 'js-page',
          entryPath: 'src/client/js-pages/orders/index.tsx',
          descriptorPath: 'src/client/js-pages/orders/entry.json',
        },
      ]);
      const fileService = createFileServiceStub(project, [
        {
          path: 'src/shared/format.ts',
          content: 'export const format = (value: string) => value.toUpperCase();\n',
        },
        {
          path: 'src/client/js-pages/orders/index.tsx',
          content: 'import { format } from "../../../shared/format";\nctx.render(format(ctx.page.uid));\n',
        },
        {
          path: 'src/client/js-pages/orders/entry.json',
          content: '{"schemaVersion":1,"key":"orders"}',
        },
      ]);
      const { service, recordCompileEvent } = createPreviewService(db, fileService);

      const result = await service.compilePreview(
        { projectId: project.id, templateIds: ['jtt_orders'] },
        { requestId: 'req_compile_preview_js_page' },
      );

      expect(result).toMatchObject({
        accepted: true,
        diagnostics: [],
        templates: [
          {
            templateId: 'jtt_orders',
            kind: 'js-page',
            status: 'success',
            accepted: true,
            artifact: {
              entryPath: 'src/client/js-pages/orders/index.tsx',
              metadata: expect.objectContaining({
                kind: 'js-page',
                templateName: 'orders',
                compilerSurfaceStyle: 'render',
              }),
            },
          },
        ],
      });
      expect(recordCompileEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          templateId: 'jtt_orders',
          result: 'success',
          requestId: 'req_compile_preview_js_page',
        }),
      );
    });

    it('supports selected templateIds and reports missing selected templates without stopping valid templates', async () => {
      const project = createProject();
      const { db } = createDbStub([
        createTemplateRecord({ id: 'jtt_sales_kpi', projectId: project.id, templateName: 'sales-kpi' }),
        createTemplateRecord({ id: 'jtt_sales_trend', projectId: project.id, templateName: 'sales-trend' }),
      ]);
      const fileService = createFileServiceStub(project, validSalesKpiFiles());
      const { service } = createPreviewService(db, fileService);

      const result = await service.compilePreview({
        projectId: project.id,
        templateIds: ['jtt_sales_trend', 'jtt_sales_kpi', 'jtt_unknown'],
      });

      expect(result.templates.map((template) => template.templateName)).toEqual([
        'sales-trend',
        'sales-kpi',
        'jtt_unknown',
      ]);
      expect(result.templates[0]).toMatchObject({
        templateId: 'jtt_sales_trend',
        status: 'skipped',
        diagnostics: [
          expect.objectContaining({
            code: 'template_missing',
          }),
        ],
      });
      expect(result.templates[1]).toMatchObject({
        templateId: 'jtt_sales_kpi',
        status: 'success',
        accepted: true,
      });
      expect(result.templates[2]).toMatchObject({
        templateId: 'jtt_unknown',
        status: 'skipped',
        diagnostics: [
          expect.objectContaining({
            code: 'template_not_found',
          }),
        ],
      });
    });

    it('denies compilePreview before reading source when ctx.can rejects the action', async () => {
      const project = createProject();
      const { db } = createDbStub([]);
      const fileService = createFileServiceStub(project, validSalesKpiFiles());
      const { service, recordCompileEvent } = createPreviewService(db, fileService);
      const can = vi.fn(() => null);

      await expect(
        service.compilePreview(
          {
            projectId: project.id,
          },
          {
            requestId: 'req_compile_preview_denied',
            actorUserId: '2',
            can,
          },
        ),
      ).rejects.toMatchObject({
        code: 'JS_TEMPLATE_PERMISSION_DENIED',
        status: 403,
      });

      expect(fileService.pull).not.toHaveBeenCalled();
      expect(can).toHaveBeenCalledTimes(1);
      expect(recordCompileEvent).toHaveBeenCalledTimes(1);
      expect(recordCompileEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: project.id,
          result: 'blocked',
          reasonCode: 'permission_denied',
          actorUserId: '2',
        }),
      );
    });

    it('normalizes the jsTemplates compilePreview resource input and passes ctx.can to the service', async () => {
      const compilePreview = vi.fn().mockResolvedValue({ ok: true });
      const resource = createJsTemplatesResource(
        {} as never,
        {} as never,
        { compilePreview } as unknown as JsTemplateCompilePreviewService,
      );
      const can = vi.fn().mockReturnValue({});
      const ctx = {
        action: {
          params: {
            filterByTk: 'jtp_sales',
            values: {
              templateIds: ['jtt_sales_kpi'],
            },
          },
        },
        auth: {
          user: {
            id: 9,
          },
        },
        can,
        request: {
          headers: {
            'x-request-id': 'req_resource_preview',
            'x-request-source': 'unit-resource',
          },
        },
      } as unknown as Context;

      await resource.actions?.compilePreview?.(ctx, async () => {});

      expect(compilePreview).toHaveBeenCalledWith(
        {
          projectId: 'jtp_sales',
          templateIds: ['jtt_sales_kpi'],
        },
        expect.objectContaining({
          actorUserId: '9',
          requestId: 'req_resource_preview',
          requestSource: 'unit-resource',
          can,
        }),
      );
      expect((ctx as { body?: unknown }).body).toEqual({ ok: true });
    });

    it.each([207, 422] as const)(
      'normalizes the unsaved workspace preview resource input with HTTP %s',
      async (httpStatus) => {
        const previewResult = {
          accepted: false,
          httpStatus,
          failureCode: 'JS_TEMPLATE_VALIDATION_FAILED',
          diagnostics: [{ code: 'settings_condition_invalid', severity: 'error', message: 'Invalid condition' }],
        };
        const compileWorkspacePreview = vi.fn().mockResolvedValue(previewResult);
        const resource = createJsTemplatesResource(
          {} as never,
          {} as never,
          { compileWorkspacePreview } as unknown as JsTemplateCompilePreviewService,
        );
        const ctx = {
          action: {
            params: {
              values: {
                projectId: 'jtp_sales',
                expectedHeadCommitId: 'vsc_commit_1',
                templateId: 'jtt_sales_kpi',
                kind: 'js-block',
                entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
                runtimeVersion: 'v2',
                files: [
                  {
                    path: 'src/client/js-blocks/sales-kpi/index.tsx',
                    content: 'ctx.render(<div />);',
                    language: 'typescript',
                  },
                ],
              },
            },
          },
        } as unknown as Context;

        await resource.actions?.compileWorkspacePreview?.(ctx, async () => {});

        expect(compileWorkspacePreview).toHaveBeenCalledWith(
          {
            projectId: 'jtp_sales',
            expectedHeadCommitId: 'vsc_commit_1',
            templateId: 'jtt_sales_kpi',
            kind: 'js-block',
            entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
            runtimeVersion: 'v2',
            files: [
              {
                path: 'src/client/js-blocks/sales-kpi/index.tsx',
                content: 'ctx.render(<div />);',
                language: 'typescript',
                mode: undefined,
              },
            ],
          },
          expect.any(Object),
        );
        expect((ctx as { status?: number }).status).toBe(httpStatus);
        expect((ctx as { body?: unknown }).body).toBe(previewResult);
      },
    );
  });

  function createPreviewService(db: Database, fileService: JsTemplateFileService) {
    const auditService = new JsTemplateAuditService(db);
    const recordCompileEvent = vi.spyOn(auditService, 'recordCompileEvent').mockResolvedValue(undefined);
    const permissionService = new JsTemplatePermissionService(auditService);
    const bridge = new JsTemplateWorkspaceCompilerBridge();
    const service = new JsTemplateCompilePreviewService(
      db,
      auditService,
      fileService,
      permissionService,
      bridge,
      undefined,
    );

    return {
      service,
      recordCompileEvent,
    };
  }

  function createDbStub(templates: Record<string, unknown>[]) {
    const templatesRepository = {
      find: vi.fn().mockResolvedValue(templates.map(createModel)),
      create: vi.fn(),
      update: vi.fn(),
    };
    const persistenceRepositories = Object.fromEntries(
      ['jsTemplateArtifacts', 'jsTemplateProjects', 'vscFileCommits', 'vscFileTrees'].map((name) => [
        name,
        {
          create: vi.fn(),
          update: vi.fn(),
          destroy: vi.fn(),
        },
      ]),
    );
    persistenceRepositories.jsTemplateProjects.findOne = vi.fn().mockResolvedValue(createModel(createProject()));
    const db = {
      getRepository: (name: string) => {
        if (name === 'jsTemplates') {
          return templatesRepository;
        }
        if (name in persistenceRepositories) {
          return persistenceRepositories[name];
        }

        throw new Error(`Unexpected repository ${name}`);
      },
    } as unknown as Database;

    return {
      db,
      templatesRepository,
      persistenceRepositories,
    };
  }

  function createFileServiceStub(project: JsTemplateProject, files: JsTemplateTreeEntryInput[]) {
    const pulledFiles: JsTemplatePulledFile[] = files.map((file) => ({
      path: file.path,
      pathHash: `${file.path}:hash`,
      pathLowerHash: `${file.path.toLowerCase()}:hash`,
      blobHash: `${file.path}:blob`,
      size: file.content?.length || 0,
      language: file.language || 'typescript',
      mode: file.mode || '100644',
      content: file.content,
    }));

    return {
      pull: vi.fn().mockResolvedValue({
        project,
        commit: {
          id: 'vsc_commit_1',
        },
        tree: {
          hash: 'tree_hash_1',
          entryCount: pulledFiles.length,
          byteSize: pulledFiles.reduce((total, file) => total + file.size, 0),
        },
        unchanged: false,
        files: pulledFiles,
      }),
    } as unknown as JsTemplateFileService;
  }

  function createProject(): JsTemplateProject {
    return {
      id: 'jtp_sales',
      name: 'Sales',
      normalizedName: 'sales',
      title: 'Sales',
      description: null,
      lifecycleStatus: 'enabled',
      healthStatus: 'ready',
      headCommitId: 'vsc_commit_1',
    };
  }

  function createTemplateRecord(input: {
    id: string;
    projectId: string;
    templateName: string;
    compiledCommitId?: string | null;
  }): Record<string, unknown> {
    return {
      id: input.id,
      projectId: input.projectId,
      target: 'client',
      kind: 'js-block',
      templateName: input.templateName,
      entryPath: `src/client/js-blocks/${input.templateName}/index.tsx`,
      descriptorPath: `src/client/js-blocks/${input.templateName}/entry.json`,
      title: input.templateName,
      description: null,
      category: null,
      icon: null,
      tags: null,
      sort: null,
      settingsSchema: null,
      settingsSchemaHash: null,
      compiledCommitId: input.compiledCommitId || null,
      runtimeArtifact: input.compiledCommitId
        ? {
            code: 'ctx.render("existing");',
            version: 'v2',
            entryPath: `src/client/js-blocks/${input.templateName}/index.tsx`,
          }
        : null,
      runtimeVersion: input.compiledCommitId ? 'v2' : null,
      surfaceStyle: input.compiledCommitId ? 'render' : null,
      runtimeCodeHash: input.compiledCommitId ? 'runtime_hash_existing' : null,
      filesHash: input.compiledCommitId ? 'files_hash_existing' : null,
      settingsDefaultsHash: null,
      compiledAt: input.compiledCommitId ? new Date('2026-07-06T00:00:00.000Z') : null,
      healthStatus: 'ready',
      diagnostics: [],
      createdAt: null,
      updatedAt: null,
    };
  }

  function createModel(values: Record<string, unknown>): Model {
    return {
      get: (key: string) => values[key],
    } as unknown as Model;
  }

  function validSalesKpiFiles(): JsTemplateTreeEntryInput[] {
    return [
      {
        path: 'src/client/js-blocks/sales-kpi/index.tsx',
        content: "const title = 'Sales KPI';\nctx.render(<div>{title}</div>);\n",
      },
      {
        path: 'src/client/js-blocks/sales-kpi/entry.json',
        content: JSON.stringify({
          schemaVersion: 1,
          key: 'sales-kpi',
          title: 'Sales KPI',
        }),
      },
    ];
  }
}
registerCompilePreviewTests();

// Consolidated from workspace-compiler-bridge.test.ts.
function registerWorkspaceCompilerBridgeTests() {
  type AsyncFunctionConstructor = new (...args: string[]) => (...args: unknown[]) => Promise<unknown>;

  const asyncFunctionConstructor = Object.getPrototypeOf(async function runJSArtifactTest() {})
    .constructor as AsyncFunctionConstructor;

  async function executeArtifact(code: string, ctx: unknown): Promise<unknown> {
    return new asyncFunctionConstructor('ctx', code)(ctx);
  }

  describe('plugin-js-template workspace compiler bridge', () => {
    let bridge: JsTemplateWorkspaceCompilerBridge;

    beforeEach(() => {
      bridge = new JsTemplateWorkspaceCompilerBridge();
    });

    it('compiles a JS Block template into the shared RunJS artifact contract', async () => {
      const result = await bridge.compileEntry(
        {
          projectId: 'jtp_sales',
          templateId: 'jtt_sales_kpi',
          kind: 'js-block',
          templateName: 'sales-kpi',
          entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
          surfaceStyle: 'render',
          files: [
            {
              path: 'src/client/js-blocks/sales-kpi/index.tsx',
              content:
                "import type { Settings } from 'js-template:settings/client/js-block/sales-kpi';\nimport { title } from './labels';\nctx.render(<div>{String((ctx.settings as Settings).title || title)}</div>);\n",
            },
            {
              path: 'src/client/js-blocks/sales-kpi/labels.ts',
              content: "export const title = 'Sales KPI';\n",
            },
            {
              path: 'src/client/js-blocks/sales-kpi/entry.json',
              content: '{"schemaVersion":1,"key":"sales-kpi","settings":{"title":{"type":"string"}}}',
            },
          ],
        },
        {
          requestId: 'req_compile_success',
          requestSource: 'unit-test',
          actorUserId: '1',
        },
      );

      expect(result.accepted).toBe(true);
      expect(result.diagnostics).toEqual([]);
      expect(result.artifact).toMatchObject({
        version: 'v2',
        entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
        metadata: {
          target: 'client',
          projectId: 'jtp_sales',
          templateId: 'jtt_sales_kpi',
          kind: 'js-block',
          templateName: 'sales-kpi',
          surfaceStyle: 'render',
          compilerSurfaceStyle: 'render',
        },
      });
      const rendered: unknown[] = [];
      const React = { createElement: (type: unknown, props: unknown, child: unknown) => ({ type, props, child }) };
      await executeArtifact(result.artifact.code, {
        libs: {},
        React,
        settings: {},
        render: (value: unknown) => rendered.push(value),
      });
      expect(rendered).toEqual([{ type: 'div', props: null, child: 'Sales KPI' }]);
      expect(result.artifact.sourceMap).toBeTruthy();
    });

    it('compiles JS Page templates through the existing render artifact contract', async () => {
      const result = await bridge.compileEntry(
        {
          projectId: 'jtp_pages',
          templateId: 'jtt_orders',
          kind: 'js-page',
          templateName: 'orders',
          entryPath: 'src/client/js-pages/orders/index.tsx',
          surfaceStyle: 'render',
          files: [
            {
              path: 'src/shared/format.ts',
              content: 'export const format = (uid: string, title: string) => `${uid}:${title}`;\n',
            },
            {
              path: 'src/client/js-pages/orders/index.tsx',
              content:
                'import { format } from "../../../shared/format";\nctx.render(format(ctx.page.uid, String(ctx.settings.title)));\n',
            },
          ],
        },
        { requestId: 'req_compile_js_page' },
      );

      expect(result).toMatchObject({
        accepted: true,
        diagnostics: [],
        surface: {
          kind: 'js-page',
          surfaceStyle: 'render',
          compilerSurfaceStyle: 'render',
          modelUse: 'JSPageModel',
          surface: 'js-model.render',
        },
        artifact: {
          version: 'v2',
          entryPath: 'src/client/js-pages/orders/index.tsx',
          metadata: expect.objectContaining({
            projectId: 'jtp_pages',
            templateId: 'jtt_orders',
            kind: 'js-page',
            templateName: 'orders',
            modelUse: 'JSPageModel',
            surface: 'js-model.render',
            surfaceStyle: 'render',
            compilerSurfaceStyle: 'render',
          }),
        },
      });
      const rendered: unknown[] = [];
      await executeArtifact(result.artifact.code, {
        libs: {},
        page: { uid: 'page-1' },
        settings: { title: 'Orders' },
        render: (value: unknown) => rendered.push(value),
      });
      expect(rendered).toEqual(['page-1:Orders']);
    });

    it('compiles without permission or audit dependencies', async () => {
      const result = await bridge.compileEntry({
        projectId: 'jtp_deferred_audit',
        templateId: 'jtt_deferred_audit',
        operation: 'runtimeCompile',
        kind: 'js-block',
        templateName: 'deferred-audit',
        entryPath: 'src/client/js-blocks/deferred-audit/index.tsx',
        files: [
          {
            path: 'src/client/js-blocks/deferred-audit/index.tsx',
            content: 'ctx.render(<div>Deferred audit</div>);\n',
          },
        ],
      });

      expect(result.accepted).toBe(true);
    });

    it('compiles shared helper imports and zero-runtime SDK helpers for JS Templates', async () => {
      const result = await bridge.compileEntry(
        {
          projectId: 'jtp_sales',
          templateId: 'jtt_sales_kpi',
          kind: 'js-block',
          templateName: 'sales-kpi',
          entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
          surfaceStyle: 'render',
          files: [
            {
              path: 'src/shared/format.ts',
              content: 'export function formatValue(value: unknown) { return String(value ?? ""); }\n',
            },
            {
              path: 'src/client/js-blocks/sales-kpi/index.tsx',
              content:
                'import { defineSettings } from "@nocobase/runjs/js-template/client";\nimport { formatValue } from "../../../shared/format";\nexport const settings = defineSettings({ type: "object", properties: {} });\nctx.render(<div>{formatValue("Revenue")}</div>);\n',
            },
          ],
        },
        {
          requestId: 'req_compile_shared_sdk',
        },
      );

      expect(result.accepted).toBe(true);
      expect(result.diagnostics).toEqual([]);
      expect(result.artifact.code).toContain('Revenue');
      expect(result.artifact.code).not.toContain('@nocobase/runjs/js-template/client');
    });

    it('maps built-in React imports to ctx.libs at runtime', async () => {
      const result = await bridge.compileEntry({
        projectId: 'jtp_sales',
        templateId: 'jtt_react_hooks',
        kind: 'js-block',
        templateName: 'react-hooks',
        entryPath: 'src/client/js-blocks/react-hooks/index.tsx',
        surfaceStyle: 'render',
        files: [
          {
            path: 'src/client/js-blocks/react-hooks/index.tsx',
            content: [
              `import React, { useEffect, useState as useLocalState } from 'react';`,
              `import * as ReactDOM from 'react-dom/client';`,
              `useEffect(() => undefined, []);`,
              `ctx.render(<div>{String(React && ReactDOM && useLocalState)}</div>);`,
            ].join('\n'),
          },
        ],
      });

      expect(result.accepted).toBe(true);
      expect(result.diagnostics).toEqual([]);
      const React = {
        createElement: (type: unknown, props: unknown, child: unknown) => ({ type, props, child }),
        useEffect: () => undefined,
        useState: () => [0, () => undefined] as const,
      };
      const ReactDOM = { createRoot: () => undefined };
      const rendered: unknown[] = [];
      await executeArtifact(result.artifact.code, {
        libs: { React, ReactDOM },
        React,
        render: (value: unknown) => rendered.push(value),
      });
      expect(rendered).toHaveLength(1);
      expect(result.artifact.code).toContain('case "react": return ctx.libs.React;');
      expect(result.artifact.code).toContain('case "react-dom/client": return ctx.libs.ReactDOM;');
      expect(result.artifact.code).not.toContain(`from 'react'`);
    });

    it('excludes entry.json from compiler hashes while retaining ordinary JSON modules', async () => {
      const compile = (descriptorTitle: string, dataTitle: string) =>
        bridge.compileEntry({
          projectId: 'jtp_sales',
          templateId: 'jtt_sales_kpi',
          kind: 'js-block',
          templateName: 'sales-kpi',
          entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
          files: [
            {
              path: 'src/client/js-blocks/sales-kpi/index.tsx',
              content: "import data from './data.json';\nctx.render(<div>{data.title}</div>);\n",
            },
            {
              path: 'src/client/js-blocks/sales-kpi/data.json',
              content: JSON.stringify({ title: dataTitle }),
            },
            {
              path: 'src/client/js-blocks/sales-kpi/entry.json',
              content: JSON.stringify({ schemaVersion: 1, key: 'sales-kpi', title: descriptorTitle }),
            },
          ],
        });

      const initial = await compile('Sales KPI', 'Revenue');
      const descriptorChanged = await compile('Revenue KPI', 'Revenue');
      const dataChanged = await compile('Revenue KPI', 'Orders');

      expect(initial.accepted).toBe(true);
      expect(descriptorChanged.accepted).toBe(true);
      expect(dataChanged.accepted).toBe(true);
      expect(descriptorChanged.artifact.filesHash).toBe(initial.artifact.filesHash);
      expect(descriptorChanged.artifact.code).toBe(initial.artifact.code);
      expect(descriptorChanged.artifact.sourceMap).toBe(initial.artifact.sourceMap);
      expect(initial.artifact.code).toContain(
        `nocobase-runjs://bundle/${sha256Hex(initial.artifact.filesHash || '').slice(0, 16)}.js`,
      );
      expect(dataChanged.artifact.filesHash).not.toBe(initial.artifact.filesHash);
      expect(dataChanged.artifact.code).not.toBe(initial.artifact.code);
    });

    it('erases SDK authoring types while preserving zero-runtime helpers', async () => {
      const result = await bridge.compileEntry({
        projectId: 'jtp_sales',
        templateId: 'jtt_sales_kpi',
        kind: 'js-block',
        templateName: 'sales-kpi',
        entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
        surfaceStyle: 'render',
        files: [
          {
            path: 'src/client/js-blocks/sales-kpi/index.tsx',
            content:
              'import { type JsTemplateSettingsContext, defineSettings } from "@nocobase/runjs/js-template/client";\nexport const settings = defineSettings({ type: "object", properties: {} });\nexport default function render(ctxSettings: JsTemplateSettingsContext) { return ctxSettings.settings; }\nctx.render(<div>Revenue</div>);\n',
          },
        ],
      });

      expect(result.accepted).toBe(true);
      expect(result.diagnostics).toEqual([]);
      expect(result.artifact.code).not.toContain('@nocobase/runjs/js-template/client');
      expect(result.artifact.code).toContain('function defineSettings');
    });

    it('compiles aliases, namespaces, settings types, and SDK import types through one authoring contract', async () => {
      const result = await bridge.compileEntry({
        projectId: 'jtp_orders',
        templateId: 'jtt_orders',
        kind: 'js-page',
        templateName: 'orders',
        entryPath: 'src/client/js-pages/orders/index.tsx',
        surfaceStyle: 'render',
        files: [
          {
            path: 'src/client/js-pages/orders/index.tsx',
            content: [
              'import { type JsTemplateContextRecord as Row, type JSPageRuntimeFacade as PageFacade, defineSettings as define } from "@nocobase/runjs/js-template/client";',
              'import type * as SDK from "@nocobase/runjs/js-template/client";',
              'import type * as Template from "js-template:settings/client/js-page/orders";',
              'type ImportedPage = import("@nocobase/runjs/js-template/client").JSPageContext<Template.Settings>;',
              'type ImportedSettings = import("js-template:settings/client/js-page/orders").Settings;',
              'function inspect(row: Row, facade: PageFacade, page: SDK.JSPageContext<Template.Settings>, imported: ImportedPage, settings: ImportedSettings) { facade.setDocumentTitle(String(row.id)); return [page.page.uid, imported.page.active, settings]; }',
              'const settings = define({ title: "Orders" });',
              'ctx.render(<div>{settings.title}</div>);',
              '',
            ].join('\n'),
          },
          {
            path: 'src/client/js-pages/orders/entry.json',
            content: '{"schemaVersion":1,"key":"orders","settings":{"title":{"type":"string"}}}',
          },
        ],
      });

      expect(result.accepted, JSON.stringify(result.diagnostics, null, 2)).toBe(true);
      expect(result.diagnostics).toEqual([]);
      expect(result.artifact.code).not.toContain('@nocobase/runjs/js-template/');
      expect(result.artifact.code).not.toContain('js-template:settings/');
      expect(result.artifact.code).toContain('function define');
    });

    it('keeps unknown SDK authoring types as compile errors', async () => {
      const result = await bridge.compileEntry({
        projectId: 'jtp_sales',
        kind: 'js-block',
        entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
        files: [
          {
            path: 'src/client/js-blocks/sales-kpi/index.tsx',
            content:
              'import type { MissingContext } from "@nocobase/runjs/js-template/client";\nctx.render(null as unknown as MissingContext);\n',
          },
        ],
      });

      expect(result.accepted).toBe(false);
      expect(result.failureCode).toBe('JS_TEMPLATE_COMPILE_DENIED');
      expect(result.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'import_not_allowed',
            message: expect.stringContaining('not a public authoring type'),
          }),
        ]),
      );
    });

    it('hoists zero-runtime SDK helpers when the static import appears after first use', async () => {
      const result = await bridge.compileEntry(
        {
          projectId: 'jtp_sales',
          templateId: 'jtt_sales_kpi',
          kind: 'js-block',
          templateName: 'sales-kpi',
          entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
          surfaceStyle: 'render',
          files: [
            {
              path: 'src/client/js-blocks/sales-kpi/index.tsx',
              content:
                'export const settings = defineSettings({ type: "object", properties: {} });\nimport { defineSettings } from "@nocobase/runjs/js-template/client";\nctx.render(<div>Revenue</div>);\n',
            },
          ],
        },
        {
          requestId: 'req_compile_late_sdk_import',
        },
      );

      expect(result.accepted).toBe(true);
      expect(result.diagnostics).toEqual([]);
      const helperIndex = result.artifact.code.indexOf('function defineSettings');
      const callIndex = result.artifact.code.indexOf('defineSettings({');
      expect(helperIndex).toBeGreaterThanOrEqual(0);
      expect(callIndex).toBeGreaterThanOrEqual(0);
      expect(helperIndex).toBeGreaterThan(callIndex);
      expect(result.artifact.code).not.toContain('var defineSettings');
      expect(result.artifact.code).not.toContain('@nocobase/runjs/js-template/client');
    });

    it('keeps diagnostics on original source lines when rewriting zero-runtime SDK helpers', async () => {
      const result = await bridge.compileEntry(
        {
          projectId: 'jtp_sales',
          templateId: 'jtt_sales_kpi',
          kind: 'js-block',
          templateName: 'sales-kpi',
          entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
          surfaceStyle: 'render',
          files: [
            {
              path: 'src/client/js-blocks/sales-kpi/index.tsx',
              content:
                'import { defineSettings } from "@nocobase/runjs/js-template/client";\nimport { missing } from "./missing";\nexport const settings = defineSettings({ type: "object", properties: {} });\nctx.render(<div>{missing}</div>);\n',
            },
          ],
        },
        {
          requestId: 'req_compile_sdk_import_diagnostic_lines',
        },
      );

      expect(result.accepted).toBe(false);
      expect(result.failureCode).toBe('RUNJS_IMPORT_NOT_FOUND');
      expect(result.diagnostics[0]).toMatchObject({
        code: 'RUNJS_IMPORT_NOT_FOUND',
        path: 'src/client/js-blocks/sales-kpi/index.tsx',
        line: 2,
      });
    });

    it('compiles JS Field templates through the render surface used by the field runtime', async () => {
      const result = await bridge.compileEntry(
        {
          projectId: 'jtp_sales',
          templateId: 'jtt_phone_link',
          kind: 'js-field',
          templateName: 'phone-link',
          entryPath: 'src/client/js-fields/phone-link/index.tsx',
          surfaceStyle: 'render',
          files: [
            {
              path: 'src/client/js-fields/phone-link/index.tsx',
              content: 'ctx.render(<a href={`tel:${String(ctx.value ?? "")}`}>{String(ctx.value ?? "")}</a>);\n',
            },
          ],
        },
        {
          requestId: 'req_compile_js_field',
        },
      );

      expect(result.accepted).toBe(true);
      expect(result.diagnostics).toEqual([]);
      expect(result.surface).toMatchObject({
        kind: 'js-field',
        surfaceStyle: 'render',
        compilerSurfaceStyle: 'render',
        modelUse: 'JSEditableFieldModel',
        surface: 'js-model.render',
      });
      expect(result.artifact).toMatchObject({
        version: 'v2',
        entryPath: 'src/client/js-fields/phone-link/index.tsx',
        metadata: expect.objectContaining({
          projectId: 'jtp_sales',
          templateId: 'jtt_phone_link',
          kind: 'js-field',
          templateName: 'phone-link',
          surfaceStyle: 'render',
          compilerSurfaceStyle: 'render',
        }),
      });
    });

    it('compiles JS Item render templates through the compiler surface', async () => {
      const result = await bridge.compileEntry(
        {
          projectId: 'jtp_sales',
          templateId: 'jtt_customer_menu',
          kind: 'js-item',
          templateName: 'customer-menu',
          entryPath: 'src/client/js-items/customer-menu/index.tsx',
          surfaceStyle: 'render',
          files: [
            {
              path: 'src/client/js-items/customer-menu/index.tsx',
              content: 'ctx.render(<button>{String(ctx.record?.name ?? "")}</button>);\n',
            },
          ],
        },
        {
          requestId: 'req_compile_js_item',
        },
      );

      expect(result.accepted).toBe(true);
      expect(result.diagnostics).toEqual([]);
      expect(result.surface).toMatchObject({
        kind: 'js-item',
        surfaceStyle: 'render',
        modelUse: 'JSItemActionModel',
        surface: 'js-model.render',
      });
      expect(result.artifact).toMatchObject({
        version: 'v2',
        entryPath: 'src/client/js-items/customer-menu/index.tsx',
        metadata: expect.objectContaining({
          projectId: 'jtp_sales',
          templateId: 'jtt_customer_menu',
          kind: 'js-item',
          templateName: 'customer-menu',
          surfaceStyle: 'render',
          compilerSurfaceStyle: 'render',
        }),
      });
    });

    it('uses compiler-owned runtime global validation for js-block render surfaces', async () => {
      const result = await bridge.compileEntry(
        {
          projectId: 'jtp_sales',
          kind: 'js-block',
          templateName: 'unknown-global',
          entryPath: 'src/client/js-blocks/unknown-global/index.tsx',
          files: [
            {
              path: 'src/client/js-blocks/unknown-global/index.tsx',
              content: 'ctx.render(<div>Example</div>);\nsdfsdfw21212 + 1212;\n',
            },
          ],
        },
        {
          requestId: 'req_compile_authoring_blocked',
        },
      );

      expect(result.accepted).toBe(false);
      expect(result.failureCode).toBe('RUNJS_COMPILE_FAILED');
      expect(result.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'RUNJS_COMPILE_FAILED',
            path: 'src/client/js-blocks/unknown-global/index.tsx',
            line: 2,
            column: 1,
            message: expect.stringContaining("Cannot find name 'sdfsdfw21212'"),
            details: expect.objectContaining({
              ruleId: 'runjs-global-unknown',
              global: 'sdfsdfw21212',
            }),
          }),
        ]),
      );
      expect(result.diagnostics.every((diagnostic) => !diagnostic.message.includes('flowSurfaces authoring'))).toBe(
        true,
      );
    });
  });
}
registerWorkspaceCompilerBridgeTests();
