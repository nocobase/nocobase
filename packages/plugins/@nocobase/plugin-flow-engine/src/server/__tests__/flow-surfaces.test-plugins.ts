/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';

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
  'calendar',
  'map',
  'data-visualization',
  'comments',
  'action-bulk-edit',
  'action-bulk-update',
  'action-export',
  'action-import',
  'action-duplicate',
  'workflow',
  'workflow-approval',
  'workflow-custom-action-trigger',
  'email-manager',
  'action-template-print',
] as const;

const FLOW_SURFACES_APPROVAL_REAL_PLUGIN_ALIASES = [
  'notification-manager',
  'notification-in-app-message',
  'workflow',
  'workflow-approval',
] as const;

const FLOW_SURFACES_APPROVAL_REAL_PLUGIN_ALIAS_SET = new Set<string>(FLOW_SURFACES_APPROVAL_REAL_PLUGIN_ALIASES);
const FLOW_SURFACES_APPROVAL_BLUEPRINT_REAL_PLUGIN_ALIASES = [
  'notification-manager',
  'notification-in-app-message',
  'workflow',
] as const;
const FLOW_SURFACES_APPROVAL_BLUEPRINT_REAL_PLUGIN_ALIAS_SET = new Set<string>(
  FLOW_SURFACES_APPROVAL_BLUEPRINT_REAL_PLUGIN_ALIASES,
);

const FLOW_SURFACES_MINIMAL_TEST_PLUGIN_SET = new Set<string>(FLOW_SURFACES_MINIMAL_TEST_PLUGINS);

function toFlowSurfacesStubClassName(pluginAlias: string) {
  return `FlowSurfaces${pluginAlias
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')}PluginStub`;
}

class FlowSurfacesExternalPluginStub extends Plugin {
  /**
   * These stubs exist only to satisfy flowSurfaces capability gating in tests.
   * They should never try to load real plugin files from disk, otherwise CI can
   * fail when optional plugin packages are not linked into NODE_MODULES_PATH.
   */
  async loadCollections() {}

  async loadAI() {}

  async loadMigrations() {
    return { beforeLoad: [], afterSync: [], afterLoad: [] };
  }

  async createFileRecord(options: any = {}) {
    return {
      title: options?.values?.title || 'flow-surfaces-stub-file',
      filename: 'flow-surfaces-stub-file.png',
      extname: options?.values?.extname || '.png',
      mimetype: options?.values?.mimetype || 'image/png',
      url: '/flow-surfaces-stub-file.png',
    };
  }
}

function createFlowSurfacesExternalPluginStub(pluginAlias: string) {
  const packageName = `@nocobase/plugin-${pluginAlias}`;
  const StubPlugin = class extends FlowSurfacesExternalPluginStub {
    constructor(app: any, options?: any) {
      super(app, {
        ...options,
        packageName,
      });
    }
  };
  Object.defineProperty(StubPlugin, 'name', {
    value: toFlowSurfacesStubClassName(pluginAlias),
  });

  return [
    StubPlugin,
    {
      name: pluginAlias,
    },
  ] as const;
}

export const FLOW_SURFACES_TEST_PLUGIN_INSTALLS = [
  ...FLOW_SURFACES_MINIMAL_TEST_PLUGINS,
  ...FLOW_SURFACES_TEST_PLUGINS.filter((pluginAlias) => !FLOW_SURFACES_MINIMAL_TEST_PLUGIN_SET.has(pluginAlias)).map(
    createFlowSurfacesExternalPluginStub,
  ),
];

export const FLOW_SURFACES_APPROVAL_TEST_ENABLED_PLUGIN_ALIASES = Array.from(
  new Set([...FLOW_SURFACES_TEST_PLUGINS, ...FLOW_SURFACES_APPROVAL_REAL_PLUGIN_ALIASES]),
);

export const FLOW_SURFACES_APPROVAL_TEST_PLUGIN_INSTALLS = [
  ...FLOW_SURFACES_TEST_PLUGIN_INSTALLS.filter((pluginInstall) => {
    if (!Array.isArray(pluginInstall)) {
      return true;
    }
    const pluginName = typeof pluginInstall[1]?.name === 'string' ? pluginInstall[1].name : '';
    return !FLOW_SURFACES_APPROVAL_REAL_PLUGIN_ALIAS_SET.has(pluginName);
  }),
  ...FLOW_SURFACES_APPROVAL_REAL_PLUGIN_ALIASES,
] as const;

export const FLOW_SURFACES_APPROVAL_BLUEPRINT_TEST_PLUGIN_INSTALLS = [
  ...FLOW_SURFACES_TEST_PLUGIN_INSTALLS.filter((pluginInstall) => {
    if (!Array.isArray(pluginInstall)) {
      return true;
    }
    const pluginName = typeof pluginInstall[1]?.name === 'string' ? pluginInstall[1].name : '';
    return !FLOW_SURFACES_APPROVAL_BLUEPRINT_REAL_PLUGIN_ALIAS_SET.has(pluginName);
  }),
  ...FLOW_SURFACES_APPROVAL_BLUEPRINT_REAL_PLUGIN_ALIASES,
] as const;
