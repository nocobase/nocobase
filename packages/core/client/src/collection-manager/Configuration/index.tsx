import { registerValidateFormats } from '@formily/core';

export * from './AddFieldAction';
export * from './ConfigurationTable';
export * from './EditFieldAction';

registerValidateFormats({
  uid: /^[A-Za-z0-9][A-Za-z0-9_-]*$/,
});
