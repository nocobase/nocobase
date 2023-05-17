import { BlockItem, Collection, GeneralSchemaDesigner, SchemaSettings, useDesigner } from '@nocobase/client';
import React from 'react';
import { Card } from 'antd';
import { useChartsTranslation } from '../locale';

export const ChartRenderer: React.FC<{
  collection: Collection;
}> & { Designer: React.FC } = (props) => {
  const Designer = useDesigner();
  return (
    <BlockItem>
      <Designer />
      charts
    </BlockItem>
  );
};

const ChartRendererDesigner: React.FC = () => {
  const { t } = useChartsTranslation();
  return (
    <GeneralSchemaDesigner>
      <SchemaSettings.Item>{t('Configure')}</SchemaSettings.Item>
      <SchemaSettings.Divider />
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};

ChartRenderer.Designer = ChartRendererDesigner;
