/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo } from 'react';
import { Form, Radio, Space, Tooltip, Typography, theme } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import type { RadioGroupProps } from 'antd';
import { css } from '@emotion/css';
import { observer } from '@nocobase/flow-engine';
import { RemoteSelect } from '../../../../components/RemoteSelect';
import type { AIEmployee } from '../../../../ai-employees/types';
import { useAIConfigRepository } from '../../../../repositories/hooks/useAIConfigRepository';
import { useT } from '../../../../locale';
import { FormValueRegistry } from '../../../components/FormValueRegistry';

const RadioOptions = {
  preset: { value: 'preset' },
  custom: { value: 'custom' },
} as const;

type CapabilityType = 'skills' | 'tools';

type BindingOption = {
  name: string;
  title?: string;
  description?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isBindingOption = (value: unknown): value is BindingOption => isRecord(value) && typeof value.name === 'string';

function getRadioOptions(t: ReturnType<typeof useT>, type: CapabilityType) {
  return [
    {
      label: (
        <Tooltip
          title={t(
            type === 'skills'
              ? "Use the AI employee's default skills for this task."
              : "Use the AI employee's default tools for this task.",
          )}
        >
          <span>{t('Preset')}</span>
        </Tooltip>
      ),
      value: RadioOptions.preset.value,
    },
    {
      label: (
        <Tooltip
          title={t(
            type === 'skills'
              ? 'Select the specific skills this task is allowed to use.'
              : 'Select the specific tools this task is allowed to use.',
          )}
        >
          <span>{t('Custom')}</span>
        </Tooltip>
      ),
      value: RadioOptions.custom.value,
    },
  ];
}

function getDefaultValues(aiEmployee: AIEmployee | undefined, type: CapabilityType) {
  if (type === 'skills') {
    return aiEmployee?.skillSettings?.skills ?? [];
  }
  return aiEmployee?.skillSettings?.tools?.map((tool) => tool.name) ?? [];
}

function OptionContent({ title, description }: { title?: string; description?: string }) {
  const t = useT();
  const { token } = theme.useToken();
  const compiledTitle = title ? t(title) : '';
  const compiledDescription = description ? t(description) : '';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: token.marginXXS,
        width: '100%',
        minWidth: 0,
        padding: `${token.paddingXXS}px 0`,
      }}
    >
      <div>{compiledTitle}</div>
      {compiledDescription ? (
        <Typography.Text
          type="secondary"
          style={{
            fontSize: token.fontSizeSM,
          }}
          ellipsis={{
            tooltip: compiledDescription,
          }}
        >
          {compiledDescription}
        </Typography.Text>
      ) : null}
    </div>
  );
}

export const CapabilitySelect: React.FC<{
  type: CapabilityType;
  value?: string[];
  onChange?: (value?: string[]) => void;
}> = observer(({ type, value, onChange }) => {
  const t = useT();
  const { token } = theme.useToken();
  const form = Form.useFormInstance();
  const username = Form.useWatch(['config', 'username'], form);
  const aiConfigRepository = useAIConfigRepository();
  const aiEmployee = typeof username === 'string' ? aiConfigRepository.getAIEmployeesMap()[username] : undefined;
  const defaultValues = useMemo(() => getDefaultValues(aiEmployee, type), [aiEmployee, type]);
  const radioOptions = useMemo(() => getRadioOptions(t, type), [t, type]);
  const radioValue = Array.isArray(value) ? RadioOptions.custom.value : RadioOptions.preset.value;
  const resourceName = type === 'skills' ? 'aiSkills' : 'aiTools';

  useEffect(() => {
    aiConfigRepository.getAIEmployees();
  }, [aiConfigRepository]);

  const handleSelectChange = (nextValue: string[]) => {
    onChange?.(nextValue?.filter((item) => defaultValues.includes(item)));
  };

  const handleRadioChange: RadioGroupProps['onChange'] = (event) => {
    if (event.target.value === RadioOptions.preset.value) {
      onChange?.(undefined);
      return;
    }
    onChange?.(defaultValues);
  };

  return (
    <Space direction="vertical" size={token.marginXXS} style={{ width: '100%' }}>
      <Radio.Group value={radioValue} onChange={handleRadioChange} options={radioOptions} />
      {radioValue === RadioOptions.custom.value ? (
        <RemoteSelect<string[]>
          key={typeof username === 'string' ? username : undefined}
          multiple
          value={value}
          onChange={handleSelectChange}
          manual={false}
          popupMatchSelectWidth
          placeholder={t(type === 'skills' ? 'Leave empty to disable skills.' : 'Leave empty to disable tools.')}
          fieldNames={{
            label: 'title',
            value: 'name',
          }}
          service={{
            resource: resourceName,
            action: 'listBinding',
            params: {
              username,
            },
          }}
          optionFilter={isBindingOption}
          optionRender={(option) => {
            const data = option.data;
            if (!isBindingOption(data)) {
              return null;
            }
            return <OptionContent title={data.title} description={data.description} />;
          }}
        />
      ) : null}
    </Space>
  );
});

function CapabilityFormRow({
  name,
  label,
  tooltip,
  children,
}: {
  name: string[];
  label: React.ReactNode;
  tooltip: React.ReactNode;
  children: React.ReactNode;
}) {
  const { token } = theme.useToken();
  const rowClassName = css`
    display: flex;
    flex-direction: column;
    row-gap: ${token.marginXXS}px;
    margin-bottom: ${token.margin}px;

    .nb-ai-capability-label {
      display: inline-flex;
      align-items: center;
      column-gap: ${token.marginXXS}px;
      color: ${token.colorText};
      font-size: ${token.fontSize}px;
      font-weight: ${token.fontWeightStrong};
      line-height: ${token.lineHeight};
      white-space: nowrap;
    }

    .nb-ai-capability-control {
      width: 100%;
      min-width: 0;
    }
  `;

  return (
    <div className={rowClassName}>
      <span className="nb-ai-capability-label">
        {label}
        <Tooltip title={tooltip}>
          <QuestionCircleOutlined />
        </Tooltip>
      </span>
      <div className="nb-ai-capability-control">
        <Form.Item name={name} noStyle>
          {children}
        </Form.Item>
      </div>
    </div>
  );
}

export function SkillSettings() {
  const t = useT();

  return (
    <>
      <Form.Item name={['config', 'skillSettings', 'skillsVersion']} initialValue={2} hidden>
        <FormValueRegistry />
      </Form.Item>
      <Form.Item name={['config', 'skillSettings', 'toolsVersion']} initialValue={2} hidden>
        <FormValueRegistry />
      </Form.Item>
      <CapabilityFormRow
        name={['config', 'skillSettings', 'skills']}
        label={t('Skills')}
        tooltip={t('Configure the skills available to this task')}
      >
        <CapabilitySelect type="skills" />
      </CapabilityFormRow>
      <CapabilityFormRow
        name={['config', 'skillSettings', 'tools']}
        label={t('Tools')}
        tooltip={t('Configure the tools available to this task')}
      >
        <CapabilitySelect type="tools" />
      </CapabilityFormRow>
    </>
  );
}

export default SkillSettings;
