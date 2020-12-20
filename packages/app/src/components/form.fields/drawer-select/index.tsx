import React from 'react'
import { connect } from '@formily/react-schema-renderer'
import moment from 'moment'
import { Select } from 'antd'
import {
  mapStyledProps,
  mapTextComponent,
  compose,
  isStr,
  isArr
} from '../shared'

function DrawerSelectComponent(props) {
  console.log(props);
  return (
    <>
      <Select>
        <Select.Option value={'aaa'}>aaa</Select.Option>
      </Select>
    </>
  );
}

export const DrawerSelect = connect({
  getProps: mapStyledProps,
  getComponent: mapTextComponent,
})(DrawerSelectComponent)

export default DrawerSelect
