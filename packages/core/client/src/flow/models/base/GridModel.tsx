/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined } from '@ant-design/icons';
import { Input } from '@formily/antd-v5';
import { uid } from '@formily/shared';
import {
  AddBlockButton,
  FlowModel,
  FlowModelRenderer,
  FlowSettingsButton,
  FlowsFloatContextMenu,
  useStepSettingContext,
} from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import { Alert, Space } from 'antd';
import _ from 'lodash';
import React, { useState } from 'react';
import { Grid } from '../../components/Grid';
import JsonEditor from '../../components/JsonEditor';
import { SkeletonFallback } from '../../components/SkeletonFallback';
import { BlockModel } from './BlockModel';

type GridModelStructure = {
  subModels: {
    items: BlockModel[];
  };
};

export class GridModel extends FlowModel<GridModelStructure> {
  subModelBaseClass = 'BlockModel';

  onInit(options: any): void {
    this.emitter.on('onSubModelAdded', () => {
      this.resetRows(true);
    });
    this.emitter.on('onSubModelRemoved', () => {
      this.resetRows(true);
    });
    this.emitter.on('onSubModelMoved', () => {
      this.resetRows(true);
    });
  }

  mergeRowsWithItems(rows: Record<string, string[][]>) {
    const items = this.subModels.items || [];
    console.log('mergeRowsWithItems', rows, items);
    if (!items || items.length === 0) {
      return {}; // 如果没有 items，直接返回原始 rows
    }
    // 1. 收集所有 items 里的 uid
    const allUids = new Set(items.map((item) => item.uid));
    // 2. 收集 rows 里已用到的 uid
    const usedUids = new Set<string>();
    const newRows: Record<string, string[][]> = {};

    // 3. 过滤 rows 里不存在于 items 的 uid
    for (const [rowKey, cells] of Object.entries(rows)) {
      const filteredCells = cells
        .map((cell) => _.castArray(cell).filter((uid) => allUids.has(uid)))
        .filter((cell) => cell.length > 0);
      if (filteredCells.length > 0) {
        newRows[rowKey] = filteredCells;
        filteredCells.forEach((cell) => cell.forEach((uid) => usedUids.add(uid)));
      }
    }

    // 4. 只把不在 rows 里的 item.uid 作为新行加到 rows 后面
    const allRowUids = new Set<string>();
    Object.values(newRows).forEach((cells) => cells.forEach((cell) => cell.forEach((uid) => allRowUids.add(uid))));
    for (const item of items) {
      if (!allRowUids.has(item.uid)) {
        newRows[uid()] = [[item.uid]];
      }
    }

    return newRows;
  }

  resetRows(syncProps = false) {
    const params = this.getStepParams('defaultFlow', 'grid') || {};
    const mergedRows = this.mergeRowsWithItems(params.rows || {});
    console.log('resetRows', mergedRows, this.subModels.items);
    this.setStepParams('defaultFlow', 'grid', {
      rows: mergedRows,
      sizes: params.sizes || {},
    });

    if (syncProps) {
      this.setProps('rows', mergedRows);
      this.setProps('sizes', params.sizes || {});
    }
  }

  render() {
    const t = this.translate;
    return (
      <div style={{ padding: 16 }}>
        <Space direction={'vertical'} style={{ width: '100%' }} size={16}>
          <Grid
            rows={this.props.rows || {}}
            sizes={this.props.sizes || {}}
            renderItem={(uid) => {
              const item = this.flowEngine.getModel(uid);
              return (
                <FlowModelRenderer
                  model={item}
                  key={item.uid}
                  fallback={<SkeletonFallback />}
                  showFlowSettings={{ showBackground: false }}
                  showErrorFallback
                  showTitle
                />
              );
            }}
          />
          <Space>
            <AddBlockButton model={this} subModelKey="items" subModelBaseClass={this.subModelBaseClass}>
              <FlowSettingsButton icon={<PlusOutlined />}>{t('Add block')}</FlowSettingsButton>
            </AddBlockButton>
            <FlowSettingsButton
              onClick={() => {
                this.openStepSettingsDialog('defaultFlow', 'grid');
              }}
            >
              {t('Configure rows')}
            </FlowSettingsButton>
          </Space>
        </Space>
      </div>
    );
  }
}

GridModel.registerFlow({
  key: 'defaultFlow',
  auto: true,
  steps: {
    step1: {
      handler(ctx) {
        ctx.model.resetRows();
      },
    },
    grid: {
      uiSchema: {
        rows: {
          title: tval('Rows'),
          'x-decorator': 'FormItem',
          'x-component': JsonEditor,
          'x-component-props': {
            autoSize: { minRows: 10, maxRows: 20 },
            description: tval('Configure the rows and columns of the grid.'),
          },
        },
        sizes: {
          title: tval('Sizes'),
          'x-decorator': 'FormItem',
          'x-component': JsonEditor,
          'x-component-props': {
            rows: 5,
          },
          description: tval(
            'Configure the sizes of each row. The value is an array of numbers representing the width of each column in the row.',
          ),
        },
      },
      async handler(ctx, params) {
        const mergedRows = ctx.model.mergeRowsWithItems(params.rows || {});
        ctx.model.setProps('rows', mergedRows);
        ctx.model.setProps('sizes', params.sizes || {});
      },
    },
  },
});

export class BlockGridModel extends GridModel {
  subModelBaseClass = 'BlockModel';
}
