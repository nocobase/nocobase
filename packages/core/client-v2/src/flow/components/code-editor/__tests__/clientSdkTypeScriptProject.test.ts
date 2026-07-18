/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Diagnostic } from '@codemirror/lint';
import { afterEach, describe, expect, it } from 'vitest';

import { generatedRunJSTypeLibraryPackManifest } from '../type-packs/generated/manifest';
import {
  clearRunJSTypeLibraryPackRegistryForTests,
  getRunJSTypeLibraryPackRegistryDebugState,
} from '../typescriptLibraryRegistry';
import { clearTypeScriptProjectCachesForTests, createTypeScriptProjectSession } from '../typescriptProject';

function errorMessages(diagnostics: Diagnostic[]): string[] {
  return diagnostics.filter((diagnostic) => diagnostic.severity === 'error').map((diagnostic) => diagnostic.message);
}

function project(code: string) {
  return {
    currentFilePath: 'src/main.ts',
    files: [{ path: 'src/main.ts', content: code }],
  };
}

afterEach(() => {
  clearRunJSTypeLibraryPackRegistryForTests();
  clearTypeScriptProjectCachesForTests();
});

describe('RunJS client SDK TypeScript project', () => {
  it('provides the official createClient, request, and auth types for the exact subpath', async () => {
    const code = `
import { createClient, type CreateClientOptions } from '@nocobase/sdk/client';
const options: CreateClientOptions = { appName: 'main', storageType: 'memory' };
const client = createClient(options);
const role: string = client.auth.role;
const response = await client.request<{ data: { id: number } }>({ url: 'orders:list' });
const id: number = response.data.data.id;
void role;
void id;
`;
    const session = createTypeScriptProjectSession();

    expect(errorMessages(await session.getDiagnostics(project(code), code))).toEqual([]);
    const completionCode = `
import { createClient } from '@nocobase/sdk/client';
const client = createClient();
client.`;
    const completion = await session.getCompletionResult(
      project(completionCode),
      completionCode.length,
      completionCode,
      true,
    );
    const completionLabels = new Set(completion?.options.map((option) => option.label));
    expect(completionLabels.has('request')).toBe(true);
    expect(completionLabels.has('auth')).toBe(true);

    const createClientHover = await session.getHover(project(code), code.lastIndexOf('createClient') + 2, code);
    const requestHover = await session.getHover(project(code), code.indexOf('request') + 2, code);
    const authHover = await session.getHover(project(code), code.indexOf('auth') + 2, code);
    expect(createClientHover?.message).toContain('createClient');
    expect(requestHover?.message).toContain('request');
    expect(authHover?.message).toContain('auth');
    expect(getRunJSTypeLibraryPackRegistryDebugState().loadingPackCount).toBe(1);
    const state = session.getDebugState();
    expect(state.rootFileNames).toContain('/__runjs__/type-packs/nocobase-client-sdk-bridge.d.ts');
    expect(state.allFileNames).toContain('/node_modules/@nocobase/sdk/lib/client/index.d.ts');
  });

  it('reports invalid client options and missing APIClient members', async () => {
    const code = `
import { createClient } from '@nocobase/sdk/client';
const client = createClient({ storageType: 'database' });
client.notARealMethod();
`;
    const session = createTypeScriptProjectSession();
    const messages = errorMessages(await session.getDiagnostics(project(code), code));

    expect(messages.some((message) => /database/.test(message) && /ClientStorageType|storageType/.test(message))).toBe(
      true,
    );
    expect(messages.some((message) => /notARealMethod/.test(message))).toBe(true);
  });

  it('records the SDK package contract without embedding declarations in the manifest', () => {
    expect(generatedRunJSTypeLibraryPackManifest).toContainEqual(
      expect.objectContaining({
        id: '@nocobase/sdk/client',
        libraryName: 'clientSdk',
        sourcePackage: '@nocobase/sdk',
        version: '2.2.0-beta.15',
        rootFileCount: 1,
      }),
    );
  });
});
