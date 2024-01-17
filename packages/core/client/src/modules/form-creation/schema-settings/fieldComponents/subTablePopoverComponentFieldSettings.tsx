import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { fieldComponent } from './utils';

export const subTablePopoverComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:SubTable',
  items: [fieldComponent],
});
