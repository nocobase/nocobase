/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Transaction } from '@nocobase/database';
import { sha256Hex } from '@nocobase/runjs';
import { vi } from 'vitest';

import { LIGHT_EXTENSION_SUPPORTED_KINDS } from '../../constants';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LIGHT_EXTENSION_AUTHORING_SURFACES } from '../services/LightExtensionCompileContract';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { LightExtensionWorkspaceCompilerBridge } from '../services/LightExtensionWorkspaceCompilerBridge';

type AsyncFunctionConstructor = new (...args: string[]) => (...args: unknown[]) => Promise<unknown>;

const asyncFunctionConstructor = Object.getPrototypeOf(async function runJSArtifactTest() {})
  .constructor as AsyncFunctionConstructor;

async function executeArtifact(code: string, ctx: unknown): Promise<unknown> {
  return new asyncFunctionConstructor('ctx', code)(ctx);
}

describe('plugin-light-extension workspace compiler bridge', () => {
  let bridge: LightExtensionWorkspaceCompilerBridge;
  let recordCompileEvent: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const auditService = new LightExtensionAuditService({} as Database);
    recordCompileEvent = vi.spyOn(auditService, 'recordCompileEvent').mockResolvedValue(undefined);
    const permissionService = new LightExtensionPermissionService(auditService);
    bridge = new LightExtensionWorkspaceCompilerBridge(auditService, permissionService);
  });

  it('compiles a js-block entry into the shared RunJS artifact contract', async () => {
    const result = await bridge.compileEntry(
      {
        repoId: 'ler_sales',
        entryId: 'lee_sales_kpi',
        kind: 'js-block',
        entryName: 'sales-kpi',
        entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
        surfaceStyle: 'render',
        files: [
          {
            path: 'src/client/js-blocks/sales-kpi/index.tsx',
            content: "import { title } from './labels';\nctx.render(<div>{title}</div>);\n",
          },
          {
            path: 'src/client/js-blocks/sales-kpi/labels.ts',
            content: "export const title = 'Sales KPI';\n",
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
        repoId: 'ler_sales',
        entryId: 'lee_sales_kpi',
        kind: 'js-block',
        entryName: 'sales-kpi',
        surfaceStyle: 'render',
        compilerSurfaceStyle: 'render',
      },
    });
    expect(result.dependencyGraph).toMatchObject({
      runtime: {
        files: ['src/client/js-blocks/sales-kpi/index.tsx', 'src/client/js-blocks/sales-kpi/labels.ts'],
        edges: [
          {
            importer: 'src/client/js-blocks/sales-kpi/index.tsx',
            imported: 'src/client/js-blocks/sales-kpi/labels.ts',
          },
        ],
      },
      types: {
        files: expect.arrayContaining([
          'src/client/js-blocks/sales-kpi/index.tsx',
          'src/client/js-blocks/sales-kpi/labels.ts',
        ]),
        contracts: expect.arrayContaining([
          expect.objectContaining({ id: 'runjs:context', contentHash: expect.stringMatching(/^[a-f0-9]{64}$/u) }),
          expect.objectContaining({ id: 'runjs:surface', version: 'render' }),
          expect.objectContaining({ id: 'runjs:typescript-environment' }),
        ]),
      },
      unresolved: [],
    });
    const rendered: unknown[] = [];
    const React = { createElement: (type: unknown, props: unknown, child: unknown) => ({ type, props, child }) };
    await executeArtifact(result.artifact.code, {
      libs: {},
      React,
      render: (value: unknown) => rendered.push(value),
    });
    expect(rendered).toEqual([{ type: 'div', props: null, child: 'Sales KPI' }]);
    expect(result.artifact.sourceMap).toBeTruthy();

    expect(recordCompileEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        result: 'success',
        repoId: 'ler_sales',
        entryId: 'lee_sales_kpi',
        requestId: 'req_compile_success',
      }),
    );
    expect(recordCompileEvent.mock.calls[0][0]).toMatchObject({
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      surfaceStyle: 'render',
      diagnosticCount: 0,
      errorCount: 0,
      warningCount: 0,
    });
    expect(recordCompileEvent.mock.calls[0][0].details).toMatchObject({
      artifactEntryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      filesHash: expect.any(String),
      requestSource: 'unit-test',
      surface: 'js-model.render',
      modelUse: 'JSBlockModel',
    });
  });

  it('compiles JS Page entries through the existing render artifact contract', async () => {
    const result = await bridge.compileEntry(
      {
        repoId: 'ler_pages',
        entryId: 'lee_orders',
        kind: 'js-page',
        entryName: 'orders',
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
          repoId: 'ler_pages',
          entryId: 'lee_orders',
          kind: 'js-page',
          entryName: 'orders',
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

  it('defers a successful runtime compile audit until the result is published', async () => {
    const result = await bridge.compileEntry(
      {
        repoId: 'ler_deferred_audit',
        entryId: 'lee_deferred_audit',
        operation: 'runtimeCompile',
        kind: 'js-block',
        entryName: 'deferred-audit',
        entryPath: 'src/client/js-blocks/deferred-audit/index.tsx',
        files: [
          {
            path: 'src/client/js-blocks/deferred-audit/index.tsx',
            content: 'ctx.render(<div>Deferred audit</div>);\n',
          },
        ],
      },
      {
        requestId: 'req_deferred_audit',
        requestSource: 'save-source-prepare',
        actorUserId: '1',
        deferSuccessfulCompileAudit: true,
      },
    );

    expect(result.accepted).toBe(true);
    expect(recordCompileEvent).not.toHaveBeenCalled();

    const transaction = {} as Transaction;
    await bridge.recordPublishedRuntimeCompileAudit(
      {
        repoId: 'ler_deferred_audit',
        entryId: 'lee_deferred_audit',
        kind: 'js-block',
        entryName: 'deferred-audit',
        entryPath: 'src/client/js-blocks/deferred-audit/index.tsx',
        runtimeVersion: result.artifact.version,
        requestId: 'req_deferred_audit',
        diagnostics: result.diagnostics,
        filesHash: result.artifact.filesHash,
        artifactEntryPath: result.artifact.entryPath,
      },
      {
        requestSource: 'save-source-publish',
        actorUserId: '1',
        transaction,
      },
    );

    expect(recordCompileEvent).toHaveBeenCalledTimes(1);
    expect(recordCompileEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'runtimeCompile',
        result: 'success',
        repoId: 'ler_deferred_audit',
        entryId: 'lee_deferred_audit',
        requestId: 'req_deferred_audit',
        transaction,
      }),
    );
  });

  it('compiles shared helper imports and zero-runtime SDK helpers for light extension entries', async () => {
    const result = await bridge.compileEntry(
      {
        repoId: 'ler_sales',
        entryId: 'lee_sales_kpi',
        kind: 'js-block',
        entryName: 'sales-kpi',
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
              'import { defineSettings } from "@nocobase/light-extension-sdk/client";\nimport { formatValue } from "../../../shared/format";\nexport const settings = defineSettings({ type: "object", properties: {} });\nctx.render(<div>{formatValue("Revenue")}</div>);\n',
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
    expect(result.artifact.code).not.toContain('@nocobase/light-extension-sdk/client');
  });

  it('maps built-in React imports to ctx.libs at runtime', async () => {
    const result = await bridge.compileEntry({
      repoId: 'ler_sales',
      entryId: 'lee_react_hooks',
      kind: 'js-block',
      entryName: 'react-hooks',
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
        repoId: 'ler_sales',
        entryId: 'lee_sales_kpi',
        kind: 'js-block',
        entryName: 'sales-kpi',
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
      repoId: 'ler_sales',
      entryId: 'lee_sales_kpi',
      kind: 'js-block',
      entryName: 'sales-kpi',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      surfaceStyle: 'render',
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content:
            'import { type LightExtensionSettingsContext, defineSettings } from "@nocobase/light-extension-sdk/client";\nexport const settings = defineSettings({ type: "object", properties: {} });\nexport default function render(ctxSettings: LightExtensionSettingsContext) { return ctxSettings.settings; }\nctx.render(<div>Revenue</div>);\n',
        },
      ],
    });

    expect(result.accepted).toBe(true);
    expect(result.diagnostics).toEqual([]);
    expect(result.artifact.code).not.toContain('@nocobase/light-extension-sdk/client');
    expect(result.artifact.code).toContain('function defineSettings');
  });

  it('keeps unknown SDK authoring types as compile errors', async () => {
    const result = await bridge.compileEntry({
      repoId: 'ler_sales',
      kind: 'js-block',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content:
            'import type { MissingContext } from "@nocobase/light-extension-sdk/client";\nctx.render(null as unknown as MissingContext);\n',
        },
      ],
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining("Cannot find module '@nocobase/light-extension-sdk/client'"),
        }),
      ]),
    );
  });

  it('hoists zero-runtime SDK helpers when the static import appears after first use', async () => {
    const result = await bridge.compileEntry(
      {
        repoId: 'ler_sales',
        entryId: 'lee_sales_kpi',
        kind: 'js-block',
        entryName: 'sales-kpi',
        entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
        surfaceStyle: 'render',
        files: [
          {
            path: 'src/client/js-blocks/sales-kpi/index.tsx',
            content:
              'export const settings = defineSettings({ type: "object", properties: {} });\nimport { defineSettings } from "@nocobase/light-extension-sdk/client";\nctx.render(<div>Revenue</div>);\n',
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
    expect(result.artifact.code).not.toContain('@nocobase/light-extension-sdk/client');
  });

  it('keeps diagnostics on original source lines when rewriting zero-runtime SDK helpers', async () => {
    const result = await bridge.compileEntry(
      {
        repoId: 'ler_sales',
        entryId: 'lee_sales_kpi',
        kind: 'js-block',
        entryName: 'sales-kpi',
        entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
        surfaceStyle: 'render',
        files: [
          {
            path: 'src/client/js-blocks/sales-kpi/index.tsx',
            content:
              'import { defineSettings } from "@nocobase/light-extension-sdk/client";\nimport { missing } from "./missing";\nexport const settings = defineSettings({ type: "object", properties: {} });\nctx.render(<div>{missing}</div>);\n',
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

  it('keeps compiler surfaces aligned with the light-extension kind contract', () => {
    expect(Object.keys(LIGHT_EXTENSION_AUTHORING_SURFACES).sort()).toEqual([...LIGHT_EXTENSION_SUPPORTED_KINDS].sort());
    expect(Object.values(LIGHT_EXTENSION_AUTHORING_SURFACES).every((surface) => surface.compilerSurfaceStyle)).toBe(
      true,
    );
  });

  it('compiles JS Field entries through the render surface used by the field runtime', async () => {
    const result = await bridge.compileEntry(
      {
        repoId: 'ler_sales',
        entryId: 'lee_phone_link',
        kind: 'js-field',
        entryName: 'phone-link',
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
        repoId: 'ler_sales',
        entryId: 'lee_phone_link',
        kind: 'js-field',
        entryName: 'phone-link',
        surfaceStyle: 'render',
        compilerSurfaceStyle: 'render',
      }),
    });
  });

  it('compiles JS Item render entries through the compiler surface', async () => {
    const result = await bridge.compileEntry(
      {
        repoId: 'ler_sales',
        entryId: 'lee_customer_menu',
        kind: 'js-item',
        entryName: 'customer-menu',
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
        repoId: 'ler_sales',
        entryId: 'lee_customer_menu',
        kind: 'js-item',
        entryName: 'customer-menu',
        surfaceStyle: 'render',
        compilerSurfaceStyle: 'render',
      }),
    });

    expect(recordCompileEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        result: 'success',
        repoId: 'ler_sales',
        entryId: 'lee_customer_menu',
        requestId: 'req_compile_js_item',
      }),
    );
  });

  it('uses compiler-owned runtime global validation for js-block render surfaces', async () => {
    const result = await bridge.compileEntry(
      {
        repoId: 'ler_sales',
        kind: 'js-block',
        entryName: 'unknown-global',
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
    expect(result.diagnostics.every((diagnostic) => !diagnostic.message.includes('flowSurfaces authoring'))).toBe(true);
  });
});
