import React from 'react';
import { BlockInitializer, useSchemaInitializerItem } from '@nocobase/client';

export const FormTriggerWorkflowActionInitializerV2 = () => {
  const schema = {
    title: '{{t("Submit to workflow", { ns: "workflow" })}}',
    'x-component': 'Action',
    'x-component-props': {
      useProps: '{{ useTriggerWorkflowsActionProps }}',
    },
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:submitToWorkflow',
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
    'x-action': 'customize:triggerWorkflows',
  };

  const itemConfig = useSchemaInitializerItem();
  return <BlockInitializer {...itemConfig} schema={schema} item={itemConfig} />;
};
