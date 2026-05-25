/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Table } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { App, Button, Card, Space, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useMemo, useState } from 'react';
import { useT } from '../../locale';
import { compileLegacyTemplate } from '../../utils/compileLegacyTemplate';
import { FieldForm } from './FieldForm';

interface FieldsPageProps {
  dataSourceKey: string;
  collection: Record<string, any>;
}

function normalizeListResponse(response: any) {
  const payload = response?.data?.data;
  return Array.isArray(payload) ? payload : [];
}

export default function FieldsPage(props: FieldsPageProps) {
  const t = useT();
  const ctx = useFlowContext();
  const { modal } = App.useApp();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const associatedIndex = `${props.dataSourceKey}.${props.collection.name}`;
  const request = useRequest(async () => {
    const response = await ctx.api.request({
      url: `dataSourcesCollections/${associatedIndex}/fields:list`,
      params: {},
    });
    return normalizeListResponse(response);
  });

  const openFieldForm = useCallback(
    (mode: 'create' | 'edit', field?: Record<string, any>) => {
      ctx.viewer.drawer({
        width: 650,
        closable: true,
        content: () => (
          <FieldForm
            mode={mode}
            dataSourceKey={props.dataSourceKey}
            collection={props.collection}
            field={field}
            onSubmitted={() => request.refresh()}
          />
        ),
      });
    },
    [ctx.viewer, props.collection, props.dataSourceKey, request],
  );

  const handleDelete = useCallback(
    (filterByTk: React.Key | React.Key[]) => {
      modal.confirm({
        title: t('Delete record'),
        content: t('Are you sure you want to delete it?'),
        async onOk() {
          const keys = Array.isArray(filterByTk) ? filterByTk : [filterByTk];
          await Promise.all(
            keys.map((key) =>
              ctx.api.request({
                url: `dataSourcesCollections/${associatedIndex}/fields:destroy?filterByTk=${key}`,
                method: 'post',
              }),
            ),
          );
          await ctx.dataSourceManager.getDataSource(props.dataSourceKey)?.reload();
          setSelectedRowKeys([]);
          request.refresh();
        },
      });
    },
    [associatedIndex, ctx.api, ctx.dataSourceManager, modal, props.dataSourceKey, request, t],
  );

  const columns = useMemo<ColumnsType<Record<string, any>>>(
    () => [
      {
        title: t('Field display name'),
        render: (record) => compileLegacyTemplate(record.uiSchema?.title || record.name, t),
      },
      { title: t('Field name'), dataIndex: 'name' },
      { title: t('Field type'), dataIndex: 'type', render: (value) => <Tag>{value}</Tag> },
      { title: t('Field interface'), dataIndex: 'interface', render: (value) => value || '-' },
      { title: t('Description'), dataIndex: 'description', ellipsis: true },
      {
        title: t('Actions'),
        width: 160,
        render: (_, record) => (
          <Space>
            <a onClick={() => openFieldForm('edit', record)}>{t('Edit')}</a>
            <a onClick={() => handleDelete(record.name)}>{t('Delete')}</a>
          </Space>
        ),
      },
    ],
    [handleDelete, openFieldForm, t],
  );

  return (
    <Card variant="borderless">
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => request.refresh()}>
            {t('Refresh')}
          </Button>
          <Button
            icon={<DeleteOutlined />}
            disabled={!selectedRowKeys.length}
            onClick={() => handleDelete(selectedRowKeys)}
          >
            {t('Delete')}
          </Button>
          {props.collection.template !== 'sql' ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openFieldForm('create')}>
              {t('Add field')}
            </Button>
          ) : null}
        </Space>
      </div>
      <Table<Record<string, any>>
        rowKey="name"
        loading={request.loading}
        dataSource={request.data || []}
        columns={columns}
        pagination={false}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
      />
    </Card>
  );
}
