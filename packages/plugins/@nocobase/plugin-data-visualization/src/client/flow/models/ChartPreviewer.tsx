/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFlowSettingsContext } from '@nocobase/flow-engine';
import { useForm, observer } from '@formily/react';
import { Chart } from './Chart';
import { configStore } from './config-store';
import { ChartBlockModel } from './ChartBlockModel';
import { EChartsType } from 'echarts';
import { debounce } from 'lodash';

export const ChartPreviewer: React.FC = observer(() => {
  const ref = useRef<EChartsType | null>(null);
  const ctx = useFlowSettingsContext<ChartBlockModel>();
  const form = useForm();
  const rawOption = form.values.chart.option.raw;
  const rawEvents = form.values.chart.events?.raw;
  const queryResult = configStore.results[ctx.model.uid]?.result;

  const [chart, setChart] = useState<EChartsType | null>(null);
  const [chartOption, setChartOption] = useState(null);

  useEffect(() => {
    ctx
      .runjs(rawOption)
      .then((result) => setChartOption(result.value))
      .catch((error) => {
        console.log(error);
      });
  }, [ctx, rawOption]);

  const handleRefReady = useCallback((chart: EChartsType) => {
    setChart(chart);
  }, []);

  useEffect(() => {
    if (!chart) {
      return;
    }

    const debouncedRunjs = debounce(() => {
      ctx.runjs(rawEvents, { chart, log: console.log });
    }, 1000);

    debouncedRunjs();

    return () => {
      debouncedRunjs.cancel();
    };
  }, [chart, rawEvents, ctx]);

  return <Chart option={chartOption} dataSource={queryResult} ref={ref} onRefReady={handleRefReady} />;
});
