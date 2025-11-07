/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { WorkContextOptions } from '../types';
import { DatabaseOutlined } from '@ant-design/icons';
import { useT } from '../../locale';
// @ts-ignore
import _ from 'lodash';
import { DatasourceSelector } from '../datasource';
import { Space } from 'antd';
import { dialogController } from '../stores/dialog-controller';
import { transformFilter } from '@nocobase/utils/client';

export const DatasourceContext: WorkContextOptions = {
  name: 'datasource',
  menu: {
    icon: <DatabaseOutlined />,
    Component: () => {
      const t = useT();
      return <div>{t('Datasource')}</div>;
    },
    onClick: ({ ctx, contextItems, onAdd, onRemove }) => {
      ctx.viewer.dialog({
        width: '80%',
        content: <DatasourceSelector contextItems={contextItems} onAdd={onAdd} onRemove={onRemove} />,
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
    Component: ({ item }) => {
      return (
        <Space>
          <DatabaseOutlined />
          <span> {item?.title || ''}</span>
        </Space>
      );
    },
  },
  getContent: async (app, { uid }) => {
    const response = await app.apiClient.resource('aiContextDatasources').get({ filterByTk: uid });
    const { data } = response.data;
    return {
      datasource: data.datasource,
      collectionName: data.collectionName,
      fields: data.fields,
      filter: transformFilter(data.filter),
      sort: data.sort,
      limit: data.limit,
    };
  },
};
