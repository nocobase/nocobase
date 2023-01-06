import {G2Plot, useAPIClient} from "@nocobase/client";
import React, {useEffect, useState} from "react";
import {Card, Spin} from "antd";
import {generateRenderConfig, getChartData} from "./ChartUtils";

interface ChartBlockEngineFormData {
  collectionName: string
  chartType: string
  dataset: object
  chartOption: object
}

const useGetRenderConfig = (formData: ChartBlockEngineFormData) => {
  const [loading, setLoading] = useState(true)
  const [renderConfig, setRenderConfig] = useState({})
  const apiClient = useAPIClient();
  const {dataset, collectionName, chartType, chartOption} = formData
  useEffect(() => {
    try {
      //1.发送请求获取聚合后的数据data
      getChartData(apiClient, chartType, dataset, collectionName).then((data) => {
        console.log(data)
        //2.根据查询后的聚合数据和chartOption,chartType生成renderConfig
        const renderConfig = generateRenderConfig(chartType, data.chartData, chartOption)
        setRenderConfig(renderConfig)
        setLoading(false)
      })
    } catch (e) {
      console.log(e)
    }
  }, [formData])
  return {
    loading,
    renderConfig,
    chartType
  }
};

const ChartBlockEngine = ({formData}: { formData: ChartBlockEngineFormData }) => {
  const {chartType} = formData
  const {loading, renderConfig} = useGetRenderConfig(formData);
  return (
    <>
      {
        loading
          ?
          <Spin/>
          :
          <G2Plot plot={chartType} config={renderConfig}/>
      }
    </>
  )
}

export {
  ChartBlockEngine
}
