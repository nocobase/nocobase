import React from 'react';
import { ActionInitializer } from '../../../schema-initializer/items/ActionInitializer';

export const ExpandableActionInitializer = (props) => {
  const schema = {
    'x-action': 'expandAll',
    'x-component': 'Action',
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:expendable',
    'x-component-props': {
      titleExpand: "{{t('Expand all')}}",
      titleCollapse: "{{t('Collapse all')}}",
      iconExpand: 'nodeexpandoutlined',
      iconCollapse: 'nodecollapseoutlined',
      component: 'Expand.Action',
      useAction: () => {
        return {
          run() {},
        };
      },
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};
