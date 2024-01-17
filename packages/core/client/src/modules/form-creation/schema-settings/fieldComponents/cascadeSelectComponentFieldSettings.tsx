import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { fieldComponent, titleField } from './utils';

export const cascadeSelectComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:CascadeSelect',
  items: [fieldComponent, titleField],
});
