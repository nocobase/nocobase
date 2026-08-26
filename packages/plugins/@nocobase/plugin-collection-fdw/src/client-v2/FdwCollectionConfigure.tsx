/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { PlusOutlined } from '@ant-design/icons';
import { randomId, useFlowContext } from '@nocobase/flow-engine';
import type { CollectionTemplateConfigureItemProps } from '@nocobase/plugin-data-source-manager/client-v2';
import { compileLegacyTemplate } from '@nocobase/plugin-data-source-manager/client-v2';
import { useRequest } from 'ahooks';
import {
  Alert,
  App,
  Button,
  Divider,
  Empty,
  Form,
  Input,
  message,
  Modal,
  notification as staticNotification,
  Select,
  Space,
  Spin,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { get } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useT } from './locale';

const internalUnsupportedFieldsName = '__fdwUnsupportedFields';
const mapFieldTypes = new Set(['lineString', 'point', 'circle', 'polygon']);

type DatabaseServerRecord = {
  database?: string;
  description?: string;
  host?: string;
  name: string;
  password?: string;
  port?: string;
  username?: string;
};

type DatabaseServerFormValues = {
  database: string;
  description: string;
  host: string;
  name: string;
  password: string;
  port: string;
  username: string;
};

type DatabaseServerDialogState =
  | {
      mode: 'create';
    }
  | {
      mode: 'edit';
      record: DatabaseServerRecord;
    }
  | null;

type DatabaseServerSelectOption = {
  label: string;
  server: DatabaseServerRecord;
  value: string;
};

type Translate = (key: string, options?: Record<string, any>) => string;

type FieldInterfaceRecord = {
  availableTypes?: string[];
  default?: {
    type?: string;
    uiSchema?: Record<string, unknown>;
  };
  group?: string;
  name?: string;
  title?: React.ReactNode;
};

type FieldInterfaceManager = {
  getFieldInterface?: (name?: string) => FieldInterfaceRecord | undefined;
  getFieldInterfaceGroups?: () => Record<string, { label?: React.ReactNode; order?: number }>;
  getFieldInterfaces?: () => FieldInterfaceRecord[];
};

type FdwFieldRecord = {
  allowNull?: boolean;
  interface?: string | null;
  name: string;
  possibleTypes?: string[];
  primaryKey?: boolean;
  rawType?: string;
  type?: string;
  uiSchema?: Record<string, unknown>;
  unique?: boolean;
};

function normalizeArrayResponse(response: unknown) {
  const payload = get(response, 'data.data');
  if (Array.isArray(payload)) {
    return payload;
  }
  const nested = get(payload, 'data');
  return Array.isArray(nested) ? nested : [];
}

function normalizeRemoteTableValue(value?: string) {
  if (!value) {
    return {
      remoteTableInfo: undefined,
      tableName: undefined,
    };
  }
  const [schema, tableName] = value.includes('.') ? value.split('.') : [undefined, value];
  return {
    remoteTableInfo: schema
      ? {
          schema,
          tableName,
        }
      : {
          tableName,
        },
    tableName,
  };
}

function omitRawTitle(uiSchema?: Record<string, unknown>) {
  const { rawTitle, ...rest } = uiSchema || {};
  return rest;
}

function normalizeRemoteTablePayload(response: unknown) {
  const candidates = [response, get(response, 'data'), get(response, 'data.data'), get(response, 'data.data.data')];
  const payload = candidates.find(
    (item) =>
      item &&
      typeof item === 'object' &&
      (Array.isArray((item as { fields?: unknown }).fields) ||
        Array.isArray((item as { unsupportedFields?: unknown }).unsupportedFields)),
  ) as { fields?: FdwFieldRecord[]; unsupportedFields?: FdwFieldRecord[] } | undefined;

  return {
    fields: Array.isArray(payload?.fields) ? payload.fields : [],
    unsupportedFields: Array.isArray(payload?.unsupportedFields) ? payload.unsupportedFields : [],
  };
}

function getResponseRecord<T>(response: unknown) {
  return get(response, 'data.data') as T | undefined;
}

function getErrorMessage(error: unknown) {
  if (typeof error === 'string') {
    return error;
  }

  const responseData = get(error, 'response.data');
  if (typeof responseData === 'string') {
    return responseData;
  }

  return (
    get(error, 'errorFields.0.errors.0') ||
    get(responseData, 'errors.0.message') ||
    get(responseData, 'messages.0.message') ||
    get(responseData, 'messages.0') ||
    get(responseData, 'error.message') ||
    get(responseData, 'message') ||
    get(error, 'message')
  );
}

function isFormValidationError(error: unknown) {
  return Array.isArray(get(error, 'errorFields'));
}

function useFdwErrorNotification(t: Translate) {
  const { notification } = App.useApp();
  const tRef = useRef(t);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  return useCallback(
    (title: string, error: unknown) => {
      (notification || staticNotification).error({
        message: tRef.current(title),
        description: getErrorMessage(error) || tRef.current('Operation failed'),
      });
    },
    [notification],
  );
}

function getDatabaseServerFormValues(record?: DatabaseServerRecord): Partial<DatabaseServerFormValues> {
  return record
    ? {
        database: record.database,
        description: record.description,
        host: record.host,
        name: record.name,
        password: record.password,
        port: record.port,
        username: record.username,
      }
    : {
        name: randomId('s_'),
      };
}

function stopSelectOptionAction(event: React.MouseEvent<HTMLElement>) {
  event.preventDefault();
  event.stopPropagation();
}

function DatabaseServerFormModal(props: {
  state: DatabaseServerDialogState;
  onCancel: () => void;
  onSubmitted: (record: DatabaseServerRecord) => Promise<void> | void;
}) {
  const ctx = useFlowContext();
  const t = useT();
  const showError = useFdwErrorNotification(t);
  const [form] = Form.useForm<DatabaseServerFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [testing, setTesting] = useState(false);
  const open = !!props.state;
  const mode = props.state?.mode || 'create';

  useEffect(() => {
    if (props.state) {
      form.setFieldsValue(getDatabaseServerFormValues(props.state.mode === 'edit' ? props.state.record : undefined));
    }
  }, [form, props.state]);

  const closeDialog = useCallback(() => {
    if (submitting || testing) {
      return;
    }
    form.resetFields();
    props.onCancel();
  }, [form, props, submitting, testing]);

  const handleTestConnection = useCallback(async () => {
    let values: DatabaseServerFormValues;
    try {
      values = await form.validateFields();
    } catch (error) {
      if (!isFormValidationError(error)) {
        showError('Test Connection', error);
      }
      return;
    }

    setTesting(true);
    try {
      await ctx.api.resource('databaseServers').testConnection({ values });
      message.success(t('Connection successful'));
    } catch (error) {
      showError('Test Connection', error);
    } finally {
      setTesting(false);
    }
  }, [ctx.api, form, showError, t]);

  const handleSubmit = useCallback(async () => {
    let values: DatabaseServerFormValues;
    try {
      values = await form.validateFields();
    } catch (error) {
      if (!isFormValidationError(error)) {
        showError('Operation failed', error);
      }
      return;
    }

    setSubmitting(true);
    try {
      const resource = ctx.api.resource('databaseServers');
      let response: unknown;
      if (mode === 'create') {
        response = await resource.create({ values });
      } else {
        response = await resource.update({ filterByTk: values.name, values });
      }
      const record = getResponseRecord<DatabaseServerRecord>(response) || values;
      message.success(t('Saved successfully'));
      await props.onSubmitted(record);
      form.resetFields();
    } catch (error) {
      showError('Operation failed', error);
    } finally {
      setSubmitting(false);
    }
  }, [ctx.api, form, mode, props, showError, t]);

  return (
    <Modal
      destroyOnClose
      open={open}
      title={mode === 'create' ? t('Create database server') : t('Edit database server')}
      width={520}
      onCancel={closeDialog}
      footer={
        <Space>
          <Button loading={testing} onClick={() => handleTestConnection()}>
            {t('Test Connection')}
          </Button>
          <Button onClick={closeDialog}>{t('Cancel')}</Button>
          <Button type="primary" loading={submitting} onClick={() => handleSubmit()}>
            {t('Submit')}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item name="description" label={t('Display name')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item
          name="name"
          label={t('Server name')}
          extra={t(
            'Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.',
          )}
          rules={[
            { required: true },
            {
              pattern: /^[A-Za-z][A-Za-z0-9_]*$/,
              message: t('Support letters, numbers and underscores, must start with an letter.'),
            },
          ]}
        >
          <Input disabled={mode === 'edit'} />
        </Form.Item>
        <Form.Item name="host" label={t('Host')} rules={[{ required: true }]}>
          <Input.TextArea autoSize={{ minRows: 1 }} />
        </Form.Item>
        <Form.Item name="port" label={t('Port')} rules={[{ required: true }]}>
          <Input.TextArea autoSize={{ minRows: 1 }} />
        </Form.Item>
        <Form.Item name="database" label={t('Database')} rules={[{ required: true }]}>
          <Input.TextArea autoSize={{ minRows: 1 }} />
        </Form.Item>
        <Form.Item name="username" label={t('Username')} rules={[{ required: true }]}>
          <Input.TextArea autoSize={{ minRows: 1 }} />
        </Form.Item>
        <Form.Item name="password" label={t('Password')} rules={[{ required: true }]}>
          <Input.Password />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function getFieldInterfaceOptions(manager: FieldInterfaceManager) {
  const groups = manager?.getFieldInterfaceGroups?.() || {};
  const interfaces = manager?.getFieldInterfaces?.() || [];
  const grouped = new Map<
    string,
    Array<{ availableTypes?: string[]; defaultType?: string; label: React.ReactNode; value: string }>
  >();

  interfaces
    .filter(
      (fieldInterface) => fieldInterface.name && !['relation', 'systemInfo'].includes(String(fieldInterface.group)),
    )
    .forEach((fieldInterface) => {
      const group = String(fieldInterface.group || 'other');
      const items = grouped.get(group) || [];
      items.push({
        value: String(fieldInterface.name),
        label: fieldInterface.title || String(fieldInterface.name),
        availableTypes: fieldInterface.availableTypes,
        defaultType: fieldInterface.default?.type,
      });
      grouped.set(group, items);
    });

  return Array.from(grouped.entries())
    .sort(([groupA], [groupB]) => (groups[groupA]?.order ?? 0) - (groups[groupB]?.order ?? 0))
    .map(([group, options]) => ({
      label: groups[group]?.label || group,
      options,
    }));
}

function getDefaultInterfaceName(fieldType: string | undefined, options: ReturnType<typeof getFieldInterfaceOptions>) {
  for (const group of options) {
    const option = group.options.find((item) => {
      if (!fieldType) {
        return true;
      }
      return item.availableTypes?.includes(fieldType) || item.defaultType === fieldType;
    });
    if (option) {
      return option.value;
    }
  }
  return undefined;
}

function normalizeRemoteFields(
  fields: FdwFieldRecord[],
  manager: FieldInterfaceManager,
  interfaceOptions: ReturnType<typeof getFieldInterfaceOptions>,
) {
  return fields.map((field) => {
    const fieldInterface = field.interface || getDefaultInterfaceName(field.type, interfaceOptions);
    const defaultConfig = manager?.getFieldInterface?.(fieldInterface)?.default || {};
    return {
      ...field,
      interface: fieldInterface,
      uiSchema: {
        ...defaultConfig.uiSchema,
        ...omitRawTitle(field.uiSchema),
        title: field.uiSchema?.title || field.name,
        required: !field.allowNull,
      },
    };
  });
}

export function FdwRemoteServerConfigureItem(props: CollectionTemplateConfigureItemProps) {
  const ctx = useFlowContext();
  const t = useT();
  const [selectOpen, setSelectOpen] = useState(false);
  const [dialogState, setDialogState] = useState<DatabaseServerDialogState>(null);
  const selectedServerName = Form.useWatch('remoteServerName', props.form);
  const serversRequest = useRequest(async () => {
    const response = await ctx.api.resource('databaseServers').list();
    return normalizeArrayResponse(response) as DatabaseServerRecord[];
  });

  const options = useMemo<DatabaseServerSelectOption[]>(
    () =>
      (serversRequest.data || []).map((server) => ({
        value: server.name,
        label: server.description || server.name,
        server,
      })),
    [serversRequest.data],
  );

  const changeServer = useCallback(
    (serverName?: string) => {
      props.form.setFieldsValue({
        remoteServerName: serverName,
        remoteTableName: undefined,
        remoteTableInfo: undefined,
        fields: [],
        [internalUnsupportedFieldsName]: [],
      });
    },
    [props.form],
  );

  const refreshServers = useCallback(async () => {
    if (serversRequest.refreshAsync) {
      await serversRequest.refreshAsync();
      return;
    }
    serversRequest.refresh();
  }, [serversRequest]);

  const handleDelete = useCallback(
    (server: DatabaseServerRecord) => {
      setSelectOpen(false);
      Modal.confirm({
        title: t('Are you sure you want to delete it?'),
        onOk: async () => {
          await ctx.api.resource('databaseServers').destroy({ filterByTk: server.name });
          message.success(t('Saved successfully'));
          if (selectedServerName === server.name) {
            changeServer(undefined);
          }
          await refreshServers();
        },
      });
    },
    [changeServer, ctx.api, refreshServers, selectedServerName, t],
  );

  const openCreateDialog = useCallback(() => {
    setSelectOpen(false);
    setDialogState({ mode: 'create' });
  }, []);

  const openEditDialog = useCallback((record: DatabaseServerRecord) => {
    setSelectOpen(false);
    setDialogState({ mode: 'edit', record });
  }, []);

  const handleSubmitted = useCallback(
    async (record: DatabaseServerRecord) => {
      setDialogState(null);
      await refreshServers();
      if (record.name) {
        changeServer(record.name);
      }
    },
    [changeServer, refreshServers],
  );

  return (
    <>
      <Form.Item name="remoteServerName" label={t('Database server')} rules={[{ required: true }]}>
        <Select
          allowClear
          disabled={props.mode === 'edit'}
          dropdownRender={(menu) => (
            <div>
              {menu}
              <Divider style={{ margin: '8px 0' }} />
              <Space style={{ padding: '0 8px 4px' }}>
                <Button icon={<PlusOutlined />} type="link" onClick={openCreateDialog}>
                  {t('Create database server')}
                </Button>
              </Space>
            </div>
          )}
          loading={serversRequest.loading}
          notFoundContent={<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          onChange={changeServer}
          onDropdownVisibleChange={setSelectOpen}
          open={selectOpen}
          optionFilterProp="label"
          optionRender={({ data, label }) => {
            const server = (data as DatabaseServerSelectOption).server;
            return (
              <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                <Space size={4} style={{ color: '#1677FF' }}>
                  <Button
                    size="small"
                    type="link"
                    onClick={(event) => {
                      stopSelectOptionAction(event);
                      openEditDialog(server);
                    }}
                    onMouseDown={stopSelectOptionAction}
                  >
                    {t('Edit')}
                  </Button>
                  <Divider type="vertical" />
                  <Button
                    size="small"
                    type="link"
                    onClick={(event) => {
                      stopSelectOptionAction(event);
                      handleDelete(server);
                    }}
                    onMouseDown={stopSelectOptionAction}
                  >
                    {t('Delete')}
                  </Button>
                </Space>
              </div>
            );
          }}
          options={options}
          showSearch
        />
      </Form.Item>
      <DatabaseServerFormModal
        state={dialogState}
        onCancel={() => setDialogState(null)}
        onSubmitted={handleSubmitted}
      />
    </>
  );
}

export function FdwRemoteTableConfigureItem(props: CollectionTemplateConfigureItemProps) {
  const ctx = useFlowContext();
  const t = useT();
  const showError = useFdwErrorNotification(t);
  const manager = ctx.dataSourceManager.collectionFieldInterfaceManager as FieldInterfaceManager;
  const remoteServerName = Form.useWatch('remoteServerName', props.form);
  const fieldOptions = useMemo(() => getFieldInterfaceOptions(manager), [manager]);
  const [loadingFields, setLoadingFields] = useState(false);
  const autoNameRef = useRef<string>();
  const tablesRequest = useRequest(
    async (serverName: string) => {
      const response = await ctx.api.resource(`databaseServers/${serverName}/tables`).list();
      return normalizeArrayResponse(response).map((table) => {
        const item = table as { name?: string; schema?: string };
        const value = item.schema ? `${item.schema}.${item.name}` : item.name;
        return {
          value,
          label: value,
        };
      });
    },
    {
      manual: true,
      onError(error) {
        showError('Remote table', error);
      },
    },
  );

  const loadFields = useCallback(
    async (tableName: string) => {
      if (!remoteServerName || !tableName) {
        props.form.setFieldsValue({
          fields: [],
          [internalUnsupportedFieldsName]: [],
        });
        return;
      }

      setLoadingFields(true);
      try {
        const response = await ctx.api.resource(`databaseServers/${remoteServerName}/tables`).get({
          filterByTk: tableName,
        });
        const payload = normalizeRemoteTablePayload(response);
        props.form.setFieldsValue({
          fields: normalizeRemoteFields(payload.fields, manager, fieldOptions),
          [internalUnsupportedFieldsName]: payload.unsupportedFields,
        });
      } catch (error) {
        props.form.setFieldsValue({
          fields: [],
          [internalUnsupportedFieldsName]: [],
        });
        showError('Fields', error);
      } finally {
        setLoadingFields(false);
      }
    },
    [ctx.api, fieldOptions, manager, props.form, remoteServerName, showError],
  );

  useEffect(() => {
    if (remoteServerName) {
      tablesRequest.run(remoteServerName);
    }
  }, [remoteServerName, tablesRequest]);

  return (
    <Spin spinning={loadingFields}>
      <Form.Item name="remoteTableName" label={t('Remote table')} rules={[{ required: true }]}>
        <Select
          allowClear
          disabled={props.mode === 'edit' || !remoteServerName}
          loading={tablesRequest.loading}
          optionFilterProp="label"
          options={tablesRequest.data || []}
          showSearch
          onChange={(value?: string) => {
            const { remoteTableInfo, tableName } = normalizeRemoteTableValue(value);
            props.form.setFieldsValue({
              remoteTableName: value,
              remoteTableInfo,
              fields: [],
              [internalUnsupportedFieldsName]: [],
            });

            if (tableName) {
              const currentName = props.form.getFieldValue('name');
              if (
                !props.form.isFieldTouched('name') ||
                currentName === autoNameRef.current ||
                /^t_[A-Za-z0-9]+$/.test(currentName)
              ) {
                autoNameRef.current = tableName;
                props.form.setFieldValue('name', tableName);
              }
              loadFields(value);
            }
          }}
        />
      </Form.Item>
    </Spin>
  );
}

export function FdwFieldsConfigureItem(props: CollectionTemplateConfigureItemProps) {
  const ctx = useFlowContext();
  const t = useT();
  const manager = ctx.dataSourceManager.collectionFieldInterfaceManager as FieldInterfaceManager;
  const watchedFields = Form.useWatch('fields', props.form);
  const unsupportedFields = Form.useWatch(internalUnsupportedFieldsName, { form: props.form, preserve: true }) as
    | FdwFieldRecord[]
    | undefined;
  const fields = useMemo(() => (Array.isArray(watchedFields) ? watchedFields : []), [watchedFields]);
  const fieldOptions = useMemo(() => getFieldInterfaceOptions(manager), [manager]);

  const updateField = useCallback(
    (index: number, nextField: FdwFieldRecord) => {
      const nextFields = [...fields];
      nextFields.splice(index, 1, nextField);
      props.form.setFieldValue('fields', nextFields);
    },
    [fields, props.form],
  );

  const columns: ColumnsType<FdwFieldRecord> = [
    {
      title: t('Name'),
      dataIndex: 'name',
      width: 130,
    },
    {
      title: t('Type'),
      dataIndex: 'type',
      width: 140,
      render: (value, record, index) =>
        record.possibleTypes?.length ? (
          <Select
            value={value}
            style={{ width: '100%' }}
            popupMatchSelectWidth={false}
            options={record.possibleTypes.map((type) => ({ label: type, value: type }))}
            onChange={(nextType) => updateField(index, { ...record, type: nextType })}
          />
        ) : (
          <Tag>{value}</Tag>
        ),
    },
    {
      title: t('Interface'),
      dataIndex: 'interface',
      width: 180,
      render: (value, record, index) => (
        <Select
          allowClear
          popupMatchSelectWidth={false}
          style={{ width: '100%' }}
          options={fieldOptions.map((group) => ({
            label: compileLegacyTemplate(group.label, t),
            options: group.options
              .filter((option) => !record.type || option.availableTypes?.includes(record.type))
              .map((option) => ({
                value: option.value,
                label: compileLegacyTemplate(option.label, t),
              })),
          }))}
          value={value || undefined}
          onChange={(nextInterface) => {
            const fieldInterface = manager?.getFieldInterface?.(nextInterface);
            updateField(index, {
              ...record,
              interface: nextInterface || null,
              type: fieldInterface?.default?.type || record.type,
              uiSchema: {
                ...fieldInterface?.default?.uiSchema,
                title: record.uiSchema?.title || record.name,
                required: !record.allowNull,
              },
            });
          }}
        />
      ),
    },
    {
      title: t('Display name'),
      dataIndex: ['uiSchema', 'title'],
      width: 180,
      render: (_, record, index) => (
        <Input
          value={(record.uiSchema?.title as string) || record.name}
          onChange={(event) => {
            updateField(index, {
              ...record,
              uiSchema: {
                ...omitRawTitle(record.uiSchema),
                title: event.target.value,
              },
            });
          }}
        />
      ),
    },
  ];

  return (
    <>
      <Form.Item
        name="fields"
        hidden
        rules={[
          {
            validator(_, value) {
              if (!Array.isArray(value) || !value.length) {
                return Promise.reject(new Error(t('Fields')));
              }
              if (value.some((field) => !field?.interface || !field?.uiSchema?.title)) {
                return Promise.reject(
                  new Error(t('Fields can only be used correctly if they are defined with an interface.')),
                );
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        <Input />
      </Form.Item>
      {fields.length ? (
        <Form.Item
          label={t('Fields')}
          required
          extra={t('Fields can only be used correctly if they are defined with an interface.')}
        >
          <Table bordered columns={columns} dataSource={fields} pagination={false} rowKey="name" scroll={{ y: 300 }} />
        </Form.Item>
      ) : (
        <Form.Item label={t('Fields')} required>
          <Alert showIcon message={t('Remote table')} />
        </Form.Item>
      )}
      {unsupportedFields?.length ? (
        <Alert
          showIcon
          type="warning"
          message={t('Unsupported fields')}
          description={unsupportedFields.map((field) => field.name).join(', ')}
          style={{ marginBottom: 24 }}
        />
      ) : null}
    </>
  );
}

export function FdwPreviewConfigureItem(props: CollectionTemplateConfigureItemProps) {
  const ctx = useFlowContext();
  const t = useT();
  const showError = useFdwErrorNotification(t);
  const remoteServerName = Form.useWatch('remoteServerName', props.form);
  const remoteTableName = Form.useWatch('remoteTableName', props.form);
  const watchedFields = Form.useWatch('fields', props.form);
  const fields = useMemo(() => (Array.isArray(watchedFields) ? watchedFields : []), [watchedFields]);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<Array<Record<string, unknown>>>([]);
  const fieldTypesKey = useMemo(() => {
    const fieldTypes = fields.reduce<Record<string, string>>((memo, field) => {
      if (field.type && mapFieldTypes.has(field.type)) {
        memo[field.name] = field.type;
      }
      return memo;
    }, {});
    return JSON.stringify(fieldTypes);
  }, [fields]);

  const columns = useMemo<ColumnsType<Record<string, unknown>>>(() => {
    return fields
      .filter((field) => field.interface)
      .map((field) => ({
        title: compileLegacyTemplate(field.uiSchema?.title || field.name, t),
        dataIndex: field.name,
        key: field.name,
        width: 200,
        ellipsis: true,
        render: (value: unknown) => {
          if (value == null) {
            return null;
          }
          if (typeof value === 'object') {
            return JSON.stringify(value);
          }
          return String(value);
        },
      }));
  }, [fields, t]);

  useEffect(() => {
    if (!remoteServerName || !remoteTableName || !fields.length) {
      setDataSource([]);
      return;
    }

    let ignore = false;
    const loadPreview = async () => {
      setLoading(true);
      try {
        const response = await ctx.api.resource('databaseServers.tables', remoteServerName).query({
          filterByTk: remoteTableName,
          fieldTypes: JSON.parse(fieldTypesKey) as Record<string, string>,
        });
        if (!ignore) {
          setDataSource(normalizeArrayResponse(response) as Array<Record<string, unknown>>);
        }
      } catch (error) {
        if (!ignore) {
          setDataSource([]);
          showError('Preview', error);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadPreview();

    return () => {
      ignore = true;
    };
  }, [ctx.api, fieldTypesKey, fields.length, remoteServerName, remoteTableName, showError]);

  return (
    <Form.Item label={t('Preview')}>
      <Spin spinning={loading}>
        <Table
          bordered
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          rowKey={(_, index) => String(index ?? 0)}
          scroll={{ x: 1000, y: 300 }}
        />
      </Spin>
    </Form.Item>
  );
}

export function normalizeFdwCollectionSubmitValues(values: Record<string, unknown>) {
  const submitValues = { ...values };
  delete submitValues[internalUnsupportedFieldsName];
  submitValues.remoteTableInfo = normalizeRemoteTableValue(
    typeof submitValues.remoteTableName === 'string' ? submitValues.remoteTableName : undefined,
  ).remoteTableInfo;
  return submitValues;
}
