/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect } from 'react';
import { useFlowSettingsContext } from '@nocobase/flow-engine';
import { useForm, observer } from '@formily/react';
import { Chart } from './Chart';
import { configStore } from './config-store';
import { ChartBlockModel } from './ChartBlockModel';

export const ChartPreviewer: React.FC = observer(() => {
  const ctx = useFlowSettingsContext<ChartBlockModel>();
  const form = useForm();
  const rawOption = form.values.chart.option.raw;
  const queryResult = configStore.result;

  const [chartOption, setChartOption] = React.useState(null);

  useEffect(() => {
    ctx
      .runjs(`return ${rawOption}`)
      .then((result) => setChartOption(result.value))
      .catch((error) => {
        console.log(error);
      });
  }, [ctx, rawOption]);

  return <Chart option={chartOption} dataSource={queryResult} />;
});
