/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import { sha256Hex } from '@nocobase/runjs';
import { vi } from 'vitest';

import { LIGHT_EXTENSION_SUPPORTED_KINDS } from '../../constants';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LIGHT_EXTENSION_AUTHORING_SURFACES } from '../services/LightExtensionCompileContract';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { LightExtensionWorkspaceCompilerBridge } from '../services/LightExtensionWorkspaceCompilerBridge';

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
    expect(result.artifact.code).toContain("const title = 'Sales KPI';");
    expect(result.artifact.code).toContain('ctx.render(<div>{title}</div>);');
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

  it('compiles built-in React imports to ctx.libs declarations', async () => {
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
    expect(result.artifact.code).toContain('const React = ctx.libs.React;');
    expect(result.artifact.code).toContain('const { useEffect, useState: useLocalState } = ctx.libs.React;');
    expect(result.artifact.code).toContain('const ReactDOM = ctx.libs.ReactDOM;');
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

  it('rejects SDK type imports when the repository omits its declaration file', async () => {
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

    expect(result.accepted).toBe(false);
    expect(result.failureCode).toBe('RUNJS_COMPILE_FAILED');
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
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
