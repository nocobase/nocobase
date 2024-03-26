import { BarChartOutlined, LineChartOutlined } from '@ant-design/icons';
import { uid } from '@formily/shared';
import {
  CompatibleSchemaInitializer,
  DEFAULT_DATA_SOURCE_KEY,
  DataBlockInitializer,
  SchemaInitializerItem,
  useACLRoleContext,
  useSchemaInitializer,
  useSchemaInitializerItem,
} from '@nocobase/client';
import React, { useCallback, useContext } from 'react';
import { ChartConfigContext } from '../configure';
import { FilterBlockInitializer } from '../filter';
import { lang } from '../locale';

const ChartInitializer = () => {
  const { setVisible, setCurrent } = useContext(ChartConfigContext);
  const { parseAction } = useACLRoleContext();
  const itemConfig = useSchemaInitializerItem();
  const filter = useCallback(
    (item) => {
      const params = parseAction(`${item.name}:list`);
      return params;
    },
    [parseAction],
  );

  return (
    <DataBlockInitializer
      {...itemConfig}
      filter={filter}
      filterDataSource={(ds) => {
        return ds.key === DEFAULT_DATA_SOURCE_KEY || ds.getOptions().isDBInstance;
      }}
      icon={<BarChartOutlined />}
      componentType={'Chart'}
      onCreateBlockSchema={async ({ item }) => {
        setCurrent({
          schema: {},
          field: null,
          collection: item.name,
          dataSource: item.dataSource,
          service: null,
          data: undefined,
        });
        setVisible(true);
      }}
    />
  );
};

/**
 * @deprecated
 */
export const chartInitializers_deprecated = new CompatibleSchemaInitializer({
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

export const chartInitializers = new CompatibleSchemaInitializer(
  {
    name: 'charts:addBlock',
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
  },
  chartInitializers_deprecated,
);

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
              'x-initializer': 'charts:addBlock',
            },
          },
        });
      }}
    />
  );
};
