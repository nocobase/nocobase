/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFilter, DEFAULT_PAGE_SIZE, DrawerFormLayout, Table, type CompiledFilter } from '@nocobase/client-v2';
import type { Collection } from '@nocobase/flow-engine';
import { useFlowContext } from '@nocobase/flow-engine';
import { PlusOutlined } from '@ant-design/icons';
import { useMemoizedFn, useRequest } from 'ahooks';
import { App, Button, Form, Input, Select, Space, theme, Tooltip } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import React, { useMemo, useState } from 'react';
import { compileLegacyTemplate, compileLegacyTemplateText } from '../../utils/compileLegacyTemplate';
import { destroyScopeRecord, saveScopeRecord } from './permissionRequests';
import type { ScopeRecord } from './types';

type TFunction = (key: string, options?: Record<string, unknown>) => string;

function normalizeListResponse(response: any) {
  const payload = response?.data?.data;
  const rows = Array.isArray(payload) ? payload : payload?.data || payload?.rows || [];
  return {
    rows,
    total: payload?.count || payload?.total || response?.data?.meta?.count || rows.length,
    page: payload?.page,
    pageSize: payload?.pageSize,
  };
}

function getScopeValueKey(value: unknown) {
  if (value && typeof value === 'object') {
    const record = value as Partial<ScopeRecord>;
    return record.id ?? record.key;
  }
  return value as React.Key | undefined;
}

function isReadonlyScope(record?: ScopeRecord) {
  return record?.key === 'all' || record?.key === 'own';
}

interface ScopeFormProps {
  collection: Collection | undefined;
  dataSourceKey: string;
  initialValues?: Partial<ScopeRecord>;
  resourceName: string;
  onSubmitted: () => void;
  t: TFunction;
}

function ScopeForm(props: ScopeFormProps) {
  const { token } = theme.useToken();
  const ctx = useFlowContext();
  const [form] = Form.useForm();
  const [scope, setScope] = useState<CompiledFilter>(props.initialValues?.scope);
  const resource = useMemo(
    () => ctx.api.resource(`dataSources/${props.dataSourceKey}/rolesResourcesScopes`),
    [ctx.api, props.dataSourceKey],
  );

  async function handleSubmit() {
    const values = await form.validateFields();
    await saveScopeRecord(resource, {
      id: props.initialValues?.id,
      resourceName: props.resourceName,
      values,
      scope,
    });
    props.onSubmitted();
  }

  return (
    <DrawerFormLayout
      title={props.initialValues?.id != null ? props.t('Edit record') : props.t('Add record')}
      onSubmit={handleSubmit}
      submitText={props.t('Submit')}
      cancelText={props.t('Cancel')}
    >
      <Form form={form} layout="vertical" initialValues={props.initialValues}>
        <Form.Item
          name="name"
          label={props.t('Scope name')}
          rules={[{ required: true, message: props.t('The field value is required') }]}
        >
          <Input />
        </Form.Item>
        <Form.Item label={props.t('Data scope')}>
          <Space direction="vertical" size={token.marginXS}>
            <CollectionFilter
              collection={props.collection}
              t={props.t}
              noIgnore
              onChange={setScope}
              buttonText={scope ? props.t('Edit') : props.t('Configure')}
            />
          </Space>
        </Form.Item>
      </Form>
    </DrawerFormLayout>
  );
}

interface ScopePickerProps {
  collection: Collection | undefined;
  dataSourceKey: string;
  resourceName: string;
  value?: unknown;
  onChange?: (value: unknown) => void;
  onClose: () => void;
  t: TFunction;
}

function ScopePicker(props: ScopePickerProps) {
  const { token } = theme.useToken();
  const ctx = useFlowContext();
  const { modal } = App.useApp();
  const [selectedRowKey, setSelectedRowKey] = useState<React.Key | undefined>(getScopeValueKey(props.value));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const resource = useMemo(
    () => ctx.api.resource(`dataSources/${props.dataSourceKey}/rolesResourcesScopes`),
    [ctx.api, props.dataSourceKey],
  );
  const request = useRequest(
    async () => {
      const response = await resource.list({
        page,
        pageSize,
        filter: {
          $or: [{ resourceName: props.resourceName }, { resourceName: null }],
        },
      });
      return normalizeListResponse(response);
    },
    {
      refreshDeps: [props.dataSourceKey, props.resourceName, page, pageSize],
    },
  );

  const records = request.data?.rows || [];
  const selectedRecord =
    records.find((record) => String(getScopeValueKey(record)) === String(selectedRowKey)) ||
    (props.value && typeof props.value === 'object' && String(getScopeValueKey(props.value)) === String(selectedRowKey)
      ? (props.value as ScopeRecord)
      : undefined);

  const openScopeForm = useMemoizedFn((record?: ScopeRecord) => {
    ctx.viewer.drawer({
      width: token.screenMD,
      closable: true,
      content: () => (
        <ScopeForm
          collection={props.collection}
          dataSourceKey={props.dataSourceKey}
          resourceName={props.resourceName}
          initialValues={record}
          t={props.t}
          onSubmitted={() => {
            request.refresh();
          }}
        />
      ),
    });
  });

  const handleDelete = useMemoizedFn((record: ScopeRecord) => {
    modal.confirm({
      title: props.t('Delete record'),
      content: props.t('Are you sure you want to delete it?'),
      async onOk() {
        await destroyScopeRecord(resource, record.id);
        request.refresh();
      },
    });
  });

  const columns = useMemo<ColumnsType<ScopeRecord>>(
    () => [
      {
        title: props.t('Scope name'),
        dataIndex: 'name',
        width: token.sizeXXL * 5,
        ellipsis: true,
        render: (name) => compileLegacyTemplate(name, props.t),
      },
      {
        title: props.t('Actions'),
        width: token.sizeXXL * 4,
        render: (_, record) => {
          const disabled = isReadonlyScope(record);
          return (
            <Space size={token.marginXXS}>
              <Button
                type="link"
                size="small"
                disabled={disabled}
                onClick={() => {
                  if (!disabled) {
                    openScopeForm(record);
                  }
                }}
              >
                {props.t('Edit')}
              </Button>
              <Button
                type="link"
                size="small"
                disabled={disabled}
                onClick={() => {
                  if (!disabled) {
                    handleDelete(record);
                  }
                }}
              >
                {props.t('Delete')}
              </Button>
            </Space>
          );
        },
      },
    ],
    [handleDelete, openScopeForm, props, token.marginXXS, token.sizeXXL],
  );

  const pagination = useMemo<TablePaginationConfig>(
    () => ({
      current: request.data?.page ?? page,
      pageSize: request.data?.pageSize ?? pageSize,
      total: request.data?.total,
      onChange(nextPage, nextPageSize) {
        setPage(nextPage);
        setPageSize(nextPageSize);
      },
    }),
    [page, pageSize, request.data?.page, request.data?.pageSize, request.data?.total],
  );

  return (
    <DrawerFormLayout
      title={props.t('Select record')}
      submitText={props.t('Submit')}
      cancelText={props.t('Cancel')}
      onSubmit={async () => {
        props.onChange?.(selectedRecord || null);
        props.onClose();
      }}
      footer={
        <Space>
          <Button onClick={props.onClose}>{props.t('Cancel')}</Button>
          <Button
            type="primary"
            onClick={() => {
              props.onChange?.(selectedRecord || null);
              props.onClose();
            }}
          >
            {props.t('Submit')}
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size={token.margin} style={{ width: '100%' }}>
        <div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openScopeForm()}>
            {props.t('Add new')}
          </Button>
        </div>
        <Table<ScopeRecord>
          rowKey="id"
          loading={request.loading}
          dataSource={records}
          columns={columns}
          pagination={pagination}
          scroll={{ x: 'max-content' }}
          rowSelection={{
            type: 'radio',
            selectedRowKeys: selectedRowKey == null ? [] : [selectedRowKey],
            onChange: (keys) => setSelectedRowKey(keys[0]),
          }}
        />
      </Space>
    </DrawerFormLayout>
  );
}

export interface ScopeSelectProps {
  collection: Collection | undefined;
  dataSourceKey: string;
  resourceName: string;
  value?: unknown;
  onChange?: (value: unknown) => void;
  t: TFunction;
}

export function ScopeSelect(props: ScopeSelectProps) {
  const { token } = theme.useToken();
  const ctx = useFlowContext();
  const selectedName =
    props.value && typeof props.value === 'object'
      ? compileLegacyTemplateText((props.value as ScopeRecord).name, props.t, '')
      : undefined;
  const selectedKey = getScopeValueKey(props.value);
  const selectedValue =
    selectedKey == null
      ? undefined
      : {
          label: selectedName || String(selectedKey),
          value: String(selectedKey),
        };

  const openPicker = useMemoizedFn(() => {
    ctx.viewer.drawer({
      width: token.screenLG,
      closable: true,
      content: ({ close }) => <ScopePicker {...props} onClose={close} />,
    });
  });

  return (
    <Tooltip title={selectedName}>
      <Select
        size="small"
        value={selectedValue}
        labelInValue
        popupMatchSelectWidth={false}
        open={false}
        placeholder={props.t('Select record')}
        options={selectedValue ? [selectedValue] : []}
        allowClear
        showSearch={false}
        style={{ minWidth: token.sizeXXL * 5 }}
        onClick={openPicker}
        onClear={() => {
          props.onChange?.(null);
        }}
      />
    </Tooltip>
  );
}
