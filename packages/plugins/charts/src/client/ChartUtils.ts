import type {APIClient} from "@nocobase/client";

const getChartData = async (api: APIClient, values) => {
  return await api.request({
    method: 'post',
    url: `chartData:data`,
    data: values
  }).then((res) => {
    return res.data.data
  })
}

const getChartBlockSchema = (values, data) => {
  const {renderData} = data
  //根据不同的chartType 来生成不同的图表schema
  const pieSchema = {
    type: 'void',
    'x-designer': 'G2Plot.Designer',
    'x-decorator': 'CardItem',
    'x-component': 'G2Plot',
    'x-component-props': {
      plot: 'Pie',
      config: renderData,
    },
  }
  return pieSchema
}

export {getChartBlockSchema, getChartData}
