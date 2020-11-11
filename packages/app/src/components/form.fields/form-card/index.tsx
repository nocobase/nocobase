import React from 'react'
import { createVirtualBox } from '@formily/react-schema-renderer'
import { Card } from 'antd'
import { CardProps } from 'antd/lib/card'
import styled from 'styled-components'

export const FormCard = createVirtualBox<CardProps>(
  'card',
  styled(({ children, className, ...props }) => {
    return (
      <Card className={className} size="small" {...props}>
        {children}
      </Card>
    )
  })`
    margin-bottom: 10px !important;
  `
)

export default FormCard