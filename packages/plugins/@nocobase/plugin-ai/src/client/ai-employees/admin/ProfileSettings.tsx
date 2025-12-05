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
  useRequest,
} from '@nocobase/client';
import React from 'react';
import { AvatarSelect } from './AvatarSelect';
import { useT } from '../../locale';
import { Switch } from '@formily/antd-v5';
import { Button, message } from 'antd';
import { useForm } from '@formily/react';
import { css } from '@emotion/css';

const ResetButton: React.FC<{ className?: string }> = ({ className }) => {
  const record = useCollectionRecordData();
  const isBuiltIn = record?.builtIn;
  const t = useT();
  const form = useForm();
  const { run } = useRequest(
    {
      resource: 'aiEmployees',
      action: 'getBuiltInDefault',
      params: { filterByTk: record?.username },
    },
    {
      manual: true,
      onSuccess: (resp) => {
        const about = resp?.data?.about ?? resp?.about;
        if (about !== undefined) {
          form.setValuesIn('about', about);
        }
      },
    },
  );
  if (!isBuiltIn) return null;
  return (
    <div className={className}>
      <Button type="link" size="small" onClick={run}>
        {t('Reset to default')}
      </Button>
    </div>
  );
};

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
  const isBuiltIn = record?.builtIn;
  return (
    <SchemaComponent
      scope={{ t }}
      components={{ AvatarSelect, Switch, ResetButton }}
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
          aboutWrap: {
            type: 'void',
            'x-component': 'div',
            'x-component-props': {
              className: css`
                position: relative;
              `,
            },
            properties: {
              about: {
                type: 'string',
                title: '{{t("About me")}}',
                required: true,
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
              resetAbout: {
                type: 'void',
                'x-component': 'ResetButton',
                'x-component-props': {
                  className: css`
                    position: absolute;
                    right: 0;
                    top: 0;
                    z-index: 1;
                  `,
                },
              },
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
