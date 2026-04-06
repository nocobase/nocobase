/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const FLOW_SURFACES_CORE_TEST_PLUGINS = [
  'error-handler',
  'users',
  'auth',
  'client',
  'flow-engine',
  'field-sort',
  'acl',
  'ui-schema-storage',
  'data-source-main',
  'data-source-manager',
] as const;

export const FLOW_SURFACES_MINIMAL_TEST_PLUGINS = [...FLOW_SURFACES_CORE_TEST_PLUGINS, 'system-settings'] as const;

export const FLOW_SURFACES_TEST_PLUGINS = [
  ...FLOW_SURFACES_CORE_TEST_PLUGINS,
  'file-manager',
  'system-settings',
  'block-list',
  'block-grid-card',
  'block-markdown',
  'block-iframe',
  'block-workbench',
  'map',
  'data-visualization',
  'comments',
  'action-bulk-edit',
  'action-bulk-update',
  'action-export',
  'action-import',
  'action-duplicate',
  'workflow',
  'workflow-custom-action-trigger',
  'email-manager',
  'action-template-print',
] as const;
