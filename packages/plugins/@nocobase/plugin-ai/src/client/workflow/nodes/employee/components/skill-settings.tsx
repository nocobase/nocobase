/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { observer, tExpr, useFlowContext } from '@nocobase/flow-engine';
import { RemoteSelect, SchemaComponent } from '@nocobase/client';
import { Schema, useField, useForm } from '@formily/react';
import { ArrayField } from '@formily/core';
import { Radio, RadioGroupProps, Space, Tooltip, Typography } from 'antd';
import { namespace, useT } from '../../../../locale';

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
            ? "Use the AI employee's default skills for this node."
            : "Use the AI employee's default tools for this node.",
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
            ? 'Select the specific skills this node is allowed to use.'
            : 'Select the specific tools this node is allowed to use.',
        )}
      >
        <span>{t('Custom')}</span>
      </Tooltip>
    ),
    value: RadioOptions.custom.value,
  },
];

const Skills: React.FC = observer(() => {
  const t = useT();
  const radioOptions = useMemo(() => getRadioOptions(t, 'skills'), [t]);
  const field = useField<ArrayField>();
  const ctx = useFlowContext();
  const form = useForm();
  const username = ctx.model.props.aiEmployee.username;
  const aiEmployeesMap = ctx.aiConfigRepository.getAIEmployeesMap();
  const defaultSkills: string[] = useMemo(() => {
    return aiEmployeesMap[username]?.skillSettings?.skills?.map((name: string) => name) ?? [];
  }, [aiEmployeesMap, username]);

  const handleChange = (value: string[]) => {
    field.setValue(value.filter((skill) => defaultSkills.includes(skill)));
  };

  const [radioValue, setRadioValue] = useState(RadioOptions.preset.value);
  const onRadioChange: RadioGroupProps['onChange'] = (e) => {
    setRadioValue(e.target.value);
    if (e.target.value === RadioOptions.preset.value) {
      field.setValue(undefined);
    } else {
      field.setValue(defaultSkills);
    }
  };

  useEffect(() => {
    const hasInitialSkills = Array.isArray(form.initialValues?.skillSettings?.skills);
    if (!hasInitialSkills) {
      form.setValuesIn('skillSettings.skills', undefined);
    }
    setRadioValue(hasInitialSkills ? RadioOptions.custom.value : RadioOptions.preset.value);
  }, [form]);

  return (
    <Space style={{ width: '100%' }} direction="vertical">
      <Radio.Group value={radioValue} onChange={onRadioChange} options={radioOptions} />
      {radioValue === RadioOptions.custom.value && (
        <RemoteSelect
          key={username}
          value={field.value}
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
});

const Tools: React.FC = observer(() => {
  const t = useT();
  const radioOptions = useMemo(() => getRadioOptions(t, 'tools'), [t]);
  const field = useField<ArrayField>();
  const ctx = useFlowContext();
  const form = useForm();
  const username = ctx.model.props.aiEmployee.username;
  const aiEmployeesMap = ctx.aiConfigRepository.getAIEmployeesMap();
  const defaultTools: string[] = useMemo(() => {
    const aiEmployee = aiEmployeesMap[username];
    return aiEmployee?.skillSettings?.tools?.map(({ name }: { name: string }) => name) ?? [];
  }, [aiEmployeesMap, username]);

  const handleChange = (value: string[]) => {
    field.setValue(value.filter((tool) => defaultTools.includes(tool)));
  };

  const [radioValue, setRadioValue] = useState(RadioOptions.preset.value);
  const onRadioChange: RadioGroupProps['onChange'] = (e) => {
    setRadioValue(e.target.value);
    if (e.target.value === RadioOptions.preset.value) {
      field.setValue(undefined);
    } else {
      field.setValue(defaultTools);
    }
  };

  useEffect(() => {
    const hasInitialTools = Array.isArray(form.initialValues?.skillSettings?.tools);
    if (!hasInitialTools) {
      form.setValuesIn('skillSettings.tools', undefined);
    }
    setRadioValue(hasInitialTools ? RadioOptions.custom.value : RadioOptions.preset.value);
  }, [form]);

  return (
    <Space style={{ width: '100%' }} direction="vertical">
      <Radio.Group value={radioValue} onChange={onRadioChange} options={radioOptions} />
      {radioValue === RadioOptions.custom.value && (
        <RemoteSelect
          key={username}
          value={field.value}
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
});

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

export const SkillSettings: React.FC = () => {
  return (
    <SchemaComponent
      components={{ Skills, Tools }}
      schema={{
        type: 'void',
        properties: {
          skills: {
            title: tExpr('Skills', { ns: namespace }),
            type: 'array',
            'x-decorator': 'FormItem',
            'x-component': 'Skills',
            'x-decorator-props': {
              layout: 'horizontal',
              tooltip: tExpr('Configure the skills available to this node', {
                ns: namespace,
              }),
            },
          },
          tools: {
            title: tExpr('Tools', { ns: namespace }),
            type: 'array',
            'x-decorator': 'FormItem',
            'x-component': 'Tools',
            'x-decorator-props': {
              layout: 'horizontal',
              tooltip: tExpr('Configure the tools available to this node', {
                ns: namespace,
              }),
            },
          },
        },
      }}
    />
  );
};
