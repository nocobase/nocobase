/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// 解决 build 报 dayjs 相关类型错误的问题
import 'dayjs/plugin/isBetween';
import 'dayjs/plugin/isSameOrAfter';
import 'dayjs/plugin/isSameOrBefore';
import 'dayjs/plugin/isoWeek';
import 'dayjs/plugin/localeData';
import 'dayjs/plugin/quarterOfYear';
import 'dayjs/plugin/utc';
import 'dayjs/plugin/weekday';

// 重置浏览器样式
import 'antd/dist/reset.css';
import './global.less';

export * from '@emotion/css';
export * from './acl';
export * from './antd-config-provider';
export * from './api-client';
export * from './appInfo';
export * from './application';
export * from './async-data-provider';
export * from './block-provider';
export * from './collection-manager';

export * from './common';
export * from './css-variable';
export * from './data-source';
export * from './document-title';
export * from './filter-provider';
export * from './flag-provider';
export * from './global-theme';
export * from './hooks';
export * from './i18n';
export * from './icon';
export * from './lazy-helper';
export { default as locale } from './locale';
export * from './nocobase-buildin-plugin';
export * from './plugin-manager';
export * from './pm';
export * from './powered-by';
export * from './record-provider';
export * from './route-switch';
export * from './schema-component';
export * from './schema-initializer';
export * from './schema-items';
export * from './schema-settings';
export * from './schema-templates';
export * from './style';
export * from './system-settings';
export * from './testUtils';
export * from './user';
export * from './variables';

export { withDynamicSchemaProps } from './hoc/withDynamicSchemaProps';
export { withSkeletonComponent } from './hoc/withSkeletonComponent';
export { SwitchLanguage } from './i18n/SwitchLanguage';
export { SchemaSettingsActionLinkItem } from './modules/actions/link/customizeLinkActionSettings';
export { getVariableComponentWithScope, useURLAndHTMLSchema } from './modules/actions/link/useURLAndHTMLSchema';
export * from './modules/blocks/BlockSchemaToolbar';
export * from './modules/blocks/data-blocks/form';
export * from './modules/blocks/data-blocks/table';
export * from './modules/blocks/data-blocks/table-selector';
export * from './modules/blocks/index';
export * from './modules/blocks/useParentRecordCommon';
export { getPageMenuSchema, useInsertPageSchema } from './modules/menu/PageMenuItem';
export { OpenModeProvider, useOpenModeContext } from './modules/popup/OpenModeProvider';
export { PopupContextProvider } from './modules/popup/PopupContextProvider';
export { usePopupUtils } from './modules/popup/usePopupUtils';
export { VariablePopupRecordProvider } from './modules/variable/variablesProvider/VariablePopupRecordProvider';

export { showFileName } from './modules/fields/component/FileManager/fileManagerComponentFieldSettings';
export { useCurrentPopupRecord } from './modules/variable/variablesProvider/VariablePopupRecordProvider';
export { fileSizeSetting } from './modules/fields/component/FileManager/fileManagerComponentFieldSettings';

export { languageCodes } from './locale';

// Override Formily API
export {
  CollectionFieldUISchemaProvider,
  IsInNocoBaseRecursionFieldContext,
  NocoBaseRecursionField,
  RefreshComponentProvider,
  useRefreshFieldSchema,
} from './formily/NocoBaseRecursionField';
