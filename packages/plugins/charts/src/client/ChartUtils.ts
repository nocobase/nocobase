import type { APIClient } from '@nocobase/client';

const getChartData = async (api: APIClient, chartType, values, collectionName, collectionFields) => {
  values = {
    collectionName,
    chartType,
    collectionFields,
    ...values,
  };
  return await api.request({
    method: 'post',
    url: `chartData:data`,
    data: values,
  }).then((res) => {
    return res.data.data;
  });
};

export { getChartData };
