/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CheckOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { DEFAULT_PAGE_SIZE, DrawerFormLayout, EnvVariableInput, Table } from '@nocobase/client-v2';
import { randomId, useFlowContext, useFlowEngine } from '@nocobase/flow-engine';
import { useMemoizedFn, useRequest } from 'ahooks';
import { App, Button, Card, Cascader, Form, Input, Radio, Space, Switch, Tag, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutlet } from 'react-router-dom';
import { PUBLIC_FORMS_NAMESPACE, PUBLIC_FORMS_SETTINGS_CONFIGURE_ROUTE_PATH } from '../constants';
import { useT } from '../locale';
import { ensurePublicFormFlowModel, type PublicFormRecord } from '../modelTree';

function normalizeListResponse(response: any) {
  const body = response?.data;
  const payload = body?.data;
  const records = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
  const meta = body?.meta || payload?.meta || {};

  return {
    records,
    total: meta.count || meta.total || records.length,
  };
}

type CollectionCascaderOption = {
  label: React.ReactNode;
  value: string;
  children: {
    label: React.ReactNode;
    value: string;
  }[];
};

function isCollectionCascaderOption(option: CollectionCascaderOption | null): option is CollectionCascaderOption {
  return !!option;
}

function formatName(value?: string) {
  if (!value) {
    return '';
  }

  return value
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (first) => first.toUpperCase());
}

function getPublicFormCollectionLabel(value?: string, options: CollectionCascaderOption[] = []) {
  const cascaderValue = toCollectionCascaderValue(value);

  if (!Array.isArray(cascaderValue) || cascaderValue.length < 2) {
    return value || '';
  }

  const [dataSourceKey, collectionName] = cascaderValue;
  const dataSourceOption = options.find((option) => option.value === dataSourceKey);
  const collectionOption = dataSourceOption?.children.find((option) => option.value === collectionName);
  const dataSourceLabel = dataSourceOption ? String(dataSourceOption.label) : formatName(dataSourceKey);
  const collectionLabel = collectionOption ? String(collectionOption.label) : formatName(collectionName);

  return [dataSourceLabel, collectionLabel].filter(Boolean).join(' / ');
}

export function toCollectionCascaderValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value;
  }
  if (!value) {
    return undefined;
  }
  const [dataSourceKey, collectionName] = String(value).includes(':') ? String(value).split(':') : ['main', value];
  return [dataSourceKey, collectionName].filter(Boolean);
}

export function fromCollectionCascaderValue(value?: string | string[]) {
  if (!Array.isArray(value)) {
    return value;
  }
  const [dataSourceKey, collectionName] = value;
  if (!dataSourceKey || !collectionName) {
    return value.filter(Boolean).join(':') || undefined;
  }
  return `${dataSourceKey}:${collectionName}`;
}

function useCollectionOptions() {
  const ctx = useFlowContext();
  const t = useT();

  return useMemo(() => {
    return (ctx.dataSourceManager?.getDataSources?.() || [])
      .map((dataSource) => {
        const children = dataSource
          .getCollections()
          .filter((collection) => !!collection.filterTargetKey)
          .map((collection) => ({
            label: collection.title || collection.name,
            value: collection.name,
          }));

        if (!children.length) {
          return null;
        }

        return {
          label: dataSource.displayName || t(dataSource.key),
          value: dataSource.key,
          children,
        };
      })
      .filter(isCollectionCascaderOption);
  }, [ctx.dataSourceManager, t]);
}

function PublicFormDrawer(props: { mode: 'create' | 'edit'; record?: PublicFormRecord; onSubmitted: () => void }) {
  const { mode, record, onSubmitted } = props;
  const t = useT();
  const ctx = useFlowContext();
  const flowEngine = useFlowEngine();
  const collectionOptions = useCollectionOptions();
  const formTypeOptions = useMemo(() => [{ label: t('Form'), value: 'form' }], [t]);
  const resource = ctx.api.resource('publicForms');
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const initialValues = useMemo(
    () =>
      mode === 'edit'
        ? { ...record }
        : {
            type: 'form',
            enabled: true,
          },
    [mode, record],
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  const handleSubmit = useCallback(async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (mode === 'create') {
        const nextRecord = {
          ...values,
          type: values.type || 'form',
          key: randomId(),
        };
        await resource.create({ values: nextRecord });
        await ensurePublicFormFlowModel(flowEngine, nextRecord, t);
      } else if (record?.key) {
        await resource.update({
          filterByTk: record.key,
          values,
        });
      } else {
        throw new Error('[NocoBase] Missing public form key.');
      }
      onSubmitted();
    } finally {
      setSubmitting(false);
    }
  }, [flowEngine, form, mode, onSubmitted, record?.key, resource, t]);

  return (
    <DrawerFormLayout
      title={mode === 'create' ? t('Add New') : t('Edit')}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
    >
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item name="title" label={t('Title')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item
          name="collection"
          label={t('Collection')}
          rules={[{ required: true }]}
          getValueProps={(value) => ({ value: toCollectionCascaderValue(value) })}
          normalize={fromCollectionCascaderValue}
        >
          <Cascader disabled={mode === 'edit'} options={collectionOptions as any} showSearch />
        </Form.Item>
        <Form.Item name="type" label={t('Type')}>
          <Radio.Group options={formTypeOptions} />
        </Form.Item>
        <Form.Item name="description" label={t('Description')}>
          <Input.TextArea />
        </Form.Item>
        <Form.Item name="password" label={t('Password')}>
          <EnvVariableInput password />
        </Form.Item>
        <Form.Item name="enabled" label={t('Enable form')} valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </DrawerFormLayout>
  );
}

export default function PublicFormsSettingsPage() {
  const t = useT();
  const ctx = useFlowContext();
  const flowEngine = useFlowEngine();
  const navigate = useNavigate();
  const outlet = useOutlet();
  const { modal } = App.useApp();
  const { token } = theme.useToken();
  const resource = ctx.api.resource('publicForms');
  const collectionOptions = useCollectionOptions();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const { data, loading, refresh } = useRequest(
    async () => {
      const response = await resource.list({
        page,
        pageSize,
        sort: ['-createdAt'],
        appends: ['createdBy', 'updatedBy'],
      });
      return normalizeListResponse(response);
    },
    {
      refreshDeps: [page, pageSize],
    },
  );

  const handlePaginationChange = useMemoizedFn((nextPage: number, nextPageSize: number) => {
    if (nextPageSize !== pageSize) {
      setPageSize(nextPageSize);
      setPage(1);
      return;
    }
    setPage(nextPage);
  });

  const openForm = useCallback(
    (mode: 'create' | 'edit', record?: PublicFormRecord) => {
      ctx.viewer.drawer({
        width: token.screenMD,
        closable: true,
        content: () => <PublicFormDrawer mode={mode} record={record} onSubmitted={() => refresh()} />,
      });
    },
    [ctx.viewer, refresh, token.screenMD],
  );

  const handleDelete = useCallback(
    (filterByTk: React.Key | React.Key[]) => {
      modal.confirm({
        title: t('Delete'),
        content: t('Are you sure you want to delete it?'),
        async onOk() {
          await resource.destroy({ filterByTk });
          setSelectedRowKeys([]);
          refresh();
        },
      });
    },
    [modal, refresh, resource, t],
  );

  const handleConfigure = useCallback(
    async (record: PublicFormRecord) => {
      await ensurePublicFormFlowModel(flowEngine, record, t);
      const basePath = ctx.app.pluginSettingsManager.getRoutePath(`${PUBLIC_FORMS_NAMESPACE}.index`);
      navigate(`${basePath}/${PUBLIC_FORMS_SETTINGS_CONFIGURE_ROUTE_PATH}/${record.key}`);
    },
    [ctx.app.pluginSettingsManager, flowEngine, navigate, t],
  );

  const columns = useMemo<ColumnsType<PublicFormRecord>>(
    () => [
      {
        title: t('Title'),
        dataIndex: 'title',
      },
      {
        title: t('Collection'),
        dataIndex: 'collection',
        width: 160,
        render: (value) => (value ? <Tag>{getPublicFormCollectionLabel(value, collectionOptions)}</Tag> : null),
      },
      {
        title: t('Type'),
        dataIndex: 'type',
        width: 100,
        render: (value) => (value ? <Tag>{value === 'form' ? t('Form') : t(value)}</Tag> : null),
      },
      {
        title: t('Enabled'),
        dataIndex: 'enabled',
        width: 80,
        render: (value) => (value ? <CheckOutlined style={{ color: token.colorSuccess }} /> : null),
      },
      {
        title: t('Description'),
        dataIndex: 'description',
      },
      {
        title: t('Actions'),
        render: (_, record) => (
          <Space>
            <a onClick={() => handleConfigure(record)}>{t('Configure')}</a>
            <a onClick={() => openForm('edit', record)}>{t('Edit')}</a>
            <a onClick={() => handleDelete(record.key)}>{t('Delete')}</a>
          </Space>
        ),
      },
    ],
    [collectionOptions, handleConfigure, handleDelete, openForm, t, token.colorSuccess],
  );

  return (
    outlet || (
      <Card variant="borderless">
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: token.marginXS, marginBottom: token.margin }}>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={refresh}>
            {t('Refresh')}
          </Button>
          <Button
            icon={<DeleteOutlined />}
            disabled={!selectedRowKeys.length}
            onClick={() => handleDelete(selectedRowKeys)}
          >
            {t('Delete')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm('create')}>
            {t('Add New')}
          </Button>
        </div>
        <Table<PublicFormRecord>
          rowKey="key"
          loading={loading}
          columns={columns}
          dataSource={data?.records || []}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{
            current: page,
            pageSize,
            total: data?.total || 0,
            onChange: handlePaginationChange,
          }}
        />
      </Card>
    )
  );
}
