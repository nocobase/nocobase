export const bar = (data, chartOption) => {
  const barBaseConfig = {
  data: data,
  xField: 'value',
  yField: 'year',
  seriesField: 'year',
  legend: {
    position: 'top-left',
  },
}
  const keys = Object.keys(chartOption)
  for (const key of keys) {
    if (barBaseConfig[key])
      barBaseConfig[key] = chartOption[key]
  }
  return barBaseConfig
}
