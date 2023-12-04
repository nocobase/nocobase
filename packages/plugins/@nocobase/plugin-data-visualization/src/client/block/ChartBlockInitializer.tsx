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
  useMenuSearch,
} from '@nocobase/client';
import React, { useContext, useState } from 'react';
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
  const items: any = collections
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

  const [isOpenSubMenu, setIsOpenSubMenu] = useState(false);
  const searchedChildren = useMenuSearch(items, isOpenSubMenu, true);
  const menuItems = useSchemaInitializerMenuItems(searchedChildren);
  return (
    <Menu
      items={menuItems}
      onOpenChange={(keys) => {
        setIsOpenSubMenu(keys.length > 0);
      }}
    />
  );
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
          'x-component-props': {
            name: 'charts',
          },
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
