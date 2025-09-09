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
import { BuildOutlined, PicLeftOutlined } from '@ant-design/icons';
import { useT } from '../../locale';
// @ts-ignore
import { useFlowEngine } from '@nocobase/flow-engine';
import _ from 'lodash';
import { DatasourceSelector } from '../datasource';

export const DatasourceContext: WorkContextOptions = {
  name: 'datasource',
  menu: {
    icon: <BuildOutlined />,
    Component: () => {
      const t = useT();
      return <div>{t('Datasource')}</div>;
    },
    clickHandler:
      ({ ctx, onAdd, onRemove }) =>
      () => {
        ctx.viewer.dialog({
          title: ctx.t('Add Datasource'),
          width: 1200,
          content: () => <DatasourceSelector onAdd={onAdd} onRemove={onRemove} />,
        });
      },
  },
  tag: {
    Component: ({ item }) => {
      const flowEngine = useFlowEngine();
      const model = flowEngine.getModel(item.uid);
      return (
        <>
          <PicLeftOutlined /> {model?.title || ''}
        </>
      );
    },
  },
  getContent: async (app, { uid }) => {
    return uid;
  },
};
