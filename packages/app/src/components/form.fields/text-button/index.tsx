import React from 'react'
import { Button } from 'antd'
import { ButtonProps } from 'antd/lib/button'

export const TextButton: React.FC<ButtonProps> = props => (
  <Button type="link" {...props} />
)

export default TextButton
