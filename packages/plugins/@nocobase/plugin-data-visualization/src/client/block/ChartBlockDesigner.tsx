import { GeneralSchemaDesigner, SchemaSettings } from '@nocobase/client';
import React from 'react';
import { useChartsTranslation } from '../locale';

export const ChartV2BlockDesigner: React.FC = () => {
  const { t } = useChartsTranslation();
  return (
    <GeneralSchemaDesigner title={t('Charts')}>
      <SchemaSettings.BlockTitleItem />
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
