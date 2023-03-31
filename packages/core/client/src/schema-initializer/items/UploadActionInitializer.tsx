import React from 'react';
import { useCollection } from '../../collection-manager';
import { ActionInitializer } from './ActionInitializer';

export const UploadActionInitializer = (props) => {
  const collection = useCollection();

  const schema = {
    type: 'void',
    'x-action': 'upload',
    title: "{{t('Upload')}}",
    'x-designer': 'Action.Designer',
    'x-component': 'Action',
    'x-decorator': 'ACLActionProvider',
    'x-component-props': {
      openMode: 'modal',
      type: 'primary',
      icon: 'UploadOutlined',
    },
    properties: {
      modal: {
        type: 'void',
        title: '{{ t("Upload files") }}',
        'x-component': 'Action.Modal',
        'x-component-props': {},
        properties: {
          upload: {
            type: 'void',
            'x-component': 'Upload.DraggerV2',
            'x-component-props': {
              height: '50vh',
              action: `${collection.name}:upload`,
              useProps: '{{useUploadFiles}}',
              multiple: true,
            },
          },
        },
      },
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};
