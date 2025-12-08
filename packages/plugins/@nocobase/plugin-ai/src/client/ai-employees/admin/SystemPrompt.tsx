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
  useAPIClient,
} from '@nocobase/client';
import React from 'react';
import { useT } from '../../locale';
import { Button, message, Alert } from 'antd';
import { useForm } from '@formily/react';
import { css } from '@emotion/css';

const ResetButton: React.FC<{ className?: string }> = ({ className }) => {
  const record = useCollectionRecordData();
  const isBuiltIn = record?.builtIn;
  const t = useT();
  const form = useForm();
  const api = useAPIClient();
  const { run } = useRequest(() => api.resource('aiEmployees').getBuiltInDefault({ filterByTk: record?.username }), {
    manual: true,
    onSuccess: (resp) => {
      const about = resp?.data?.data?.about;
      if (typeof about === 'string') {
        form.setValuesIn('about', about);
        message.success(t('Reset successfully'));
      }
    },
  });
  if (!isBuiltIn) return null;
  return (
    <div className={className}>
      <Button type="link" size="small" onClick={() => run()}>
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

const Description = () => {
  const t = useT();

  return (
    <Alert
      style={{
        marginBottom: 16,
      }}
      message={t('Characterization description')}
      type="info"
    />
  );
};

export const SystemPrompt: React.FC = () => {
  const t = useT();
  const options = useVariableOptions();

  return (
    <SchemaComponent
      scope={{ t }}
      components={{ ResetButton, Description }}
      schema={{
        type: 'void',
        properties: {
          desc: {
            type: 'void',
            'x-component': 'Description',
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
                title: '{{t("Characterization")}}',
                required: true,
                'x-decorator': 'FormItem',
                'x-component': 'Variable.RawTextArea',
                'x-component-props': {
                  scope: options,
                  placeholder: t('Characterization placeholder'),
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
        },
      }}
    />
  );
};
