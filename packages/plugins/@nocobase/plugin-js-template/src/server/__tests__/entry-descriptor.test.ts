/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  JS_TEMPLATE_KEY_PATTERN,
  JS_TEMPLATE_SCHEMA_URI,
  JS_TEMPLATE_SCHEMA_VERSION,
  JS_TEMPLATE_SETTINGS_CONDITION_LIMITS,
  JS_TEMPLATE_SETTINGS_CONDITION_LOGICS,
  JS_TEMPLATE_SETTINGS_CONDITION_OPERATORS,
  JS_TEMPLATE_SETTINGS_SCHEMA_KEYWORDS,
  JS_TEMPLATE_SETTINGS_SCHEMA_TYPES,
  JS_TEMPLATE_X_COMPONENT_WHITELIST,
  jsTemplateV1Schema,
} from '@nocobase/runjs/js-template/schema';
import { JS_TEMPLATE_SDK_CLIENT_IMPORT, JS_TEMPLATE_SDK_SHARED_IMPORT } from '@nocobase/runjs/js-template/typegen';
import sdkPackageJson from '@nocobase/runjs/package.json';
import type { Database } from '@nocobase/database';
import {
  RUNJS_SETTINGS_CONDITION_LIMITS,
  RUNJS_SETTINGS_CONDITION_LOGICS,
  RUNJS_SETTINGS_CONDITION_OPERATORS,
} from '@nocobase/runjs/settings';
import type { Application } from '@nocobase/server';
import { createHash } from 'crypto';
import { vi } from 'vitest';

import { JS_TEMPLATE_DESCRIPTOR_MAX_BYTES, NAMESPACE } from '../../constants';
import { jsTemplateV1SchemaFileContent, jsTemplateV1SchemaSha256 } from '../jsTemplateSchema';
import PluginJsTemplateServer from '../plugin';
import { JsTemplateValidator } from '../services/JsTemplateValidator';

interface RouteContext {
  body?: unknown;
  method: string;
  path: string;
  request?: {
    path: string;
    headers?: Record<string, string | string[] | undefined>;
  };
  status?: number;
  type?: string;
  set?: (name: string, value: string) => void;
}

type RouteMiddleware = (ctx: RouteContext, next: () => Promise<void>) => Promise<void>;

describe('entry descriptor schema', () => {
  it('locks capabilities to the SDK schema contract and exact package version', () => {
    const capabilities = new JsTemplateValidator().getCapabilities();

    expect(capabilities.templateDescriptor).toEqual({
      schemaVersion: JS_TEMPLATE_SCHEMA_VERSION,
      keyPattern: JS_TEMPLATE_KEY_PATTERN,
    });
    expect(capabilities.schemaSubset.allowedTypes).toEqual(JS_TEMPLATE_SETTINGS_SCHEMA_TYPES);
    expect(capabilities.schemaSubset.allowedKeywords).toEqual(JS_TEMPLATE_SETTINGS_SCHEMA_KEYWORDS);
    expect(capabilities.xComponentWhitelist).toEqual(JS_TEMPLATE_X_COMPONENT_WHITELIST);
    expect(capabilities.conditions).toEqual({
      operators: JS_TEMPLATE_SETTINGS_CONDITION_OPERATORS,
      logic: JS_TEMPLATE_SETTINGS_CONDITION_LOGICS,
      limits: JS_TEMPLATE_SETTINGS_CONDITION_LIMITS,
    });
    expect(capabilities.conditions.operators).toEqual(RUNJS_SETTINGS_CONDITION_OPERATORS);
    expect(capabilities.conditions.logic).toEqual(RUNJS_SETTINGS_CONDITION_LOGICS);
    expect(capabilities.conditions.limits).toEqual(RUNJS_SETTINGS_CONDITION_LIMITS);
    expect(capabilities.sdk).toEqual({
      packageName: '@nocobase/runjs',
      version: sdkPackageJson.version,
      clientImport: JS_TEMPLATE_SDK_CLIENT_IMPORT,
      sharedImport: JS_TEMPLATE_SDK_SHARED_IMPORT,
      templateSchemaUri: JS_TEMPLATE_SCHEMA_URI,
      templateSchemaSha256: jsTemplateV1SchemaSha256,
    });
    expect(capabilities.supportedKinds).toEqual(['js-block', 'js-page', 'js-field', 'js-action', 'js-item']);
    expect(capabilities.allowedPaths.templates.runjs).toBeUndefined();
    expect(capabilities.allowedPaths.project).not.toContain('src/client/runjs/**');
    expect(JSON.stringify(capabilities)).not.toMatch(/meta\.json|settings\.json|\$not"/u);
  });

  it('serves the canonical schema before auth with matching ETag and supports conditional GET', async () => {
    const middlewares: Array<{ middleware: RouteMiddleware; options?: { tag?: string; before?: string } }> = [];
    const acl = { allow: vi.fn(), registerSnippet: vi.fn() };
    const app = {
      db: {} as Database,
      acl,
      auditManager: { registerActions: vi.fn() },
      pm: { get: vi.fn(() => null), getPlugins: vi.fn(() => new Map()) },
      resourceManager: { define: vi.fn(), options: { prefix: '/api' } },
      on: vi.fn(),
      off: vi.fn(),
      use: vi.fn((middleware: RouteMiddleware, options?: { tag?: string; before?: string }) => {
        middlewares.push({ middleware, options });
      }),
    } as unknown as Application;
    const plugin = new PluginJsTemplateServer(app, {
      name: 'js-template',
      packageName: NAMESPACE,
    });
    await plugin.load();

    const registered = middlewares.find((item) => item.options?.tag === 'js-template-entry-schema');
    expect(registered?.options).toMatchObject({ before: 'auth' });
    const headers: Record<string, string> = {};
    const ctx: RouteContext = {
      method: 'GET',
      path: '/api/js-templates/schemas/entry-v1.schema.json',
      request: { path: '/api/js-templates/schemas/entry-v1.schema.json', headers: {} },
      set: (name, value) => {
        headers[name] = value;
      },
    };
    await registered?.middleware(
      ctx,
      vi.fn(async () => undefined),
    );

    const hash = createHash('sha256').update(jsTemplateV1SchemaFileContent).digest('hex');
    expect(ctx.status).toBe(200);
    expect(ctx.type).toBe('application/schema+json');
    expect(ctx.body).toBe(jsTemplateV1SchemaFileContent);
    expect(JSON.parse(jsTemplateV1SchemaFileContent)).toEqual(jsTemplateV1Schema);
    expect(JSON.parse(String(ctx.body)).$id).toBe(JS_TEMPLATE_SCHEMA_URI);
    expect(headers.ETag).toBe(`"${hash}"`);
    expect(acl.allow).toHaveBeenCalledWith('jsTemplateCapabilities', ['get'], 'public');

    const cachedContext: RouteContext = {
      method: 'GET',
      path: ctx.path,
      request: { path: ctx.path, headers: { 'if-none-match': headers.ETag } },
      set: vi.fn(),
    };
    await registered?.middleware(
      cachedContext,
      vi.fn(async () => undefined),
    );
    expect(cachedContext.status).toBe(304);
    expect(cachedContext.body).toBeUndefined();
  });
});

describe('entry descriptor normalization', () => {
  it('projects metadata and normalizes direct settings fields from entry.json', () => {
    const settingsSchema = {
      type: 'object',
      required: ['threshold'],
      properties: {
        threshold: {
          type: 'number',
          default: 10,
          'x-component': 'InputNumber',
        },
      },
    };
    const result = new JsTemplateValidator().validateWorkspace({
      files: entryFiles({
        schemaVersion: 1,
        key: 'sales-overview',
        title: 'Sales KPI',
        description: 'Shows sales KPIs',
        category: 'sales',
        icon: 'BarChartOutlined',
        tags: ['sales', 'kpi'],
        sort: 10,
        settings: {
          threshold: {
            ...settingsSchema.properties.threshold,
            required: true,
          },
        },
      }),
    });

    expect(result.accepted).toBe(true);
    expect(result.templates[0]).toMatchObject({
      templateName: 'sales-overview',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      descriptorPath: 'src/client/js-blocks/sales-kpi/entry.json',
      title: 'Sales KPI',
      description: 'Shows sales KPIs',
      category: 'sales',
      icon: 'BarChartOutlined',
      tags: ['sales', 'kpi'],
      sort: 10,
      settingsSchema,
    });
  });
});

describe('entry descriptor semantic validation', () => {
  it.each([
    [{ key: 'sales-kpi' }, 'entry_descriptor_schema_version_required'],
    [{ schemaVersion: 2, key: 'sales-kpi' }, 'entry_descriptor_schema_version_unsupported'],
    [{ schemaVersion: 1 }, 'entry_descriptor_key_required'],
    [{ schemaVersion: 1, key: 'Sales KPI' }, 'entry_descriptor_field_invalid'],
    [
      { schemaVersion: 1, key: 'sales-kpi', $schema: 'https://example.com/entry.json' },
      'entry_descriptor_schema_url_unsupported',
    ],
    [{ schemaVersion: 1, key: 'sales-kpi', settingsSchema: {} }, 'entry_descriptor_unknown_field'],
    [{ schemaVersion: 1, key: 'sales-kpi', unknown: true }, 'entry_descriptor_unknown_field'],
  ])('rejects invalid descriptor contract %j', (descriptor, code) => {
    const result = new JsTemplateValidator().validateWorkspace({ files: entryFiles(descriptor) });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code,
        path: 'src/client/js-blocks/sales-kpi/entry.json',
      }),
    );
  });

  it('requires entry.json and rejects old descriptor paths through workspace policy', () => {
    const result = new JsTemplateValidator().validateWorkspace({
      files: [
        { path: 'src/client/js-blocks/sales-kpi/index.tsx', content: 'ctx.render(<div />);\n' },
        { path: 'src/client/js-blocks/sales-kpi/meta.json', content: '{"key":"sales-kpi"}' },
        { path: 'src/client/js-blocks/sales-kpi/settings.json', content: '{"type":"object"}' },
      ],
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics.map((item) => item.code)).toEqual(
      expect.arrayContaining(['workspace_path_not_allowed', 'entry_descriptor_missing']),
    );
  });

  it('enforces the 128 KiB descriptor limit before JSON parsing', () => {
    const result = new JsTemplateValidator({ limits: { maxJsonBytes: 256 * 1024 } }).validateWorkspace({
      files: entryFiles({
        schemaVersion: 1,
        key: 'sales-kpi',
        description: 'x'.repeat(JS_TEMPLATE_DESCRIPTOR_MAX_BYTES),
      }),
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'entry_descriptor_too_large',
        path: 'src/client/js-blocks/sales-kpi/entry.json',
      }),
    );
  });

  it('rejects descriptor imports while preserving ordinary JSON module imports', () => {
    const rejected = new JsTemplateValidator().validateWorkspace({
      files: entryFiles(
        { schemaVersion: 1, key: 'sales-kpi' },
        'import descriptor from "./entry.json";\nctx.render(descriptor.key);\n',
      ),
    });
    const accepted = new JsTemplateValidator().validateWorkspace({
      files: [
        ...entryFiles(
          { schemaVersion: 1, key: 'sales-kpi' },
          'import data from "./data.json";\nctx.render(data.title);\n',
        ),
        { path: 'src/client/js-blocks/sales-kpi/data.json', content: '{"title":"Sales"}' },
      ],
    });

    expect(rejected.accepted).toBe(false);
    expect(rejected.diagnostics).toContainEqual(
      expect.objectContaining({ code: 'entry_descriptor_import_not_allowed' }),
    );
    expect(accepted.accepted).toBe(true);
  });

  it('validates settings field definitions in entry.json', () => {
    const result = new JsTemplateValidator().validateWorkspace({
      files: entryFiles({
        schemaVersion: 1,
        key: 'sales-kpi',
        settings: {
          title: {
            type: 'string',
            'x-reactions': '{{ dangerous }}',
            'x-component': 'DangerWidget',
          },
        },
      }),
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics.map((item) => item.code)).toEqual(
      expect.arrayContaining(['settings_schema_keyword_not_allowed', 'settings_x_component_not_allowed']),
    );
  });
});

function entryFiles(descriptor: Record<string, unknown>, code = 'ctx.render(<div />);\n') {
  const root = 'src/client/js-blocks/sales-kpi';
  return [
    { path: `${root}/index.tsx`, content: code },
    { path: `${root}/entry.json`, content: JSON.stringify(descriptor) },
  ];
}
