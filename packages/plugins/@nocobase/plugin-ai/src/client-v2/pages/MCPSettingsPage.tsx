/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  App,
  Button,
  Card,
  Drawer,
  Empty,
  Flex,
  Form,
  Input,
  List,
  Popconfirm,
  Segmented,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { TableProps } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { EnvVariableInput, useApp } from '@nocobase/client-v2';
import type { APIClient } from '@nocobase/client-v2';
import { useT } from '../locale';

type APIClientLike = Pick<APIClient, 'resource'>;
type ResourceAction = (params?: Record<string, unknown>) => Promise<unknown>;
type APIResponse = {
  data?: {
    data?: unknown;
    count?: unknown;
  };
};
type MCPTransport = 'stdio' | 'http' | 'sse';
type KeyValueEntry = {
  name?: string;
  value?: string;
};
export type MCPRecord = {
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
  restart?: Record<string, unknown>;
};
type MCPFormValues = Omit<MCPRecord, 'args' | 'env' | 'headers'> & {
  args?: string | string[];
  env?: KeyValueEntry[] | Record<string, string>;
  headers?: KeyValueEntry[] | Record<string, string>;
};
export type MCPTestResultData = {
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
  toolsCount?: number;
  tools?: string[];
  toolsTruncated?: boolean;
};
export type MCPToolPermission = 'ASK' | 'ALLOW';
export type MCPToolEntry = {
  name: string;
  title: string;
  description?: string;
  serverName: string;
  permission: MCPToolPermission;
};
type MCPListResult = {
  data: MCPRecord[];
  total?: number;
};

const transportOptions: Array<{ label: string; value: MCPTransport }> = [
  { label: 'Stdio', value: 'stdio' },
  { label: 'HTTP (Streamable)', value: 'http' },
  { label: 'HTTP + SSE (Legacy)', value: 'sse' },
];

const transportColorMap: Record<MCPTransport, string> = {
  stdio: 'blue',
  http: 'green',
  sse: 'gold',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isResourceAction = (value: unknown): value is ResourceAction => typeof value === 'function';

const readResponseData = (response: unknown): unknown => {
  if (!isRecord(response)) {
    return undefined;
  }
  return (response as APIResponse).data?.data ?? response.data;
};

const readResponseCount = (response: unknown): number | undefined => {
  if (!isRecord(response)) {
    return undefined;
  }
  const count = (response as APIResponse).data?.count;
  return typeof count === 'number' ? count : undefined;
};

const callResourceAction = async (
  apiClient: APIClientLike,
  resourceName: string,
  actionName: string,
  params?: Record<string, unknown>,
): Promise<unknown> => {
  const resource = apiClient.resource(resourceName) as Record<string, unknown>;
  const action = resource[actionName];
  if (!isResourceAction(action)) {
    throw new Error(`Missing resource action: ${resourceName}.${actionName}`);
  }
  return action(params);
};

const isMCPTransport = (value: unknown): value is MCPTransport =>
  value === 'stdio' || value === 'http' || value === 'sse';

const isMCPRecord = (value: unknown): value is MCPRecord =>
  isRecord(value) && typeof value.name === 'string' && isMCPTransport(value.transport);

const isMCPTestResult = (value: unknown): value is MCPTestResultData =>
  isRecord(value) && typeof value.success === 'boolean';

const isMCPToolEntry = (value: unknown): value is MCPToolEntry =>
  isRecord(value) &&
  typeof value.name === 'string' &&
  typeof value.title === 'string' &&
  typeof value.serverName === 'string';

const mapObjectToEntries = (value: Record<string, string> | null | undefined): KeyValueEntry[] =>
  Object.entries(value || {}).map(([name, entryValue]) => ({
    name,
    value: entryValue == null ? '' : String(entryValue),
  }));

const mapEntriesToObject = (value: KeyValueEntry[] | Record<string, string> | null | undefined) => {
  if (isRecord(value)) {
    return Object.entries(value).reduce<Record<string, string>>((result, [name, entryValue]) => {
      if (name) {
        result[name] = entryValue == null ? '' : String(entryValue);
      }
      return result;
    }, {});
  }
  return (Array.isArray(value) ? value : []).reduce<Record<string, string>>((result, item) => {
    if (!item?.name) {
      return result;
    }
    result[item.name] = item.value || '';
    return result;
  }, {});
};

export const sanitizeMCPValues = (values: MCPFormValues): MCPRecord => {
  const transport = values.transport;
  const nextValues = {
    ...values,
    args:
      typeof values.args === 'string'
        ? values.args
            .split(' ')
            .map((item) => item.trim())
            .filter(Boolean)
        : Array.isArray(values.args)
          ? values.args
          : [],
    env: mapEntriesToObject(values.env),
    headers: mapEntriesToObject(values.headers),
    restart: isRecord(values.restart) ? values.restart : {},
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

export const toMCPFormValues = (record: MCPRecord): MCPFormValues => ({
  ...record,
  args: Array.isArray(record.args) ? record.args.join(' ') : '',
  env: mapObjectToEntries(record.env),
  headers: mapObjectToEntries(record.headers),
  restart: isRecord(record.restart) ? record.restart : {},
});

export const getMCPToolsByServer = (
  toolsMap: Record<string, MCPToolEntry[]> | null | undefined,
  serverName: string,
): MCPToolEntry[] => {
  const tools = toolsMap?.[serverName];
  return Array.isArray(tools) ? tools.filter(isMCPToolEntry) : [];
};

export async function listMCPClients(apiClient: APIClientLike): Promise<MCPListResult> {
  const response = await callResourceAction(apiClient, 'aiMcpClients', 'list');
  const data = readResponseData(response);
  return {
    data: Array.isArray(data) ? data.filter(isMCPRecord) : [],
    total: readResponseCount(response),
  };
}

export async function testMCPConnection(apiClient: APIClientLike, values: MCPFormValues) {
  const response = await callResourceAction(apiClient, 'aiMcpClients', 'testConnection', {
    values: sanitizeMCPValues(values),
  });
  const data = readResponseData(response);
  return isMCPTestResult(data) ? data : null;
}

export async function createMCPClient(apiClient: APIClientLike, values: MCPFormValues) {
  await callResourceAction(apiClient, 'aiMcpClients', 'create', {
    values: sanitizeMCPValues(values),
  });
}

export async function updateMCPClient(apiClient: APIClientLike, values: MCPFormValues, name: string) {
  await callResourceAction(apiClient, 'aiMcpClients', 'update', {
    values: sanitizeMCPValues(values),
    filterByTk: name,
  });
}

export async function deleteMCPClient(apiClient: APIClientLike, name: string) {
  await callResourceAction(apiClient, 'aiMcpClients', 'destroy', {
    filterByTk: name,
  });
}

export async function deleteMCPClients(apiClient: APIClientLike, names: string[]) {
  await callResourceAction(apiClient, 'aiMcpClients', 'destroy', {
    filterByTk: names,
  });
}

export async function updateMCPClientEnabled(apiClient: APIClientLike, name: string, enabled: boolean) {
  await callResourceAction(apiClient, 'aiMcpClients', 'update', {
    filterByTk: name,
    values: { enabled },
  });
}

export async function rebuildMCPClient(apiClient: APIClientLike) {
  await callResourceAction(apiClient, 'aiMcpClients', 'rebuildClient');
}

export async function listMCPTools(apiClient: APIClientLike, serverName: string): Promise<MCPToolEntry[]> {
  const response = await callResourceAction(apiClient, 'aiMcpClients', 'listTools');
  const data = readResponseData(response);
  return isRecord(data) ? getMCPToolsByServer(data as Record<string, MCPToolEntry[]>, serverName) : [];
}

export async function updateMCPToolPermission(
  apiClient: APIClientLike,
  toolName: string,
  permission: MCPToolPermission,
) {
  await callResourceAction(apiClient, 'aiMcpClients', 'updateToolPermission', {
    values: {
      toolName,
      permission,
    },
  });
}

const createInitialValues = (): MCPFormValues => ({
  name: '',
  title: '',
  enabled: true,
  transport: 'stdio',
  args: '',
  env: [],
  headers: [],
  restart: {},
});

const KeyValueList: React.FC<{
  value?: KeyValueEntry[] | Record<string, string>;
  onChange?: (value: KeyValueEntry[]) => void;
  addLabel: string;
}> = ({ value, onChange, addLabel }) => {
  const t = useT();
  const entries = Array.isArray(value) ? value : mapObjectToEntries(value);
  const updateEntry = (index: number, key: keyof KeyValueEntry, nextValue: string) => {
    const nextEntries = [...entries];
    nextEntries[index] = { ...nextEntries[index], [key]: nextValue };
    onChange?.(nextEntries);
  };
  return (
    <Flex vertical gap="small">
      {entries.map((entry, index) => (
        <Flex key={index} gap="small" align="baseline">
          <Input
            placeholder={t('Name')}
            value={entry.name}
            onChange={(event) => updateEntry(index, 'name', event.target.value)}
          />
          <EnvVariableInput value={entry.value} onChange={(nextValue) => updateEntry(index, 'value', nextValue)} />
          <Button
            aria-label={t('Delete')}
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => onChange?.(entries.filter((_, currentIndex) => currentIndex !== index))}
          />
        </Flex>
      ))}
      <Button type="dashed" icon={<PlusOutlined />} onClick={() => onChange?.([...entries, { name: '', value: '' }])}>
        {addLabel}
      </Button>
    </Flex>
  );
};

const MCPForm: React.FC<{ editing: boolean; testResult: MCPTestResultData | null; testing: boolean }> = ({
  editing,
  testResult,
  testing,
}) => {
  const t = useT();
  const form = Form.useFormInstance<MCPFormValues>();
  const transport = Form.useWatch('transport', form);
  const isStdio = transport === 'stdio';
  const isRemote = transport === 'http' || transport === 'sse';

  return (
    <>
      <Form.Item name="name" label={t('Name')} rules={[{ required: true }]}>
        <Input disabled={editing} />
      </Form.Item>
      <Form.Item name="title" label={t('Title')} rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="description" label={t('Description')}>
        <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
      </Form.Item>
      <Form.Item name="transport" label={t('Transport')} rules={[{ required: true }]}>
        <Select options={transportOptions.map((item) => ({ ...item, label: t(item.label) }))} />
      </Form.Item>
      {isStdio ? (
        <>
          <Form.Item name="command" label={t('Command')} rules={[{ required: true }]}>
            <Input placeholder={t('For example: npx, uvx, node')} />
          </Form.Item>
          <Form.Item name="args" label={t('Arguments')}>
            <Input placeholder={t('Space-separated args, e.g.: -u --flag value')} />
          </Form.Item>
          <Form.Item name="env" label={t('Environment variables')}>
            <KeyValueList addLabel={t('Add variable')} />
          </Form.Item>
        </>
      ) : null}
      {isRemote ? (
        <>
          <Form.Item name="url" label={t('URL')} rules={[{ required: true }]}>
            <Input placeholder={t('For example: https://example.com/mcp')} />
          </Form.Item>
          <Form.Item name="headers" label={t('Headers')}>
            <KeyValueList addLabel={t('Add request header')} />
          </Form.Item>
        </>
      ) : null}
      <TestConnectionResult result={testResult} loading={testing} />
    </>
  );
};

const TestConnectionResult: React.FC<{ result: MCPTestResultData | null; loading: boolean }> = ({
  result,
  loading,
}) => {
  const t = useT();
  if (loading) {
    return (
      <Flex justify="center">
        <Spin tip={t('Testing connection...')} />
      </Flex>
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
        message={t('Connection Successful')}
        description={
          <Flex vertical gap="small">
            <span>{t('Successfully connected to MCP server')}</span>
            <span>
              {t('Tools found')}: {result.toolsCount}
            </span>
            {result.tools?.length ? (
              <Space wrap>
                {result.tools.map((tool) => (
                  <Tag key={tool}>{tool}</Tag>
                ))}
                {result.toolsTruncated ? <span>...</span> : null}
              </Space>
            ) : null}
          </Flex>
        }
      />
    );
  }
  return (
    <Alert
      type="error"
      showIcon
      icon={<CloseCircleOutlined />}
      message={t('Connection Failed')}
      description={
        <Flex vertical gap="small">
          <span>{result.error || t('Failed to connect to MCP server')}</span>
          {result.details ? <Typography.Text code>{result.details}</Typography.Text> : null}
        </Flex>
      }
    />
  );
};

const MCPToolsList: React.FC<{ record: MCPRecord; rebuilding: boolean }> = ({ record, rebuilding }) => {
  const app = useApp();
  const t = useT();
  const { message } = App.useApp();
  const [tools, setTools] = useState<MCPToolEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingToolName, setUpdatingToolName] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const loadTools = async () => {
      setLoading(true);
      try {
        const nextTools = await listMCPTools(app.apiClient, record.name);
        if (!ignore) {
          setTools(nextTools);
        }
      } catch (error) {
        if (!ignore) {
          message.error(error instanceof Error ? error.message : t('Failed to load MCP tools'));
          setTools([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    loadTools().catch((error: unknown) => {
      console.error(error);
    });
    return () => {
      ignore = true;
    };
  }, [app.apiClient, message, record.name, t]);

  const handlePermissionChange = async (toolName: string, permission: MCPToolPermission) => {
    const previousTools = tools;
    setUpdatingToolName(toolName);
    setTools((currentTools) => currentTools.map((tool) => (tool.name === toolName ? { ...tool, permission } : tool)));
    try {
      await updateMCPToolPermission(app.apiClient, toolName, permission);
    } catch (error) {
      setTools(previousTools);
      message.error(error instanceof Error ? error.message : t('Failed to update tool permission'));
    } finally {
      setUpdatingToolName(null);
    }
  };

  if (loading) {
    return (
      <Flex justify="center">
        <Spin />
      </Flex>
    );
  }
  if (!tools.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No data')} />;
  }
  return (
    <List
      itemLayout="vertical"
      dataSource={tools}
      pagination={{
        pageSize: 10,
        hideOnSinglePage: false,
        size: 'small',
        showTotal: (total) => t('Total {{count}} items', { count: total }),
      }}
      renderItem={(tool) => (
        <List.Item
          key={tool.name}
          extra={
            <Space>
              <Typography.Text type="secondary">{t('Permission')}</Typography.Text>
              <Segmented
                size="small"
                options={[
                  { label: t('Ask'), value: 'ASK' },
                  { label: t('Allow'), value: 'ALLOW' },
                ]}
                value={tool.permission}
                disabled={rebuilding || updatingToolName === tool.name}
                onChange={(value) => handlePermissionChange(tool.name, value as MCPToolPermission)}
              />
            </Space>
          }
        >
          <div>{tool.title}</div>
          {tool.description ? (
            <Typography.Paragraph type="secondary" ellipsis={{ rows: 3, expandable: 'collapsible' }}>
              {tool.description}
            </Typography.Paragraph>
          ) : null}
        </List.Item>
      )}
    />
  );
};

const EnabledSwitch: React.FC<{ record: MCPRecord; rebuilding: boolean; onUpdated: () => Promise<void> }> = ({
  record,
  rebuilding,
  onUpdated,
}) => {
  const app = useApp();
  const [loading, setLoading] = useState(false);
  const handleChange = async (enabled: boolean) => {
    setLoading(true);
    try {
      await updateMCPClientEnabled(app.apiClient, record.name, enabled);
      await rebuildMCPClient(app.apiClient);
      await onUpdated();
    } finally {
      setLoading(false);
    }
  };
  return (
    <Switch
      size="small"
      checked={record.enabled !== false}
      loading={loading}
      disabled={rebuilding}
      onChange={handleChange}
    />
  );
};

export const MCPSettingsPage: React.FC = () => {
  const app = useApp();
  const t = useT();
  const { message } = App.useApp();
  const [form] = Form.useForm<MCPFormValues>();
  const [clients, setClients] = useState<MCPRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<MCPTestResultData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toolsDrawerRecord, setToolsDrawerRecord] = useState<MCPRecord | undefined>();
  const [editingRecord, setEditingRecord] = useState<MCPRecord | undefined>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [rebuilding, setRebuilding] = useState(false);
  const rebuildTailRef = useRef<Promise<void>>(Promise.resolve());
  const rebuildPendingCountRef = useRef(0);

  const rebuildClient = useCallback(async () => {
    rebuildPendingCountRef.current += 1;
    setRebuilding(true);
    const task = rebuildTailRef.current
      .catch(() => undefined)
      .then(async () => {
        await rebuildMCPClient(app.apiClient);
      });
    rebuildTailRef.current = task.finally(() => {
      rebuildPendingCountRef.current -= 1;
      if (rebuildPendingCountRef.current === 0) {
        setRebuilding(false);
      }
    });
    return task;
  }, [app.apiClient]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listMCPClients(app.apiClient);
      setClients(result.data);
    } finally {
      setLoading(false);
    }
  }, [app.apiClient]);

  useEffect(() => {
    refresh().catch((error: unknown) => {
      console.error(error);
      setLoading(false);
    });
  }, [refresh]);

  const openCreateDrawer = () => {
    setEditingRecord(undefined);
    setTestResult(null);
    form.setFieldsValue(createInitialValues());
    setDrawerOpen(true);
  };

  const openEditDrawer = (record: MCPRecord) => {
    setEditingRecord(record);
    setTestResult(null);
    form.setFieldsValue(toMCPFormValues(record));
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    form.resetFields();
    setTestResult(null);
  };

  const runTestConnection = async () => {
    const values = form.getFieldsValue(true);
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testMCPConnection(app.apiClient, values);
      setTestResult(result);
      return !!result?.success;
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : t('An error occurred while testing the connection'),
      });
      return false;
    } finally {
      setTesting(false);
    }
  };

  const handleFinish = async (values: MCPFormValues) => {
    setSaving(true);
    try {
      const passed = await runTestConnection();
      if (!passed) {
        return;
      }
      if (editingRecord) {
        await updateMCPClient(app.apiClient, values, editingRecord.name);
      } else {
        await createMCPClient(app.apiClient, values);
      }
      await rebuildClient();
      message.success(t('Saved successfully'));
      closeDrawer();
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    const names = selectedRowKeys.filter((key): key is string => typeof key === 'string');
    if (!names.length) {
      return;
    }
    await deleteMCPClients(app.apiClient, names);
    await rebuildClient();
    setSelectedRowKeys([]);
    message.success(t('Saved successfully'));
    await refresh();
  };

  const columns: TableProps<MCPRecord>['columns'] = [
    {
      title: t('Name'),
      dataIndex: 'name',
    },
    {
      title: t('Title'),
      dataIndex: 'title',
    },
    {
      title: t('Transport'),
      dataIndex: 'transport',
      render: (transport: MCPTransport) => {
        const label = transportOptions.find((item) => item.value === transport)?.label || transport;
        return <Tag color={transportColorMap[transport]}>{t(label)}</Tag>;
      },
    },
    {
      title: t('Enabled'),
      dataIndex: 'enabled',
      render: (_, record) => <EnabledSwitch record={record} rebuilding={rebuilding} onUpdated={refresh} />,
    },
    {
      title: t('Actions'),
      key: 'actions',
      render: (_, record) => (
        <Space split="|">
          <Button type="link" onClick={() => setToolsDrawerRecord(record)}>
            {t('MCP tools')}
          </Button>
          <Button type="link" onClick={() => openEditDrawer(record)}>
            {t('Edit')}
          </Button>
          <Popconfirm
            title={t('Delete record')}
            description={t('Are you sure you want to delete it?')}
            onConfirm={async () => {
              await deleteMCPClient(app.apiClient, record.name);
              await rebuildClient();
              message.success(t('Saved successfully'));
              await refresh();
            }}
          >
            <Button type="link" danger>
              {t('Delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const drawerTitle = editingRecord ? t('Edit record') : t('Add new');

  return (
    <Card>
      <Flex vertical gap="middle">
        <Flex justify="space-between" wrap="wrap" gap="middle">
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refresh()}>
              {t('Refresh')}
            </Button>
            <Popconfirm
              title={t('Delete record')}
              description={t('Are you sure you want to delete it?')}
              disabled={!selectedRowKeys.length || rebuilding}
              onConfirm={handleBulkDelete}
            >
              <Button icon={<DeleteOutlined />} disabled={!selectedRowKeys.length || rebuilding}>
                {t('Delete')}
              </Button>
            </Popconfirm>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDrawer} disabled={rebuilding}>
            {t('Add new')}
          </Button>
        </Flex>
        <Table<MCPRecord>
          rowKey="name"
          loading={loading}
          columns={columns}
          dataSource={clients}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
        />
      </Flex>
      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={drawerTitle}
        footer={
          <Flex justify="space-between" gap="small">
            <Button loading={testing} onClick={() => runTestConnection()}>
              {t('Test flight')}
            </Button>
            <Space>
              <Button onClick={closeDrawer}>{t('Cancel')}</Button>
              <Button type="primary" loading={saving || testing || rebuilding} onClick={() => form.submit()}>
                {t('Submit')}
              </Button>
            </Space>
          </Flex>
        }
      >
        <Spin spinning={saving}>
          <Form<MCPFormValues> form={form} layout="vertical" onFinish={handleFinish}>
            <MCPForm editing={!!editingRecord} testResult={testResult} testing={testing} />
          </Form>
        </Spin>
      </Drawer>
      <Drawer
        open={!!toolsDrawerRecord}
        onClose={() => setToolsDrawerRecord(undefined)}
        title={t('MCP tools')}
        destroyOnClose
      >
        {toolsDrawerRecord ? <MCPToolsList record={toolsDrawerRecord} rebuilding={rebuilding} /> : null}
      </Drawer>
    </Card>
  );
};

export default MCPSettingsPage;
