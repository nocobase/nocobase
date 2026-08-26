/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, DownOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  CollectionFilter,
  DEFAULT_PAGE_SIZE,
  DrawerFormLayout,
  ExtendCollectionsProvider,
  Table,
} from '@nocobase/client-v2';
import { randomId, useFlowContext, useFlowEngine } from '@nocobase/flow-engine';
import { useMemoizedFn, useRequest } from 'ahooks';
import { App, Button, Card, Dropdown, Empty, Flex, Form, Input, Space, Spin, Tag, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { cloneDeep } from 'lodash';
import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import channelCollection from '../../collections/channel';
import { COLLECTION_NAME } from '../../constant';
import { useNotificationTranslation, useT } from '../locale';
import PluginNotificationManagerClientV2 from '../plugin';
import type { RegisterChannelOptions } from '../notification-manager';
import { getNotificationTypeOptions, withResolvedNotificationTypeEnum } from '../utils/notificationTypeOptions';

type ChannelRecord = {
  name: string;
  title?: string;
  description?: string;
  notificationType?: string;
  options?: Record<string, any>;
  meta?: { editable?: boolean; deletable?: boolean };
  [key: string]: any;
};

function normalizeListResponse(response: any) {
  const body = response?.data;
  const payload = body?.data;
  const records: ChannelRecord[] = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
  const meta = body?.meta || payload?.meta || {};
  return {
    records,
    total: meta.count || meta.total || records.length,
  };
}

function ChannelFormView(props: {
  mode: 'create' | 'edit';
  notificationType: string;
  plugin: PluginNotificationManagerClientV2;
  record?: ChannelRecord;
  onSubmitted: () => void;
}) {
  const { t } = useNotificationTranslation();
  const ctx = useFlowContext();
  const resource = useMemo(() => ctx.api.resource(COLLECTION_NAME.channels), [ctx.api]);
  const [form] = Form.useForm<ChannelRecord>();
  const [submitting, setSubmitting] = useState(false);

  const initialValues = useMemo<ChannelRecord>(() => {
    if (props.mode === 'edit') return cloneDeep(props.record || ({} as ChannelRecord));
    return {
      name: randomId('s_'),
      notificationType: props.notificationType,
      options: {},
    } as ChannelRecord;
  }, [props.mode, props.notificationType, props.record]);

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  const channelType = props.plugin.channelTypes.get(props.notificationType);
  const ChannelConfigFormLoader = channelType?.components?.ChannelConfigFormLoader;

  const ChannelConfigBody = useMemo(
    () => (ChannelConfigFormLoader ? lazy(ChannelConfigFormLoader) : null),
    [ChannelConfigFormLoader],
  );

  const handleSubmit = useMemoizedFn(async () => {
    const raw = await form.validateFields();
    setSubmitting(true);
    try {
      if (props.mode === 'create') {
        await resource.create({ values: raw });
        props.onSubmitted();
      } else if (props.record?.name != null) {
        const merged: ChannelRecord = {
          ...cloneDeep(props.record),
          ...raw,
          options: { ...(props.record.options || {}), ...(raw.options || {}) },
        };
        await resource.update({ filterByTk: props.record.name, values: merged });
        props.onSubmitted();
      } else {
        throw new Error(`Edit mode requires record.name; got ${JSON.stringify(props.record)}`);
      }
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <DrawerFormLayout
      title={props.mode === 'create' ? t('Add new') : t('Edit')}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
    >
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item
          name="name"
          label={t('Channel name')}
          extra={t(
            'Randomly generated and can not be modified. Support letters, numbers and underscores, must start with an letter.',
          )}
          rules={[{ required: true, message: t('The field value is required') }]}
        >
          <Input disabled />
        </Form.Item>
        <Form.Item
          name="title"
          label={t('Channel display name')}
          rules={[{ required: true, message: t('The field value is required') }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="description" label={t('Description')}>
          <Input.TextArea autoSize={{ minRows: 2 }} />
        </Form.Item>
        <Form.Item name="notificationType" hidden>
          <Input />
        </Form.Item>
        {ChannelConfigBody ? (
          <Suspense fallback={<Spin />}>
            <ChannelConfigBody />
          </Suspense>
        ) : null}
      </Form>
    </DrawerFormLayout>
  );
}

function ChannelsPageInner() {
  const { t } = useNotificationTranslation();
  const compileT = useT();
  const ctx = useFlowContext();
  const engine = useFlowEngine();
  const { token } = theme.useToken();
  const { modal, message } = App.useApp();
  const resource = useMemo(() => ctx.api.resource(COLLECTION_NAME.channels), [ctx.api]);
  const plugin = ctx.app.pm.get(PluginNotificationManagerClientV2);
  const filterCollection = useMemo(
    () => engine.context.dataSourceManager?.getDataSource?.('main')?.getCollection?.(COLLECTION_NAME.channels),
    [engine],
  );

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [filterPayload, setFilterPayload] = useState<any>(undefined);

  const { data, loading, refresh } = useRequest(
    async () => {
      const response = await resource.list({
        page,
        pageSize,
        sort: ['createdAt'],
        ...(filterPayload ? { filter: filterPayload } : {}),
      });
      return normalizeListResponse(response);
    },
    {
      refreshDeps: [page, pageSize, filterPayload],
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

  const registeredChannelTypes = useMemo<RegisterChannelOptions[]>(() => {
    if (!plugin) return [];
    const entries: Array<[string, RegisterChannelOptions]> = Array.from(plugin.channelTypes.getEntities());
    return entries.map(([, value]) => value);
  }, [plugin]);

  const channelTypeLabelOf = useMemoizedFn((type?: string) => {
    if (!type) return '';
    const found = registeredChannelTypes.find((item) => item.type === type);
    return compileT(found?.title || type);
  });

  const openForm = useMemoizedFn((mode: 'create' | 'edit', notificationType: string, record?: ChannelRecord) => {
    ctx.viewer.drawer({
      width: '50%',
      closable: true,
      content: () => (
        <ChannelFormView
          mode={mode}
          notificationType={notificationType}
          plugin={plugin}
          record={record}
          onSubmitted={() => refresh()}
        />
      ),
    });
  });

  const handleDelete = useMemoizedFn((filterByTk: React.Key | React.Key[]) => {
    modal.confirm({
      title: t('Delete'),
      content: t('Are you sure you want to delete it?'),
      async onOk() {
        await resource.destroy({ filterByTk });
        setSelectedRowKeys([]);
        refresh();
      },
    });
  });

  const docsHref =
    ctx.api?.auth?.locale === 'zh-CN'
      ? 'https://docs-cn.nocobase.com/handbook/notification-manager'
      : 'https://docs.nocobase.com/handbook/notification-manager';

  const creatableChannelTypes = useMemo(
    () => registeredChannelTypes.filter((item) => item.meta?.creatable !== false),
    [registeredChannelTypes],
  );

  const addNewMenu = useMemo(() => {
    if (creatableChannelTypes.length === 0) {
      return {
        items: [
          {
            key: '__empty__',
            label: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <>
                    {t('No channel enabled yet')}
                    <br />
                    <a target="_blank" href={docsHref} rel="noreferrer">
                      {t('View documentation')}
                    </a>
                  </>
                }
              />
            ),
          },
        ],
      };
    }
    return {
      items: creatableChannelTypes.map((item) => ({
        key: item.type,
        label: compileT(item.title),
        onClick: () => openForm('create', item.type),
      })),
    };
  }, [creatableChannelTypes, compileT, docsHref, openForm, t]);

  const columns = useMemo<ColumnsType<ChannelRecord>>(
    () => [
      {
        title: t('Channel display name'),
        dataIndex: 'title',
        ellipsis: true,
        render: (value: string) => (value ? compileT(value) : ''),
      },
      {
        title: t('Channel name'),
        dataIndex: 'name',
        ellipsis: true,
      },
      {
        title: t('Description'),
        dataIndex: 'description',
        ellipsis: true,
        render: (value: string) => (value ? compileT(value) : ''),
      },
      {
        title: t('Notification type'),
        dataIndex: 'notificationType',
        render: (value: string) => (value ? <Tag>{channelTypeLabelOf(value)}</Tag> : null),
      },
      {
        title: t('Actions'),
        width: 160,
        render: (_, record) => (
          <Space>
            {record.meta?.editable === false ? null : (
              <a
                onClick={() => {
                  if (!record.notificationType) return;
                  if (!plugin?.channelTypes.get(record.notificationType)) {
                    message.error(
                      t('Notification type {{type}} is not registered.').replace('{{type}}', record.notificationType),
                    );
                    return;
                  }
                  openForm('edit', record.notificationType, record);
                }}
              >
                {t('Edit')}
              </a>
            )}
            {record.meta?.deletable === false ? null : <a onClick={() => handleDelete(record.name)}>{t('Delete')}</a>}
          </Space>
        ),
      },
    ],
    [channelTypeLabelOf, compileT, handleDelete, message, openForm, plugin, t],
  );

  return (
    <Card variant="borderless">
      <Flex justify="space-between" style={{ marginBottom: token.margin }}>
        <CollectionFilter collection={filterCollection} onChange={setFilterPayload} t={compileT} />
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refresh()}>
            {t('Refresh')}
          </Button>
          <Button
            icon={<DeleteOutlined />}
            disabled={!selectedRowKeys.length}
            onClick={() => handleDelete(selectedRowKeys)}
          >
            {t('Delete')}
          </Button>
          <Dropdown menu={addNewMenu}>
            <Button type="primary" icon={<PlusOutlined />}>
              {t('Add new')} <DownOutlined />
            </Button>
          </Dropdown>
        </Space>
      </Flex>
      <Table<ChannelRecord>
        rowKey="name"
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

export default function ChannelsPage() {
  const ctx = useFlowContext();
  const compileT = useT();
  const plugin = ctx.app.pm.get(PluginNotificationManagerClientV2);
  const collections = useMemo(() => {
    const options = getNotificationTypeOptions(plugin, compileT);
    return [withResolvedNotificationTypeEnum(channelCollection, options)];
  }, [plugin, compileT]);
  return (
    <ExtendCollectionsProvider collections={collections}>
      <ChannelsPageInner />
    </ExtendCollectionsProvider>
  );
}
