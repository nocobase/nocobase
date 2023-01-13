import { useField } from '@formily/react';
import { GeneralSchemaDesigner, SchemaSettings } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';

export const CommentBlockDesigner = () => {
  const field = useField();
  const { t } = useTranslation();
  return (
    <GeneralSchemaDesigner>
      {/* <SchemaSettings.Item
        title={t('Edit markdown')}
        onClick={() => {
          field.editable = true;
        }}
      />
      <SchemaSettings.Divider /> */}
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
