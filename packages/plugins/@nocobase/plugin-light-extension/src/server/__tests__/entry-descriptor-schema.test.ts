/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  LIGHT_EXTENSION_ENTRY_KEY_PATTERN,
  LIGHT_EXTENSION_ENTRY_SCHEMA_URI,
  LIGHT_EXTENSION_ENTRY_SCHEMA_VERSION,
  LIGHT_EXTENSION_SETTINGS_CONDITION_LIMITS,
  LIGHT_EXTENSION_SETTINGS_CONDITION_LOGICS,
  LIGHT_EXTENSION_SETTINGS_CONDITION_OPERATORS,
  LIGHT_EXTENSION_SETTINGS_SCHEMA_KEYWORDS,
  LIGHT_EXTENSION_SETTINGS_SCHEMA_TYPES,
  LIGHT_EXTENSION_X_COMPONENT_WHITELIST,
  lightExtensionEntryV1Schema,
} from '@nocobase/light-extension-sdk/schema';
import sdkPackageJson from '@nocobase/light-extension-sdk/package.json';
import type { Database } from '@nocobase/database';
import {
  RUNJS_SETTINGS_CONDITION_LIMITS,
  RUNJS_SETTINGS_CONDITION_LOGICS,
  RUNJS_SETTINGS_CONDITION_OPERATORS,
} from '@nocobase/runjs/settings';
import type { Application } from '@nocobase/server';
import { createHash } from 'crypto';
import { vi } from 'vitest';

import { NAMESPACE } from '../../constants';
import {
  lightExtensionEntryV1SchemaFileContent,
  lightExtensionEntryV1SchemaSha256,
} from '../lightExtensionEntrySchema';
import PluginLightExtensionServer from '../plugin';
import { LightExtensionValidator } from '../services/LightExtensionValidator';

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

describe('plugin-light-extension canonical entry schema', () => {
  it('locks capabilities to the SDK schema contract and exact package version', () => {
    const capabilities = new LightExtensionValidator().getCapabilities();

    expect(capabilities.entryDescriptor).toEqual({
      schemaVersion: LIGHT_EXTENSION_ENTRY_SCHEMA_VERSION,
      keyPattern: LIGHT_EXTENSION_ENTRY_KEY_PATTERN,
    });
    expect(capabilities.schemaSubset.allowedTypes).toEqual(LIGHT_EXTENSION_SETTINGS_SCHEMA_TYPES);
    expect(capabilities.schemaSubset.allowedKeywords).toEqual(LIGHT_EXTENSION_SETTINGS_SCHEMA_KEYWORDS);
    expect(capabilities.xComponentWhitelist).toEqual(LIGHT_EXTENSION_X_COMPONENT_WHITELIST);
    expect(capabilities.conditions).toEqual({
      operators: LIGHT_EXTENSION_SETTINGS_CONDITION_OPERATORS,
      logic: LIGHT_EXTENSION_SETTINGS_CONDITION_LOGICS,
      limits: LIGHT_EXTENSION_SETTINGS_CONDITION_LIMITS,
    });
    expect(capabilities.conditions.operators).toEqual(RUNJS_SETTINGS_CONDITION_OPERATORS);
    expect(capabilities.conditions.logic).toEqual(RUNJS_SETTINGS_CONDITION_LOGICS);
    expect(capabilities.conditions.limits).toEqual(RUNJS_SETTINGS_CONDITION_LIMITS);
    expect(capabilities.sdk).toEqual({
      packageName: '@nocobase/light-extension-sdk',
      version: sdkPackageJson.version,
      entrySchemaUri: LIGHT_EXTENSION_ENTRY_SCHEMA_URI,
      entrySchemaSha256: lightExtensionEntryV1SchemaSha256,
    });
    expect(JSON.stringify(capabilities)).not.toMatch(/meta\.json|settings\.json|"runjs"|\$not"/u);
  });

  it('serves the canonical schema before auth with matching ETag and supports conditional GET', async () => {
    const middlewares: Array<{ middleware: RouteMiddleware; options?: { tag?: string; before?: string } }> = [];
    const acl = { allow: vi.fn(), registerSnippet: vi.fn() };
    const app = {
      db: {} as Database,
      acl,
      pm: { get: vi.fn(() => null), getPlugins: vi.fn(() => new Map()) },
      resourceManager: { define: vi.fn(), options: { prefix: '/api' } },
      on: vi.fn(),
      off: vi.fn(),
      use: vi.fn((middleware: RouteMiddleware, options?: { tag?: string; before?: string }) => {
        middlewares.push({ middleware, options });
      }),
    } as unknown as Application;
    const plugin = new PluginLightExtensionServer(app, {
      name: 'light-extension',
      packageName: NAMESPACE,
    });
    await plugin.load();

    const registered = middlewares.find((item) => item.options?.tag === 'light-extension-entry-schema');
    expect(registered?.options).toMatchObject({ before: 'auth' });
    const headers: Record<string, string> = {};
    const ctx: RouteContext = {
      method: 'GET',
      path: '/api/light-extensions/schemas/entry-v1.schema.json',
      request: { path: '/api/light-extensions/schemas/entry-v1.schema.json', headers: {} },
      set: (name, value) => {
        headers[name] = value;
      },
    };
    await registered?.middleware(
      ctx,
      vi.fn(async () => undefined),
    );

    const hash = createHash('sha256').update(lightExtensionEntryV1SchemaFileContent).digest('hex');
    expect(ctx.status).toBe(200);
    expect(ctx.type).toBe('application/schema+json');
    expect(ctx.body).toBe(lightExtensionEntryV1SchemaFileContent);
    expect(JSON.parse(lightExtensionEntryV1SchemaFileContent)).toEqual(lightExtensionEntryV1Schema);
    expect(JSON.parse(String(ctx.body)).$id).toBe(LIGHT_EXTENSION_ENTRY_SCHEMA_URI);
    expect(headers.ETag).toBe(`"${hash}"`);
    expect(acl.allow).toHaveBeenCalledWith('lightExtensionCapabilities', ['get'], 'public');

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
