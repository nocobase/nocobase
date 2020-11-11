import React from 'react'
import { AntdSchemaFieldAdaptor, pickFormItemProps } from '@formily/antd'
import { createVirtualBox } from '@formily/react-schema-renderer'
import { Row } from 'antd'
import { RowProps } from 'antd/lib/grid'
import { FormItemProps as ItemProps } from 'antd/lib/form'
import { IItemProps } from '../types'

export const FormGridRow = createVirtualBox<RowProps & ItemProps & IItemProps>(
  'grid-row',
  props => {
    const { title, label } = props
    const grids = <Row {...props}>{props.children}</Row>
    if (title || label) {
      return (
        <AntdSchemaFieldAdaptor {...pickFormItemProps(props)}>
          {grids}
        </AntdSchemaFieldAdaptor>
      )
    }
    return grids
  }
)

export default FormGridRow
