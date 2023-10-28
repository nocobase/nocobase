import { LineChartOutlined } from '@ant-design/icons';
import { uid } from '@formily/shared';
import {
  SchemaInitializerItem,
  SchemaInitializer,
  useACLRoleContext,
  useSchemaInitializerMenuItems,
  useCollectionDataSourceItemsV2,
  useSchemaInitializer,
  useSchemaInitializerItem,
} from '@nocobase/client';
import React, { useContext } from 'react';
import { ChartConfigContext } from '../configure/ChartConfigure';
import { Menu } from 'antd';

const ConfigureButton = () => {
  const itemConfig = useSchemaInitializerItem();
  const { setVisible, setCurrent } = useContext(ChartConfigContext);
  return (
    <SchemaInitializerItem
      {...itemConfig}
      applyMenuStyle={false}
      onClick={() => {
        setCurrent({ schema: {}, field: null, collection: itemConfig?.name, service: null, data: undefined });
        setVisible(true);
      }}
    />
  );
};

const ItemsComponent = () => {
  const collections = useCollectionDataSourceItemsV2('Chart');
  const { allowAll, parseAction } = useACLRoleContext();
  const items: any = collections[0].children
    .filter((item) => {
      if (allowAll) {
        return true;
      }
      const params = parseAction(`${item.name}:list`);
      return params;
    })
    .map((item) => ({
      ...item,
      Component: ConfigureButton,
    }));

  const menuItems = useSchemaInitializerMenuItems(items);
  return <Menu items={menuItems} />;
};

export const chartInitializers = new SchemaInitializer({
  name: 'ChartInitializers',
  icon: 'PlusOutlined',
  popoverProps: {
    placement: 'bottomLeft',
  },
  title: '{{t("Add chart")}}',
  ItemsComponent: ItemsComponent,
});

export const ChartV2BlockInitializer: React.FC = () => {
  const itemConfig = useSchemaInitializerItem();
  const { insert } = useSchemaInitializer();
  return (
    <SchemaInitializerItem
      {...itemConfig}
      icon={<LineChartOutlined />}
      onClick={() => {
        insert({
          type: 'void',
          'x-component': 'CardItem',
          'x-designer': 'ChartV2BlockDesigner',
          properties: {
            [uid()]: {
              type: 'void',
              'x-component': 'Grid',
              'x-decorator': 'ChartV2Block',
              'x-initializer': 'ChartInitializers',
            },
          },
        });
      }}
    />
  );
};
