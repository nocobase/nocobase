import React from 'react';

import { ActionInitializer } from '@nocobase/client';

export const PrintActionInitializer = (props) => {
  const schema = {
    title: '{{ t("Print") }}',
    'x-action': 'print',
    'x-component': 'Action',
    'x-component-props': {
      icon: 'PrinterOutlined',
      useProps: '{{ useDetailPrintActionProps }}',
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};
