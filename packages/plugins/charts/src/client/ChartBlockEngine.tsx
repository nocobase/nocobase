import { useCompile, useRequest } from '@nocobase/client';
import React from 'react';
import { Spin } from 'antd';
import chartRenderComponentsMap from './chartRenderComponents';
import { templates } from './templates';
import { ChartBlockEngineDesigner } from './ChartBlockEngineDesigner';
import JSON5 from 'json5';
import { useForm } from '@formily/react';

type dataSet = {
  title: string,
  id: number,
  data_set_id: string,
  data_set_value: string,
  data_set_name: string,
}

interface ChartBlockEngineMetaData {
  dataSetMetaData: dataSet,
  chartConfig: {
    chartType: string,
    [key: string]: any,
  },
}

// renderComponent 可扩展 G2Plot | Echarts | D3'
type RenderComponent = 'G2Plot';

const ChartRenderComponent = ({
                                chartBlockMetaData,
                                renderComponent,
                              }: { chartBlockMetaData: ChartBlockEngineMetaData, renderComponent: RenderComponent }): JSX.Element => {
  const compile = useCompile();

  const RenderComponent = chartRenderComponentsMap.get(renderComponent);//G2Plot | Echarts | D3
  const { dataSetMetaData, chartConfig } = chartBlockMetaData;
  const { loading, dataSet } = useGetDataSet(dataSetMetaData.data_set_id);
  let finalChartOptions;
  finalChartOptions = templates.get(chartConfig.chartType)?.defaultChartOptions;
  switch (renderComponent) {
    case 'G2Plot': {
      let advanceConfig;
      try {
        advanceConfig = JSON5.parse(chartConfig[chartConfig?.chartType]?.advanceConfig);
      } catch (e) {
        advanceConfig = {};
      }
      const config = compile({
        ...finalChartOptions,
        ...advanceConfig,
        data: dataSet?.data_set_value ? JSON5.parse(dataSet?.data_set_value) : [],
      }, chartConfig[chartConfig.chartType]);
      return (
        loading
          ?
          <Spin />
          :
          <RenderComponent plot={chartConfig.chartType} config={config} />
      );
    }
  }
};

const useGetDataSet = (dataSetId: string) => {
  const { loading, data } = useRequest({ url: `/datasets:get?filter={"data_set_id":"${dataSetId}"}` });
  return {
    loading,
    dataSet: data?.data,
  };
};
let chartType = '';
const ChartBlockEngine = ({
                            chartBlockMetaData,
                            renderComponent,
                          }: { chartBlockMetaData: ChartBlockEngineMetaData, renderComponent: RenderComponent }) => {
  const form = useForm();
  if (!chartType) {
    chartType = form.values.chartType;
    return (
      <>
        <ChartRenderComponent renderComponent={renderComponent} chartBlockMetaData={chartBlockMetaData} />
      </>
    );
  }
  if (chartType !== form.values.chartType) {
    chartType = form.values.chartType;
    return (
      <>Please check your chart config option</>
    );
  }
  return (
    <>
      <ChartRenderComponent renderComponent={renderComponent} chartBlockMetaData={chartBlockMetaData} />
    </>
  );
};

ChartBlockEngine.Designer = ChartBlockEngineDesigner;

export {
  ChartBlockEngine,
};
