import { LineChartOutlined, BarChartOutlined } from '@ant-design/icons';
import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import {
  DataBlockInitializer,
  SchemaInitializer,
  useACLRoleContext,
  useCollectionDataSourceItems,
} from '@nocobase/client';
import React, { useContext } from 'react';
import { ChartConfigContext } from '../configure';
import { useChartsTranslation } from '../locale';
import { FilterBlockInitializer } from '../filter';

const ChartInitializer = (props: any) => {
  const { setVisible, setCurrent } = useContext(ChartConfigContext);
  const collections = useCollectionDataSourceItems('Chart');
  const { allowAll, parseAction } = useACLRoleContext();

  if (collections[0].loadChildren) {
    const originalLoadChildren = collections[0].loadChildren;
    collections[0].loadChildren = ({ searchValue }) => {
      const children = originalLoadChildren({ searchValue });
      return children.filter((item) => {
        if (allowAll) {
          return true;
        }
        const params = parseAction(`${item.name}:list`);
        return params;
      });
    };
  }
  return (
    <DataBlockInitializer
      {...props}
      items={collections}
      icon={<BarChartOutlined />}
      componentType={'Chart'}
      onCreateBlockSchema={async ({ item }) => {
        setCurrent({ schema: {}, field: null, collection: item.name, service: null, data: undefined });
        setVisible(true);
      }}
    />
  );
};

export const ChartInitializers = () => {
  const { t } = useChartsTranslation();

  return (
    <SchemaInitializer.Button
      data-testid="add-block-button-in-chart-block"
      title={t('Add block')}
      icon={'PlusOutlined'}
      items={[
        {
          key: 'chart',
          type: 'item',
          title: t('Chart'),
          component: ChartInitializer,
        },
        {
          type: 'itemGroup',
          title: t('Other blocks'),
          children: [
            {
              key: 'filter',
              type: 'item',
              title: t('Filter'),
              component: FilterBlockInitializer,
            },
          ],
        },
      ]}
    />
  );
};

export const ChartV2BlockInitializer: React.FC<{
  insert: (s: ISchema) => void;
}> = (props) => {
  const { insert } = props;
  return (
    <SchemaInitializer.Item
      {...props}
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
