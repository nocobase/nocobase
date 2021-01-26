import React from 'react'
import { createVirtualBox } from '@formily/react-schema-renderer'
import { Card } from 'antd'
import styled from 'styled-components'
import { markdown } from '@/components/views/Field'

export const FormDescription = createVirtualBox(
  'description',
  styled(({ children, className, ...props }) => {
    return (
      <Card size={'small'} headStyle={{padding: 0}} bodyStyle={{
        padding: 0,
      }} className={className} {...props}>
        <div dangerouslySetInnerHTML={{__html: children && markdown(children)}}></div>
      </Card>
    )
  })`
    margin-bottom: 24px !important;
    &.ant-card {
      border: none;
      box-shadow: none;
      p:first-child {
        margin-top: 14px;
      }
      p:last-child {
        margin-bottom: 0;
      }
    }
  `
)

export default FormDescription
