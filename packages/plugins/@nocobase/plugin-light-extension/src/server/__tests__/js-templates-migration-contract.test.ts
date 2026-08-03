/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import type { Database } from '@nocobase/database';
import { LIGHT_EXTENSION_PERSISTED_VSC_OWNER_TYPE } from '@nocobase/runjs-workspace/shared';
import type { Application } from '@nocobase/server';
import { vi } from 'vitest';

import {
  JS_TEMPLATES_CANONICAL_PRODUCT_NAME,
  JS_TEMPLATES_CANONICAL_PRODUCT_NAME_ZH_CN,
  LIGHT_EXTENSION_ACL_SNIPPET,
  LIGHT_EXTENSION_COLLECTIONS,
  LIGHT_EXTENSION_LEGACY_PERSISTENCE_CONTRACT,
  LIGHT_EXTENSION_LEGACY_PROTOCOL_CONTRACT,
  LIGHT_EXTENSION_OWNER_TYPE,
  LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT,
} from '../../constants';
import { LIGHT_EXTENSION_ERROR_CODES } from '../../shared/errors';
import PluginLightExtensionServer from '../plugin';
import { LIGHT_EXTENSION_RUNTIME_SURFACE_CONTRACT_VERSION } from '../services/LightExtensionCompileContract';

const repositoryRoot = path.resolve(__dirname, '../../../../../../..');

describe('JS templates migration compatibility contract', () => {
  it('pins the canonical product names and legacy persisted tokens', () => {
    expect(JS_TEMPLATES_CANONICAL_PRODUCT_NAME).toBe('JS templates');
    expect(JS_TEMPLATES_CANONICAL_PRODUCT_NAME_ZH_CN).toBe('JS 模板');
    expect(LIGHT_EXTENSION_LEGACY_PERSISTENCE_CONTRACT).toEqual({
      sourceMode: 'light-extension',
      sourceBindingType: 'light-extension-entry',
      collectionNames: [
        'lightExtensionRepos',
        'lightExtensionEntries',
        'lightExtensionReferences',
        'lightExtensionRuntimeArtifacts',
        'lightExtensionLogs',
        'lightExtensionMoveOperations',
        'lightExtensionCreateJobs',
      ],
      vscOwnerType: 'light-extension',
    });
    expect(LIGHT_EXTENSION_PERSISTED_VSC_OWNER_TYPE).toBe('light-extension');
    expect(LIGHT_EXTENSION_OWNER_TYPE).toBe(LIGHT_EXTENSION_PERSISTED_VSC_OWNER_TYPE);
    expect(LIGHT_EXTENSION_COLLECTIONS).toEqual({
      repos: 'lightExtensionRepos',
      entries: 'lightExtensionEntries',
      references: 'lightExtensionReferences',
      runtimeArtifacts: 'lightExtensionRuntimeArtifacts',
      logs: 'lightExtensionLogs',
      moveOperations: 'lightExtensionMoveOperations',
      createJobs: 'lightExtensionCreateJobs',
    });
  });

  it('routes production database lookups through the frozen collection identities', () => {
    const serverRoot = path.resolve(__dirname, '..');
    const persistenceFiles = [
      path.join(serverRoot, 'plugin.ts'),
      ...listSourceFiles(path.join(serverRoot, 'collections')),
      ...listSourceFiles(path.join(serverRoot, 'services')),
    ];

    for (const filePath of persistenceFiles) {
      const source = readFileSync(filePath, 'utf8');
      for (const collectionName of LIGHT_EXTENSION_LEGACY_PERSISTENCE_CONTRACT.collectionNames) {
        const directLookup = new RegExp(
          `(?:getRepository|getModel|getCollection|hasCollection)(?:<[^\\n]*>)?\\(\\s*['"]${collectionName}['"]`,
          'u',
        );
        expect(source, path.relative(repositoryRoot, filePath)).not.toMatch(directLookup);
      }
    }
  });

  it('ships no physical collection rename migration for the product rename', () => {
    const migrationRoot = path.resolve(__dirname, '../migrations');
    for (const filePath of listSourceFiles(migrationRoot)) {
      const source = readFileSync(filePath, 'utf8');
      expect(source, path.relative(repositoryRoot, filePath)).not.toMatch(/\b(?:renameTable|renameColumn)\s*\(/u);
      expect(source, path.relative(repositoryRoot, filePath)).not.toMatch(/\bALTER\s+TABLE\b[\s\S]*\bRENAME\b/iu);
      expect(source, path.relative(repositoryRoot, filePath)).not.toMatch(/\bjsTemplates?[A-Z]/u);
    }
  });

  it('pins legacy runtime, HTTP, ACL, CLI, and SDK protocol names', () => {
    expect(LIGHT_EXTENSION_LEGACY_PROTOCOL_CONTRACT).toEqual({
      packageName: '@nocobase/plugin-light-extension',
      settingsKey: 'light-extension',
      aclSnippet: 'pm.light-extension',
      runtimeArtifactContract: 'light-extension.runtime-artifact.v1',
      runtimeSurfaceContract: 'light-extension.runtime-surface.v1',
      errorCodePrefix: 'LIGHT_EXTENSION_',
      httpResourceNames: [
        'lightExtensions',
        'lightExtensionRepos',
        'lightExtensionFiles',
        'lightExtensionEntries',
        'lightExtensionReferences',
        'lightExtensionRuntime',
        'lightExtensionCapabilities',
        'lightExtensionSync',
        'lightExtensionCreateJobs',
      ],
      documentedHttpRoutes: [
        '/light-extensions/capabilities',
        '/light-extensions/{repoId}/compile-preview',
        '/light-extensions/schemas/entry-v1.schema.json',
        '/light-extension-runtime/resolve',
        '/light-extension-runtime/artifacts/{artifactHash}',
      ],
      cli: {
        topic: 'light',
        apiModule: 'light-extension',
        commands: ['pull', 'check', 'save'],
      },
      sdk: {
        packageName: '@nocobase/light-extension-sdk',
        exportSubpaths: [
          '.',
          './client',
          './shared',
          './schema',
          './schema/server',
          './schema/entry-v1.schema.json',
          './typegen',
          './package.json',
        ],
        schemaUri: 'https://schemas.nocobase.com/light-extension/entry-v1.schema.json',
        settingsImportPrefix: 'light-extension:settings/',
        generatedTypesRoot: '.light-extension/types',
        projectFileName: 'light-extension.json',
      },
    });
    expect(LIGHT_EXTENSION_ACL_SNIPPET).toBe('pm.light-extension');
    expect(LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT).toBe('light-extension.runtime-artifact.v1');
    expect(LIGHT_EXTENSION_RUNTIME_SURFACE_CONTRACT_VERSION).toBe('light-extension.runtime-surface.v1');
  });

  it('pins all public LIGHT_EXTENSION error codes', () => {
    expect(LIGHT_EXTENSION_ERROR_CODES).toEqual([
      'LIGHT_EXTENSION_INVALID_INPUT',
      'LIGHT_EXTENSION_REPO_CONFLICT',
      'LIGHT_EXTENSION_REPO_NOT_FOUND',
      'LIGHT_EXTENSION_REPO_NOT_ARCHIVED',
      'LIGHT_EXTENSION_REPO_ARCHIVED',
      'LIGHT_EXTENSION_REPO_DISABLED',
      'LIGHT_EXTENSION_RUNTIME_UNAVAILABLE',
      'LIGHT_EXTENSION_REFERENCE_EXISTS',
      'LIGHT_EXTENSION_ENTRY_NOT_FOUND',
      'LIGHT_EXTENSION_ARTIFACT_NOT_FOUND',
      'LIGHT_EXTENSION_ENTRY_CONFLICT',
      'LIGHT_EXTENSION_IDEMPOTENCY_CONFLICT',
      'LIGHT_EXTENSION_IDEMPOTENCY_IN_PROGRESS',
      'LIGHT_EXTENSION_BINDING_OUTDATED',
      'LIGHT_EXTENSION_SOURCE_OUTDATED',
      'LIGHT_EXTENSION_SETTINGS_INVALID',
      'LIGHT_EXTENSION_PERMISSION_DENIED',
      'LIGHT_EXTENSION_VALIDATION_FAILED',
      'LIGHT_EXTENSION_SOURCE_ERROR',
      'LIGHT_EXTENSION_SYNC_UNSUPPORTED_PROVIDER',
      'LIGHT_EXTENSION_SYNC_CREDENTIAL_UNAVAILABLE',
      'LIGHT_EXTENSION_SYNC_AUTH_FAILED',
      'LIGHT_EXTENSION_SYNC_REMOTE_NOT_FOUND',
      'LIGHT_EXTENSION_SYNC_RATE_LIMITED',
      'LIGHT_EXTENSION_SYNC_REMOTE_CHANGED',
      'LIGHT_EXTENSION_SYNC_DIVERGED',
      'LIGHT_EXTENSION_SYNC_BUSY',
      'LIGHT_EXTENSION_SYNC_UNSAFE_CONTENT',
      'LIGHT_EXTENSION_SYNC_REMOTE_UNAVAILABLE',
      'LIGHT_EXTENSION_SYNC_LOCAL_OUTDATED',
      'LIGHT_EXTENSION_SYNC_CONFIG_INVALID',
      'LIGHT_EXTENSION_SYNC_AUTH_REF_INVALID',
    ]);
    expect(LIGHT_EXTENSION_ERROR_CODES.every((code) => code.startsWith('LIGHT_EXTENSION_'))).toBe(true);
  });

  it('registers every legacy HTTP resource and the legacy management ACL snippet', async () => {
    const resourceNames: string[] = [];
    const snippetNames: string[] = [];
    const app = {
      db: {} as Database,
      environment: { getVariables: vi.fn(() => ({})) },
      acl: {
        allow: vi.fn(),
        registerSnippet: vi.fn((snippet: { name: string }) => {
          snippetNames.push(snippet.name);
        }),
      },
      auditManager: { registerActions: vi.fn(), log: vi.fn() },
      resourceManager: {
        define: vi.fn((resource: { name?: string }) => {
          if (resource.name) {
            resourceNames.push(resource.name);
          }
        }),
        options: {},
      },
      on: vi.fn(),
      off: vi.fn(),
      use: vi.fn(),
    } as unknown as Application;
    const plugin = new PluginLightExtensionServer(app, {
      name: 'light-extension',
      packageName: LIGHT_EXTENSION_LEGACY_PROTOCOL_CONTRACT.packageName,
    });

    await plugin.load();

    expect(resourceNames).toEqual(
      expect.arrayContaining([...LIGHT_EXTENSION_LEGACY_PROTOCOL_CONTRACT.httpResourceNames]),
    );
    expect(snippetNames).toContain(LIGHT_EXTENSION_LEGACY_PROTOCOL_CONTRACT.aclSnippet);

    await plugin.afterDisable();
  });

  it('keeps the legacy CLI topic, API module, commands, SDK package, and SDK subpaths present', () => {
    const cliPackage = readJsonObject(path.join(repositoryRoot, 'packages/core/cli/package.json'));
    const cliOclif = requireObject(cliPackage.oclif, 'CLI oclif configuration');
    const cliTopics = requireObject(cliOclif.topics, 'CLI topics');
    const apiConfig = readJsonObject(path.join(repositoryRoot, 'packages/core/cli/nocobase-ctl.config.json'));
    const apiModules = requireObject(apiConfig.modules, 'API modules');
    const sdkPackage = readJsonObject(path.join(repositoryRoot, 'packages/core/light-extension-sdk/package.json'));
    const sdkExports = requireObject(sdkPackage.exports, 'SDK exports');

    expect(cliTopics).toHaveProperty(LIGHT_EXTENSION_LEGACY_PROTOCOL_CONTRACT.cli.topic);
    expect(apiModules).toHaveProperty(LIGHT_EXTENSION_LEGACY_PROTOCOL_CONTRACT.cli.apiModule);
    expect(cliTopics).toHaveProperty('js-template');
    expect(apiModules).toHaveProperty('js-template');
    for (const command of LIGHT_EXTENSION_LEGACY_PROTOCOL_CONTRACT.cli.commands) {
      expect(
        existsSync(path.join(repositoryRoot, `packages/core/cli/src/commands/light/${command}.ts`)),
        `nb light ${command}`,
      ).toBe(true);
      expect(
        existsSync(path.join(repositoryRoot, `packages/core/cli/src/commands/js-template/${command}.ts`)),
        `nb js-template ${command}`,
      ).toBe(true);
    }
    expect(sdkPackage.name).toBe(LIGHT_EXTENSION_LEGACY_PROTOCOL_CONTRACT.sdk.packageName);
    expect(Object.keys(sdkExports)).toEqual([...LIGHT_EXTENSION_LEGACY_PROTOCOL_CONTRACT.sdk.exportSubpaths]);
  });
});

function readJsonObject(filePath: string): Record<string, unknown> {
  return requireObject(JSON.parse(readFileSync(filePath, 'utf8')) as unknown, filePath);
}

function requireObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function listSourceFiles(directory: string): string[] {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : listSourceFiles(entryPath);
    }
    return /\.(?:js|ts)$/u.test(entry.name) ? [entryPath] : [];
  });
}
