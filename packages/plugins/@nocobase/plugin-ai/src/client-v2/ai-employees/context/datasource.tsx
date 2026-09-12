/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { CloseOutlined, DatabaseOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';
import { transformFilter } from '@nocobase/utils/client';
import type { WorkContextOptions } from '../types';
import { useT } from '../../locale';
import { DatasourceSelector } from '../datasource/DatasourceSelector';
import { dialogController } from '../stores/dialog-controller';

type DatasourceResponse = {
  datasource?: string;
  collectionName?: string;
  fields?: unknown;
  filter?: unknown;
  sort?: unknown;
  limit?: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const DatasourceDialogTitle: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const t = useT();

  return (
    <Space>
      <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
      <span>{t('Select datasource')}</span>
    </Space>
  );
};

export const DatasourceContext: WorkContextOptions = {
  name: 'datasource',
  menu: {
    icon: <DatabaseOutlined />,
    Component: () => {
      const t = useT();
      return <div>{t('Datasource')}</div>;
    },
    onClick: ({ ctx, contextItems, onAdd, onRemove }) => {
      const currentDialog: { close?: () => Promise<unknown> } = ctx.viewer.dialog({
        width: '80%',
        title: (
          <DatasourceDialogTitle
            onClose={() => {
              Promise.resolve(currentDialog.close?.()).catch(console.error);
            }}
          />
        ),
        content: (view) => <DatasourceSelector contextItems={contextItems} onAdd={onAdd} onRemove={onRemove} />,
        onOpen: () => {
          dialogController.hide();
        },
        onClose: () => {
          dialogController.resume();
        },
      });
    },
  },
  tag: {
    Component: ({ item }) => (
      <Space>
        <DatabaseOutlined />
        <span>{item?.title || ''}</span>
      </Space>
    ),
  },
  getContent: async (app, { uid, content }) => {
    if (content) {
      return content;
    }
    const response = await app.apiClient.resource('aiContextDatasources').get({ filterByTk: uid });
    const data = response.data?.data as unknown;
    if (!isRecord(data)) {
      return {};
    }
    const datasource = data as DatasourceResponse;
    return {
      datasource: datasource.datasource,
      collectionName: datasource.collectionName,
      fields: datasource.fields,
      filter: transformFilter(datasource.filter),
      sort: datasource.sort,
      limit: datasource.limit,
    };
  },
};
