/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/client-v2';
import {
  JS_BLOCK_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  Plugin,
  RunJSSourceResolverRegistry,
  registerBlockGridSelectSceneAddBlockProvider,
} from '@nocobase/client-v2';

import { LIGHT_EXTENSION_ACL_SNIPPET, LIGHT_EXTENSION_SETTINGS_KEY } from '../constants';
import { createLightExtensionJSBlockAddItems } from './add-block/lightExtensionJsBlockItems';
import { JSBlockLightExtensionSourceField } from './components/JSBlockLightExtensionSourceField';
import { RepoEntryPublicationSelector } from './components/RepoEntryPublicationSelector';
import { SettingsAutoForm } from './components/SettingsAutoForm';
import { VersionPolicyField } from './components/VersionPolicyField';
import { createLightExtensionRunJSResolver } from './resolvers/LightExtensionRunJSResolver';

let activeLightExtensionClientV2Instance: PluginLightExtensionClientV2 | null = null;

export class PluginLightExtensionClientV2 extends Plugin<Record<string, never>, Application> {
  private readonly disposers: Array<() => void> = [];

  async beforeLoad() {
    activeLightExtensionClientV2Instance?.dispose();
    this.dispose();
  }

  async load() {
    this.flowEngine.flowSettings.registerComponents({
      [JS_BLOCK_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: JSBlockLightExtensionSourceField,
      RepoEntryPublicationSelector,
      SettingsAutoForm,
      VersionPolicyField,
    });
    this.disposers.push(
      RunJSSourceResolverRegistry.registerResolver(createLightExtensionRunJSResolver(this.app.apiClient)),
    );
    this.disposers.push(
      registerBlockGridSelectSceneAddBlockProvider('light-extension-js-blocks', createLightExtensionJSBlockAddItems),
    );
    activeLightExtensionClientV2Instance = this;

    const title = this.t('Light extensions');

    this.pluginSettingsManager.addMenuItem({
      key: LIGHT_EXTENSION_SETTINGS_KEY,
      title,
      icon: 'CodeOutlined',
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: LIGHT_EXTENSION_SETTINGS_KEY,
      key: 'index',
      title,
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
      componentLoader: () => import('./pages/LightExtensionListPage'),
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: LIGHT_EXTENSION_SETTINGS_KEY,
      key: 'source',
      title: this.t('Source'),
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
      componentLoader: () => import('./pages/LightExtensionWorkspacePage'),
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: LIGHT_EXTENSION_SETTINGS_KEY,
      key: 'entries',
      title: this.t('Entries'),
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
      componentLoader: () => import('./pages/LightExtensionEntriesPage'),
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: LIGHT_EXTENSION_SETTINGS_KEY,
      key: 'publications',
      title: this.t('Publications'),
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
      componentLoader: () => import('./pages/LightExtensionPublicationsPage'),
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: LIGHT_EXTENSION_SETTINGS_KEY,
      key: 'references',
      title: this.t('References'),
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
      componentLoader: () => import('./pages/EntryReferencesPanel'),
    });
  }

  dispose() {
    while (this.disposers.length) {
      this.disposers.pop()?.();
    }
    if (activeLightExtensionClientV2Instance === this) {
      activeLightExtensionClientV2Instance = null;
    }
  }
}

export default PluginLightExtensionClientV2;
