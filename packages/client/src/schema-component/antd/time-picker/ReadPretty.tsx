import { formatMomentValue, usePrefixCls } from '@formily/antd/esm/__builtins__';
import { isArr } from '@formily/shared';
import { TimeRangePickerProps } from 'antd/lib/time-picker';
import cls from 'classnames';
import React from 'react';

export const ReadPretty: React.FC<TimeRangePickerProps> = (props: any) => {
  const { placeholder } = props;
  const prefixCls = usePrefixCls('description-text', props);
  const getLabels = () => {
    const labels = formatMomentValue(props.value, props.format, placeholder);
    return isArr(labels) ? labels.join('~') : labels;
  };
  return (
    <div className={cls(prefixCls, props.className)} style={props.style}>
      {getLabels()}
    </div>
  );
};
