import { GeneralSchemaDesigner, SchemaSettingsRemove } from '@nocobase/client';
import React from 'react';
import { useChartsTranslation } from '../locale';

export const ChartFilterBlockDesigner: React.FC = () => {
  const { t } = useChartsTranslation();
  return (
    <GeneralSchemaDesigner disableInitializer title={t('Filter')}>
      {/* <SchemaSettings.BlockTitleItem /> */}
      {/* <SchemaSettings.Divider /> */}
      <SchemaSettingsRemove
        breakRemoveOn={{
          'x-component': 'ChartV2Block',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
