/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  JS_TEMPLATE_KEY_PATTERN as JS_TEMPLATE_KEY_PATTERN_SOURCE,
  JS_TEMPLATE_SCHEMA_URI,
  JS_TEMPLATE_SCHEMA_VERSION,
} from '@nocobase/js-template-sdk/schema';

/** Product metadata only. User-visible text must still use the i18n layer. */
export const JS_TEMPLATES_PRODUCT_NAME = 'JS templates';
export const JS_TEMPLATES_PRODUCT_NAME_ZH_CN = 'JS 模板';

export const JS_TEMPLATE_COLLECTIONS = {
  projects: 'jsTemplateProjects',
  templates: 'jsTemplates',
  usages: 'jsTemplateUsages',
  artifacts: 'jsTemplateArtifacts',
  logs: 'jsTemplateLogs',
  sourceOperations: 'jsTemplateSourceOperations',
  createJobs: 'jsTemplateCreateJobs',
} as const;

export const JS_TEMPLATE_COLLECTION_NAMES = [
  JS_TEMPLATE_COLLECTIONS.projects,
  JS_TEMPLATE_COLLECTIONS.templates,
  JS_TEMPLATE_COLLECTIONS.usages,
  JS_TEMPLATE_COLLECTIONS.artifacts,
  JS_TEMPLATE_COLLECTIONS.logs,
  JS_TEMPLATE_COLLECTIONS.sourceOperations,
  JS_TEMPLATE_COLLECTIONS.createJobs,
] as const;

export const NAMESPACE = '@nocobase/plugin-js-template';
export const JS_TEMPLATE_SOURCE_MODE = 'js-template' as const;
export const JS_TEMPLATE_SOURCE_BINDING_TYPE = 'js-template-entry' as const;
export const JS_TEMPLATE_ARTIFACT_CONTRACT = 'js-template.artifact.v1' as const;
export const JS_TEMPLATE_RUNTIME_SURFACE_CONTRACT = 'js-template.runtime-surface.v1' as const;
export const JS_TEMPLATE_SETTINGS_KEY = 'js-templates' as const;
export const JS_TEMPLATE_ACL_SNIPPET = 'pm.js-template' as const;
export const JS_TEMPLATE_OWNER_TYPE = 'js-template' as const;
export const JS_TEMPLATE_ERROR_CODE_PREFIX = 'JS_TEMPLATE_' as const;

export const JS_TEMPLATE_SUPPORTED_KINDS = ['js-block', 'js-page', 'js-field', 'js-action', 'js-item'] as const;
export const JS_TEMPLATE_KEY_PATTERN = new RegExp(JS_TEMPLATE_KEY_PATTERN_SOURCE);
export { JS_TEMPLATE_SCHEMA_VERSION };
export const JS_TEMPLATE_SCHEMA_URL = JS_TEMPLATE_SCHEMA_URI;
export const JS_TEMPLATE_DESCRIPTOR_FILE = 'entry.json';
export const JS_TEMPLATE_DESCRIPTOR_MAX_BYTES = 128 * 1024;

export const JS_TEMPLATE_ACL_ACTIONS = [
  'list',
  'readSource',
  'readArchivedSource',
  'readUsages',
  'writeSource',
  'create',
  'changeLifecycle',
  'delete',
  'archive',
  'compilePreview',
  'updateUsages',
  'manageSyncSource',
  'pullFromSyncSource',
  'pushToSyncSource',
] as const;

export const JS_TEMPLATE_PROJECT_LIFECYCLE_STATUSES = ['enabled', 'disabled', 'archived'] as const;
export const JS_TEMPLATE_PROJECT_HEALTH_STATUSES = ['pending', 'ready'] as const;
export const JS_TEMPLATE_HEALTH_STATUSES = ['ready', 'missing'] as const;
export const JS_TEMPLATE_USAGE_RESOLVED_STATUSES = [
  'active',
  'binding_outdated',
  'project_missing',
  'project_disabled',
  'project_archived',
  'template_missing',
  'owner_missing',
  'settings_invalid',
  'runtime_missing',
] as const;

export type JsTemplateAclAction = (typeof JS_TEMPLATE_ACL_ACTIONS)[number];
export type JsTemplateKind = (typeof JS_TEMPLATE_SUPPORTED_KINDS)[number];
