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
import { ObjectField, useForm } from '@formily/react';
import { ChartOptionsEditor } from './ChartOptionsEditor';
import { useT } from '../../locale';
import { FunctionOutlined, LineChartOutlined } from '@ant-design/icons';
import { ChartOptionsBuilder } from './ChartOptionsBuilder';
import { configStore } from './config-store';
import { observer, useFlowSettingsContext } from '@nocobase/flow-engine';

export const chartOptionDefaultValue = `return {
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
  const mode = form?.values?.chart?.option?.mode || 'basic';
  const builderValue = form?.values?.chart?.option?.builder;
  const rawValue = form?.values?.chart?.option?.raw;

  // 当 raw 尚未初始化时，设置默认值（等效于原先 Field 的 initialValue 行为）
  React.useEffect(() => {
    if (mode === 'custom' && !rawValue) {
      form?.setValuesIn?.('chart.option.raw', chartOptionDefaultValue);
    }
  }, [mode, rawValue, form]);

  // 图形化模式，修改自动触发预览
  const handleBuilderChange = async (next: any) => {
    await form?.setValuesIn?.('chart.option.builder', next);
    // 写入图表参数，统一走 onPreview 方便回滚
    await ctx.model.onPreview(form.values);
  };

  const handleRawChange = async (raw: string) => {
    form?.setValuesIn?.('chart.option.raw', raw);
    // 代码模式下，修改不自动触发预览，等待用户点击预览按钮
  };

  const userId = ctx.auth?.user.id ?? 'anonymous';
  const TIP_KEY = `plugin-data-visualization:ChartConfig:tipRunQuery:${userId}`;

  const [showFirstVisitTip, setShowFirstVisitTip] = React.useState(false);
  React.useEffect(() => {
    setShowFirstVisitTip(!localStorage.getItem(TIP_KEY));
  }, [TIP_KEY]);

  return (
    <ObjectField name="chart.option">
      {showFirstVisitTip && (
        <Alert
          message={t("Please click 'Run Query' to fetch data before configuring chart options")}
          type="warning"
          showIcon
          closable
          style={{ marginBottom: 8, paddingLeft: 8 }}
          onClose={() => {
            localStorage.setItem(TIP_KEY, '1');
            setShowFirstVisitTip(false);
          }}
        />
      )}
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
            form?.setValuesIn?.('chart.option.mode', e.target.value);
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
          <ChartOptionsEditor value={rawValue ?? chartOptionDefaultValue} onChange={handleRawChange} />
        </div>
      )}
    </ObjectField>
  );
});
