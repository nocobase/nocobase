import {G2Plot} from "@nocobase/client";
import React, {useEffect} from "react";
import {Spin} from "antd";

const ChartBlockEngine = (formData) => {
  const [loading, setLoading] = React.useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 3000)
    return () => {
      clearTimeout(timer)
    }
  }, [])
  const {plot, config} = formData
  //根据不同的chartType 来生成不同的图表schema
  // const engineSchema = {
  //   type: 'void',
  //   'x-designer': 'G2Plot.Designer',
  //   'x-decorator': 'CardItem',
  //   'x-component': 'G2Plot',
  //   'x-component-props': {
  //     plot: 'Pie',
  //     config: renderData,
  //   },
  // }
  return (
    <>
      {
        loading
          ?
          <Spin/>
          :
          <G2Plot plot='Pie' config={config}/>
      }
    </>
  )
}

export {
  ChartBlockEngine
}
