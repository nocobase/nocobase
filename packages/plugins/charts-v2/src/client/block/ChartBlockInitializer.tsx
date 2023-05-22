import { SchemaInitializer, useCollectionDataSourceItems } from '@nocobase/client';
import React, { useContext } from 'react';
import { ISchema } from '@formily/react';
import { PieChartOutlined } from '@ant-design/icons';
import { uid } from '@formily/shared';
import { useChartsTranslation } from '../locale';
import { ChartConfigContext } from './ChartConfigure';

const itemWrap = SchemaInitializer.itemWrap;
const ConfigureButton = itemWrap((props) => {
  const { setVisible } = useContext(ChartConfigContext);
  return (
    <SchemaInitializer.Item
      {...props}
      onClick={() => {
        setVisible(true);
      }}
    />
  );
});

export const ChartInitializers = () => {
  const { t } = useChartsTranslation();
  const { setVisible } = useContext(ChartConfigContext);
  const collections = useCollectionDataSourceItems('Chart');
  collections[0].children = collections[0].children.map((item) => ({
    ...item,
    component: ConfigureButton,
  }));
  return (
    <SchemaInitializer.Button icon={'PlusOutlined'} items={collections as any}>
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
