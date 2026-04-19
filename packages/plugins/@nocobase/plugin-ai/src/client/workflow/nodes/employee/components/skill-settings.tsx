/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect } from 'react';
import { observer, tExpr, useFlowContext } from '@nocobase/flow-engine';
import { RemoteSelect, SchemaComponent } from '@nocobase/client';
import { Schema, useField } from '@formily/react';
import { ArrayField } from '@formily/core';
import { Typography } from 'antd';
import { namespace, useT } from '../../../../locale';

const Skills: React.FC = observer(() => {
  const t = useT();
  const field = useField<ArrayField>();
  const ctx = useFlowContext();
  const username = ctx.model.props.aiEmployee.username;
  const aiEmployeesMap = ctx.aiConfigRepository.getAIEmployeesMap();
  useEffect(() => {
    const aiEmployee = aiEmployeesMap[username];
    const defaultSkills = aiEmployee?.skillSettings?.skills?.map((name) => name) ?? [];
    if (field.value?.length) {
      field.setValue(field.value.filter((tool) => defaultSkills.includes(tool)));
    }
  }, [aiEmployeesMap, field, username]);

  const handleChange = (value: string[]) => {
    field.setValue(value);
  };

  return (
    <RemoteSelect
      defaultValue={field.value}
      onChange={handleChange}
      manual={false}
      multiple={true}
      popupMatchSelectWidth
      placeholder={t('Use all AI employee skills')}
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
  );
});

const Tools: React.FC = observer(() => {
  const t = useT();
  const field = useField<ArrayField>();
  const ctx = useFlowContext();
  const username = ctx.model.props.aiEmployee.username;
  const aiEmployeesMap = ctx.aiConfigRepository.getAIEmployeesMap();
  useEffect(() => {
    const aiEmployee = aiEmployeesMap[username];
    const defaultTools = aiEmployee?.skillSettings?.tools?.map(({ name }) => name) ?? [];
    if (field.value?.length) {
      field.setValue(field.value.filter((tool) => defaultTools.includes(tool)));
    }
  }, [aiEmployeesMap, field, username]);

  const handleChange = (value: string[]) => {
    field.setValue(value);
  };

  return (
    <RemoteSelect
      defaultValue={field.value}
      onChange={handleChange}
      manual={false}
      multiple={true}
      popupMatchSelectWidth
      placeholder={t('Use all AI employee tools')}
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

export const SkillSettings: React.FC = observer(() => {
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
            'x-component': Skills,
            'x-decorator-props': {
              tooltip: tExpr('Restrict task skills', {
                ns: namespace,
              }),
            },
          },
          tools: {
            title: tExpr('Tools', { ns: namespace }),
            type: 'array',
            'x-decorator': 'FormItem',
            'x-component': Tools,
            'x-decorator-props': {
              tooltip: tExpr('Restrict task tools', {
                ns: namespace,
              }),
            },
          },
        },
      }}
    />
  );
});
