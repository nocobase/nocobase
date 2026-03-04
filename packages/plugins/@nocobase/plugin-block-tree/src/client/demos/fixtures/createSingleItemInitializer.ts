import { Grid, SchemaInitializerItemType } from '@nocobase/client';
import { SchemaInitializer } from '@nocobase/client';

export function createSingleItemInitializer(initializerItem: SchemaInitializerItemType) {
  return new SchemaInitializer({
    name: 'test',
    icon: 'SettingOutlined',
    wrap: Grid.wrap,
    title: 'Test',
    style: {
      marginLeft: 8,
    },
    items: [initializerItem],
  });
}
