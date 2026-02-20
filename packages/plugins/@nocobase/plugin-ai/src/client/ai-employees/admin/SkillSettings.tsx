/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef, useState } from 'react';
import { List, Button, Dropdown, Tooltip, Space, Segmented, Flex, Collapse, Switch } from 'antd';
import { PlusOutlined, QuestionCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { useT } from '../../locale';
import { SchemaComponent, useCollectionRecordData, useToken, useTools } from '@nocobase/client';
import { Schema, useField } from '@formily/react';
import { Field } from '@formily/core';

export const SkillsListItem: React.FC<{
  name: string;
  title: string;
  description: string;
  isRoot?: boolean;
}> = ({ name, title, description, isRoot }) => {
  const t = useT();
  const { token } = useToken();
  const field = useField<Field>();
  const checked = field.value?.find((item: { name: string }) => item.name === name);

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

export const Skills: React.FC = () => {
  const t = useT();
  const { token } = useToken();
  const field = useField<Field>();
  const { tools = [], loading } = useTools();
  const record = useCollectionRecordData();
  const isBuiltIn = record?.builtIn;

  const handleAdd = (name: string) => {
    const skills = [...(field.value || [])];
    if (!skills.some((s) => s.name === name)) {
      skills.push({ name, autoCall: false });
    }
    field.value = skills;
  };

  const selectedSkills = [...(field.value ?? [])];
  const selectedNames = new Set(selectedSkills.map((item: { name: string }) => item.name));

  const customAddItems =
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
        result.label = <SkillsListItem {...itemProps} />;
        result.onClick = () => handleAdd(item.definition.name);
        return result;
      }) || [];

  const toolsByName = new Map(tools.map((tool) => [tool.definition.name, tool]));
  const generalTools = tools.filter((tool) => tool.scope === 'GENERAL');
  const specifiedSkills = selectedSkills.filter((item) => {
    const tool = toolsByName.get(item.name);
    return tool && tool.scope !== 'GENERAL' && tool.scope !== 'CUSTOM';
  });
  const customSkills = selectedSkills.filter((item) => {
    const tool = toolsByName.get(item.name);
    return tool && tool.scope === 'CUSTOM';
  });

  const permissionOptions = [
    { label: t('Ask'), value: 'ASK' },
    { label: t('Allow'), value: 'ALLOW' },
  ];

  const getPermissionValue = (tool: any, item?: { autoCall?: boolean }) => {
    if (tool.scope === 'CUSTOM') {
      return item?.autoCall ? 'ALLOW' : 'ASK';
    }
    return tool.defaultPermission === 'ALLOW' ? 'ALLOW' : 'ASK';
  };

  const [customActiveKeys, setCustomActiveKeys] = useState<string[]>(
    isBuiltIn && customSkills.length === 0 ? [] : ['custom-skills'],
  );
  const previousCustomLength = useRef(customSkills.length);

  useEffect(() => {
    const wasEmpty = previousCustomLength.current === 0;
    if (isBuiltIn && customSkills.length === 0) {
      setCustomActiveKeys([]);
    } else if (wasEmpty && customSkills.length > 0) {
      setCustomActiveKeys(['custom-skills']);
    }
    previousCustomLength.current = customSkills.length;
  }, [customSkills.length, isBuiltIn]);

  return (
    <>
      {!loading && (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
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
                        {t('Shared by all AI employees. Read-only.')}
                      </div>
                    </div>
                  ),
                  children: (
                    <List
                      itemLayout="vertical"
                      size="small"
                      dataSource={generalTools}
                      renderItem={(tool: any) => {
                        return (
                          <List.Item
                            key={tool.definition.name}
                            extra={
                              <Flex vertical={true} justify="end">
                                <div style={{ fontSize: token.fontSizeSM, color: token.colorTextSecondary }}>
                                  {t('Permission')}
                                  <Segmented
                                    style={{ marginLeft: '8px' }}
                                    size="small"
                                    options={permissionOptions}
                                    value={getPermissionValue(tool)}
                                    disabled
                                  />
                                </div>
                              </Flex>
                            }
                          >
                            <div style={{ fontSize: token.fontSizeSM }}>
                              {Schema.compile(tool.introduction.title, { t })}
                            </div>
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
          </div>
          {isBuiltIn && specifiedSkills.length > 0 && (
            <div>
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
                          {t('Only available to this AI employee. Read-only.')}
                        </div>
                      </div>
                    ),
                    children: (
                      <List
                        itemLayout="vertical"
                        size="small"
                        dataSource={specifiedSkills}
                        renderItem={(item: { name: string; autoCall?: boolean }) => {
                          const tool = toolsByName.get(item.name);
                          if (!tool) {
                            return null;
                          }
                          return (
                            <List.Item
                              key={tool.definition.name}
                              extra={
                                <Flex vertical={true} justify="end">
                                  <div style={{ fontSize: token.fontSizeSM, color: token.colorTextSecondary }}>
                                    {t('Permission')}
                                    <Segmented
                                      style={{ marginLeft: '8px' }}
                                      size="small"
                                      options={permissionOptions}
                                      value={getPermissionValue(tool, item)}
                                      disabled
                                    />
                                  </div>
                                </Flex>
                              }
                            >
                              <div style={{ fontSize: token.fontSizeSM }}>
                                {Schema.compile(tool.introduction.title, { t })}
                              </div>
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
                defaultActiveKey={['specific-skills']}
              />
            </div>
          )}
          <div>
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
                  key: 'custom-skills',
                  label: (
                    <div>
                      <div style={{ fontWeight: token.fontWeightStrong, fontSize: token.fontSizeSM }}>
                        {t('Custom skills')}
                      </div>
                      <div style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>
                        {t('Created via workflow. You can add/remove and set default permissions.')}
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
                          items: customAddItems,
                        }}
                        placement="bottomRight"
                        disabled={customAddItems.length === 0}
                      >
                        <Button type="primary" icon={<PlusOutlined />}>
                          {t('Add skill')}
                          {/* <Tooltip title={t('Tools available for LLM function calling')}> */}
                          {/*   <QuestionCircleOutlined style={{ marginLeft: '4px' }} /> */}
                          {/* </Tooltip> */}
                        </Button>
                      </Dropdown>
                    </div>
                  ),
                  children: (
                    <List
                      itemLayout="vertical"
                      bordered
                      dataSource={customSkills}
                      renderItem={(item: { name: string; autoCall?: boolean }) => {
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
                                        const updated = (field.value || []).map(
                                          (s: { name: string; autoCall?: boolean }) =>
                                            s.name === item.name ? { ...s, autoCall: value === 'ALLOW' } : s,
                                        );
                                        field.value = updated;
                                      }}
                                    />
                                  </div>
                                  <Button
                                    icon={<DeleteOutlined />}
                                    variant="link"
                                    color="default"
                                    onClick={() => {
                                      const skills = [...(field.value || [])];
                                      const index = skills.findIndex((s) => s.name === tool.definition.name);
                                      if (index !== -1) {
                                        skills.splice(index, 1);
                                        field.value = skills;
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
          </div>
        </Space>
      )}
    </>
  );
};

export const SkillSettings: React.FC = () => {
  const t = useT();
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
