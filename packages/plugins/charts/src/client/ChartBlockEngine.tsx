import { useCompile, useRequest } from '@nocobase/client';
import React from 'react';
import { Spin } from 'antd';
import chartRenderComponentsMap from './chartRenderComponents';
import { templates } from './templates';
import { ChartBlockEngineDesigner } from './ChartBlockEngineDesigner';
import JSON5 from 'json5';
import { ChartQueryMetadata } from './ChartQueryBlockInitializer';
import { Empty } from 'antd';

export interface ChartBlockEngineMetaData {
  query: {
    id: number
    //vars
  },
  chart: {
    type: string
    template: string
    metric: string
    dimension: string
    category?: string
    [key: string]: any,
  },
}

const ChartRenderComponent = ({
                                chartBlockEngineMetaData,
                              }: { chartBlockEngineMetaData: ChartBlockEngineMetaData }): JSX.Element => {
  const compile = useCompile();
  const chartType = chartBlockEngineMetaData.chart.type;
  const renderComponent = templates.get(chartType)?.renderComponent;
  const RenderComponent = chartRenderComponentsMap.get(renderComponent);//G2Plot | Echarts | D3 |Table
  const chartConfig = chartBlockEngineMetaData.chart;
  const { loading, dataSet, error } = useGetDataSet(chartBlockEngineMetaData.query.id);

  if (error) {
    return (
      <>
        <Empty description={<span>May be this chart block's query data has been deleted,please check!</span>} />
      </>
    );
  }

  switch (renderComponent) {
    case 'G2Plot': {
      let finalChartOptions;
      finalChartOptions = templates.get(chartType)?.defaultChartOptions;
      let template;
      try {
        template = JSON5.parse(chartConfig?.template);
      } catch (e) {
        template = {};
      }
      const config = compile({
        ...finalChartOptions,
        ...template,
        data: dataSet,
      }, { ...chartConfig, category: chartConfig?.category ?? '' });
      if (config && chartConfig) {
        const { dimension, metric } = chartConfig;
        if (!metric || !dimension) {
          return (
            <>
              Please check your config
            </>
          );
        }
      }
      return (
        <>
          {
            loading
              ?
              <Spin />
              :
              <RenderComponent plot={chartConfig.type} config={config} />
          }
        </>
      );
    }
    case 'DataSetPreviewTable': {
      const tableConfig = chartConfig[chartConfig.chartType]; // ['Date','scales']
      let data = dataSet?.data_set_value ? JSON5.parse(dataSet?.data_set_value) : [];
      let finalData = data;
      if (data.length && tableConfig?.columns?.length) {
        finalData = data.map(item => {
          let obj = {};
          for (const column of tableConfig?.columns) {
            obj[column] = item[column];
          }
          return obj;
        });
      }
      if (!finalData || !tableConfig?.columns?.length) {
        return (
          <>
          </>
        );
      }
      return (
        loading
          ?
          <Spin />
          :
          <RenderComponent dataSet={finalData} />
      );
    }
  }
};

export const useGetDataSet = (chartQueryId: number) => {
  const { data, loading, error } = useRequest({
    url: `/chartsQueries:getData/${chartQueryId}`,
  });
  const dataSet = data?.data;
  return {
    loading,
    dataSet: dataSet,
    error,
  };
};

const ChartBlockEngine = ({
                            chartBlockEngineMetaData,
                          }: { chartBlockEngineMetaData: ChartBlockEngineMetaData }) => {
  let renderComponent;
  const chartType = chartBlockEngineMetaData?.chart?.type;
  if (chartType) {
    renderComponent = templates.get(chartType)?.renderComponent;
  }
  if (!chartType || !renderComponent) {
    return (
      <>Please check your chart config option!!! </>
    );
  }

  return (
    <>
      <ChartRenderComponent chartBlockEngineMetaData={chartBlockEngineMetaData} />
    </>
  );
};

ChartBlockEngine.Designer = ChartBlockEngineDesigner;

export {
  ChartBlockEngine,
};
