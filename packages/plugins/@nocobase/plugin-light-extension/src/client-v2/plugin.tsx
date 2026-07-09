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
  JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_ACTION_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
  JS_BLOCK_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_BLOCK_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
  JS_FIELD_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_FIELD_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
  JS_ITEM_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_ITEM_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
  Plugin,
  RunJSSourceResolverRegistry,
  RunJSEditorRegistry,
  registerBlockGridSelectSceneAddBlockProvider,
} from '@nocobase/client-v2';

import { LIGHT_EXTENSION_ACL_SNIPPET, LIGHT_EXTENSION_SETTINGS_KEY } from '../constants';
import { createLightExtensionJSBlockAddItems } from './add-block/lightExtensionJsBlockItems';
import {
  JSActionLightExtensionSourceField,
  JSBlockLightExtensionSourceField,
  JSFieldLightExtensionSourceField,
  JSItemLightExtensionSourceField,
  RunJSLightExtensionSourceField,
} from './components/JSBlockLightExtensionSourceField';
import { createRunJSLightExtensionEditorProvider } from './components/RunJSLightExtensionEditorProvider';
import { RepoEntryPublicationSelector } from './components/RepoEntryPublicationSelector';
import { SettingsAutoForm, SettingsSingleField } from './components/SettingsAutoForm';
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
      [JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: JSActionLightExtensionSourceField,
      [JS_ACTION_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]: SettingsSingleField,
      [JS_BLOCK_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: JSBlockLightExtensionSourceField,
      [JS_BLOCK_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]: SettingsSingleField,
      [JS_FIELD_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: JSFieldLightExtensionSourceField,
      [JS_FIELD_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]: SettingsSingleField,
      [JS_ITEM_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: JSItemLightExtensionSourceField,
      [JS_ITEM_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]: SettingsSingleField,
      RunJSLightExtensionSourceField,
      RepoEntryPublicationSelector,
      SettingsAutoForm,
      VersionPolicyField,
    });
    this.disposers.push(
      RunJSSourceResolverRegistry.registerResolver(createLightExtensionRunJSResolver(this.app.apiClient)),
    );
    this.disposers.push(RunJSEditorRegistry.registerProvider(createRunJSLightExtensionEditorProvider()));
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
      showTabs: false,
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: LIGHT_EXTENSION_SETTINGS_KEY,
      key: 'index',
      title,
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
      componentLoader: () => import('./pages/LightExtensionListPage'),
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
