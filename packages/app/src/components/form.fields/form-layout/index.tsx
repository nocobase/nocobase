import React from 'react'
import { FormItemDeepProvider, useDeepFormItem } from '@formily/antd'
import { createVirtualBox } from '@formily/react-schema-renderer'
import cls from 'classnames'
import { IFormItemTopProps } from '../types'

export const FormLayout = createVirtualBox<IFormItemTopProps>(
  'layout',
  props => {
    const { inline } = useDeepFormItem()
    const isInline = props.inline || inline
    const children =
      isInline || props.className || props.style ? (
        <div
          className={cls(props.className, {
            'ant-form ant-form-inline': isInline
          })}
          style={props.style}
        >
          {props.children}
        </div>
      ) : (
        props.children
      )
    return <FormItemDeepProvider {...props}>{children}</FormItemDeepProvider>
  }
)

export default FormLayout