import React from 'react'
import { createVirtualBox } from '@formily/react-schema-renderer'
import { Card } from 'antd'
import { CardProps } from 'antd/lib/card'
import styled from 'styled-components'

export const FormBlock = createVirtualBox<CardProps>(
  'block',
  styled(({ children, className, ...props }) => {
    return (
      <Card className={className} size="small" {...props}>
        {children}
      </Card>
    )
  })`
    margin-bottom: 10px !important;
    &.ant-card {
      border: none;
      box-shadow: none;
    }
  `
)

export default FormBlock