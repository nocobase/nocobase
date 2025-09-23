/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Radio } from 'antd';
import { ObjectField, useForm, observer } from '@formily/react';
import { ChartOptionsEditor } from './ChartOptionsEditor';
import { useT } from '../../locale';
import { FunctionOutlined, LineChartOutlined } from '@ant-design/icons';
import { ChartOptionsBuilder } from './ChartOptionsBuilder';
import { configStore } from './config-store';
import { useFlowSettingsContext } from '@nocobase/flow-engine';

const customInitialValue = `return {
  dataset: { source: ctx.data.objects || [] },
  xAxis: { type: 'category' },
  yAxis: {},
  series: [
    {
      type: 'line',
      smooth: true,
      showSymbol: false,
    },
  ],
}
`;

export const ChartOptionsPanel: React.FC = observer(() => {
  const t = useT();
  const form = useForm();
  // 从 flow ctx 和 configStore 计算 columns
  const ctx = useFlowSettingsContext<any>();
  const uid = ctx?.model?.uid;
  const previewData = configStore.results[uid]?.result || [];
  const columns = React.useMemo<string[]>(() => Object.keys(previewData?.[0] ?? {}), [previewData]);

  // 受控 value 与回写 formily
  const builderValue = form?.values?.chart?.option?.builder;
  const handleBuilderChange = React.useCallback(
    (next: any) => {
      form?.setValuesIn?.('chart.option.builder', next);
    },
    [form],
  );
  const handleRawChange = React.useCallback(
    (raw: string) => {
      form?.setValuesIn?.('chart.option.raw', raw);
    },
    [form],
  );

  const mode = form?.values?.chart?.option?.mode || 'code';
  const rawValue = form?.values?.chart?.option?.raw;

  // 当 raw 尚未初始化时，设置默认值（等效于原先 Field 的 initialValue 行为）
  React.useEffect(() => {
    if (rawValue == null) {
      form?.setValuesIn?.('chart.option.raw', customInitialValue);
    }
  }, [rawValue, form]);

  return (
    <ObjectField name="chart.option">
      <div
        style={{
          marginBottom: '8px',
          padding: 1,
        }}
      >
        {/* 配置模式切换：改为普通 React 的 Radio.Group */}
        <Radio.Group
          value={mode}
          onChange={(e) => {
            form?.setValuesIn?.('chart.option.mode', e.target.value);
          }}
        >
          <Radio.Button value={'builder'}>
            <LineChartOutlined /> {t('Basic')}
          </Radio.Button>
          <Radio.Button value={'code'}>
            <FunctionOutlined /> {t('Custom')}
          </Radio.Button>
        </Radio.Group>
      </div>

      {mode === 'builder' ? (
        <ChartOptionsBuilder
          columns={columns}
          value={builderValue}
          onChange={handleBuilderChange}
          onRawChange={handleRawChange}
        />
      ) : (
        // raw 编辑器：改为普通 React 受控组件
        <ChartOptionsEditor value={rawValue ?? customInitialValue} onChange={handleRawChange} />
      )}
    </ObjectField>
  );
});
