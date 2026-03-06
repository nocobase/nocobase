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

export const ToolsListItem: React.FC<{
  name: string;
  title: string;
  description: string;
  isRoot?: boolean;
}> = ({ name, title, description, isRoot }) => {
  const t = useT();
  const { token } = useToken();
  const field = useField<Field>();
  const { tools } = field.value ?? { tools: [] };
  const checked = tools.find((item: { name: string }) => item.name === name);

  return (
    <div
      style={{
        minWidth: '150px',
        maxWidth: '300px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <div>{Schema.compile(title, { t })}</div>
        {!isRoot && (
          <div>
            <Switch size="small" value={checked} disabled={checked} />
          </div>
        )}
      </div>
      <div style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>
        {Schema.compile(description, { t })}
      </div>
    </div>
  );
};

interface SelectedTool {
  name: string;
  autoCall?: boolean;
}

const permissionOptions = [
  { label: 'Ask', value: 'ASK' },
  { label: 'Allow', value: 'ALLOW' },
];

const getPermissionValue = (tool: ToolsEntry, item?: SelectedTool) => {
  if (tool.scope === 'CUSTOM') {
    return item?.autoCall ? 'ALLOW' : 'ASK';
  }
  return tool.defaultPermission === 'ALLOW' ? 'ALLOW' : 'ASK';
};

export const ToolListForSkill: React.FC<{
  toolNames: string[];
  tools: ToolsEntry[];
  field: any;
}> = ({ toolNames, tools, field }) => {
  const t = useT();
  const { token } = useToken();
  const toolsByName = new Map(tools.map((tool) => [tool.definition.name, tool]));
  const fieldTools = field?.value?.tools || [];

  const getPermissionValue = (toolName: string) => {
    const tool = toolsByName.get(toolName);
    const selectedTool = fieldTools.find((s: { name: string }) => s.name === toolName);
    if (!tool) return 'ASK';
    if (tool.scope === 'CUSTOM') {
      return selectedTool?.autoCall ? 'ALLOW' : 'ASK';
    }
    return tool.defaultPermission === 'ALLOW' ? 'ALLOW' : 'ASK';
  };

  const filteredTools = toolNames.map((name) => toolsByName.get(name)).filter(Boolean);

  if (filteredTools.length === 0) {
    return (
      <div style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM, padding: '8px 0' }}>
        {t('No tools bound to this skill')}
      </div>
    );
  }

  return (
    <List
      size="small"
      dataSource={filteredTools}
      renderItem={(tool: ToolsEntry) => (
        <List.Item style={{ padding: '8px 0' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: token.fontSizeSM }}>
              {Schema.compile(tool.introduction?.title ?? tool.definition.name, { t })}
            </div>
            <div style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>
              {Schema.compile(tool.introduction?.about ?? tool.definition.description ?? '', { t })}
            </div>
          </div>
          <div style={{ marginLeft: '16px' }}>
            <div style={{ fontSize: token.fontSizeSM }}>
              {t('Permission')}
              <Segmented
                style={{ marginLeft: '8px', marginRight: '8px' }}
                size="small"
                options={permissionOptions}
                value={getPermissionValue(tool.definition.name)}
                disabled
              />
            </div>
          </div>
        </List.Item>
      )}
    />
  );
};

export const GeneralSkills: React.FC<{
  skills: SkillsEntry[];
  tools: ToolsEntry[];
  field: any;
}> = ({ skills, tools, field }) => {
  const t = useT();
  const { token } = useToken();
  const generalSkills = skills.filter((skill) => skill.scope === 'GENERAL');

  const generalTools = tools.filter((tool) => tool.scope === 'GENERAL');
  if (generalTools?.length) {
    generalSkills.push({
      scope: 'GENERAL',
      name: 'general-tools',
      description: '',
      title: t('General tools'),
      about: t('Shared by all AI employees.'),
      tools: generalTools.map((tool) => tool.definition.name),
    });
  }

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
                    <Collapse ghost size="small">
                      <Collapse.Panel
                        key={skill.name}
                        header={
                          <div>
                            <div style={{ fontSize: token.fontSizeSM }}>
                              {Schema.compile(skill?.title ?? skill.name, { t })}
                            </div>
                            <div style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>
                              {Schema.compile(skill?.about ?? skill.description ?? '', { t })}
                            </div>
                          </div>
                        }
                      >
                        <ToolListForSkill toolNames={skill.tools || []} tools={tools} field={field} />
                      </Collapse.Panel>
                    </Collapse>
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
  selectedTools: SelectedTool[];
  skills: SkillsEntry[];
  tools: ToolsEntry[];
  field: any;
}> = ({ selectedSkills, selectedTools, skills, tools, field }) => {
  const t = useT();
  const { token } = useToken();
  const skillsByName = new Map(skills.map((skill) => [skill.name, skill]));
  const specifiedSkills = selectedSkills.map((name) => skillsByName.get(name));

  if (selectedTools?.length) {
    specifiedSkills.push({
      scope: 'SPECIFIED',
      name: 'employee-specified-tools',
      description: '',
      title: t('Employee-specific tools'),
      about: t('Only available to this AI employee.'),
      tools: selectedTools.map((tool) => tool.name),
    });
  }

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
                    <Collapse ghost size="small">
                      <Collapse.Panel
                        key={skill.name}
                        header={
                          <div>
                            <div style={{ fontSize: token.fontSizeSM }}>
                              {Schema.compile(skill?.title ?? skill.name, { t })}
                            </div>
                            <div style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>
                              {Schema.compile(skill?.about ?? skill.description ?? '', { t })}
                            </div>
                          </div>
                        }
                      >
                        <ToolListForSkill toolNames={skill.tools || []} tools={tools} field={field} />
                      </Collapse.Panel>
                    </Collapse>
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

export const CustomToolsSection: React.FC<{
  selectedTools: SelectedTool[];
  tools: ToolsEntry[];
  field: any;
}> = ({ selectedTools, tools, field }) => {
  const t = useT();
  const { token } = useToken();
  const toolsByName = new Map(tools.map((tool) => [tool.definition.name, tool]));
  const customTools = selectedTools.filter((item) => {
    const tool = toolsByName.get(item.name);
    return tool && tool.scope === 'CUSTOM';
  });
  const record = useCollectionRecordData();
  const isBuiltIn = record?.builtIn;

  const [customActiveKeys, setCustomActiveKeys] = useState<string[]>(
    isBuiltIn && customTools.length === 0 ? [] : ['custom-tools'],
  );
  const previousCustomLength = useRef(customTools.length);

  useEffect(() => {
    const wasEmpty = previousCustomLength.current === 0;
    if (isBuiltIn && customTools.length === 0) {
      setCustomActiveKeys([]);
    } else if (wasEmpty && customTools.length > 0) {
      setCustomActiveKeys(['custom-tools']);
    }
    previousCustomLength.current = customTools.length;
  }, [customTools.length, isBuiltIn]);

  const selectedNames = new Set(selectedTools.map((item: { name: string }) => item.name));
  const customAddTools =
    tools
      ?.filter((item) => item.scope === 'CUSTOM' && !selectedNames.has(item.definition.name))
      .map((item) => {
        const result: any = {
          key: item.definition.name,
        };
        const itemProps = {
          title: item.introduction.title ?? '',
          description: item.introduction.about ?? '',
          name: item.definition.name,
          isRoot: true,
        };
        result.label = <ToolsListItem {...itemProps} />;
        result.onClick = () => {
          const tools = [...(field.value?.tools || [])];
          if (!tools.some((s) => s.name === item.definition.name)) {
            tools.push({ name: item.definition.name, autoCall: false });
          }
          field.value = {
            ...(field.value ?? {}),
            tools,
          };
        };
        return result;
      }) || [];

  return (
    <Collapse
      ghost
      size="small"
      activeKey={customActiveKeys}
      onChange={(keys) => {
        const nextKeys = Array.isArray(keys) ? keys : [keys].filter(Boolean);
        setCustomActiveKeys(nextKeys as string[]);
      }}
      items={[
        {
          key: 'custom-tools',
          label: (
            <div>
              <div style={{ fontWeight: token.fontWeightStrong, fontSize: token.fontSizeSM }}>{t('Custom tools')}</div>
              <div style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>
                {t('Created by workflow. You can add/remove and set default permissions.')}
              </div>
            </div>
          ),
          extra: (
            <div
              onClick={(event) => {
                event.stopPropagation();
              }}
              onKeyDown={(event) => {
                event.stopPropagation();
              }}
            >
              <Dropdown
                menu={{
                  items: customAddTools,
                }}
                placement="bottomRight"
                disabled={customAddTools.length === 0}
              >
                <Button type="primary" icon={<PlusOutlined />}>
                  {t('Add tool')}
                </Button>
              </Dropdown>
            </div>
          ),
          children: (
            <List
              itemLayout="vertical"
              bordered
              dataSource={customTools}
              renderItem={(item: SelectedTool) => {
                const tool = toolsByName.get(item.name);
                if (!tool) {
                  return null;
                }
                return (
                  <List.Item
                    key={tool.definition.name}
                    extra={
                      <Flex vertical={true} justify="end">
                        <Space>
                          <div style={{ fontSize: token.fontSizeSM }}>
                            {t('Permission')}
                            <Segmented
                              style={{ marginLeft: '8px', marginRight: '8px' }}
                              size="small"
                              options={permissionOptions}
                              value={getPermissionValue(tool, item)}
                              onChange={(value) => {
                                const updated = (field.value?.tools || []).map(
                                  (s: { name: string; autoCall?: boolean }) =>
                                    s.name === item.name ? { ...s, autoCall: value === 'ALLOW' } : s,
                                );
                                field.value = {
                                  ...(field.value ?? {}),
                                  tools: updated,
                                };
                              }}
                            />
                          </div>
                          <Button
                            icon={<DeleteOutlined />}
                            variant="link"
                            color="default"
                            onClick={() => {
                              const tools = [...(field.value?.tools || [])];
                              const index = tools.findIndex((s) => s.name === tool.definition.name);
                              if (index !== -1) {
                                tools.splice(index, 1);
                                field.value = {
                                  ...(field.value ?? {}),
                                  tools,
                                };
                              }
                            }}
                          />
                        </Space>
                      </Flex>
                    }
                  >
                    <div>{Schema.compile(tool.introduction.title, { t })}</div>
                    <div style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>
                      {Schema.compile(tool.introduction.about, { t })}
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

export const SettingsPanel: React.FC = observer(() => {
  const field = useField<Field>();
  const aiConfigRepository = useAIConfigRepository();
  const loading = aiConfigRepository.aiToolsLoading;
  const skillsLoading = aiConfigRepository.aiSkillsLoading;
  const aiTools = aiConfigRepository.aiTools;
  const aiSkills = aiConfigRepository.aiSkills;
  const record = useCollectionRecordData();
  const isBuiltIn = record?.builtIn;

  const { skills = [], tools = [] } = field.value ?? {
    skills: [],
    tools: [],
  };

  useEffect(() => {
    aiConfigRepository.getAITools();
    aiConfigRepository.getAISkills();
  }, [aiConfigRepository]);

  const selectedTools = [...tools];
  const selectedSkills = [...skills];

  const skillsByName = new Map(aiSkills.map((skill) => [skill.name, skill]));
  const specifiedSkills = selectedSkills.filter((item) => {
    const skill = skillsByName.get(item);
    return skill && skill.scope === 'SPECIFIED';
  });

  const toolsByName = new Map(aiTools.map((tool) => [tool.definition.name, tool]));
  const specifiedTools = selectedTools.filter((item) => {
    const tool = toolsByName.get(item.name);
    return tool && tool.scope === 'SPECIFIED';
  });

  return (
    <>
      {!loading && !skillsLoading && (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <GeneralSkills skills={aiSkills} tools={aiTools} field={field} />
          {isBuiltIn && specifiedSkills.length > 0 && (
            <SpecifiedSkills
              selectedSkills={specifiedSkills}
              selectedTools={specifiedTools}
              skills={aiSkills}
              tools={aiTools}
              field={field}
            />
          )}
          <CustomToolsSection selectedTools={selectedTools} tools={aiTools} field={field} />
        </Space>
      )}
    </>
  );
});

export const SkillSettings: React.FC = () => {
  return (
    <SchemaComponent
      components={{ SettingsPanel }}
      schema={{
        type: 'void',
        properties: {
          skillSettings: {
            type: 'object',
            'x-component': 'SettingsPanel',
            properties: {
              skills: {
                type: 'array',
              },
              tools: {
                type: 'array',
              },
            },
          },
        },
      }}
    />
  );
};
