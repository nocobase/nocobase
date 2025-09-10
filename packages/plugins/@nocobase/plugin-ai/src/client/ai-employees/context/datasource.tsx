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

export const DatasourceContext: WorkContextOptions = {
  name: 'datasource',
  menu: {
    icon: <DatabaseOutlined />,
    Component: () => {
      const t = useT();
      return <div>{t('Datasource')}</div>;
    },
    onClick: ({ ctx, onAdd, onRemove }) => {
      ctx.viewer.dialog({
        width: '80%',
        content: <DatasourceSelector onAdd={onAdd} onRemove={onRemove} />,
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
    return uid;
  },
};
