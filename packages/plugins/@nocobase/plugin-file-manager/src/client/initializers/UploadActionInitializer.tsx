/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionInitializerItem } from '@nocobase/client';
import React from 'react';

export const UploadActionInitializer = (props) => {
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
  return <ActionInitializerItem {...props} schema={schema} />;
};
