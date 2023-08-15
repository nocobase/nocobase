import { useFieldSchema } from '@formily/react';
import { Action, SchemaSettings, useDesignable } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CustomRequestConfigurationFieldsSchema } from '../schemas';

function CustomRequestSettingsItem() {
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();

  return (
    <SchemaSettings.ActionModalItem
      title={t('Request settings')}
      schema={CustomRequestConfigurationFieldsSchema}
      initialValues={fieldSchema?.['x-action-settings']?.requestSettings}
      onSubmit={(requestSettings) => {
        fieldSchema['x-action-settings']['requestSettings'] = requestSettings;
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-action-settings': fieldSchema['x-action-settings'],
          },
        });
        dn.refresh();
      }}
    />
  );
}

export const CustomRequestActionDesigner: React.FC = () => {
  return (
    <Action.Designer>
      <CustomRequestSettingsItem />
    </Action.Designer>
  );
};
