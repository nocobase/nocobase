import { registerValidateFormats } from '@formily/core';
import { exp } from 'mathjs';

export * from './AddFieldAction';
export * from './ConfigurationTable';
export * from './EditFieldAction';
export * from './interfaces';
export * from './components';
export * from './CollectionFieldsTable';
export * from './schemas/collections'
export * from './OverridingCollectionField'
export * from './ViewInheritedField'

registerValidateFormats({
  uid: /^[A-Za-z0-9][A-Za-z0-9_-]*$/,
});
