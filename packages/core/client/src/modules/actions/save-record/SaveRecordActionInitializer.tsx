import React from 'react';
import { BlockInitializer } from '../../../schema-initializer/items';
import { useSchemaInitializerItem } from '../../../application';

export const SaveRecordActionInitializer = () => {
  const schema = {
    title: '{{ t("Save record") }}',
    'x-action': 'customize:save',
    'x-component': 'Action',
    'x-use-component-props': 'useCreateActionProps',
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:saveRecord',
    'x-designer-props': {
      modalTip:
        '{{ t("When the button is clicked, the following fields will be assigned and saved together with the fields in the form. If there are overlapping fields, the value here will overwrite the value in the form.") }}',
    },
    'x-action-settings': {
      assignedValues: {},
      skipValidator: false,
      onSuccess: {
        manualClose: true,
        redirecting: false,
        successMessage: '{{t("Submitted successfully")}}',
      },
      triggerWorkflows: [],
    },
  };

  const itemConfig = useSchemaInitializerItem();
  return <BlockInitializer {...itemConfig} schema={schema} item={itemConfig} />;
};
