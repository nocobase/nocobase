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
  Variable,
} from '@nocobase/client';
import React, { useState, useEffect } from 'react';
import { useT } from '../../locale';
import { Radio, Alert, Space, Typography } from 'antd';
import { useForm } from '@formily/react';
import { css } from '@emotion/css';

const { Paragraph } = Typography;

type AboutMode = 'system' | 'custom';

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
      message={t('Role setting description')}
      type="info"
    />
  );
};

const BuiltInAboutField: React.FC = () => {
  const t = useT();
  const record = useCollectionRecordData();
  const form = useForm();
  const options = useVariableOptions();

  // about 为空（null 或 undefined）表示使用系统默认
  const initialMode: AboutMode = record?.about ? 'custom' : 'system';
  const [mode, setMode] = useState<AboutMode>(initialMode);

  // Sync mode to form for useEditActionProps to access
  useEffect(() => {
    form.setValuesIn('_aboutMode', mode);
  }, [form, mode]);

  // Get system default prompt from virtual field (set by setupBuiltInInfo)
  const defaultPrompt = record?.defaultPrompt || '';

  const handleModeChange = (newMode: AboutMode) => {
    setMode(newMode);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Radio.Group value={mode} onChange={(e) => handleModeChange(e.target.value)}>
        <Radio value="system">{t('System default')}</Radio>
        <Radio value="custom">{t('Custom')}</Radio>
      </Radio.Group>
      {mode === 'system' ? (
        <div
          className={css`
            background-color: #fafafa;
            border: 1px solid #d9d9d9;
            border-radius: 6px;
            padding: 8px 12px;
            min-height: 330px;
            max-height: 500px;
            overflow-y: auto;
          `}
        >
          <Paragraph
            copyable
            className={css`
              margin: 0 !important;
              white-space: pre-wrap;
              word-break: break-word;
            `}
          >
            {defaultPrompt}
          </Paragraph>
        </div>
      ) : (
        <Variable.RawTextArea
          value={form.values.about ?? ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            form.setValuesIn('about', e.target.value);
          }}
          scope={options}
          placeholder={t('Role setting placeholder')}
          autoSize={{ minRows: 15 }}
          className={css`
            width: 100%;
          `}
        />
      )}
    </Space>
  );
};

const StandardAboutField: React.FC = () => {
  const t = useT();
  const form = useForm();
  const options = useVariableOptions();

  return (
    <Variable.RawTextArea
      value={form.values.about ?? ''}
      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
        form.setValuesIn('about', e.target.value);
      }}
      scope={options}
      placeholder={t('Role setting placeholder')}
      autoSize={{ minRows: 15 }}
      className={css`
        width: 100%;
      `}
    />
  );
};

const AboutField: React.FC = () => {
  const record = useCollectionRecordData();
  const isBuiltIn = record?.builtIn;

  if (isBuiltIn) {
    return <BuiltInAboutField />;
  }
  return <StandardAboutField />;
};

export const SystemPrompt: React.FC = () => {
  const t = useT();

  return (
    <SchemaComponent
      scope={{ t }}
      components={{ Description, AboutField }}
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
            properties: {
              about: {
                type: 'string',
                title: '{{t("Role setting")}}',
                'x-decorator': 'FormItem',
                'x-component': 'AboutField',
              },
            },
          },
        },
      }}
    />
  );
};
