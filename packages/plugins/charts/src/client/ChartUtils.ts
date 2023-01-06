import type {APIClient} from "@nocobase/client";
import {bar, pie} from "./chart-config";

const getChartData = async (api: APIClient, chartType, values, collectionName) => {
  values = {
    collectionName,
    chartType,
    ...values
  }
  return await api.request({
    method: 'post',
    url: `chartData:data`,
    data: values
  }).then((res) => {
    return res.data.data
  })
}

const generateRenderConfig = (chartType, data, chartOption) => {
  let renderConfig
  switch (chartType) {
    case 'Pie': {
      renderConfig = pie(data, chartOption)
      break
    }
    case 'Bar': {
      renderConfig = bar(data, chartOption)
      break
    }
  }
  return renderConfig
}

export {generateRenderConfig, getChartData}
