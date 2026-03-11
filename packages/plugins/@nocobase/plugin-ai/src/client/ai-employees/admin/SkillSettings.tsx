/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef, useState } from 'react';
import { List, Button, Dropdown, Space, Segmented, Flex, Collapse, Switch } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useT } from '../../locale';
import { SchemaComponent, useCollectionRecordData, useToken, ToolsEntry, SkillsEntry } from '@nocobase/client';
import { Schema, useField } from '@formily/react';
import { Field } from '@formily/core';
import { useAIConfigRepository } from '../../repositories/hooks/useAIConfigRepository';
import { observer } from '@nocobase/flow-engine';

export const GeneralSkills: React.FC<{
  skills: SkillsEntry[];
}> = ({ skills }) => {
  const t = useT();
  const { token } = useToken();
  const generalSkills = skills.filter((skill) => skill.scope === 'GENERAL');

  return (
    <Collapse
      ghost
      size="small"
      defaultActiveKey={[]}
      items={[
        {
          key: 'general-skills',
          label: (
            <div>
              <div style={{ fontWeight: token.fontWeightStrong, fontSize: token.fontSizeSM }}>
                {t('General skills')}
              </div>
              <div style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>
                {t('Shared by all AI employees.')}
              </div>
            </div>
          ),
          children: (
            <List
              itemLayout="vertical"
              size="small"
              dataSource={generalSkills}
              renderItem={(skill: SkillsEntry) => {
                return (
                  <List.Item key={skill.name}>
                    <div style={{ fontSize: token.fontSizeSM }}>
                      {Schema.compile(skill?.title ?? skill.name, { t })}
                    </div>
                    <div style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>
                      {Schema.compile(skill?.about ?? skill.description ?? '', { t })}
                    </div>
                  </List.Item>
                );
              }}
            />
          ),
        },
      ]}
    />
  );
};

export const SpecifiedSkills: React.FC<{
  selectedSkills: string[];
  skills: SkillsEntry[];
}> = ({ selectedSkills, skills }) => {
  const t = useT();
  const { token } = useToken();
  const skillsByName = new Map(skills.map((skill) => [skill.name, skill]));
  const specifiedSkills = selectedSkills.map((name) => skillsByName.get(name));

  return (
    <Collapse
      ghost
      size="small"
      items={[
        {
          key: 'specific-skills',
          label: (
            <div>
              <div style={{ fontWeight: token.fontWeightStrong, fontSize: token.fontSizeSM }}>
                {t('Employee-specific skills')}
              </div>
              <div style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>
                {t('Only available to this AI employee.')}
              </div>
            </div>
          ),
          children: (
            <List
              itemLayout="vertical"
              size="small"
              dataSource={specifiedSkills}
              renderItem={(skill: SkillsEntry) => {
                return (
                  <List.Item key={skill.name}>
                    <div style={{ fontSize: token.fontSizeSM }}>
                      {Schema.compile(skill?.title ?? skill.name, { t })}
                    </div>
                    <div style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>
                      {Schema.compile(skill?.about ?? skill.description ?? '', { t })}
                    </div>
                  </List.Item>
                );
              }}
            />
          ),
        },
      ]}
      defaultActiveKey={['specific-skills']}
    />
  );
};

export const Skills: React.FC = observer(() => {
  const field = useField<Field>();
  const aiConfigRepository = useAIConfigRepository();
  const loading = aiConfigRepository.aiSkillsLoading;
  const aiSkills = aiConfigRepository.aiSkills;
  const record = useCollectionRecordData();
  const isBuiltIn = record?.builtIn;

  const skills = field.value ?? [];

  useEffect(() => {
    aiConfigRepository.getAISkills();
  }, [aiConfigRepository]);

  const selectedSkills = [...skills];

  const skillsByName = new Map(aiSkills.map((skill) => [skill.name, skill]));
  const specifiedSkills = selectedSkills.filter((item) => {
    const skill = skillsByName.get(item);
    return skill && skill.scope === 'SPECIFIED';
  });

  return (
    <>
      {!loading && (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <GeneralSkills skills={aiSkills} />
          {isBuiltIn && specifiedSkills.length > 0 && (
            <SpecifiedSkills selectedSkills={specifiedSkills} skills={aiSkills} />
          )}
        </Space>
      )}
    </>
  );
});

export const SkillSettings: React.FC = () => {
  return (
    <SchemaComponent
      components={{ Skills }}
      schema={{
        type: 'void',
        properties: {
          skillSettings: {
            type: 'object',
            properties: {
              skills: {
                type: 'array',
                'x-component': 'Skills',
                'x-decorator': 'FormItem',
              },
            },
          },
        },
      }}
    />
  );
};
