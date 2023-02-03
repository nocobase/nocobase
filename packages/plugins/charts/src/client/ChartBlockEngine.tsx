import { CollectionFieldOptions, useAPIClient, useCollectionManager, useCompile } from '@nocobase/client';
import React, { useEffect , useState } from 'react';
import { Card, Spin } from 'antd';
import { getChartData } from './ChartUtils';
import chartRenderComponentsMap from './chartRenderComponents';
import { templates } from './templates';
import { ChartBlockEngineDesigner } from './ChartBlockEngineDesigner';

interface ChartBlockEngineMetaData {
  collectionName: string;
  chartType: string;
  dataset: object;
  chartOptions: object;
  chartConfig: {
    config: string
  };
  collectionFields: CollectionFieldOptions[];
}

// renderComponent 可扩展 G2Plot | Echarts | D3'
type RenderComponent = 'G2Plot';

const ChartRenderComponent = ({ chartBlockMetaData, renderComponent, }: { chartBlockMetaData: ChartBlockEngineMetaData, renderComponent: RenderComponent }): JSX.Element => {
  const compile = useCompile();
  const { getCollectionFields } = useCollectionManager();
  const RenderComponent = chartRenderComponentsMap.get(renderComponent);//G2Plot | Echarts | D3
  const { dataset, collectionName, chartType, chartOptions, chartConfig } = chartBlockMetaData;
  const { loading, data } = useGetChartData(chartBlockMetaData);
  let finalChartOptions;
  if (chartConfig?.config) {
    finalChartOptions = JSON.parse(compile(chartConfig?.config));
  } else {
    finalChartOptions = templates.get(chartType)?.defaultChartOptions;
  }
  switch (renderComponent) {
    case 'G2Plot': {
      const config = compile({
        ...finalChartOptions,
        ...chartOptions,
        data: data,
      }, chartOptions);
      console.log(chartBlockMetaData, '=====================');
      console.log(config);
      return (
        loading
          ?
          <Spin />
          :
          <RenderComponent plot={chartType} config={config} />
      );
    }
  }
};

const useGetChartData = (chartBlockMetaData: ChartBlockEngineMetaData) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const apiClient = useAPIClient();
  const { dataset, collectionName, chartType, chartOptions,collectionFields } = chartBlockMetaData;
  useEffect(() => {
    try {
      //1.发送请求获取聚合后的数据data
      getChartData(apiClient, chartType, dataset, collectionName,collectionFields).then((data) => {
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

const ChartBlockEngine = ({
                            chartBlockMetaData,
                            renderComponent,
                          }: { chartBlockMetaData: ChartBlockEngineMetaData, renderComponent: RenderComponent }) => {
  const { getCollectionFields } = useCollectionManager();
  const collectionFields = getCollectionFields(chartBlockMetaData.collectionName);
  const _chartBlockMetaData = {
    ...chartBlockMetaData,
    collectionFields
  }
  return (
    <>
      <ChartRenderComponent renderComponent={renderComponent} chartBlockMetaData={_chartBlockMetaData} />
    </>
  );
};

ChartBlockEngine.Designer = ChartBlockEngineDesigner;

export {
  ChartBlockEngine,
};
