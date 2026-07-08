/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const NAMESPACE = '@nocobase/plugin-light-extension';
export const LIGHT_EXTENSION_SETTINGS_KEY = 'light-extension';
export const LIGHT_EXTENSION_ACL_SNIPPET = 'pm.light-extension';

export const LIGHT_EXTENSION_OWNER_TYPE = 'light-extension';

export const LIGHT_EXTENSION_SUPPORTED_KINDS = [
  'js-block',
  'js-field',
  'js-action',
  'js-item',
  'runjs',
  'event',
] as const;
export const LIGHT_EXTENSION_ENABLED_KINDS = ['js-block', 'js-field', 'js-action', 'js-item'] as const;

export const LIGHT_EXTENSION_ACL_ACTIONS = [
  'list',
  'readSource',
  'readArchivedSource',
  'readPublication',
  'usePublication',
  'readReferences',
  'writeSource',
  'create',
  'updateMeta',
  'changeLifecycle',
  'delete',
  'archive',
  'scan',
  'compilePreview',
  'publish',
  'activatePublication',
  'emergencyRollback',
  'updateReferences',
  'viewLogs',
  'sync',
] as const;

export const LIGHT_EXTENSION_REPO_LIFECYCLE_STATUSES = ['enabled', 'disabled', 'archived'] as const;
export const LIGHT_EXTENSION_REPO_HEALTH_STATUSES = ['draft', 'ready', 'partial_failed', 'scan_failed'] as const;
export const LIGHT_EXTENSION_ENTRY_HEALTH_STATUSES = ['ready', 'failed', 'missing', 'disabled'] as const;
export const LIGHT_EXTENSION_REFERENCE_RESOLVED_STATUSES = [
  'active',
  'binding_outdated',
  'repo_missing',
  'repo_disabled',
  'repo_archived',
  'entry_missing',
  'publication_missing',
  'owner_missing',
  'settings_invalid',
  'no_active_publication',
] as const;

export type LightExtensionAclAction = (typeof LIGHT_EXTENSION_ACL_ACTIONS)[number];
export type LightExtensionKind = (typeof LIGHT_EXTENSION_SUPPORTED_KINDS)[number];
