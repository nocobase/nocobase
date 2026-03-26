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
import { SchemaComponent, useCollectionRecordData, useToken } from '@nocobase/client';
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

export const Tools: React.FC = observer(() => {
  const t = useT();
  const { token } = useToken();
  const field = useField<Field>();
  const aiConfigRepository = useAIConfigRepository();
  const loading = aiConfigRepository.aiToolsLoading;
  const tools = aiConfigRepository.aiTools;
  const record = useCollectionRecordData();
  const isBuiltIn = record?.builtIn;

  useEffect(() => {
    aiConfigRepository.getAITools();
  }, [aiConfigRepository]);

  const handleAddTool = (name: string) => {
    console.log(name);
    const tools = [...(field.value || [])];
    if (!tools.some((s) => s.name === name)) {
      tools.push({ name, autoCall: false });
    }
    console.log(field.value);
    console.log(tools);
    field.value = tools;
    console.log(field.value);
  };

  const selectedTools = [...(field.value ?? [])];
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
        result.onClick = () => handleAddTool(item.definition.name);
        return result;
      }) || [];

  const toolsByName = new Map(tools.map((tool) => [tool.definition.name, tool]));
  const generalTools = tools.filter((tool) => tool.scope === 'GENERAL' && tool.from === 'loader');
  const specifiedTools = selectedTools.filter((item) => {
    const tool = toolsByName.get(item.name);
    return tool && tool.scope !== 'GENERAL' && tool.scope !== 'CUSTOM';
  });
  const customTools = selectedTools.filter((item) => {
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
                  key: 'general-tools',
                  label: (
                    <div>
                      <div style={{ fontWeight: token.fontWeightStrong, fontSize: token.fontSizeSM }}>
                        {t('General tools')}
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
          {isBuiltIn && specifiedTools.length > 0 && (
            <div>
              <Collapse
                ghost
                size="small"
                items={[
                  {
                    key: 'specific-tools',
                    label: (
                      <div>
                        <div style={{ fontWeight: token.fontWeightStrong, fontSize: token.fontSizeSM }}>
                          {t('Employee-specific tools')}
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
                        dataSource={specifiedTools}
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
                defaultActiveKey={['specific-tools']}
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
                  key: 'custom-tools',
                  label: (
                    <div>
                      <div style={{ fontWeight: token.fontWeightStrong, fontSize: token.fontSizeSM }}>
                        {t('Custom tools')}
                      </div>
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
                      dataSource={customTools}
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
                                      const tools = [...(field.value || [])];
                                      const index = tools.findIndex((s) => s.name === tool.definition.name);
                                      if (index !== -1) {
                                        tools.splice(index, 1);
                                        field.value = tools;
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
});

export const ToolSettings: React.FC = () => {
  return (
    <SchemaComponent
      components={{ Tools }}
      schema={{
        type: 'void',
        properties: {
          skillSettings: {
            type: 'object',
            properties: {
              tools: {
                type: 'array',
                'x-component': 'Tools',
                'x-decorator': 'FormItem',
              },
            },
          },
        },
      }}
    />
  );
};
