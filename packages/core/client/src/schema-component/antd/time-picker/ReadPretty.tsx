import { usePrefixCls } from '@formily/antd/lib/__builtins__';
import { toArr } from '@formily/shared';
import { TimeRangePickerProps } from 'antd/lib/time-picker';
import cls from 'classnames';
import moment from 'moment';
import React from 'react';

export const ReadPretty: React.FC<TimeRangePickerProps> = (props: any) => {
  const { value, format = 'HH:mm:ss' } = props;
  const prefixCls = usePrefixCls('description-text', props);
  const values = toArr(value);
  const getLabels = () => {
    const labels = values.map((v) => moment(v, 'HH:mm:ss').format(format));
    return labels.join('~');
  };
  return (
    <div className={cls(prefixCls, props.className)} style={props.style}>
      {getLabels()}
    </div>
  );
};
