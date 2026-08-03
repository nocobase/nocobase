/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  JS_TEMPLATE_ACTION_FULL_SOURCE_FIELD,
  JS_TEMPLATE_ACTION_SETTINGS_STEP_FIELD,
  JS_TEMPLATE_BLOCK_FULL_SOURCE_FIELD,
  JS_TEMPLATE_BLOCK_SETTINGS_STEP_FIELD,
  JS_TEMPLATE_FIELD_FULL_SOURCE_FIELD,
  JS_TEMPLATE_FIELD_SETTINGS_STEP_FIELD,
  JS_TEMPLATE_ITEM_FULL_SOURCE_FIELD,
  JS_TEMPLATE_ITEM_SETTINGS_STEP_FIELD,
  JS_TEMPLATE_PAGE_FULL_SOURCE_FIELD,
  JS_TEMPLATE_PAGE_SETTINGS_STEP_FIELD,
  RunJSEditorRegistry,
  RunJSSourceResolverRegistry,
} from '@nocobase/client-v2';
import { runJSStudioToolbarRegistry } from '@nocobase/runjs-workspace/client-v2';
import type React from 'react';

import type { ApiClientLike } from './api/lightExtensionEntriesRequests';
import {
  JSActionLightExtensionSourceField,
  JSBlockLightExtensionSourceField,
  JSFieldLightExtensionSourceField,
  JSItemLightExtensionSourceField,
  JSPageLightExtensionSourceField,
} from './components/JSBlockLightExtensionSourceField';
import { createJsTemplateRunJSEditorProvider } from './components/RunJSLightExtensionEditorProvider';
import { createMoveSourceToJsTemplateContribution } from './components/MoveSourceToLightExtension';
import { SettingsSingleField } from './components/SettingsAutoForm';
import { registerJsTemplateModelMenus } from './modelMenu/registerLightExtensionModelMenus';
import { createJsTemplateRunJSResolver } from './resolvers/LightExtensionRunJSResolver';

export type JsTemplateFlowSettingsRegistry = {
  components?: Record<string, React.ElementType | undefined>;
  registerComponents: (components: Record<string, React.ElementType>, options?: { warnOnOverwrite?: boolean }) => void;
};

export function createJsTemplateRunJSFlowSettingsComponents(): Record<string, React.ElementType> {
  return {
    [JS_TEMPLATE_ACTION_FULL_SOURCE_FIELD]: JSActionLightExtensionSourceField,
    [JS_TEMPLATE_ACTION_SETTINGS_STEP_FIELD]: SettingsSingleField,
    [JS_TEMPLATE_BLOCK_FULL_SOURCE_FIELD]: JSBlockLightExtensionSourceField,
    [JS_TEMPLATE_BLOCK_SETTINGS_STEP_FIELD]: SettingsSingleField,
    [JS_TEMPLATE_FIELD_FULL_SOURCE_FIELD]: JSFieldLightExtensionSourceField,
    [JS_TEMPLATE_FIELD_SETTINGS_STEP_FIELD]: SettingsSingleField,
    [JS_TEMPLATE_ITEM_FULL_SOURCE_FIELD]: JSItemLightExtensionSourceField,
    [JS_TEMPLATE_ITEM_SETTINGS_STEP_FIELD]: SettingsSingleField,
    [JS_TEMPLATE_PAGE_FULL_SOURCE_FIELD]: JSPageLightExtensionSourceField,
    [JS_TEMPLATE_PAGE_SETTINGS_STEP_FIELD]: SettingsSingleField,
  };
}

export function registerJsTemplateRunJSFlowSettingsComponents(
  flowSettings: JsTemplateFlowSettingsRegistry,
): () => void {
  const components = createJsTemplateRunJSFlowSettingsComponents();
  const registeredComponents = flowSettings.components;
  if (!registeredComponents) {
    flowSettings.registerComponents(components, { warnOnOverwrite: false });
    return () => undefined;
  }
  const previousComponents = new Map(
    Object.keys(components).map((name) => [
      name,
      {
        exists: Object.prototype.hasOwnProperty.call(registeredComponents, name),
        value: registeredComponents[name],
      },
    ]),
  );
  flowSettings.registerComponents(components, { warnOnOverwrite: false });

  return () => {
    for (const [name, component] of Object.entries(components)) {
      if (registeredComponents[name] !== component) {
        continue;
      }
      const previous = previousComponents.get(name);
      if (previous?.exists) {
        registeredComponents[name] = previous.value;
      } else {
        delete registeredComponents[name];
      }
    }
  };
}

export function installJsTemplateRunJSIntegrations(api?: ApiClientLike): () => void {
  const disposers: Array<() => void> = [];
  try {
    if (api) {
      disposers.push(RunJSSourceResolverRegistry.registerResolver(createJsTemplateRunJSResolver(api)));
    }
    disposers.push(RunJSEditorRegistry.registerProvider(createJsTemplateRunJSEditorProvider()));
    if (api) {
      disposers.push(runJSStudioToolbarRegistry.register(createMoveSourceToJsTemplateContribution(api)));
      disposers.push(registerJsTemplateModelMenus(api));
    }
  } catch (error) {
    disposeJsTemplateRunJSIntegrations(disposers);
    throw error;
  }

  return () => disposeJsTemplateRunJSIntegrations(disposers);
}

function disposeJsTemplateRunJSIntegrations(disposers: Array<() => void>): void {
  while (disposers.length) {
    disposers.pop()?.();
  }
}

export const createLightExtensionRunJSFlowSettingsComponents = createJsTemplateRunJSFlowSettingsComponents;
export const registerLightExtensionRunJSFlowSettingsComponents = registerJsTemplateRunJSFlowSettingsComponents;
export const installLightExtensionRunJSIntegrations = installJsTemplateRunJSIntegrations;
