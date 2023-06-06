import { SchemaInitializer, useACLRoleContext, useCollectionDataSourceItems } from '@nocobase/client';
import React, { useContext } from 'react';
import { ISchema } from '@formily/react';
import { PieChartOutlined } from '@ant-design/icons';
import { uid } from '@formily/shared';
import { useChartsTranslation } from '../locale';
import { ChartConfigContext } from './ChartConfigure';

const itemWrap = SchemaInitializer.itemWrap;
const ConfigureButton = itemWrap((props) => {
  const { setVisible, setCurrent, setData } = useContext(ChartConfigContext);
  return (
    <SchemaInitializer.Item
      {...props}
      onClick={() => {
        setCurrent({ schema: {}, field: null, collection: props.item?.name });
        setData('');
        setVisible(true);
      }}
    />
  );
});

export const ChartInitializers = () => {
  const { t } = useChartsTranslation();
  const collections = useCollectionDataSourceItems('Chart');
  const { allowAll, parseAction } = useACLRoleContext();
  const children = collections[0].children
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
  if (!children.length) {
    // Leave a blank item to show the filter component
    children.push({} as any);
  }
  collections[0].children = children;
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
      icon={<PieChartOutlined />}
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
