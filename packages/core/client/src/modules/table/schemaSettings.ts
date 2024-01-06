import { SchemaSettings } from '../../application';
import { SchemaSettingsBlockTitleItem } from '../../schema-settings';

export const tableBlockSettings = new SchemaSettings({
  name: 'tableBlockSettings',
  items: [
    {
      name: 'editBlockTitle',
      Component: SchemaSettingsBlockTitleItem,
    },
  ],
});
