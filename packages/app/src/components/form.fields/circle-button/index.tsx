import React from 'react'
import { Button } from 'antd'
import { ButtonProps } from 'antd/lib/button'

export const CircleButton: React.FC<ButtonProps> = props => {
  const hasText = String(props.className || '').indexOf('has-text') > -1
  return (
    <Button
      type={hasText ? 'link' : undefined}
      shape={hasText ? undefined : 'circle'}
      {...props}
    />
  )
}

export default CircleButton
