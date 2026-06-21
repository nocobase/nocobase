/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaComponent, useCollectionRecordData, useAPIClient } from '@nocobase/client';
import React from 'react';
import { AvatarSelect } from './AvatarSelect';
import { useT } from '../../locale';

export const ProfileSettings: React.FC<{
  edit?: boolean;
}> = ({ edit }) => {
  const t = useT();
  const record = useCollectionRecordData();
  const isBuiltIn = record?.builtIn;
  return (
    <SchemaComponent
      scope={{ t }}
      components={{ AvatarSelect }}
      schema={{
        type: 'void',
        properties: {
          username: {
            type: 'string',
            title: '{{t("Username")}}',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            required: true,
            'x-disabled': edit,
          },
          nickname: {
            type: 'string',
            title: '{{t("Nickname")}}',
            'x-disabled': isBuiltIn,
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            required: true,
          },
          position: {
            type: 'string',
            title: '{{t("Position")}}',
            'x-disabled': isBuiltIn,
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            description: t('Position description'),
            'x-component-props': {
              placeholder: t('Position placeholder'),
            },
          },
          avatar: {
            type: 'string',
            title: '{{t("Avatar")}}',
            'x-decorator': 'FormItem',
            'x-component': 'AvatarSelect',
            'x-component-props': {
              disabled: isBuiltIn,
            },
          },
          bio: {
            type: 'string',
            title: '{{t("Bio")}}',
            'x-disabled': isBuiltIn,
            'x-decorator': 'FormItem',
            'x-component': 'Input.TextArea',
            'x-component-props': {
              placeholder: t('Bio placeholder'),
            },
          },
          greeting: {
            type: 'string',
            title: '{{t("Greeting message")}}',
            'x-disabled': isBuiltIn,
            'x-decorator': 'FormItem',
            'x-component': 'Input.TextArea',
            'x-component-props': {
              placeholder: t('Greeting message placeholder'),
            },
          },
        },
      }}
    />
  );
};
