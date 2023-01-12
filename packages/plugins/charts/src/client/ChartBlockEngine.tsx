import { G2Plot, useAPIClient, useCompile } from '@nocobase/client';
import React, { useEffect, useState } from 'react';
import { Card, Spin } from 'antd';
import { generateRenderConfig, getChartData } from './ChartUtils';
import chartRenderComponentsMap from './chartRenderComponents';
import { templates } from './templates';
import { ChartBlockEngineDesigner } from './ChartBlockEngineDesigner';

interface ChartBlockEngineMetaData {
  collectionName: string;
  chartType: string;
  dataset: object;
  chartOption: object;
}

// renderComponent 可扩展 G2Plot | Echarts | D3'
type RenderComponent = 'G2Plot';

const ChartRenderComponent = ({chartBlockMetaData,renderComponent}:{ chartBlockMetaData: ChartBlockEngineMetaData, renderComponent: RenderComponent }) :JSX.Element=>{
  const compile = useCompile()
  const RenderComponent = chartRenderComponentsMap.get(renderComponent);//G2Plot | Echarts | D3
  const { dataset, collectionName, chartType, chartOption } = chartBlockMetaData;
  const {loading,data} = useGetChartData(chartBlockMetaData);
  const defaultChartOptions = templates.get(chartType)?.defaultChartOptions;
  switch (renderComponent) {
    case 'G2Plot':{
      const config = compile({
        ...defaultChartOptions,
        ...chartOption,
        data: data,
      })
      return (
        loading
          ?
          <Spin />
          :
          <RenderComponent plot={chartType} config={config}/>
      )
    }
  }
}

const useGetChartData = (chartBlockMetaData: ChartBlockEngineMetaData) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const apiClient = useAPIClient();
  const { dataset, collectionName, chartType, chartOption } = chartBlockMetaData;
  useEffect(() => {
    try {
      //1.发送请求获取聚合后的数据data
      getChartData(apiClient, chartType, dataset, collectionName).then((data) => {
        setData(data.chartData);
        setLoading(false);
      });
    } catch (e) {
      console.log(e);
    }
  }, [chartBlockMetaData]);
  return {
    loading,
    data,
    chartType,
  };
};

const ChartBlockEngine = ({ chartBlockMetaData, renderComponent }: { chartBlockMetaData: ChartBlockEngineMetaData, renderComponent: RenderComponent }) => {
  console.log(chartBlockMetaData);
  console.log(renderComponent);
  const { chartType } = chartBlockMetaData;
  return (
    <>
      <ChartRenderComponent renderComponent={renderComponent} chartBlockMetaData={chartBlockMetaData}/>
    </>
  )
}

ChartBlockEngine.Designer = ChartBlockEngineDesigner

export {
  ChartBlockEngine,
};
