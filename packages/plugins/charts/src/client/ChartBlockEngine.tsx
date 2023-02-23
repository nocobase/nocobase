import { useCompile, useRequest } from '@nocobase/client';
import React from 'react';
import { Spin } from 'antd';
import chartRenderComponentsMap from './chartRenderComponents';
import { templates } from './templates';
import { ChartBlockEngineDesigner } from './ChartBlockEngineDesigner';
import JSON5 from 'json5';

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
type RenderComponent = 'G2Plot' | 'DataSetPreviewTable';

const ChartRenderComponent = ({
                                chartBlockMetaData,
                                renderComponent,
                              }: { chartBlockMetaData: ChartBlockEngineMetaData, renderComponent: RenderComponent }): JSX.Element => {
  const compile = useCompile();
  const RenderComponent = chartRenderComponentsMap.get(renderComponent);//G2Plot | Echarts | D3 |Table
  const { dataSetMetaData, chartConfig } = chartBlockMetaData;
  const { loading, dataSet } = useGetDataSet(dataSetMetaData.data_set_id);
  switch (renderComponent) {
    case 'G2Plot': {
      let finalChartOptions;
      finalChartOptions = templates.get(chartConfig.chartType)?.defaultChartOptions;
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
      }, { ...chartConfig[chartConfig.chartType], category: chartConfig[chartConfig.chartType]?.category ?? '' });
      if(config && chartConfig[chartConfig?.chartType]){
        const {dimension,metric} = chartConfig[chartConfig?.chartType];
        if(!metric || !dimension){
          return (
            <>
              Please check your config
            </>
          )
        }
      }
      return (
        <>
          {
            loading
              ?
              <Spin />
              :
              <RenderComponent plot={chartConfig.chartType} config={config} />
          }
        </>
      );
    }
    case 'DataSetPreviewTable': {
      const tableConfig = chartConfig[chartConfig.chartType]; // ['Date','scales']
      let data = dataSet?.data_set_value ? JSON5.parse(dataSet?.data_set_value) : [];
      let finalData=data;
      if (data.length && tableConfig?.columns?.length) {
        finalData = data.map(item => {
          let obj = {};
          for (const column of tableConfig?.columns) {
            obj[column] = item[column];
          }
          return obj;
        });
      }
      if(!finalData || !tableConfig?.columns?.length){
       return (
         <>
         </>
       )
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

const useGetDataSet = (dataSetId: string) => {
  const { loading, data } = useRequest({ url: `/datasets:get?filter={"data_set_id":"${dataSetId}"}` });
  return {
    loading,
    dataSet: data?.data,
  };
};
let chartType = '';
const ChartBlockEngine = ({
                            previewMetaData
                          }: { chartBlockMetaData: ChartBlockEngineMetaData, renderComponent: RenderComponent,previewMetaData:any }) => {
  let renderComponent
  const chartType = previewMetaData?.dataSetMetaData?.chartConfig?.chartType;
  if(chartType){
    renderComponent = templates.get(chartType)?.renderComponent;
  }
  if(!chartType || !renderComponent || !previewMetaData?.dataSetMetaData?.dataSetMetaData || !previewMetaData?.dataSetMetaData?.chartConfig){
    return (
      <>Please check your chart config option!!! </>
    )
  }

  const chartBlockMetaData = previewMetaData.dataSetMetaData
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
