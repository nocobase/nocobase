import { BarChartOutlined, LineChartOutlined } from '@ant-design/icons';
import { uid } from '@formily/shared';
import {
  DataBlockInitializer,
  SchemaInitializer,
  SchemaInitializerItem,
  useACLRoleContext,
  useCollectionDataSourceItemsV2,
  useSchemaInitializer,
  useSchemaInitializerItem,
} from '@nocobase/client';
import React, { useContext } from 'react';
import { ChartConfigContext } from '../configure';
import { FilterBlockInitializer } from '../filter';
import { lang } from '../locale';

const ChartInitializer = () => {
  const { setVisible, setCurrent } = useContext(ChartConfigContext);
  const collections = useCollectionDataSourceItemsV2('Chart');
  const { allowAll, parseAction } = useACLRoleContext();
  const itemConfig = useSchemaInitializerItem();

  const items = collections
    .filter((item) => {
      if (allowAll) {
        return true;
      }
      const params = parseAction(`${item.name}:list`);
      return params;
    })
    .map((item) => ({
      ...item,
    }));

  return (
    <DataBlockInitializer
      {...itemConfig}
      items={items}
      icon={<BarChartOutlined />}
      componentType={'Chart'}
      onCreateBlockSchema={async ({ item }) => {
        setCurrent({ schema: {}, field: null, collection: item.name, service: null, data: undefined });
        setVisible(true);
      }}
    />
  );
};

export const chartInitializers: SchemaInitializer = new SchemaInitializer({
  name: 'ChartInitializers',
  icon: 'PlusOutlined',
  title: '{{t("Add block")}}',
  items: [
    {
      name: 'chart',
      title: lang('Chart'),
      Component: ChartInitializer,
    },
    {
      name: 'otherBlocks',
      type: 'itemGroup',
      title: lang('Other blocks'),
      children: [
        {
          name: 'filter',
          title: lang('Filter'),
          Component: FilterBlockInitializer,
        },
      ],
    },
  ],
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
