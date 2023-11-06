import { registerValidateFormats } from '@formily/core';

export * from './AddFieldAction';
export * from './ConfigurationTable';
export * from './EditFieldAction';
export * from './components';
export * from './templates';
export * from './CollectionFieldsTable';
export * from './schemas/collections';
export * from './OverridingCollectionField';
export * from './ViewInheritedField';
export * from './AddCollectionAction';
export * from './EditCollectionAction';
export * from './ConfigurationTabs';
export * from './AddCategoryAction';
export * from './EditCategoryAction';
export * from './SyncFieldsAction';
export * from './SyncSQLFieldsAction';

registerValidateFormats({
  uid: /^[A-Za-z0-9][A-Za-z0-9_-]*$/,
});
