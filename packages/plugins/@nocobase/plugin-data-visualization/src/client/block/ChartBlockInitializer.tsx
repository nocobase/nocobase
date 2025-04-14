/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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

const commonOptions = {
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
};

/**
 * @deprecated
 * use `chartInitializers` instead
 */
export const chartInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'ChartInitializers',
  ...commonOptions,
});

export const chartInitializers = new CompatibleSchemaInitializer(
  {
    name: 'charts:addBlock',
    ...commonOptions,
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
          'x-component': 'ChartCardItem',
          'x-use-component-props': 'useChartBlockCardProps',
          'x-settings': 'chart:block',
          'x-decorator': 'ChartBlockProvider',
          properties: {
            actions: {
              type: 'void',
              'x-component': 'ActionBar',
              'x-component-props': {
                style: {
                  marginBottom: 'var(--nb-designer-offset)',
                },
              },
              'x-initializer': 'chartBlock:configureActions',
            },
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
