import { LineChartOutlined } from '@ant-design/icons';
import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { SchemaInitializer, useACLRoleContext, useCollectionDataSourceItems } from '@nocobase/client';
import React, { useContext } from 'react';
import { ChartConfigContext } from '../configure/ChartConfigure';
import { useChartsTranslation } from '../locale';

const itemWrap = SchemaInitializer.itemWrap;
const ConfigureButton = itemWrap((props) => {
  const { setVisible, setCurrent } = useContext(ChartConfigContext);
  return (
    <SchemaInitializer.Item
      {...props}
      onClick={() => {
        setCurrent({ schema: {}, field: null, collection: props.item?.name, service: null, data: undefined });
        setVisible(true);
      }}
    />
  );
});

export const ChartInitializers = () => {
  const { t } = useChartsTranslation();
  const collections = useCollectionDataSourceItems('Chart');
  const { allowAll, parseAction } = useACLRoleContext();

  if (collections[0].loadChildren) {
    const originalLoadChildren = collections[0].loadChildren;
    collections[0].loadChildren = ({ searchValue }) => {
      const children = originalLoadChildren({ searchValue });
      const result = children
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

      return result;
    };
  }

  return (
    <SchemaInitializer.Button
      icon={'PlusOutlined'}
      items={collections as any}
      dropdown={{
        placement: 'bottomLeft',
      }}
    >
      {t('Add chart')}
    </SchemaInitializer.Button>
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
