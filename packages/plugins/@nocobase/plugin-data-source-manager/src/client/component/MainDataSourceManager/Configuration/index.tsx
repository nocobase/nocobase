import { registerValidateFormats } from '@formily/core';
export * from './ConfigurationTable';
export * from './CollectionFieldsTable';
export * from './schemas/collections';
export * from './ConfigurationTabs';
export * from './AddCategoryAction';
export * from './EditCategoryAction';

registerValidateFormats({
  uid: /^[a-zA-Z][a-zA-Z0-9_-]*$/,
});
