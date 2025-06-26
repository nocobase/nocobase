import React from 'react';
import { ReadPrettyFieldModel } from './ReadPrettyFieldModel';
import { Checkbox } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

export class CheckboxReadPrettyFieldModel extends ReadPrettyFieldModel {
  public static readonly supportedFieldInterfaces = ['checkbox'];
  public render() {
    const value = this.getValue();
    const { prefix = '', suffix = '', showUnchecked } = this.props;
    const content = value ? (
      <CheckOutlined style={{ color: '#52c41a' }} />
    ) : showUnchecked ? (
      <CloseOutlined style={{ color: '#ff4d4f' }} />
    ) : (
      <Checkbox disabled />
    );

    return (
      <div>
        {prefix}
        {content}
        {suffix}
      </div>
    );
  }
}
