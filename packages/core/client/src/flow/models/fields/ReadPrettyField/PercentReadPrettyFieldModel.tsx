import React from 'react';
import * as math from 'mathjs';
import { isNum } from '@formily/shared';
import { ReadPrettyFieldModel } from './ReadPrettyFieldModel';

const isNumberLike = (index: any): index is number => isNum(index) || /^-?\d+(\.\d+)?$/.test(index);

const toValue = (value: any, callback: (v: number) => number) => {
  if (isNumberLike(value)) {
    return `${math.round(callback(value), 9)}%`;
  }
  return null;
};
export class PercentReadPrettyFieldModel extends ReadPrettyFieldModel {
  public static readonly supportedFieldInterfaces = ['percent'];
  public render() {
    const value = this.getValue();
    const { prefix = '', suffix = '' } = this.props;

    const content = toValue(value, (v) => v * 100);
    return (
      <div>
        {prefix}
        {content}
        {suffix}
      </div>
    );
  }
}
