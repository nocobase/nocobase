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
import { Alert, Space } from 'antd';
import _ from 'lodash';
import React, { useState } from 'react';
import { tval } from '@nocobase/utils/client';
import { Grid } from '../../components/Grid';
import { BlockModel } from './BlockModel';

type GridModelStructure = {
  subModels: {
    items: BlockModel[];
  };
};

export class GridModel extends FlowModel<GridModelStructure> {
  subModelBaseClass = 'BlockModel';

  mergeRowsWithItems(rows: Record<string, string[][]>) {
    const items = this.subModels.items || [];
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
      const filteredCells = cells
        .map((cell) => cell.filter((uid) => allUids.has(uid)))
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

  render() {
    const t = this.flowEngine.translate.bind(this.flowEngine);
    console.log('GridModel render', JSON.stringify(this.props.rows, null, 2), this.props.sizes);
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
          title: tval('Rows'),
          'x-decorator': 'FormItem',
          'x-component': ({ value, onChange }) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const ctx = useStepSettingContext();
            const params = ctx.model.getStepParams('defaultFlow', 'grid');
            const mergedRows = ctx.model.mergeRowsWithItems(params?.rows || {});
            return <JsonEditor value={mergedRows} onChange={onChange} rows={10} />;
          },
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
        console.log('GridModel defaultFlow grid handler', params);
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
