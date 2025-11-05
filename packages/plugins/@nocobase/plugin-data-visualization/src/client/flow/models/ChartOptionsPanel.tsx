/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Alert, Button, Radio } from 'antd';
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
  const mode = form?.values?.chartConfig?.mode || 'basic';
  const builderValue = form?.values?.chartConfig?.builder;
  const rawValue = form?.values?.chartConfig?.raw;

  // 当 raw 尚未初始化时，设置默认值（等效于原先 Field 的 initialValue 行为）
  React.useEffect(() => {
    if (mode === 'custom' && !rawValue) {
      form?.setValuesIn?.('chartConfig.raw', customInitialValue);
    }
  }, [mode, rawValue, form]);

  // 图形化模式，修改自动触发预览
  const handleBuilderChange = async (next: any) => {
    await form?.setValuesIn?.('chartConfig.builder', next);
    // 写入图表参数，统一走 onPreview 方便回滚
    await ctx.model.onPreview(form.values);
  };

  const handleRawChange = async (raw: string) => {
    form?.setValuesIn?.('chartConfig.raw', raw);
    // 代码模式下，修改不自动触发预览，等待用户点击预览按钮
  };

  return (
    <ObjectField name="chartConfig">
      <Alert
        message={t("Please click 'Run Query' to fetch data before configuring chart options")}
        type="warning"
        showIcon
        closable
        style={{ marginBottom: 16, paddingLeft: 8 }}
      />
      {/* 配置模式切换与预览 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
          padding: 1,
        }}
      >
        {/* 配置模式切换 */}
        <Radio.Group
          value={mode}
          onChange={(e) => {
            form?.setValuesIn?.('chartConfig.mode', e.target.value);
          }}
        >
          <Radio.Button value={'basic'}>
            <LineChartOutlined /> {t('Basic')}
          </Radio.Button>
          <Radio.Button value={'custom'}>
            <FunctionOutlined /> {t('Custom')}
          </Radio.Button>
        </Radio.Group>

        {/* 仅在 custom 模式下显示右侧预览按钮，手动应用图表配置更新预览 */}
        {mode === 'custom' ? (
          <Button
            type="link"
            style={{ marginRight: '8px' }}
            onClick={async () => {
              // 写入图表参数，统一走 onPreview 方便回滚
              await ctx.model.onPreview(form.values);
            }}
          >
            {t('Preview')}
          </Button>
        ) : null}
      </div>

      {mode === 'basic' ? (
        <ChartOptionsBuilder columns={columns} initialValues={builderValue} onChange={handleBuilderChange} />
      ) : (
        <div>
          <ChartOptionsEditor value={rawValue ?? customInitialValue} onChange={handleRawChange} />
        </div>
      )}
    </ObjectField>
  );
});
