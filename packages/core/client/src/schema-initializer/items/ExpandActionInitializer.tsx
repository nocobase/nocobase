import React from 'react';
import { ActionInitializer } from './ActionInitializer';

export const ExpandActionInitializer = (props) => {
  const schema = {
    'x-action': 'expandAll',
    'x-component': 'Action',
    'x-designer': 'Expand.Action.Design',
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
