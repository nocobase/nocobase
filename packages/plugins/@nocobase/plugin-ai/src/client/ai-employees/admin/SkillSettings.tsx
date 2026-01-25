/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { List, Button, Dropdown, Tooltip, Card, Popover, Space, Switch, Flex } from 'antd';
import { InfoCircleOutlined, PlusOutlined, QuestionCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { useT } from '../../locale';
import { SchemaComponent, useAPIClient, useRequest, useToken } from '@nocobase/client';
import { Schema, useField } from '@formily/react';
import { Field } from '@formily/core';
import { Tool } from '../types';

const ToolInfo: React.FC<{
  title: string;
  description: string;
  schema?: any;
}> = ({ title, description, schema }) => {
  const t = useT();
  const { token } = useToken();
  return (
    <Card
      size="small"
      style={{
        minWidth: '300px',
        maxWidth: '400px',
      }}
      title={
        <>
          <div
            style={{
              marginTop: '4px',
            }}
          >
            {Schema.compile(title, { t })}
          </div>
          <div
            style={{
              color: token.colorTextSecondary,
              fontSize: token.fontSizeSM,
              fontWeight: 400,
              whiteSpace: 'pre-wrap',
            }}
          >
            {Schema.compile(description, { t })}
          </div>
        </>
      }
    >
      <>
        <div
          style={{
            fontWeight: token.fontWeightStrong,
          }}
        >
          {t('Parameters')}
        </div>
        <List
          itemLayout="vertical"
          dataSource={Object.entries(schema?.properties || {})}
          size="small"
          renderItem={([name, option]: [
            string,
            {
              name: string;
              type: string;
              title?: string;
              description?: string;
            },
          ]) => {
            return (
              <List.Item key={name}>
                <div>
                  <span
                    style={{
                      fontWeight: token.fontWeightStrong,
                    }}
                  >
                    {option.title || name}
                  </span>
                  <span
                    style={{
                      color: token.colorTextSecondary,
                      fontSize: token.fontSizeSM,
                      marginLeft: '4px',
                    }}
                  >
                    {option.type}
                  </span>
                  {schema.required?.includes(name) && (
                    <span
                      style={{
                        color: token.colorError,
                        fontSize: token.fontSizeSM,
                        marginLeft: '4px',
                      }}
                    >
                      {t('Required')}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    color: token.colorTextSecondary,
                    fontSize: token.fontSizeSM,
                  }}
                >
                  {option.description}
                </div>
              </List.Item>
            );
          }}
        />
      </>
    </Card>
  );
};

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
  const api = useAPIClient();
  const { data, loading } = useRequest<Tool[]>(() =>
    api
      .resource('aiTools')
      .list()
      .then((res) => res?.data?.data),
  );

  const handleAdd = (name: string) => {
    const skills = [...(field.value || [])];
    if (!skills.some((s) => s.name === name)) {
      skills.push({ name, autoCall: false });
    }
    field.value = skills;
  };

  const items =
    data?.map((item) => {
      const result: any = {
        key: item.group.groupName,
      };
      const itemProps = {
        title: item.group.title ?? '',
        description: item.group.description ?? '',
        name: item.group.groupName,
        isRoot: true,
      };
      if (item.tools) {
        result.label = <SkillsListItem {...itemProps} />;
        result.children = item.tools.map((child) => {
          return {
            key: child.name,
            label: <SkillsListItem {...child} />,
            onClick: () => handleAdd(child.name),
          };
        });
      } else {
        result.label = <SkillsListItem {...itemProps} />;
        result.onClick = () => {};
      }
      return result;
    }) || [];
  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          width: '100%',
          margin: '8px 0 16px 0',
        }}
      >
        <Dropdown
          menu={{
            items,
          }}
          placement="bottomRight"
        >
          <Button type="primary" icon={<PlusOutlined />}>
            {t('Add skill')}
            <Tooltip title={t('Tools available for LLM function calling')}>
              <QuestionCircleOutlined
                style={{
                  marginLeft: '4px',
                }}
              />
            </Tooltip>
          </Button>
        </Dropdown>
      </div>
      {!loading && (
        <List
          itemLayout="vertical"
          bordered
          dataSource={field.value || []}
          renderItem={(item: { name: string; autoCall?: boolean }) => {
            const tools = data?.flatMap((x) => x.tools) ?? [];
            const tool = tools.find((tool) => tool.name === item.name);
            if (!tool) {
              return null;
            }
            return (
              <List.Item
                key={tool.name}
                extra={
                  <Flex vertical={true} justify="end">
                    <Space>
                      <div
                        style={{
                          fontSize: token.fontSizeSM,
                        }}
                      >
                        {t('Auto usage')}
                        <Switch
                          style={{
                            marginLeft: '4px',
                            marginRight: '8px',
                          }}
                          size="small"
                          checked={item.autoCall}
                          onChange={(checked) => {
                            const updated = (field.value || []).map((s: { name: string; autoCall?: boolean }) =>
                              s.name === item.name ? { ...s, autoCall: checked } : s,
                            );
                            field.value = updated;
                          }}
                        />
                      </div>
                      <Popover
                        content={<ToolInfo {...tool} />}
                        placement="bottom"
                        arrow={false}
                        styles={{
                          body: {
                            padding: 0,
                            marginRight: '8px',
                          },
                        }}
                      >
                        <InfoCircleOutlined />
                      </Popover>
                      <Button
                        icon={<DeleteOutlined />}
                        variant="link"
                        color="default"
                        onClick={() => {
                          const skills = [...(field.value || [])];
                          const index = skills.findIndex((s) => s.name === tool.name);
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
                <div>{Schema.compile(tool.title, { t })}</div>
                <div
                  style={{
                    color: token.colorTextSecondary,
                    fontSize: token.fontSizeSM,
                  }}
                >
                  {Schema.compile(tool.description, { t })}
                </div>
              </List.Item>
            );
          }}
        />
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
                description: t('Auto skill description'),
              },
            },
          },
        },
      }}
    />
  );
};
