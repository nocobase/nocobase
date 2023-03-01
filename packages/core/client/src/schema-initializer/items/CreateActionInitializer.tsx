import React from 'react';
import { ActionInitializer } from './ActionInitializer';

export const CreateActionInitializer = (props) => {
  const schema = {
    type: 'void',
    title: '{{ t("Add new") }}',
    'x-action': 'create',
    'x-component': 'CreateRecordAction',
  };
  return <ActionInitializer {...props} schema={schema} />;
};
