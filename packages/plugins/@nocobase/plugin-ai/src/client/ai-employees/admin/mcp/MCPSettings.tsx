/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ActionContextProvider,
  CollectionRecordProvider,
  ExtendCollectionsProvider,
  SchemaComponent,
  useActionContext,
  useAPIClient,
  useCollectionRecordData,
  useRequest,
  useToken,
} from '@nocobase/client';
import { css } from '@emotion/css';
import {
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  ReloadOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { App, Button, Space, Switch, Tag, Alert, Spin, Collapse, List, Flex, Segmented, Empty, Dropdown } from 'antd';
import { createForm } from '@formily/core';
import { observer, useForm, Schema } from '@formily/react';
import React, { createContext, useContext, useMemo, useRef, useState, useCallback, useEffect } from 'react';
import aiMcpClients from '../../../../collections/ai-mcp-clients';
import { useT } from '../../../locale';
import { createMCPSchema, editMCPDrawerSchema } from './schemas';

type MCPTransport = 'stdio' | 'http' | 'sse';

const transportOptions = [
  { label: 'stdio', value: 'stdio' },
  { label: 'HTTP (Streamable)', value: 'http' },
  { label: 'HTTP + SSE (Legacy)', value: 'sse' },
];

const keyValueRowClassName = css`
  & > .ant-space-item:first-child,
  & > .ant-space-item:last-child {
    flex-shrink: 0;
  }

  & > .ant-space-item:first-child,
  & > .ant-space-item:nth-of-type(2) {
    flex: 1;
  }
`;

const mapObjectToEntries = (value: Record<string, any> | null | undefined) =>
  Object.entries(value || {}).map(([name, entryValue]) => ({
    name,
    value: entryValue == null ? '' : String(entryValue),
  }));

const mapEntriesToObject = (value: Array<{ name?: string; value?: string }> | null | undefined) =>
  (Array.isArray(value) ? value : []).reduce<Record<string, string>>((result, item) => {
    if (!item?.name) {
      return result;
    }
    result[item.name] = item.value || '';
    return result;
  }, {});

const sanitizeMCPValues = (values: Record<string, any>) => {
  const transport = values.transport as MCPTransport;
  const nextValues = {
    ...values,
    args:
      typeof values.args === 'string'
        ? values.args
            .split(' ')
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
        : Array.isArray(values.args)
          ? values.args
          : [],
    env: mapEntriesToObject(values.env),
    headers: mapEntriesToObject(values.headers),
    restart:
      values.restart && typeof values.restart === 'object' && !Array.isArray(values.restart) ? values.restart : {},
  };

  if (transport === 'stdio') {
    return {
      ...nextValues,
      url: null,
      headers: {},
    };
  }

  return {
    ...nextValues,
    command: null,
    args: [],
    env: {},
  };
};

const useCreateFormProps = () => {
  const { visible } = useActionContext();
  const initialValues = useMemo(
    () => ({
      enabled: true,
      transport: 'stdio',
      args: '',
      env: [],
      headers: [],
      restart: {},
    }),
    [],
  );
  const form = useMemo(
    () =>
      createForm({
        initialValues,
      }),
    [initialValues],
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    form.setInitialValues(initialValues);
    form.reset();
  }, [form, initialValues, visible]);

  return { form };
};

const useEditFormProps = () => {
  const record = useCollectionRecordData();
  const { visible } = useActionContext();
  const initialValues = useMemo(
    () => ({
      ...record,
      args: Array.isArray(record?.args) ? record.args.join(' ') : '',
      env: mapObjectToEntries(record?.env),
      headers: mapObjectToEntries(record?.headers),
      restart:
        record?.restart && typeof record.restart === 'object' && !Array.isArray(record.restart) ? record.restart : {},
    }),
    [record],
  );
  const form = useMemo(
    () =>
      createForm({
        initialValues,
      }),
    [initialValues],
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    form.setInitialValues(initialValues);
    form.reset();
  }, [form, initialValues, visible]);

  return { form };
};

const useCancelActionProps = () => {
  const { setVisible } = useActionContext();

  return {
    type: 'default',
    onClick() {
      setVisible(false);
    },
  };
};

type Permission = 'ASK' | 'ALLOW';

interface MCPRecord {
  name: string;
  title?: string;
  description?: string;
  enabled?: boolean;
  transport: MCPTransport;
  command?: string | null;
  url?: string | null;
  args?: string[];
  env?: Record<string, string>;
  headers?: Record<string, string>;
  restart?: Record<string, any>;
}

interface MCPTool {
  name: string;
  title: string;
  description?: string;
  permission: Permission;
  serverName: string;
}

const unwrapResponseData = <T,>(response: any, fallback: T): T => response?.data?.data ?? response?.data ?? fallback;

interface MCPSettingsContextValue {
  refreshMCPs: () => Promise<any>;
  refreshTools: () => Promise<any>;
  rebuildClient: () => Promise<void>;
  rebuilding: boolean;
}

const MCPSettingsContext = createContext<MCPSettingsContextValue>({
  refreshMCPs: async () => undefined,
  refreshTools: async () => undefined,
  rebuildClient: async () => undefined,
  rebuilding: false,
});

interface TestConnectionResultData {
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
  toolsCount?: number;
  tools?: string[];
  toolsTruncated?: boolean;
}

interface TestConnectionContextValue {
  result: TestConnectionResultData | null;
  loading: boolean;
  setResult: (result: TestConnectionResultData | null) => void;
  setLoading: (loading: boolean) => void;
}

const TestConnectionContext = createContext<TestConnectionContextValue>({
  result: null,
  loading: false,
  setResult: () => {},
  setLoading: () => {},
});

const useEnsureConnectionBeforeSubmit = () => {
  const api = useAPIClient();
  const t = useT();
  const { setResult, setLoading } = useContext(TestConnectionContext);

  return async (values: Record<string, any>) => {
    setLoading(true);
    setResult(null);
    try {
      const payload = sanitizeMCPValues(values);
      const { data } = await api.resource('aiMcpClients').testConnection({
        values: payload,
      });
      const result = unwrapResponseData<TestConnectionResultData | null>({ data }, null);
      setResult(result);
      return !!result?.success;
    } catch (error: any) {
      setResult({
        success: false,
        error: error?.message || t('An error occurred while testing the connection'),
      });
      return false;
    } finally {
      setLoading(false);
    }
  };
};

const useCreateActionProps = () => {
  const { setVisible } = useActionContext();
  const { message } = App.useApp();
  const form = useForm();
  const api = useAPIClient();
  const t = useT();
  const { loading: testLoading } = useContext(TestConnectionContext);
  const { rebuildClient, refreshMCPs, refreshTools, rebuilding } = useContext(MCPSettingsContext);
  const ensureConnectionBeforeSubmit = useEnsureConnectionBeforeSubmit();

  return {
    type: 'primary',
    loading: rebuilding || testLoading,
    async onClick() {
      await form.submit();
      const passed = await ensureConnectionBeforeSubmit(form.values);
      if (!passed) {
        return;
      }
      await api.resource('aiMcpClients').create({
        values: sanitizeMCPValues(form.values),
      });
      await rebuildClient();
      await Promise.all([refreshMCPs(), refreshTools()]);
      message.success(t('Saved successfully'));
      setVisible(false);
      form.reset();
    },
  };
};

const useEditActionProps = () => {
  const { setVisible } = useActionContext();
  const { message } = App.useApp();
  const form = useForm();
  const api = useAPIClient();
  const record = useCollectionRecordData() as MCPRecord;
  const t = useT();
  const { loading: testLoading } = useContext(TestConnectionContext);
  const { rebuildClient, refreshMCPs, refreshTools, rebuilding } = useContext(MCPSettingsContext);
  const ensureConnectionBeforeSubmit = useEnsureConnectionBeforeSubmit();

  return {
    type: 'primary',
    loading: rebuilding || testLoading,
    async onClick() {
      await form.submit();
      const passed = await ensureConnectionBeforeSubmit(form.values);
      if (!passed) {
        return;
      }
      const values = sanitizeMCPValues(form.values);
      await api.resource('aiMcpClients').update({
        values,
        filterByTk: record.name,
      });
      await rebuildClient();
      await Promise.all([refreshMCPs(), refreshTools()]);
      message.success(t('Saved successfully'));
      setVisible(false);
      form.reset();
    },
  };
};

const TestConnectionButton: React.FC = observer(
  () => {
    const form = useForm();
    const api = useAPIClient();
    const { setResult, loading, setLoading } = useContext(TestConnectionContext);
    const t = useT();

    const handleTest = async () => {
      setLoading(true);
      setResult(null);
      try {
        const values = sanitizeMCPValues(form.values);
        const { data } = await api.resource('aiMcpClients').testConnection({
          values,
        });
        setResult(unwrapResponseData<TestConnectionResultData | null>({ data }, null));
      } catch (error: any) {
        setResult({
          success: false,
          error: error?.message || t('An error occurred while testing the connection'),
        });
      } finally {
        setLoading(false);
      }
    };

    return (
      <Button type="default" loading={loading} onClick={handleTest}>
        {t('Test flight')}
      </Button>
    );
  },
  { displayName: 'TestConnectionButton' },
);

const TestConnectionResult: React.FC = observer(
  () => {
    const { result, loading } = useContext(TestConnectionContext);
    const t = useT();

    if (loading) {
      return (
        <div style={{ padding: '16px 0', textAlign: 'center' }}>
          <Spin tip={t('Testing connection...')} />
        </div>
      );
    }

    if (!result) {
      return null;
    }

    if (result.success) {
      return (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          style={{ marginTop: 16 }}
          message={t('Connection Successful')}
          description={
            <div>
              <p>{t('Successfully connected to MCP server')}</p>
              <p>
                {t('Tools found')}: {result.toolsCount}
              </p>
              {result.tools && result.tools.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <p style={{ fontWeight: 'bold', marginBottom: 4 }}>{t('Tools')}:</p>
                  <div style={{ maxHeight: 120, overflow: 'auto' }}>
                    {result.tools.map((tool) => (
                      <Tag key={tool} style={{ margin: '2px' }}>
                        {tool}
                      </Tag>
                    ))}
                    {result.toolsTruncated && <span>...</span>}
                  </div>
                </div>
              )}
            </div>
          }
        />
      );
    }

    return (
      <Alert
        type="error"
        showIcon
        icon={<CloseCircleOutlined />}
        style={{ marginTop: 16 }}
        message={t('Connection Failed')}
        description={
          <div>
            <p>{result.error || t('Failed to connect to MCP server')}</p>
            {result.details && (
              <pre style={{ maxHeight: 100, overflow: 'auto', fontSize: 11, margin: 0 }}>{result.details}</pre>
            )}
          </div>
        }
      />
    );
  },
  { displayName: 'TestConnectionResult' },
);

const AddNew = () => {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [result, setResult] = useState<TestConnectionResultData | null>(null);
  const [loading, setLoading] = useState(false);

  const contextValue = useMemo(
    () => ({
      result,
      loading,
      setResult,
      setLoading,
    }),
    [result, loading],
  );

  return (
    <ActionContextProvider value={{ visible, setVisible }}>
      <Button
        icon={<PlusOutlined />}
        type="primary"
        onClick={() => {
          setResult(null);
          setLoading(false);
          setVisible(true);
        }}
      >
        {t('Add new')}
      </Button>
      <TestConnectionContext.Provider value={contextValue}>
        <SchemaComponent
          components={{ TestConnectionButton, TestConnectionResult, Space }}
          scope={{
            t,
            transportOptions,
            keyValueRowClassName,
            useCreateFormProps,
            useCancelActionProps,
            useCreateActionProps,
          }}
          schema={createMCPSchema}
        />
      </TestConnectionContext.Provider>
    </ActionContextProvider>
  );
};

const EditMCP: React.FC<{
  record: MCPRecord;
  visible: boolean;
  setVisible: (visible: boolean) => void;
}> = ({ record, visible, setVisible }) => {
  const t = useT();
  const [result, setResult] = useState<TestConnectionResultData | null>(null);
  const [loading, setLoading] = useState(false);

  const contextValue = useMemo(
    () => ({
      result,
      loading,
      setResult,
      setLoading,
    }),
    [result, loading],
  );

  return (
    <CollectionRecordProvider record={record}>
      <ActionContextProvider value={{ visible, setVisible }}>
        <TestConnectionContext.Provider value={contextValue}>
          <SchemaComponent
            components={{ TestConnectionButton, TestConnectionResult, Space }}
            scope={{
              t,
              transportOptions,
              keyValueRowClassName,
              useEditFormProps,
              useCancelActionProps,
              useEditActionProps,
            }}
            schema={editMCPDrawerSchema}
          />
        </TestConnectionContext.Provider>
      </ActionContextProvider>
    </CollectionRecordProvider>
  );
};

const MCPRowExtra: React.FC<{
  record: MCPRecord;
  enabled: boolean;
  loading: boolean;
  rebuilding: boolean;
  onEdit: (record: MCPRecord) => void;
  onToggleEnabled: (record: MCPRecord, enabled: boolean) => Promise<void>;
  onDelete: (record: MCPRecord) => Promise<void>;
}> = ({ record, enabled, loading, rebuilding, onEdit, onToggleEnabled, onDelete }) => {
  const t = useT();
  const { modal } = App.useApp();
  const disabled = loading || rebuilding;

  return (
    <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
      <Space size="middle">
        <Switch
          size="small"
          checked={enabled}
          loading={loading}
          disabled={disabled}
          onChange={(checked) => onToggleEnabled(record, checked)}
        />
        <Dropdown
          trigger={['hover']}
          placement="bottomRight"
          disabled={disabled}
          menu={{
            items: [
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: t('Edit'),
              },
              {
                key: 'delete',
                icon: <DeleteOutlined />,
                danger: true,
                label: t('Delete'),
              },
            ],
            onClick: ({ key, domEvent }) => {
              domEvent.stopPropagation();
              if (key === 'edit') {
                onEdit(record);
                return;
              }
              modal.confirm({
                title: t('Delete record'),
                content: t('Are you sure you want to delete it?'),
                okButtonProps: {
                  loading,
                },
                onOk: () => onDelete(record),
              });
            },
          }}
        >
          <Button type="text" size="small" icon={<MoreOutlined />} loading={loading} disabled={disabled} />
        </Dropdown>
      </Space>
    </div>
  );
};

const MCPToolsList: React.FC<{
  tools: MCPTool[];
  onPermissionChange: (toolName: string, permission: Permission) => Promise<void>;
}> = ({ tools, onPermissionChange }) => {
  const t = useT();
  const { token } = useToken();

  const permissionOptions = [
    { label: t('Ask'), value: 'ASK' },
    { label: t('Allow'), value: 'ALLOW' },
  ];

  if (!tools.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No tools')} />;
  }

  return (
    <List
      itemLayout="vertical"
      size="small"
      dataSource={tools}
      renderItem={(tool) => (
        <List.Item
          key={tool.name}
          extra={
            <Flex vertical justify="end">
              <div style={{ fontSize: token.fontSizeSM, color: token.colorTextSecondary }}>
                {t('Permission')}
                <Segmented
                  style={{ marginLeft: 8 }}
                  size="small"
                  options={permissionOptions}
                  value={tool.permission}
                  onChange={(value) => onPermissionChange(tool.name, value as Permission)}
                />
              </div>
            </Flex>
          }
        >
          <div style={{ fontSize: token.fontSizeSM }}>{Schema.compile(tool.title || tool.name, { t })}</div>
          <div style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>
            {Schema.compile(tool.description || '', { t })}
          </div>
        </List.Item>
      )}
    />
  );
};

const MCPList: React.FC = () => {
  const t = useT();
  const api = useAPIClient();
  const { message } = App.useApp();
  const { token } = useToken();
  const rebuildTailRef = useRef<Promise<void>>(Promise.resolve());
  const rebuildPendingCountRef = useRef(0);
  const [rebuilding, setRebuilding] = useState(false);
  const [rowLoadingMap, setRowLoadingMap] = useState<Record<string, boolean>>({});
  const [editingRecord, setEditingRecord] = useState<MCPRecord | null>(null);

  const setRowLoading = (recordName: string, loading: boolean) => {
    setRowLoadingMap((prev) => {
      if (loading) {
        return {
          ...prev,
          [recordName]: true,
        };
      }
      const next = { ...prev };
      delete next[recordName];
      return next;
    });
  };

  const rebuildClient = useCallback(async () => {
    rebuildPendingCountRef.current += 1;
    setRebuilding(true);
    const task = rebuildTailRef.current
      .catch(() => undefined)
      .then(async () => {
        try {
          await api.resource('aiMcpClients').rebuildClient();
        } catch (error) {
          // Ignore errors silently
        }
      });

    rebuildTailRef.current = task.finally(() => {
      rebuildPendingCountRef.current -= 1;
      if (rebuildPendingCountRef.current === 0) {
        setRebuilding(false);
      }
    });

    return task;
  }, [api]);

  const mcpRequest = useRequest(
    async () => {
      const response = await api.resource('aiMcpClients').list({ paginate: false });
      return unwrapResponseData<MCPRecord[]>(response, []);
    },
    {
      refreshDeps: [api],
    },
  );

  const toolsRequest = useRequest(
    async () => {
      const response = await api.resource('aiMcpClients').listTools();
      return unwrapResponseData<Record<string, MCPTool[]>>(response, {});
    },
    {
      refreshDeps: [api],
    },
  );

  const handleToggleEnabled = async (record: MCPRecord, enabled: boolean) => {
    setRowLoading(record.name, true);
    try {
      await api.resource('aiMcpClients').update({
        filterByTk: record.name,
        values: { enabled },
      });
      await rebuildClient();
      await Promise.all([mcpRequest.refresh(), toolsRequest.refresh()]);
    } finally {
      setRowLoading(record.name, false);
    }
  };

  const handleDelete = async (record: MCPRecord) => {
    setRowLoading(record.name, true);
    try {
      await api.resource('aiMcpClients').destroy({
        filterByTk: record.name,
      });
      await rebuildClient();
      await Promise.all([mcpRequest.refresh(), toolsRequest.refresh()]);
      message.success(t('Deleted successfully'));
    } finally {
      setRowLoading(record.name, false);
    }
  };

  const handlePermissionChange = async (toolName: string, permission: Permission) => {
    await api.resource('aiMcpClients').updateToolPermission({
      values: {
        toolName,
        permission,
      },
    });
    await toolsRequest.refresh();
    message.success(t('Saved successfully'));
  };

  const mcpItems = mcpRequest.data || [];
  const toolsMap = toolsRequest.data || {};
  const contextValue = useMemo(
    () => ({
      refreshMCPs: () => mcpRequest.refresh(),
      refreshTools: () => toolsRequest.refresh(),
      rebuildClient,
      rebuilding,
    }),
    [mcpRequest, toolsRequest, rebuildClient, rebuilding],
  );

  return (
    <MCPSettingsContext.Provider value={contextValue}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {editingRecord ? (
          <EditMCP
            record={editingRecord}
            visible={!!editingRecord}
            setVisible={(visible) => !visible && setEditingRecord(null)}
          />
        ) : null}
        <Flex justify="flex-end" align="center" gap={8}>
          <Button
            icon={<ReloadOutlined />}
            loading={rebuilding}
            onClick={() => Promise.all([mcpRequest.refresh(), toolsRequest.refresh()])}
          >
            {t('Refresh')}
          </Button>
          <AddNew />
        </Flex>
        {mcpRequest.loading || toolsRequest.loading ? (
          <div style={{ padding: '16px 0', textAlign: 'center' }}>
            <Spin />
          </div>
        ) : mcpItems.length === 0 ? (
          <div style={{ padding: '48px 0' }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No data')} />
          </div>
        ) : (
          <Collapse
            ghost
            size="small"
            items={mcpItems.map((record) => {
              const transportLabel =
                transportOptions.find((item) => item.value === record.transport)?.label || record.transport;
              const transportColor =
                record.transport === 'stdio' ? 'blue' : record.transport === 'sse' ? 'gold' : 'green';

              return {
                key: record.name,
                label: (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Tag color={transportColor}>{transportLabel}</Tag>
                      <div style={{ fontWeight: token.fontWeightStrong, fontSize: token.fontSizeSM }}>
                        {record.title || record.name}
                      </div>
                    </div>
                    <div style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>
                      {record.description || record.name}
                    </div>
                  </div>
                ),
                extra: (
                  <MCPRowExtra
                    record={record}
                    enabled={record.enabled !== false}
                    loading={!!rowLoadingMap[record.name]}
                    rebuilding={rebuilding}
                    onEdit={setEditingRecord}
                    onToggleEnabled={handleToggleEnabled}
                    onDelete={handleDelete}
                  />
                ),
                children: (
                  <MCPToolsList tools={toolsMap[record.name] || []} onPermissionChange={handlePermissionChange} />
                ),
              };
            })}
          />
        )}
      </Space>
    </MCPSettingsContext.Provider>
  );
};

export const MCPSettings: React.FC = () => {
  return (
    <ExtendCollectionsProvider collections={[aiMcpClients]}>
      <SchemaComponent
        components={{ MCPList }}
        schema={{
          type: 'void',
          properties: {
            card: {
              type: 'void',
              'x-component': 'CardItem',
              'x-component-props': {
                heightMode: 'fullHeight',
              },
              properties: {
                content: {
                  type: 'void',
                  'x-component': 'MCPList',
                },
              },
            },
          },
        }}
      />
    </ExtendCollectionsProvider>
  );
};
