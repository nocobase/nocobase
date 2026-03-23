/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useActionContext, useAPIClient, useCollectionRecordData } from '@nocobase/client';
import { App, Card, Empty, List, Segmented, Space, Spin, Typography } from 'antd';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useT } from '../../../locale';
import { MCPSettingsContext, unwrapResponseData } from './context';

export type MCPToolPermission = 'ASK' | 'ALLOW';

export interface MCPToolEntry {
  name: string;
  title: string;
  description?: string;
  serverName: string;
  permission: MCPToolPermission;
}

interface MCPRecord {
  name: string;
  title?: string;
  description?: string;
}

const mcpToolPermissionOptions = [
  { label: 'Ask', value: 'ASK' },
  { label: 'Allow', value: 'ALLOW' },
] as const;

export const getMCPToolsByServer = (
  toolsMap: Record<string, MCPToolEntry[]> | null | undefined,
  serverName: string,
): MCPToolEntry[] => {
  const tools = toolsMap?.[serverName];
  return Array.isArray(tools) ? tools : [];
};

export const MCPToolsList: React.FC = () => {
  const t = useT();
  const api = useAPIClient();
  const { message } = App.useApp();
  const { visible } = useActionContext();
  const record = useCollectionRecordData<MCPRecord>();
  const { rebuilding } = useContext(MCPSettingsContext);
  const [tools, setTools] = useState<MCPToolEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingToolName, setUpdatingToolName] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const toolsCount = tools.length;
  const pageSize = 10;
  const messageRef = useRef(message);
  const tRef = useRef(t);

  messageRef.current = message;
  tRef.current = t;

  useEffect(() => {
    if (!visible) {
      return;
    }

    let cancelled = false;

    const loadTools = async () => {
      setLoading(true);
      try {
        const response = await api.resource('aiMcpClients').listTools();
        const nextTools = getMCPToolsByServer(
          unwrapResponseData<Record<string, MCPToolEntry[]> | null>(response, null),
          record.name,
        );
        if (!cancelled) {
          setCurrentPage(1);
          setTools(nextTools);
        }
      } catch (error: any) {
        if (!cancelled) {
          messageRef.current.error(error?.message || tRef.current('Failed to load MCP tools'));
          setCurrentPage(1);
          setTools([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadTools();

    return () => {
      cancelled = true;
    };
  }, [api, record.name, visible]);

  const handlePermissionChange = async (toolName: string, permission: MCPToolPermission) => {
    const previousTools = tools;
    setUpdatingToolName(toolName);
    setTools((currentTools) => currentTools.map((tool) => (tool.name === toolName ? { ...tool, permission } : tool)));

    try {
      await api.resource('aiMcpClients').updateToolPermission({
        values: {
          toolName,
          permission,
        },
      });
    } catch (error: any) {
      setTools(previousTools);
      messageRef.current.error(error?.message || tRef.current('Failed to update tool permission'));
    } finally {
      setUpdatingToolName(null);
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {loading ? (
        <div style={{ padding: '24px 0', textAlign: 'center' }}>
          <Spin />
        </div>
      ) : tools.length ? (
        <List
          itemLayout="vertical"
          dataSource={tools}
          pagination={{
            current: currentPage,
            pageSize,
            total: toolsCount,
            onChange: setCurrentPage,
            hideOnSinglePage: false,
            size: 'small',
            showTotal: (total) => t('Total {{count}} items', { count: total }),
          }}
          renderItem={(tool) => (
            <List.Item
              key={tool.name}
              extra={
                <div style={{ fontSize: 12, color: 'var(--nb-color-text-secondary)' }}>
                  {t('Permission')}
                  <Segmented
                    style={{ marginLeft: 8 }}
                    size="small"
                    options={mcpToolPermissionOptions.map((item) => ({ ...item, label: t(item.label) }))}
                    value={tool.permission}
                    disabled={rebuilding || updatingToolName === tool.name}
                    onChange={(value) => handlePermissionChange(tool.name, value as MCPToolPermission)}
                  />
                </div>
              }
            >
              <div>{tool.title}</div>
              {tool.description ? (
                <Typography.Paragraph
                  style={{ color: 'var(--nb-color-text-secondary)', fontSize: 12, marginBottom: 0 }}
                  ellipsis={{
                    rows: 3,
                    expandable: 'collapsible',
                  }}
                >
                  {tool.description}
                </Typography.Paragraph>
              ) : null}
            </List.Item>
          )}
        />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No data')} />
      )}
    </Space>
  );
};
