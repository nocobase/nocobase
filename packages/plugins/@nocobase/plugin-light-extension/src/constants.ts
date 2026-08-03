/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  LIGHT_EXTENSION_ENTRY_KEY_PATTERN as LIGHT_EXTENSION_ENTRY_KEY_PATTERN_SOURCE,
  LIGHT_EXTENSION_ENTRY_SCHEMA_URI,
  LIGHT_EXTENSION_ENTRY_SCHEMA_VERSION,
} from '@nocobase/js-template-sdk/schema';

/** Product metadata only. User-visible text must still use the i18n layer. */
export const JS_TEMPLATES_CANONICAL_PRODUCT_NAME = 'JS templates';
export const JS_TEMPLATES_CANONICAL_PRODUCT_NAME_ZH_CN = 'JS 模板';

/**
 * Compatibility baseline for the product now named JS templates. These legacy values remain canonical persisted
 * tokens. Do not rename them or rewrite saved FlowModels and repositories as part of product-copy migrations.
 */
export const LIGHT_EXTENSION_LEGACY_PERSISTENCE_CONTRACT = {
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
  // Duplicated intentionally to keep shared client constants free of the server-capable runjs-workspace barrel.
  // The migration contract test asserts equality with LIGHT_EXTENSION_PERSISTED_VSC_OWNER_TYPE.
  vscOwnerType: 'light-extension',
} as const;

/**
 * Legacy public protocol surface retained during and after the JS templates product rename. New names must be
 * additive aliases until an explicit compatibility review proves every external consumer can migrate.
 */
export const LIGHT_EXTENSION_LEGACY_PROTOCOL_CONTRACT = {
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
} as const;

export const NAMESPACE = LIGHT_EXTENSION_LEGACY_PROTOCOL_CONTRACT.packageName;
export const LIGHT_EXTENSION_SOURCE_MODE = LIGHT_EXTENSION_LEGACY_PERSISTENCE_CONTRACT.sourceMode;
export const LIGHT_EXTENSION_SOURCE_BINDING_TYPE = LIGHT_EXTENSION_LEGACY_PERSISTENCE_CONTRACT.sourceBindingType;
export const LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT =
  LIGHT_EXTENSION_LEGACY_PROTOCOL_CONTRACT.runtimeArtifactContract;
export const LIGHT_EXTENSION_SETTINGS_KEY = LIGHT_EXTENSION_LEGACY_PROTOCOL_CONTRACT.settingsKey;
export const LIGHT_EXTENSION_ACL_SNIPPET = LIGHT_EXTENSION_LEGACY_PROTOCOL_CONTRACT.aclSnippet;

export const LIGHT_EXTENSION_OWNER_TYPE = LIGHT_EXTENSION_LEGACY_PERSISTENCE_CONTRACT.vscOwnerType;

export const LIGHT_EXTENSION_SUPPORTED_KINDS = ['js-block', 'js-page', 'js-field', 'js-action', 'js-item'] as const;
export const LIGHT_EXTENSION_ENTRY_KEY_PATTERN = new RegExp(LIGHT_EXTENSION_ENTRY_KEY_PATTERN_SOURCE);
export { LIGHT_EXTENSION_ENTRY_SCHEMA_VERSION };
export const LIGHT_EXTENSION_ENTRY_SCHEMA_URL = LIGHT_EXTENSION_ENTRY_SCHEMA_URI;
export const LIGHT_EXTENSION_ENTRY_DESCRIPTOR_FILE = 'entry.json';
export const LIGHT_EXTENSION_ENTRY_DESCRIPTOR_MAX_BYTES = 128 * 1024;

export const LIGHT_EXTENSION_ACL_ACTIONS = [
  'list',
  'readSource',
  'readArchivedSource',
  'readReferences',
  'writeSource',
  'create',
  'changeLifecycle',
  'delete',
  'archive',
  'compilePreview',
  'updateReferences',
  'manageSyncSource',
  'pullFromSyncSource',
  'pushToSyncSource',
] as const;

export const LIGHT_EXTENSION_REPO_LIFECYCLE_STATUSES = ['enabled', 'disabled', 'archived'] as const;
export const LIGHT_EXTENSION_REPO_HEALTH_STATUSES = ['pending', 'ready'] as const;
export const LIGHT_EXTENSION_ENTRY_HEALTH_STATUSES = ['ready', 'missing'] as const;
export const LIGHT_EXTENSION_REFERENCE_RESOLVED_STATUSES = [
  'active',
  'binding_outdated',
  'repo_missing',
  'repo_disabled',
  'repo_archived',
  'entry_missing',
  'owner_missing',
  'settings_invalid',
  'runtime_missing',
] as const;

export type LightExtensionAclAction = (typeof LIGHT_EXTENSION_ACL_ACTIONS)[number];
export type LightExtensionKind = (typeof LIGHT_EXTENSION_SUPPORTED_KINDS)[number];
