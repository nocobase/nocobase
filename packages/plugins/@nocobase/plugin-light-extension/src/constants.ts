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
} from '@nocobase/light-extension-sdk/schema';

export const NAMESPACE = '@nocobase/plugin-light-extension';
export const LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT = 'light-extension.runtime-artifact.v1';
export const LIGHT_EXTENSION_SETTINGS_KEY = 'light-extension';
export const LIGHT_EXTENSION_ACL_SNIPPET = 'pm.light-extension';

export const LIGHT_EXTENSION_OWNER_TYPE = 'light-extension';

export const LIGHT_EXTENSION_SUPPORTED_KINDS = ['js-block', 'js-field', 'js-action', 'js-item', 'runjs'] as const;
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
