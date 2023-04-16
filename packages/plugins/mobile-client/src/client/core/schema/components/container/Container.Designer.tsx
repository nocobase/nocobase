import { GeneralSchemaDesigner, SchemaSettings } from '@nocobase/client';
import React from 'react';
import { useTranslation } from '../../../../locale';

export const ContainerDesigner = () => {
  const { t } = useTranslation();
  return (
    <GeneralSchemaDesigner draggable={false}>
      <SchemaSettings.SwitchItem title={t('Enable application info')} />
      <SchemaSettings.SwitchItem title={t('Enable TabBar')} />
    </GeneralSchemaDesigner>
  );
};
