import { GeneralSchemaDesigner, SchemaSettingsRemove } from '@nocobase/client';
import React from 'react';
import { useTranslation } from '../../../../locale';

export const SettingsDesigner = () => {
  const { t } = useTranslation();

  return (
    <GeneralSchemaDesigner>
      <SchemaSettingsRemove
        key="remove"
        removeParentsIfNoChildren
        confirm={{
          title: t('Delete settings block'),
        }}
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
