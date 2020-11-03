import React from 'react'
import { createVirtualBox } from '@formily/react-schema-renderer'
import { Col } from 'antd'
import { ColProps } from 'antd/lib/grid'

export const FormGridCol = createVirtualBox<ColProps>('grid-col', props => {
  return <Col {...props}>{props.children}</Col>
})

export default FormGridCol