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
export * from './DeleteCollectionAction';
export * from './AddSubFieldAction';
export * from './EditSubFieldAction';
export * from './components/FieldSummary';
export * from './components/TemplateSummary';
export * from './components/CollectionFieldInterface';
export * from './components/CollectionCategory';
export * from './components/CollectionTemplate';

registerValidateFormats({
  uid: /^[a-zA-Z][a-zA-Z0-9_-]*$/,
});
