/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaComponent } from '@nocobase/client';
import React from 'react';
import { AvatarSelect } from './AvatarSelect';
import { useT } from '../../locale';

export const ProfileSettings: React.FC = () => {
  const t = useT();
  return (
    <SchemaComponent
      components={{ AvatarSelect }}
      schema={{
        type: 'void',
        properties: {
          username: {
            type: 'string',
            title: 'Username',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            required: true,
          },
          nickname: {
            type: 'string',
            title: 'Nickname',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            required: true,
          },
          position: {
            type: 'string',
            title: 'Position',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            description: t('A short label indicating the AI employee’s responsibility.'),
            'x-component-props': {
              placeholder: t('e.g. Translator, etc.'),
            },
          },
          avatar: {
            type: 'string',
            title: 'Avatar',
            'x-decorator': 'FormItem',
            'x-component': 'AvatarSelect',
          },
          bio: {
            type: 'string',
            title: 'Bio',
            'x-decorator': 'FormItem',
            'x-component': 'Input.TextArea',
            'x-component-props': {
              placeholder:
                'The introduction to the AI employee will inform human colleagues about its skills and how to use it. This information will be displayed on the employee’s profile. This will not be part of the prompt of this AI employee.',
            },
          },
          about: {
            type: 'string',
            title: 'About me',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'Input.TextArea',
            'x-component-props': {
              placeholder:
                'Define the AI employee’s role, guide its work, and instruct it complete user-assigned tasks. This will be part of the prompt of this AI employee.',
              autoSize: {
                minRows: 15,
              },
            },
          },
          greeting: {
            type: 'string',
            title: 'Greeting message',
            'x-decorator': 'FormItem',
            'x-component': 'Input.TextArea',
            'x-component-props': {
              placeholder: 'Opening message sent to the user when starting a new conversation.',
            },
          },
        },
      }}
    />
  );
};
