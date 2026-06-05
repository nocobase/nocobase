import { CollectionFieldsToFormInitializerItems, Grid, SchemaInitializer } from '@nocobase/client';
import { StepsFormName } from '../../constants';
import { tStr } from '../../locale';

export const configureFieldsInitializer = new SchemaInitializer({
  name: `${StepsFormName}:configureFields`,
  icon: 'SettingOutlined',
  wrap: Grid.wrap,
  title: tStr('Configure fields'),
  items: [
    {
      name: 'collectionFields',
      Component: CollectionFieldsToFormInitializerItems,
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'addText',
      title: tStr('Add text'),
      Component: 'MarkdownFormItemInitializer',
    },
  ],
});
