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
import { Alert, Card, Space } from 'antd';
import _ from 'lodash';
import React, { useState } from 'react';
import { BlockModel } from './BlockModel';

type GridModelStructure = {
  subModels: {
    items: BlockModel[];
  };
};

function Grid(props: {
  rows: Record<string, string[][]>;
  sizes?: Record<string, number[]>;
  renderItem: (uid: string) => React.ReactNode;
}) {
  const { rows, sizes = {}, renderItem } = props;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {Object.entries(rows).map(([rowKey, cells]) => {
        const colCount = cells.length;
        const rowSizes = sizes[rowKey] || [];
        const hasAnySize = rowSizes.some((v) => v != null && v !== undefined);

        return (
          <div key={rowKey} style={{ display: 'flex', flexDirection: 'row', gap: 16 }}>
            {cells.map((cell, cellIdx) => {
              const style: React.CSSProperties = {};
              if (hasAnySize) {
                // 兼容部分有 size 部分没有 size 的情况
                const assigned = rowSizes.reduce((sum, v) => sum + (v || 0), 0);
                const unassignedCount = colCount - rowSizes.filter(Boolean).length;
                const autoSize = unassignedCount > 0 ? (24 - assigned) / unassignedCount : 0;
                const width = rowSizes[cellIdx] ?? autoSize;
                const totalGap = (colCount - 1) * 16;
                const availableWidth = `calc((100% - ${totalGap}px) * ${width / 24})`;
                style.flex = `0 0 ${availableWidth}`;
              } else {
                // 没有 sizes，等分
                const percent = 100 / colCount;
                style.flex = `0 0 calc((100% - ${(colCount - 1) * 16}px) * ${percent / 100})`;
              }
              return (
                <div key={cellIdx} style={style}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {cell.map((uid) => (
                      <div key={uid}>{renderItem(uid)}</div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function mergeRowsWithItems(rows: Record<string, string[][]>, items: BlockModel[]) {
  if (!items || items.length === 0) {
    return rows; // 如果没有 items，直接返回原始 rows
  }
  // 1. 收集所有 items 里的 uid
  const allUids = new Set(items.map((item) => item.uid));
  // 2. 收集 rows 里已用到的 uid
  const usedUids = new Set<string>();
  const newRows: Record<string, string[][]> = {};

  // 3. 过滤 rows 里不存在于 items 的 uid
  for (const [rowKey, cells] of Object.entries(rows)) {
    const filteredCells = cells.map((cell) => cell.filter((uid) => allUids.has(uid))).filter((cell) => cell.length > 0);
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

export class GridModel extends FlowModel<GridModelStructure> {
  subModelBaseClass = 'BlockModel';
  render() {
    return (
      <div style={{ padding: 16 }}>
        <Grid
          rows={this.props.rows || {}}
          sizes={this.props.sizes || {}}
          renderItem={(uid) => {
            const item = this.flowEngine.getModel(uid);
            return (
              <FlowModelRenderer
                model={item}
                key={item.uid}
                showFlowSettings={{ showBackground: false }}
                showErrorFallback
              />
            );
          }}
        />
        <Space style={{ marginTop: 16 }}>
          <AddBlockButton
            model={this}
            subModelKey="items"
            subModelBaseClass={this.subModelBaseClass}
            onSubModelAdded={async (model) => {
              this.props.rows = { ...this.props.rows, [uid()]: [[model.uid]] };
            }}
          >
            <FlowSettingsButton icon={<PlusOutlined />}>{'Add block'}</FlowSettingsButton>
          </AddBlockButton>
          <FlowsFloatContextMenu showBorder={false} showDeleteButton={false} model={this}>
            <FlowSettingsButton>Configure rows</FlowSettingsButton>
          </FlowsFloatContextMenu>
        </Space>
      </div>
    );
  }
}

function JsonEditor({ value, onChange, rows = 10 }) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    try {
      const json = JSON.parse(val);
      setError(null);
      onChange(json);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <Input.TextArea value={text} autoSize={{ minRows: rows, maxRows: rows + 10 }} onChange={handleChange} />
      {error && <Alert type="error" message={error} showIcon style={{ marginTop: 8 }} />}
    </div>
  );
}

GridModel.registerFlow({
  key: 'defaultFlow',
  auto: true,
  steps: {
    grid: {
      uiSchema: {
        rows: {
          title: 'Rows',
          'x-decorator': 'FormItem',
          'x-component': ({ value, onChange }) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const ctx = useStepSettingContext();
            const params = ctx.model.getStepParams('defaultFlow', 'grid');
            const mergedRows = mergeRowsWithItems(params?.rows || {}, ctx.model.subModels.items || []);
            return <JsonEditor value={mergedRows} onChange={onChange} rows={10} />;
          },
          'x-component-props': {
            autoSize: { minRows: 10, maxRows: 20 },
            description: 'Configure the rows and columns of the grid.',
          },
        },
        sizes: {
          title: 'Sizes',
          'x-decorator': 'FormItem',
          'x-component': JsonEditor,
          'x-component-props': {
            rows: 5,
          },
          description:
            'Configure the sizes of each row. The value is an array of numbers representing the width of each column in the row.',
        },
      },
      async handler(ctx, params) {
        const mergedRows = mergeRowsWithItems(params.rows || {}, ctx.model.subModels.items);
        ctx.model.setProps('rows', mergedRows);
        ctx.model.setProps('sizes', params.sizes || {});
      },
    },
  },
});

export class BlockGridModel extends GridModel {
  subModelBaseClass = 'BlockModel';
}
