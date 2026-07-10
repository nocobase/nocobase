/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import 'antd/dist/reset.css';

export * from './APIClient';
export * from './BaseApplication';
export * from './Application';
export * from './PinnedPluginListContext';
export * from './RouteRepository';
export * from './acl';
export * from './ai';
export * from './authRedirect';
export * from './components';
export * from './context';
export * from './theme';
export * from './MockApplication';
export * from './Plugin';
export * from './WebSocketClient';
export * from './RouterManager';
export * from './PluginManager';
export * from './PluginSettingsManager';
export * from './layout-manager';
export * from './hooks';
export { default as languageCodes } from './locale/languageCodes';
export * from './nocobase-buildin-plugin';
export * from './collection-field-interface/CollectionFieldInterface';
export * from './collection-field-interface/CollectionFieldInterfaceManager';
export * from './collection-manager/field-configure';
export * from './collection-manager/field-validation';
export * from './collection-manager/filter-operators';
export * from './collection-manager/interfaces';
export * from './collection-manager/template-fields';
export * from './data-source';
export * from './entry-actions';
export * from './flow';
export {
  RunJSSourceResolverError,
  RunJSSourceResolverRegistry,
  resolveRunJSSourceBinding,
  resolveRuntimeRunJS,
} from './flow/components/runjs-source';
export type {
  ResolvedRuntimeRunJS,
  ResolveRunJSSourceBindingInput,
  RuntimeRunJSInput,
  RunJSSourceBinding,
  RunJSSourceResolver,
  RunJSSourceResolverInput,
  RunJSSourceResolverResult,
  RunJSSourceSettingsDescriptor,
  RunJSSourceSettings,
} from './flow/components/runjs-source';
export {
  DEFAULT_DATA_SOURCE_KEY,
  IconPicker,
  isTitleField,
  isTitleFieldInterface,
  NocoBaseDesktopRouteType,
  useFullscreenOverlay,
} from './flow-compat';
export type { NocoBaseDesktopRoute } from './flow-compat';
export * from './utils/markdownSanitize';
export { default as AntdAppProvider } from './theme/AntdAppProvider';
