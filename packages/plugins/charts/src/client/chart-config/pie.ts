export const pie = (data, chartOption) => {
  console.log(data,chartOption)
  const pieBaseConfig = {
    appendPadding: 10,
    data: data,
    angleField: 'value',
    colorField: 'type',
    radius: 0.9,
    label: {
      type: 'inner',
      offset: '-30%',
      content: ({ percent }) => `${(percent * 100).toFixed(0)}%`,
      style: {
        fontSize: 14,
        textAlign: 'center',
      },
    },
    interactions: [{type: 'element-active'}],
  }
  if(chartOption){
    const keys = Object.keys(chartOption)
    for (const key of keys) {
      if (pieBaseConfig[key])
        pieBaseConfig[key] = chartOption[key]
    }
  }
  return pieBaseConfig
}
