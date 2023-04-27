import React from 'react';

import { ActionInitializer } from './ActionInitializer';

export const PrintActionInitializer = (props) => {
  const schema = {
    title: '{{ t("Print") }}',
    'x-action': 'print',
    'x-component': 'Action',
    'x-designer': 'Action.Designer',
    'x-component-props': {
      icon: 'PrinterOutlined',
      useProps: '{{ useDetailPrintActionProps }}',
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};
