/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  SchemaComponent,
  useCollectionRecordData,
  useCurrentRoleVariable,
  useCurrentUserVariable,
  useDatetimeVariable,
} from '@nocobase/client';
import React from 'react';
import { AvatarSelect } from './AvatarSelect';
import { useT } from '../../locale';
import { Switch } from '@formily/antd-v5';

const useVariableOptions = () => {
  const t = useT();
  const { currentUserSettings } = useCurrentUserVariable({
    maxDepth: 3,
    noDisabled: true,
  });
  const { currentRoleSettings } = useCurrentRoleVariable({
    noDisabled: true,
  });
  const { datetimeSettings } = useDatetimeVariable({ noDisabled: true });
  return [
    currentUserSettings,
    currentRoleSettings,
    {
      key: '$nLang',
      value: '$nLang',
      label: t('Current language'),
    },
    datetimeSettings,
  ];
};

export const ProfileSettings: React.FC<{
  edit?: boolean;
}> = ({ edit }) => {
  const t = useT();
  const options = useVariableOptions();
  const record = useCollectionRecordData();
  const isBuildIn = record?.buildIn;
  return (
    <SchemaComponent
      scope={{ t }}
      components={{ AvatarSelect, Switch }}
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
            'x-disabled': isBuildIn,
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            required: true,
          },
          enabled: {
            type: 'boolean',
            title: '{{t("Enabled")}}',
            'x-decorator': 'FormItem',
            'x-component': 'Switch',
            default: true,
            required: true,
          },
          position: {
            type: 'string',
            title: '{{t("Position")}}',
            'x-disabled': isBuildIn,
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
              disabled: isBuildIn,
            },
          },
          bio: {
            type: 'string',
            title: '{{t("Bio")}}',
            'x-disabled': isBuildIn,
            'x-decorator': 'FormItem',
            'x-component': 'Input.TextArea',
            'x-component-props': {
              placeholder: t('Bio placeholder'),
            },
          },
          about: {
            type: 'string',
            title: '{{t("About me")}}',
            required: true,
            'x-disabled': isBuildIn,
            'x-decorator': 'FormItem',
            'x-component': 'Variable.RawTextArea',
            'x-component-props': {
              scope: options,
              placeholder: t('About me placeholder'),
              autoSize: {
                minRows: 15,
              },
            },
          },
          greeting: {
            type: 'string',
            title: '{{t("Greeting message")}}',
            'x-disabled': isBuildIn,
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
