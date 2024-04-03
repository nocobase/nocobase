import React from 'react';
import { BlockInitializer } from '../../../schema-initializer/items';
import { useSchemaInitializerItem } from '../../../application';

export const UpdateRecordActionInitializer = (props) => {
  const schema = {
    title: '{{ t("Update record") }}',
    'x-component': props?.['x-component'] || 'Action.Link',
    'x-use-component-props': 'useCustomizeUpdateActionProps',
    'x-action': 'customize:update',
    'x-decorator': 'ACLActionProvider',
    'x-acl-action': 'update',
    // 'x-designer': 'Action.Designer',
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:updateRecord',
    'x-action-settings': {
      assignedValues: {},
      onSuccess: {
        manualClose: true,
        redirecting: false,
        successMessage: '{{t("Updated successfully")}}',
      },
      triggerWorkflows: [],
    },
  };

  const itemConfig = useSchemaInitializerItem();
  return <BlockInitializer {...itemConfig} schema={schema} item={itemConfig} />;
};
