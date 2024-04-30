/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { registerValidateFormats } from '@formily/core';

export * from './AddFieldAction';
export * from './EditFieldAction';
export * from './components';
export * from './OverridingCollectionField';
export * from './ViewInheritedField';
export * from './AddCollectionAction';
export * from './EditCollectionAction';
export * from './SyncFieldsAction';
export * from './SyncSQLFieldsAction';
export * from './DeleteCollectionAction';
export * from './AddSubFieldAction';
export * from './EditSubFieldAction';
export * from './components/FieldSummary';
export * from './components/TemplateSummary';
export * from './components/CollectionFieldInterfaceTag';
export * from './components/CollectionCategory';
export * from './components/CollectionTemplateTag';

registerValidateFormats({
  uid: /^[a-zA-Z][a-zA-Z0-9_-]*$/,
});
