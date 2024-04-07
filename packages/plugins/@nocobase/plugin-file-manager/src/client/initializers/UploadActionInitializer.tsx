import { ActionInitializer, useCollection_deprecated } from '@nocobase/client';
import React from 'react';

export const UploadActionInitializer = (props) => {
  const collection = useCollection_deprecated();

  const schema = {
    type: 'void',
    'x-action': 'create',
    title: "{{t('Upload')}}",
    'x-designer': 'Action.Designer',
    'x-component': 'Action',
    'x-decorator': 'ACLActionProvider',
    'x-component-props': {
      openMode: 'drawer',
      type: 'primary',
      icon: 'UploadOutlined',
    },
    properties: {
      drawer: {
        type: 'void',
        title: '{{ t("Upload files") }}',
        'x-component': 'Action.Container',
        properties: {
          upload: {
            type: 'void',
            title: '{{ t("Upload files") }}',
            'x-component': 'Upload.DraggerV2',
            'x-use-component-props': 'useUploadFiles',
            'x-component-props': {
              height: '50vh',
              multiple: true,
              listType: 'picture',
            },
          },
        },
      },
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};
