/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { FormItem, observer, tExpr, useFlowContext } from '@nocobase/flow-engine';
import { RemoteSelect, SchemaComponent } from '@nocobase/client';
import { Schema, useField, useForm } from '@formily/react';
import { ArrayField, ObjectField } from '@formily/core';
import { Radio, RadioGroupProps, Space, Tooltip, Typography } from 'antd';
import { namespace, useT } from '../locale';

const RadioOptions = {
  preset: { value: 'preset' },
  custom: { value: 'custom' },
};

const getRadioOptions = (t: ReturnType<typeof useT>, type: 'skills' | 'tools') => [
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

export const Skills: React.FC<{
  username: string;
  defaultSkills: string[];
  initials?: string[];
  onChange: (value?: string[]) => void;
}> = ({ username, defaultSkills, initials, onChange }) => {
  const t = useT();
  const radioOptions = useMemo(() => getRadioOptions(t, 'skills'), [t]);

  useEffect(() => {
    setRadioValue(Array.isArray(initials) ? RadioOptions.custom.value : RadioOptions.preset.value);
  }, [initials]);

  const handleChange = (value: string[]) => {
    onChange(value?.filter((skill) => defaultSkills.includes(skill)));
  };

  const [radioValue, setRadioValue] = useState(RadioOptions.preset.value);
  const onRadioChange: RadioGroupProps['onChange'] = (e) => {
    setRadioValue(e.target.value);
    if (e.target.value === RadioOptions.preset.value) {
      onChange(undefined);
    } else {
      onChange(defaultSkills);
    }
  };

  return (
    <Space style={{ width: '100%' }} direction="vertical">
      <Radio.Group value={radioValue} onChange={onRadioChange} options={radioOptions} />
      {radioValue === RadioOptions.custom.value && (
        <RemoteSelect
          key={username}
          value={initials}
          onChange={handleChange}
          manual={false}
          multiple={true}
          popupMatchSelectWidth
          placeholder={t('Leave empty to disable skills.')}
          fieldNames={{
            label: 'title',
            value: 'name',
          }}
          optionRender={renderTitleWithDescription(t)}
          service={{
            resource: 'aiSkills',
            action: 'listBinding',
            params: {
              username,
            },
          }}
        />
      )}
    </Space>
  );
};

export const Tools: React.FC<{
  username: string;
  defaultTools: string[];
  initials?: string[];
  onChange: (value?: string[]) => void;
}> = ({ username, defaultTools, initials, onChange }) => {
  const t = useT();
  const radioOptions = useMemo(() => getRadioOptions(t, 'tools'), [t]);

  useEffect(() => {
    setRadioValue(Array.isArray(initials) ? RadioOptions.custom.value : RadioOptions.preset.value);
  }, [initials]);

  const handleChange = (value: string[]) => {
    onChange(value?.filter((tool) => defaultTools.includes(tool)));
  };

  const [radioValue, setRadioValue] = useState(RadioOptions.preset.value);
  const onRadioChange: RadioGroupProps['onChange'] = (e) => {
    setRadioValue(e.target.value);
    if (e.target.value === RadioOptions.preset.value) {
      onChange(undefined);
    } else {
      onChange(defaultTools);
    }
  };

  return (
    <Space style={{ width: '100%' }} direction="vertical">
      <Radio.Group value={radioValue} onChange={onRadioChange} options={radioOptions} />
      {radioValue === RadioOptions.custom.value && (
        <RemoteSelect
          key={username}
          value={initials}
          onChange={handleChange}
          manual={false}
          multiple={true}
          popupMatchSelectWidth
          placeholder={t('Leave empty to disable tools.')}
          fieldNames={{
            label: 'title',
            value: 'name',
          }}
          optionRender={renderTitleWithDescription(t)}
          service={{
            resource: 'aiTools',
            action: 'listBinding',
            params: {
              username,
            },
          }}
        />
      )}
    </Space>
  );
};

const renderTitleWithDescription = (t: any) => (option: { data?: { title?: string; description?: string } }) => (
  <OptionContent t={t} title={option.data?.title} description={option.data?.description} />
);

const OptionContent: React.FC<{
  t: any;
  title?: string;
  description?: string;
}> = ({ t, title, description }) => {
  const compiledTitle = Schema.compile(title, { t });
  const compiledDescription = Schema.compile(description, { t });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        width: '100%',
        minWidth: 0,
        padding: '2px 0',
      }}
    >
      <div>{compiledTitle}</div>
      {compiledDescription ? (
        <Typography.Text
          type="secondary"
          style={{
            fontSize: 12,
          }}
          ellipsis={{
            tooltip: typeof compiledDescription === 'string' ? compiledDescription : undefined,
          }}
        >
          {compiledDescription}
        </Typography.Text>
      ) : null}
    </div>
  );
};

export const SkillSettings: React.FC = observer(() => {
  const ctx = useFlowContext();
  const username = ctx.model.props?.aiEmployee?.username ?? '';
  const aiEmployeesMap = ctx.aiConfigRepository.getAIEmployeesMap();
  const defaultSkills: string[] = useMemo(() => {
    return aiEmployeesMap[username]?.skillSettings?.skills?.map((name: string) => name) ?? [];
  }, [aiEmployeesMap, username]);
  const defaultTools: string[] = useMemo(() => {
    return aiEmployeesMap[username]?.skillSettings?.tools?.map(({ name }: { name: string }) => name) ?? [];
  }, [aiEmployeesMap, username]);
  const field = useField<ObjectField>();
  return (
    <>
      <FormItem
        label={ctx.t('Skills', { ns: namespace })}
        layout="horizontal"
        tooltip={ctx.t('Configure the skills available to this task', {
          ns: namespace,
        })}
      >
        <Skills
          username={username}
          defaultSkills={defaultSkills}
          initials={field.value.skills}
          onChange={(value) => (field.value.skills = value)}
        />
      </FormItem>
      <FormItem
        label={ctx.t('Tools', { ns: namespace })}
        layout="horizontal"
        tooltip={ctx.t('Configure the tools available to this task', {
          ns: namespace,
        })}
      >
        <Tools
          username={username}
          defaultTools={defaultTools}
          initials={field.value.tools}
          onChange={(value) => (field.value.tools = value)}
        />
      </FormItem>
    </>
  );
});
