import { registerValidateFormats } from '@formily/core';

export * from './ConfigurationTable';
export * from './components';
export * from './CollectionFieldsTable';
export * from './schemas/collections';
export * from './ConfigurationTabs';
export * from './AddCategoryAction';
export * from './EditCategoryAction';
export * from './components/FieldSummary';
export * from './components/TemplateSummary';
export * from './components/CollectionFieldInterfaceTag';
export * from './components/CollectionCategory';
export * from './components/CollectionTemplateTag';

registerValidateFormats({
  uid: /^[a-zA-Z][a-zA-Z0-9_-]*$/,
});
