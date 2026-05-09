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
import { JsonTextArea } from '@nocobase/client-v2';
import { useFlowContext, useFlowView } from '@nocobase/flow-engine';
import {
  App,
  Button,
  Card,
  Checkbox,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Table,
  theme,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useRequest } from 'ahooks';
import { cloneDeep, get, set } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FILE_SIZE_LIMIT_DEFAULT, FILE_SIZE_LIMIT_MAX, FILE_SIZE_LIMIT_MIN } from '../../constants';
import { useT } from '../locale';
import { storageTypes } from '../storageTypes';
import type { StorageFieldMeta, StorageTypeMeta } from '../storageTypes/types';
import { EnvVariableInput } from '@nocobase/plugin-environment-variables/client-v2';

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

// Mirrors v1's `.auto-width` rule (registered globally on FormItem in @nocobase/client):
// shrinks the antd control to its content width but keeps a sensible minimum.
const autoWidthClassName = css`
  &.ant-input-number,
  &.ant-select {
    width: auto;
    min-width: 6em;
  }
`;

const drawerTitleClassName = css`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: -8px;
`;

const renameModeOptions = [
  { label: 'Append random ID', value: 'appendRandomID' },
  { label: 'Random string', value: 'random' },
  { label: 'Keep original filename (will be overwrite if filename is existed)', value: 'none' },
];

const unitOptions = [
  { value: 1, label: 'Byte' },
  { value: 1024, label: 'KB' },
  { value: 1024 * 1024, label: 'MB' },
  { value: 1024 * 1024 * 1024, label: 'GB' },
];

function createStorageName() {
  return `s_${Math.random().toString(36).slice(2, 12)}`;
}

function getUnitOption(value: number, defaultUnit = 1024 * 1024) {
  const size = value || defaultUnit;
  for (let i = unitOptions.length - 1; i >= 0; i -= 1) {
    const option = unitOptions[i];
    if (size % option.value === 0) {
      return option;
    }
  }

  return unitOptions[0];
}

function limitSize(value: number, min = FILE_SIZE_LIMIT_MIN, max = FILE_SIZE_LIMIT_MAX) {
  return Math.min(Math.max(min, value), max);
}

function FileSizeInput(props: { value?: number; onChange?: (value?: number) => void; disabled?: boolean }) {
  const defaultValue = FILE_SIZE_LIMIT_DEFAULT;
  const unit = getUnitOption(props.value ?? defaultValue);
  const value = props.value == null ? props.value : props.value / unit.value;

  const handleBlur = useCallback(() => {
    // Mirror v1: when blurred with empty / below-min input, snap to the minimum byte size
    // so the form stays valid instead of flagging "required".
    if (props.value == null || props.value < FILE_SIZE_LIMIT_MIN) {
      props.onChange?.(FILE_SIZE_LIMIT_MIN);
    }
  }, [props]);

  return (
    <Space.Compact>
      <InputNumber
        value={value}
        disabled={props.disabled}
        defaultValue={defaultValue / getUnitOption(defaultValue).value}
        step={1}
        className={autoWidthClassName}
        onBlur={handleBlur}
        onChange={(nextValue) => {
          props.onChange?.(nextValue == null ? undefined : limitSize(Number(nextValue) * unit.value));
        }}
      />
      <Select
        disabled={props.disabled}
        options={unitOptions}
        value={unit.value}
        className={autoWidthClassName}
        onChange={(nextUnit) => {
          props.onChange?.(value == null ? undefined : limitSize(Number(value) * nextUnit));
        }}
      />
    </Space.Compact>
  );
}

function applyFieldDefaults(storageType: StorageTypeMeta, values: Record<string, any>) {
  const nextValues = cloneDeep(values || {});
  for (const field of storageType.fields) {
    if (typeof field.defaultValue !== 'undefined' && typeof get(nextValues, field.name) === 'undefined') {
      set(nextValues, field.name, field.defaultValue);
    }
  }
  return nextValues;
}

function getInitialValues(options: { mode: 'create' | 'edit'; storageType: StorageTypeMeta; record?: StorageRecord }) {
  const values =
    options.mode === 'create'
      ? {
          type: options.storageType.name,
          name: createStorageName(),
        }
      : {
          ...options.record,
        };

  return applyFieldDefaults(options.storageType, values);
}

function useStorageResource() {
  const ctx = useFlowContext();
  return ctx.api.resource('storages');
}

function StorageField(props: { field: StorageFieldMeta; disabledDefault?: boolean }) {
  const { field, disabledDefault } = props;
  const t = useT();

  if (field.hidden) {
    return (
      <Form.Item name={field.name} hidden>
        <Input />
      </Form.Item>
    );
  }

  if (field.component === 'checkbox') {
    return (
      <Form.Item name={field.name} valuePropName="checked" extra={field.description ? t(field.description) : undefined}>
        <Checkbox disabled={disabledDefault && field.name === 'default'}>{t(field.label)}</Checkbox>
      </Form.Item>
    );
  }

  const rules = field.required ? [{ required: true, message: t('The field value is required') }] : undefined;
  const help = field.description ? t(field.description) : undefined;

  return (
    <Form.Item name={field.name} label={`${t(field.label)} :`} rules={rules} extra={help}>
      {field.component === 'variableInput' ? (
        <EnvVariableInput
          placeholder={field.placeholder ? t(field.placeholder) : undefined}
          addonBefore={field.addonBefore}
        />
      ) : field.component === 'passwordVariableInput' ? (
        <EnvVariableInput password />
      ) : field.component === 'number' ? (
        Array.isArray(field.name) && field.name.join('.') === 'rules.size' ? (
          <FileSizeInput />
        ) : (
          <InputNumber style={{ width: '100%' }} />
        )
      ) : field.component === 'radio' ? (
        <Radio.Group options={renameModeOptions.map((item) => ({ ...item, label: t(item.label) }))} />
      ) : field.component === 'json' ? (
        <JsonTextArea autoSize={{ minRows: 5 }} />
      ) : (
        <Input placeholder={field.placeholder ? t(field.placeholder) : undefined} addonBefore={field.addonBefore} />
      )}
    </Form.Item>
  );
}

function StorageFormView(props: {
  mode: 'create' | 'edit';
  storageType: StorageTypeMeta;
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
      await view.close();
    } finally {
      setSubmitting(false);
    }
  }, [form, props, resource, view]);

  const title = `${props.mode === 'create' ? t('Add new') : t('Edit')} - ${t(props.storageType.title)}`;

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
        {props.storageType.fields.map((field) => (
          <StorageField
            field={field}
            key={Array.isArray(field.name) ? field.name.join('.') : field.name}
            disabledDefault={props.mode === 'edit' && !!props.record?.default}
          />
        ))}
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
    (mode: 'create' | 'edit', storageType: StorageTypeMeta, record?: StorageRecord) => {
      ctx.viewer.drawer({
        width: '50%',
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
        render: (value) => <Checkbox checked={!!value} disabled />,
      },
      {
        title: t('Actions'),
        render: (_, record) => (
          <Space>
            <a
              onClick={() => {
                const storageType = storageTypes[record.type || ''];
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
            items: Object.values(storageTypes).map((storageType) => ({
              key: storageType.name,
              label: t(storageType.title),
            })),
            onClick(info) {
              const storageType = storageTypes[info.key];
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
