import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { allowMultiple, fieldComponent } from './utils';

export const subformPopoverComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:PopoverNester',
  items: [fieldComponent, allowMultiple],
});
