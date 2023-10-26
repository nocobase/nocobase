import { LineChartOutlined } from '@ant-design/icons';
import { uid } from '@formily/shared';
import {
  SchemaInitializerItem,
  SchemaInitializerV2,
  useACLRoleContext,
  useSchemaInitializerMenuItems,
  useCollectionDataSourceItemsV2,
  useSchemaInitializerV2,
} from '@nocobase/client';
import React, { useContext } from 'react';
import { ChartConfigContext } from '../configure/ChartConfigure';
import { Menu } from 'antd';

const ConfigureButton = (props) => {
  const { setVisible, setCurrent } = useContext(ChartConfigContext);
  return (
    <SchemaInitializerItem
      {...props}
      applyMenuStyle={false}
      onClick={() => {
        setCurrent({ schema: {}, field: null, collection: props.item?.name, service: null, data: undefined });
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
      component: ConfigureButton,
    }));

  const menuItems = useSchemaInitializerMenuItems(items);
  return <Menu items={menuItems} />;
};

export const chartInitializers = new SchemaInitializerV2({
  name: 'ChartInitializers',
  icon: 'PlusOutlined',
  popoverProps: {
    placement: 'bottomLeft',
  },
  title: '{{t("Add chart")}}',
  ItemsComponent: ItemsComponent,
});

export const ChartV2BlockInitializer: React.FC = (props) => {
  const { insert } = useSchemaInitializerV2();
  return (
    <SchemaInitializerItem
      {...props}
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
