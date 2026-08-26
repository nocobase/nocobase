/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  CloseOutlined,
  DeleteOutlined,
  DownOutlined,
  FilterOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { css } from '@emotion/css';
import { FilterContent, Table } from '@nocobase/client-v2';
import { useFlowContext, useFlowView } from '@nocobase/flow-engine';
import { transformFilter } from '@nocobase/utils/client';
import { useRequest } from 'ahooks';
import { Alert, App, Button, Card, Dropdown, Flex, Form, Input, Popover, Radio, Space, Tag, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { observable } from '@formily/reactive';
import { observer } from '@formily/react';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { VAR_NAME_RE } from '../../re';
import { EnvVariableFilterItem } from '../components/EnvVariableFilterItem';
import { useT } from '../locale';

type EnvVariable = {
  name: string;
  value?: string;
  type: 'default' | 'secret';
};

type FilterGroupValue = {
  logic: '$and' | '$or';
  items: any[];
};

const drawerTitleClassName = css`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: -8px;
`;

function createEmptyFilter(): FilterGroupValue {
  return observable({ logic: '$and', items: [] }) as FilterGroupValue;
}

function parseKeyValuePairs(input: string, type: 'default' | 'secret'): EnvVariable[] {
  return input
    .trim()
    .split('\n')
    .map((line): EnvVariable | null => {
      const [name, ...valueParts] = line.split('=');
      if (!name?.trim()) return null;
      return { name: name.trim(), value: valueParts.join('=').trim(), type };
    })
    .filter((item): item is EnvVariable => item != null);
}

function FilterPopover({
  value,
  onSubmit,
  onReset,
}: {
  value: FilterGroupValue;
  onSubmit: () => void;
  onReset: () => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const fakeCtx = useMemo(
    () => ({
      model: {
        translate: (key: string) => t(key),
        dispatchEvent: (eventName: string) => {
          if (eventName === 'submit') {
            onSubmit();
            setOpen(false);
          } else if (eventName === 'reset') {
            onReset();
          }
        },
      },
    }),
    [t, onSubmit, onReset],
  );

  const hasFilter = Array.isArray(value.items) && value.items.length > 0;

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      placement="bottomLeft"
      content={
        <div style={{ minWidth: 480 }}>
          <FilterContent value={value} ctx={fakeCtx} FilterItem={EnvVariableFilterItem} />
        </div>
      }
    >
      <Button icon={<FilterOutlined />} type={hasFilter ? 'primary' : 'default'}>
        {t('Filter')}
      </Button>
    </Popover>
  );
}

const EnvironmentPage: React.FC = observer(() => {
  const t = useT();
  const ctx = useFlowContext();
  const view = useFlowView();
  const { token } = theme.useToken();
  const { modal } = App.useApp();
  const resource = useMemo(() => ctx.api.resource('environmentVariables'), [ctx.api]);

  // The filter object is observable so that FilterGroup mutations re-render the popover.
  const filterValueRef = useRef<FilterGroupValue>(createEmptyFilter());
  const [filterPayload, setFilterPayload] = useState<Record<string, any> | undefined>(undefined);

  const [selectRowKeys, setSelectRowKeys] = useState<React.Key[]>([]);

  const variablesRequest = useRequest(
    async () => {
      const response = await ctx.api.request({
        url: 'environmentVariables',
        method: 'get',
        params: {
          paginate: false,
          filter: filterPayload,
        },
        skipNotify: true,
      } as any);
      return (response as any)?.data;
    },
    {
      refreshDeps: [filterPayload],
    },
  );

  const { data: variablesResp, loading } = variablesRequest;
  const records: EnvVariable[] = useMemo(() => {
    const list = (variablesResp as any)?.data;
    return Array.isArray(list) ? list : [];
  }, [variablesResp]);

  const handleSubmitFilter = useCallback(() => {
    setFilterPayload(transformFilter(filterValueRef.current as any) as any);
  }, []);

  const handleResetFilter = useCallback(() => {
    filterValueRef.current.logic = '$and';
    filterValueRef.current.items.splice(0, filterValueRef.current.items.length);
    setFilterPayload(undefined);
  }, []);

  const handleRefresh = useCallback(() => {
    variablesRequest.refresh();
  }, [variablesRequest]);

  const handleDelete = useCallback(
    (filterByTk: React.Key | React.Key[]) => {
      modal.confirm({
        title: t('Delete variable'),
        content: t('Are you sure you want to delete it?'),
        async onOk() {
          await resource.destroy({ filterByTk });
          setSelectRowKeys([]);
          variablesRequest.refresh();
        },
      });
    },
    [modal, resource, t, variablesRequest],
  );

  const openVariableDrawer = useCallback(
    (mode: 'create' | 'edit', record?: EnvVariable) => {
      const drawerTitle = `${mode === 'create' ? t('Add variable') : t('Edit')}`;
      ctx.viewer.drawer({
        width: '50%',
        content: () => (
          <VariableForm
            mode={mode}
            initialValues={record}
            onSubmitted={() => variablesRequest.refresh()}
            title={drawerTitle}
          />
        ),
      });
    },
    [ctx.viewer, t, variablesRequest],
  );

  const openBulkImportDrawer = useCallback(() => {
    ctx.viewer.drawer({
      width: '50%',
      content: () => <BulkImportForm onSubmitted={() => variablesRequest.refresh()} />,
    });
  }, [ctx.viewer, variablesRequest]);

  const columns = useMemo<ColumnsType<EnvVariable>>(
    () => [
      { title: t('Name'), dataIndex: 'name', ellipsis: true },
      {
        title: t('Type'),
        dataIndex: 'type',
        render: (value: 'default' | 'secret') =>
          value === 'secret' ? <Tag color="red">{t('Encrypted')}</Tag> : <Tag color="green">{t('Plain text')}</Tag>,
      },
      {
        title: t('Value'),
        ellipsis: true,
        render: (record: EnvVariable) => (record.type === 'default' ? record.value : '******'),
      },
      {
        title: t('Actions'),
        width: 200,
        render: (record: EnvVariable) => (
          <Space>
            <a onClick={() => openVariableDrawer('edit', record)}>{t('Edit')}</a>
            <a onClick={() => handleDelete(record.name)}>{t('Delete')}</a>
          </Space>
        ),
      },
    ],
    [handleDelete, openVariableDrawer, t],
  );

  const updated = (variablesResp as any)?.meta?.updated;

  return (
    <div>
      {updated ? (
        <Alert
          type="warning"
          style={{ marginBottom: token.marginMD, alignItems: 'center' }}
          description={
            <div>
              {t('Variables and secrets have been updated. A restart is required for the changes to take effect.')}
            </div>
          }
          action={
            <Button
              size="middle"
              type="primary"
              onClick={async () => {
                await ctx.api.resource('app').refresh();
              }}
            >
              {t('Restart now')}
            </Button>
          }
        />
      ) : null}
      <Card>
        <Flex justify="space-between" style={{ marginBottom: token.marginMD }}>
          <FilterPopover value={filterValueRef.current} onSubmit={handleSubmitFilter} onReset={handleResetFilter} />
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              {t('Refresh')}
            </Button>
            <Button
              icon={<DeleteOutlined />}
              disabled={!selectRowKeys.length}
              onClick={() => handleDelete(selectRowKeys)}
            >
              {t('Delete')}
            </Button>
            <Dropdown
              menu={{
                onClick(info) {
                  if (info.key === 'variable') openVariableDrawer('create');
                  else if (info.key === 'bulk') openBulkImportDrawer();
                },
                items: [
                  { key: 'variable', label: t('Add variable') },
                  { type: 'divider' },
                  { key: 'bulk', label: t('Bulk import') },
                ],
              }}
            >
              <Button type="primary" icon={<PlusOutlined />}>
                {t('Add new')} <DownOutlined />
              </Button>
            </Dropdown>
          </Space>
        </Flex>
        <Table<EnvVariable>
          rowKey="name"
          loading={loading}
          dataSource={records}
          columns={columns}
          pagination={false}
          rowSelection={{
            selectedRowKeys: selectRowKeys,
            onChange: (keys) => setSelectRowKeys(keys),
          }}
        />
      </Card>
    </div>
  );
});

function VariableForm(props: {
  mode: 'create' | 'edit';
  initialValues?: EnvVariable;
  onSubmitted: () => void;
  title: string;
}) {
  const { mode, initialValues, onSubmitted, title } = props;
  const t = useT();
  const ctx = useFlowContext();
  const view = useFlowView();
  const [form] = Form.useForm<EnvVariable>();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (mode === 'create') {
        await ctx.api.request({ url: 'environmentVariables:create', method: 'post', data: values });
      } else {
        await ctx.api.request({
          url: `environmentVariables:update`,
          method: 'post',
          params: { filterByTk: initialValues?.name },
          data: values,
        });
      }
      onSubmitted();
      await view.close();
    } finally {
      setSubmitting(false);
    }
  }, [ctx.api, form, initialValues?.name, mode, onSubmitted, view]);

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
      <div>
        <Form form={form} layout="vertical" initialValues={{ type: 'default', ...initialValues }}>
          <Form.Item
            name="name"
            label={`${t('Name')} :`}
            rules={[
              { required: true, message: t('The field value is required') },
              {
                pattern: VAR_NAME_RE,
                message: t('Only letters, numbers and underscores are allowed, and it must start with a letter.'),
              },
            ]}
          >
            <Input disabled={mode === 'edit'} />
          </Form.Item>
          <Form.Item
            name="type"
            label={`${t('Type')} :`}
            rules={[{ required: true, message: t('The field value is required') }]}
          >
            <Radio.Group
              options={[
                { value: 'default', label: t('Plain text') },
                { value: 'secret', label: t('Encrypted') },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="value"
            label={`${t('Value')} :`}
            rules={[{ required: true, message: t('The field value is required') }]}
          >
            <Input.TextArea autoSize={{ minRows: 3 }} />
          </Form.Item>
        </Form>
      </div>
      {view.Footer ? (
        <view.Footer>
          <Space>
            <Button onClick={async () => view.close()}>{t('Cancel')}</Button>
            <Button type="primary" loading={submitting} onClick={handleSubmit}>
              {t('Submit')}
            </Button>
          </Space>
        </view.Footer>
      ) : null}
    </div>
  );
}

function BulkImportForm(props: { onSubmitted: () => void }) {
  const { onSubmitted } = props;
  const t = useT();
  const ctx = useFlowContext();
  const view = useFlowView();
  const [form] = Form.useForm<{ variables?: string; secret?: string }>();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    const values = await form.validateFields();
    const items = [
      ...parseKeyValuePairs(values.variables || '', 'default'),
      ...parseKeyValuePairs(values.secret || '', 'secret'),
    ];
    if (!items.length) {
      await view.close();
      return;
    }
    setSubmitting(true);
    try {
      await ctx.api.request({ url: 'environmentVariables:create', method: 'post', data: items });
      onSubmitted();
      await view.close();
    } finally {
      setSubmitting(false);
    }
  }, [ctx.api, form, onSubmitted, view]);

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
              <span>{t('Bulk import')}</span>
            </span>
          }
        />
      ) : null}
      <div>
        <Form form={form} layout="vertical">
          <Form.Item name="variables" label={`${t('Plain text')} :`}>
            <Input.TextArea autoSize={{ minRows: 8, maxRows: 16 }} placeholder={'FOO=aaa\nBAR=bbb'} />
          </Form.Item>
          <Form.Item name="secret" label={`${t('Encrypted')} :`}>
            <Input.TextArea autoSize={{ minRows: 8, maxRows: 16 }} placeholder={'FOO=aaa\nBAR=bbb'} />
          </Form.Item>
        </Form>
      </div>
      {view.Footer ? (
        <view.Footer>
          <Space>
            <Button onClick={async () => view.close()}>{t('Cancel')}</Button>
            <Button type="primary" loading={submitting} onClick={handleSubmit}>
              {t('Submit')}
            </Button>
          </Space>
        </view.Footer>
      ) : null}
    </div>
  );
}

export default EnvironmentPage;
