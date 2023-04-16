import { GeneralSchemaDesigner, SchemaSettings } from '@nocobase/client';
import React from 'react';
import { useTranslation } from '../../../../locale';

export const MenuDesigner: React.FC = (props) => {
  const { t } = useTranslation();
  return (
    <GeneralSchemaDesigner draggable={false}>
      <SchemaSettings.Remove
        key="remove"
        removeParentsIfNoChildren
        confirm={{
          title: t('Delete menu?'),
        }}
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
