/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CheckOutlined, DeleteOutlined, DownOutlined, PlusOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { DEFAULT_PAGE_SIZE, DrawerFormLayout, Table } from '@nocobase/client-v2';
import { randomId, useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn, useRequest } from 'ahooks';
import { App, Button, Card, Dropdown, Form, Input, Space, Spin, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { cloneDeep } from 'lodash';
import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useT } from '../locale';
import { PluginFileManagerClientV2, type StorageType } from '../plugin';

type StorageRecord = {
  id: number | string;
  title?: string;
  name?: string;
  type?: string;
  default?: boolean;
  [key: string]: any;
};

function useStorageFormClassName() {
  const { token } = theme.useToken();
  return useMemo(
    () => css`
      .ant-radio-group {
        display: flex;
        flex-wrap: wrap;
        gap: ${token.marginSM}px;
      }

      .ant-radio-wrapper {
        margin-inline-end: 0;
        max-width: 100%;
      }
    `,
    [token.marginSM],
  );
}

function getInitialValues(options: { mode: 'create' | 'edit'; storageType: StorageType; record?: StorageRecord }) {
  if (options.mode === 'edit') {
    return cloneDeep(options.record || {});
  }
  return {
    ...cloneDeep(options.storageType.defaultValues || {}),
    type: options.storageType.name,
    name: randomId('s_'),
  };
}

function useStorageResource() {
  const ctx = useFlowContext();
  return ctx.api.resource('storages');
}

function StorageFormView(props: {
  mode: 'create' | 'edit';
  storageType: StorageType;
  record?: StorageRecord;
  onSubmitted: () => void;
}) {
  const t = useT();
  const resource = useStorageResource();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const storageFormClassName = useStorageFormClassName();
  const initialValues = useMemo(
    () => getInitialValues({ mode: props.mode, storageType: props.storageType, record: props.record }),
    [props.mode, props.record, props.storageType],
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  const handleSubmit = useCallback(async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (props.mode === 'create') {
        await resource.create({ values });
      } else {
        await resource.update({ filterByTk: props.record?.id, values });
      }
      props.onSubmitted();
    } finally {
      setSubmitting(false);
    }
  }, [form, props, resource]);

  const StorageFormBody = useMemo(() => lazy(props.storageType.formLoader), [props.storageType]);
  const title = `${props.mode === 'create' ? t('Add new') : t('Edit')} - ${t(props.storageType.title)}`;

  return (
    <DrawerFormLayout
      title={title}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
    >
      <Form form={form} layout="vertical" initialValues={initialValues} className={storageFormClassName}>
        <Form.Item name="type" hidden>
          <Input />
        </Form.Item>
        <Suspense fallback={<Spin />}>
          <StorageFormBody />
        </Suspense>
      </Form>
    </DrawerFormLayout>
  );
}

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

export default function FileStoragePage() {
  const t = useT();
  const ctx = useFlowContext();
  const { token } = theme.useToken();
  const { modal, message } = App.useApp();
  const resource = useStorageResource();
  const fileManagerPlugin = ctx.app.pm.get(PluginFileManagerClientV2);
  const storageTypes = useMemo(() => [...fileManagerPlugin.storageTypes.values()], [fileManagerPlugin]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const { data, loading, refresh } = useRequest(
    async () => {
      const response = await resource.list({
        page,
        pageSize,
        sort: ['id'],
        appends: [],
      });
      return normalizeListResponse(response);
    },
    {
      refreshDeps: [page, pageSize],
    },
  );

  // antd pagination `onChange(nextPage, nextPageSize)` fires for both
  // page-number changes and page-size changes. When pageSize changes we reset
  // back to page 1 so the user isn't stranded on an out-of-range page.
  const handlePaginationChange = useMemoizedFn((nextPage: number, nextPageSize: number) => {
    if (nextPageSize !== pageSize) {
      setPageSize(nextPageSize);
      setPage(1);
      return;
    }
    setPage(nextPage);
  });

  const openForm = useCallback(
    (mode: 'create' | 'edit', storageType: StorageType, record?: StorageRecord) => {
      ctx.viewer.drawer({
        width: '50%',
        closable: true,
        content: () => (
          <StorageFormView mode={mode} storageType={storageType} record={record} onSubmitted={() => refresh()} />
        ),
      });
    },
    [ctx.viewer, refresh],
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

  const columns = useMemo<ColumnsType<StorageRecord>>(
    () => [
      {
        title: t('Title'),
        dataIndex: 'title',
      },
      {
        title: t('Storage name'),
        dataIndex: 'name',
      },
      {
        title: t('Default storage'),
        dataIndex: 'default',
        // v1 renders a green check for "yes" and nothing for "no"; we mirror
        // that here. `token.colorSuccess` keeps us on the design-token API.
        render: (value) => (value ? <CheckOutlined style={{ color: token.colorSuccess }} /> : null),
      },
      {
        title: t('Actions'),
        render: (_, record) => (
          <Space>
            <a
              onClick={() => {
                const storageType = fileManagerPlugin.getStorageType(record.type);
                if (!storageType) {
                  message.error(
                    t('Storage type {{type}} is not registered, please check if related plugin is enabled.').replace(
                      '{{type}}',
                      record.type || '',
                    ),
                  );
                  return;
                }
                openForm('edit', storageType, record);
              }}
            >
              {t('Edit')}
            </a>
            <a onClick={() => handleDelete(record.id)}>{t('Delete')}</a>
          </Space>
        ),
      },
    ],
    // `token` is a stable design-token snapshot from antd; we omit it from
    // the deps because tracking individual token paths would force a rebuild
    // on every theme micro-change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fileManagerPlugin, handleDelete, message, openForm, t],
  );

  return (
    <Card variant="borderless">
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
        <Button
          icon={<DeleteOutlined />}
          disabled={!selectedRowKeys.length}
          onClick={() => handleDelete(selectedRowKeys)}
        >
          {t('Delete')}
        </Button>
        <Dropdown
          menu={{
            items: storageTypes.map((storageType) => ({
              key: storageType.name,
              label: t(storageType.title),
            })),
            onClick(info) {
              const storageType = fileManagerPlugin.getStorageType(info.key);
              if (storageType) {
                openForm('create', storageType);
              }
            },
          }}
        >
          <Button type="primary" icon={<PlusOutlined />}>
            {t('Add new')} <DownOutlined />
          </Button>
        </Dropdown>
      </div>
      <Table<StorageRecord>
        rowKey="id"
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
  );
}
