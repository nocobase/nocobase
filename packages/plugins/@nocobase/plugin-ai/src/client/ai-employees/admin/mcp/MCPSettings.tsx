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
  useBlockRequestContext,
  useBulkDestroyActionProps,
  useCollectionRecordData,
  useDataBlockRequest,
  useDestroyActionProps,
  useGlobalVariable,
  useCurrentUserVariable,
  Variable,
  Checkbox as NocoCheckbox,
} from '@nocobase/client';
import { css } from '@emotion/css';
import { CheckCircleOutlined, CloseCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button, Space, Switch, Tag, Alert, Spin, Tooltip } from 'antd';
import type { DefaultOptionType } from 'antd/lib/cascader';
import { createForm } from '@formily/core';
import { observer, useForm } from '@formily/react';
import React, { useContext, useEffect, useMemo, useRef, useState, useCallback, createContext } from 'react';
import aiMcpClients from '../../../../collections/ai-mcp-clients';
import { useT } from '../../../locale';
import { MCPSettingsContext, unwrapResponseData } from './context';
import { MCPToolsList } from './MCPToolsList';
import { createMCPSchema, editMCPFormContentSchema, mcpSettingsSchema, viewMCPToolsContentSchema } from './schemas';

type MCPTransport = 'stdio' | 'http' | 'sse';

const transportOptions = [
  { label: 'Stdio', value: 'stdio' },
  { label: 'HTTP (Streamable)', value: 'http' },
  { label: 'HTTP + SSE (Legacy)', value: 'sse' },
];

const transportColorMap: Record<MCPTransport, string> = {
  stdio: 'blue',
  http: 'green',
  sse: 'gold',
};

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
    useUserContext: transport === 'stdio' ? false : values.useUserContext === true,
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
      useUserContext: false,
      command: '',
      url: '',
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
  useUserContext?: boolean;
}

const useEditFormProps = () => {
  const record = useCollectionRecordData<MCPRecord>();
  const { visible } = useActionContext();
  const initialValues = useMemo(
    () => ({
      ...record,
      useUserContext: record?.useUserContext === true,
      command: record?.command ?? '',
      url: record?.url ?? '',
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

const useConfirmSaveAfterFailedTest = () => {
  const { modal } = App.useApp();
  const t = useT();

  return async () =>
    modal.confirm({
      title: t('Connection test failed'),
      content: t(
        'The MCP server uses current user variables and the connection test failed. Do you want to save it anyway?',
      ),
      okText: t('Save anyway'),
      cancelText: t('Cancel'),
    });
};

const useCreateActionProps = () => {
  const { setVisible } = useActionContext();
  const { message } = App.useApp();
  const form = useForm();
  const api = useAPIClient();
  const { refresh } = useDataBlockRequest();
  const t = useT();
  const { loading: testLoading } = useContext(TestConnectionContext);
  const { rebuildClient, rebuilding } = useContext(MCPSettingsContext);
  const ensureConnectionBeforeSubmit = useEnsureConnectionBeforeSubmit();
  const confirmSaveAfterFailedTest = useConfirmSaveAfterFailedTest();

  return {
    type: 'primary',
    loading: rebuilding || testLoading,
    async onClick() {
      await form.submit();
      const passed = await ensureConnectionBeforeSubmit(form.values);
      if (!passed) {
        if (sanitizeMCPValues(form.values).useUserContext !== true) {
          return;
        }
        const confirmed = await confirmSaveAfterFailedTest();
        if (!confirmed) {
          return;
        }
      }
      await api.resource('aiMcpClients').create({
        values: sanitizeMCPValues(form.values),
      });
      await rebuildClient();
      await refresh();
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
  const { refresh } = useDataBlockRequest();
  const record = useCollectionRecordData() as MCPRecord;
  const t = useT();
  const { loading: testLoading } = useContext(TestConnectionContext);
  const { rebuildClient, rebuilding } = useContext(MCPSettingsContext);
  const ensureConnectionBeforeSubmit = useEnsureConnectionBeforeSubmit();
  const confirmSaveAfterFailedTest = useConfirmSaveAfterFailedTest();

  return {
    type: 'primary',
    loading: rebuilding || testLoading,
    async onClick() {
      await form.submit();
      const passed = await ensureConnectionBeforeSubmit(form.values);
      if (!passed) {
        if (sanitizeMCPValues(form.values).useUserContext !== true) {
          return;
        }
        const confirmed = await confirmSaveAfterFailedTest();
        if (!confirmed) {
          return;
        }
      }
      await api.resource('aiMcpClients').update({
        values: sanitizeMCPValues(form.values),
        filterByTk: record.name,
      });
      await rebuildClient();
      await refresh();
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

const useMCPVariableScope = (includeCurrentUser: boolean) => {
  const environmentVariables = useGlobalVariable('$env');
  const { currentUserSettings } = useCurrentUserVariable({
    maxDepth: 3,
    noDisabled: true,
  });

  return useMemo(
    () =>
      [
        normalizeMCPVariableOption(environmentVariables),
        includeCurrentUser ? normalizeMCPVariableOption(currentUserSettings) : null,
      ].filter(Boolean),
    [currentUserSettings, environmentVariables, includeCurrentUser],
  );
};

type MCPVariableValue = NonNullable<DefaultOptionType['value']>;

type MCPVariableOption = Omit<Partial<DefaultOptionType>, 'children' | 'label' | 'value'> & {
  name?: MCPVariableValue;
  title?: React.ReactNode;
  value?: MCPVariableValue;
  label?: React.ReactNode;
  key?: React.Key;
  children?: MCPVariableOption[];
  loadChildren?: (option: MCPVariableOption, ...args: unknown[]) => Promise<void> | void;
  [key: string]: unknown;
};

const normalizeMCPVariableOption = (option?: MCPVariableOption | null): MCPVariableOption | null => {
  if (!option) {
    return null;
  }

  const value = option.value ?? option.name;
  const label = option.label ?? option.title;
  const loadChildren = option.loadChildren
    ? async (target: MCPVariableOption, ...args: unknown[]) => {
        await option.loadChildren?.(target, ...args);
        target.children = target.children
          ?.map((child) => normalizeMCPVariableOption(child))
          .filter((child): child is MCPVariableOption => Boolean(child));
      }
    : undefined;

  return {
    ...option,
    name: option.name ?? value,
    title: option.title ?? label,
    value,
    label,
    key: option.key ?? value,
    children: option.children
      ?.map((child) => normalizeMCPVariableOption(child))
      .filter((child): child is MCPVariableOption => Boolean(child)),
    ...(loadChildren ? { loadChildren } : {}),
  };
};

const mcpVariableFieldNames = {
  value: 'name',
  label: 'title',
};

type MCPVariableInputProps = React.ComponentProps<typeof Variable.TextArea> & {
  variableScope?: 'env' | 'user';
};

const MCPVariableInput: React.FC<MCPVariableInputProps> = observer(
  (props) => {
    const { variableScope = 'env', ...others } = props;
    const form = useForm();
    const includeCurrentUser = variableScope === 'user' && form.values.useUserContext === true;
    const scope = useMCPVariableScope(includeCurrentUser);

    return <Variable.TextArea {...others} scope={scope} fieldNames={mcpVariableFieldNames} trim={false} />;
  },
  { displayName: 'MCPVariableInput' },
);

type UserContextCheckboxProps = React.ComponentProps<typeof NocoCheckbox> & {
  tooltip?: React.ReactNode;
};

const UserContextCheckbox: React.FC<UserContextCheckboxProps> = observer(
  (props) => {
    const { tooltip, ...others } = props;
    const form = useForm();
    const disabled = form.values.transport === 'stdio';

    useEffect(() => {
      if (disabled && form.values.useUserContext) {
        form.setValuesIn('useUserContext', false);
      }
    }, [disabled, form]);

    const checkbox = <NocoCheckbox {...others} disabled={disabled || props.disabled} />;
    return tooltip ? <Tooltip title={tooltip}>{checkbox}</Tooltip> : checkbox;
  },
  { displayName: 'UserContextCheckbox' },
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
          components={{ TestConnectionButton, TestConnectionResult, Space, MCPVariableInput, UserContextCheckbox }}
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

const MCPEditDrawerContent: React.FC = () => {
  const t = useT();
  const record = useCollectionRecordData<MCPRecord>();
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
      <TestConnectionContext.Provider value={contextValue}>
        <SchemaComponent
          components={{ TestConnectionButton, TestConnectionResult, Space, MCPVariableInput, UserContextCheckbox }}
          scope={{
            t,
            transportOptions,
            keyValueRowClassName,
            useEditFormProps,
            useCancelActionProps,
            useEditActionProps,
          }}
          schema={editMCPFormContentSchema}
        />
      </TestConnectionContext.Provider>
    </CollectionRecordProvider>
  );
};

const MCPViewDrawerContent: React.FC = () => {
  const t = useT();
  const record = useCollectionRecordData<MCPRecord>();

  return (
    <CollectionRecordProvider record={record}>
      <SchemaComponent components={{ MCPToolsList }} scope={{ t }} schema={viewMCPToolsContentSchema} />
    </CollectionRecordProvider>
  );
};

const TransportTag: React.FC = () => {
  const record = useCollectionRecordData<MCPRecord>();
  const transport = record.transport;
  const label = transportOptions.find((item) => item.value === transport)?.label || transport;
  return <Tag color={transportColorMap[transport]}>{label}</Tag>;
};

const EnabledSwitch: React.FC = observer(
  () => {
    const api = useAPIClient();
    const record = useCollectionRecordData<MCPRecord>();
    const { refresh } = useDataBlockRequest();
    const { rebuildClient, rebuilding } = useContext(MCPSettingsContext);
    const [loading, setLoading] = useState(false);

    return (
      <Switch
        size="small"
        checked={record.enabled !== false}
        loading={loading}
        disabled={rebuilding}
        onChange={async (enabled) => {
          setLoading(true);
          try {
            await api.resource('aiMcpClients').update({
              filterByTk: record.name,
              values: { enabled },
            });
            await rebuildClient();
            await refresh();
          } finally {
            setLoading(false);
          }
        }}
      />
    );
  },
  { displayName: 'MCPEnabledSwitch' },
);

const useMCPDestroyActionProps = () => {
  const props = useDestroyActionProps();
  const { rebuildClient, rebuilding } = useContext(MCPSettingsContext);
  return {
    ...props,
    loading: rebuilding,
    async onClick(e?, callBack?) {
      await props.onClick?.(e, callBack);
      await rebuildClient();
    },
  };
};

const useMCPBulkDestroyActionProps = () => {
  const props = useBulkDestroyActionProps();
  const { field } = useBlockRequestContext();
  const { rebuildClient, rebuilding } = useContext(MCPSettingsContext);

  return {
    ...props,
    loading: rebuilding,
    async onClick(e?, callBack?) {
      const hasSelection = !!field?.data?.selectedRowKeys?.length;
      if (!hasSelection) {
        return;
      }
      await props.onClick?.(e, callBack);
      await rebuildClient();
    },
  };
};

export const MCPSettings: React.FC = () => {
  const t = useT();
  const api = useAPIClient();
  const rebuildTailRef = useRef<Promise<void>>(Promise.resolve());
  const rebuildPendingCountRef = useRef(0);
  const [rebuilding, setRebuilding] = useState(false);

  const rebuildClient = useCallback(async () => {
    rebuildPendingCountRef.current += 1;
    setRebuilding(true);
    const task = rebuildTailRef.current
      .catch(() => undefined)
      .then(async () => {
        try {
          await api.resource('aiMcpClients').rebuildClient();
        } catch (error) {
          // Ignore rebuild errors to avoid blocking CRUD flow.
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

  const contextValue = useMemo(
    () => ({
      rebuildClient,
      rebuilding,
    }),
    [rebuildClient, rebuilding],
  );

  return (
    <MCPSettingsContext.Provider value={contextValue}>
      <ExtendCollectionsProvider collections={[aiMcpClients]}>
        <SchemaComponent
          components={{
            AddNew,
            MCPEditDrawerContent,
            MCPViewDrawerContent,
            MCPToolsList,
            TestConnectionButton,
            TestConnectionResult,
            MCPVariableInput,
            UserContextCheckbox,
            TransportTag,
            EnabledSwitch,
          }}
          scope={{
            t,
            transportOptions,
            keyValueRowClassName,
            useCreateFormProps,
            useEditFormProps,
            useCancelActionProps,
            useCreateActionProps,
            useEditActionProps,
            useMCPDestroyActionProps,
            useMCPBulkDestroyActionProps,
          }}
          schema={mcpSettingsSchema}
        />
      </ExtendCollectionsProvider>
    </MCPSettingsContext.Provider>
  );
};
