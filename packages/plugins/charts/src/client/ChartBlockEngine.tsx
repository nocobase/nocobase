import { useCompile, useRequest } from '@nocobase/client';
import { Empty, Spin } from 'antd';
import JSON5 from 'json5';
import React, { useEffect, useState } from 'react';
import { ChartBlockEngineDesigner } from './ChartBlockEngineDesigner';
import chartRenderComponentsMap from './chartRenderComponents';
import { lang } from './locale';
import { templates } from './templates';

export interface IQueryConfig {
  id: number;
}
export interface IChartConfig {
  type: string;
  template: string;
  metric: string;
  dimension: string;
  category?: string;
  [key: string]: any;
}

export interface ChartBlockEngineMetaData {
  query: IQueryConfig;
  chart: IChartConfig;
}

const ChartRenderComponent = ({
  chartBlockEngineMetaData,
}: {
  chartBlockEngineMetaData: ChartBlockEngineMetaData;
}): JSX.Element => {
  const compile = useCompile();
  const chartType = chartBlockEngineMetaData.chart.type;
  const renderComponent = templates.get(chartType)?.renderComponent;
  const RenderComponent = chartRenderComponentsMap.get(renderComponent); //G2Plot | Echarts | D3 |Table
  const chartConfig = chartBlockEngineMetaData.chart;
  const { loading, dataSet, error } = useGetDataSet(chartBlockEngineMetaData.query.id);

  const [currentConfig, setCurrentConfig] = useState<IChartConfig>({} as any);

  useEffect(() => {
    setCurrentConfig(chartConfig);
  }, [JSON.stringify(chartConfig)]);

  if (error) {
    return (
      <>
        <Empty description={<span>{`May be this chart block's query data has been deleted,please check!`}</span>} />
      </>
    );
  }

  if (currentConfig.type !== chartConfig.type) {
    return <></>;
  }

  switch (renderComponent) {
    case 'G2Plot': {
      const finalChartOptions = templates.get(chartType)?.defaultChartOptions;
      let template;
      try {
        template = JSON5.parse(chartConfig?.template);
      } catch (e) {
        template = {};
      }
      const config = compile(
        {
          ...finalChartOptions,
          ...template,
          data: dataSet,
        },
        { ...chartConfig, category: chartConfig?.category ?? '' },
      );
      if (config && chartConfig) {
        const { dimension, metric, category } = chartConfig;
        if (!metric || !dimension) {
          return <>{lang('Please check the chart config')}</>;
        }
      }
      return <>{loading ? <Spin /> : <RenderComponent plot={chartConfig.type} config={config} />}</>;
    }
  }
  return <></>;
};

export const useGetDataSet = (chartQueryId: number) => {
  const { data, loading, error } = useRequest<{
    data: any;
  }>({
    url: `/chartsQueries:getData/${chartQueryId}`,
  });
  const dataSet = data?.data;
  return {
    loading,
    dataSet: dataSet,
    error,
  };
};

const ChartBlockEngine = ({ chartBlockEngineMetaData }: { chartBlockEngineMetaData: ChartBlockEngineMetaData }) => {
  let renderComponent;
  const chartType = chartBlockEngineMetaData?.chart?.type;

  if (chartType) {
    renderComponent = templates.get(chartType)?.renderComponent;
  }

  if (!chartType || !renderComponent) {
    return <>{lang('Please check the chart config')}</>;
  }

  return (
    <>
      <ChartRenderComponent chartBlockEngineMetaData={chartBlockEngineMetaData} />
    </>
  );
};

ChartBlockEngine.Designer = ChartBlockEngineDesigner;

export { ChartBlockEngine };
