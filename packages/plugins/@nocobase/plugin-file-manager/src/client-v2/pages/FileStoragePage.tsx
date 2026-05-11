/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CloseOutlined, DeleteOutlined, DownOutlined, PlusOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { useFlowContext, useFlowView } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { App, Button, Card, Checkbox, Dropdown, Form, Input, Space, Table, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { cloneDeep } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useT } from '../locale';
import { storageFormRegistry, type StorageFormDefinition } from '../storage-forms';

type StorageRecord = {
  id: number | string;
  title?: string;
  name?: string;
  type?: string;
  default?: boolean;
  [key: string]: any;
};

const PAGE_SIZE = 50;

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

const drawerTitleClassName = css`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: -8px;
`;

function createStorageName() {
  return `s_${Math.random().toString(36).slice(2, 12)}`;
}

function getInitialValues(options: {
  mode: 'create' | 'edit';
  storageDef: StorageFormDefinition;
  record?: StorageRecord;
}) {
  if (options.mode === 'edit') {
    return cloneDeep(options.record || {});
  }
  return {
    ...cloneDeep(options.storageDef.defaultValues || {}),
    type: options.storageDef.name,
    name: createStorageName(),
  };
}

function useStorageResource() {
  const ctx = useFlowContext();
  return ctx.api.resource('storages');
}

function StorageFormView(props: {
  mode: 'create' | 'edit';
  storageDef: StorageFormDefinition;
  record?: StorageRecord;
  onSubmitted: () => void;
}) {
  const t = useT();
  const view = useFlowView();
  const resource = useStorageResource();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const storageFormClassName = useStorageFormClassName();
  const initialValues = useMemo(
    () => getInitialValues({ mode: props.mode, storageDef: props.storageDef, record: props.record }),
    [props.mode, props.record, props.storageDef],
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
      await view.close();
    } finally {
      setSubmitting(false);
    }
  }, [form, props, resource, view]);

  const { Form: StorageFormBody } = props.storageDef;
  const title = `${props.mode === 'create' ? t('Add new') : t('Edit')} - ${t(props.storageDef.title)}`;

  return (
    <div>
      {view.Header ? (
        <view.Header
          title={
            <span className={drawerTitleClassName}>
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={async () => {
                  await view.close();
                }}
              />
              <span>{title}</span>
            </span>
          }
        />
      ) : null}
      <Form form={form} layout="vertical" initialValues={initialValues} className={storageFormClassName}>
        <Form.Item name="type" hidden>
          <Input />
        </Form.Item>
        <StorageFormBody />
      </Form>
      {view.Footer ? (
        <view.Footer>
          <Space>
            <Button
              onClick={async () => {
                await view.close();
              }}
            >
              {t('Cancel')}
            </Button>
            <Button type="primary" loading={submitting} onClick={handleSubmit}>
              {t('Submit')}
            </Button>
          </Space>
        </view.Footer>
      ) : null}
    </div>
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
  const { modal, message } = App.useApp();
  const resource = useStorageResource();
  const [page, setPage] = useState(1);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const { data, loading, refresh } = useRequest(
    async () => {
      const response = await resource.list({
        page,
        pageSize: PAGE_SIZE,
        sort: ['id'],
        appends: [],
      });
      return normalizeListResponse(response);
    },
    {
      refreshDeps: [page],
    },
  );

  const openForm = useCallback(
    (mode: 'create' | 'edit', storageDef: StorageFormDefinition, record?: StorageRecord) => {
      ctx.viewer.drawer({
        width: '50%',
        content: () => (
          <StorageFormView mode={mode} storageDef={storageDef} record={record} onSubmitted={() => refresh()} />
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
        render: (value) => <Checkbox checked={!!value} disabled />,
      },
      {
        title: t('Actions'),
        render: (_, record) => (
          <Space>
            <a
              onClick={() => {
                const storageDef = storageFormRegistry.get(record.type || '');
                if (!storageDef) {
                  message.error(
                    t('Storage type {{type}} is not registered, please check if related plugin is enabled.').replace(
                      '{{type}}',
                      record.type || '',
                    ),
                  );
                  return;
                }
                openForm('edit', storageDef, record);
              }}
            >
              {t('Edit')}
            </a>
            <a onClick={() => handleDelete(record.id)}>{t('Delete')}</a>
          </Space>
        ),
      },
    ],
    [handleDelete, message, openForm, t],
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
            items: storageFormRegistry.list().map((storageDef) => ({
              key: storageDef.name,
              label: t(storageDef.title),
            })),
            onClick(info) {
              const storageDef = storageFormRegistry.get(info.key);
              if (storageDef) {
                openForm('create', storageDef);
              }
            },
          }}
        >
          <Button type="primary" icon={<PlusOutlined />}>
            {t('Add new')} <DownOutlined />
          </Button>
        </Dropdown>
      </div>
      <Table
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
          pageSize: PAGE_SIZE,
          total: data?.total || 0,
          showSizeChanger: false,
          onChange: setPage,
        }}
      />
    </Card>
  );
}
