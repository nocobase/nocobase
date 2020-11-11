import React from 'react'
import { Slider } from 'antd'
import { connect } from '@formily/react-schema-renderer'
import { mapStyledProps } from '../shared'

export interface ISliderMarks {
  [key: number]:
    | React.ReactNode
    | {
        style: React.CSSProperties
        label: React.ReactNode
      }
}

export declare type SliderValue = number | [number, number]

// TODO 并不是方法，最好能引用组件的 typescript 接口定义
export interface ISliderProps {
  min?: number
  max?: number
  marks?: ISliderMarks
  value?: SliderValue
  defaultValue?: SliderValue
  onChange?: (value: SliderValue) => void
}

export const Range = connect({
  defaultProps: {
    style: {
      width: 320
    }
  },
  getProps: mapStyledProps
})(
  class Component extends React.Component<ISliderProps> {
    public render() {
      const { onChange, value, min, max, marks, ...rest } = this.props
      let newMarks = {}
      if (Array.isArray(marks)) {
        marks.forEach(mark => {
          newMarks[mark] = mark
        })
      } else {
        newMarks = marks
      }
      return (
        <Slider
          {...rest}
          onChange={onChange}
          value={value}
          min={min}
          max={max}
          marks={newMarks}
        />
      )
    }
  }
)

export default Range
