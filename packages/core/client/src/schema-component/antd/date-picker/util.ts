import { formatMomentValue } from '@formily/antd/lib/__builtins__';
import type { DatePickerProps } from 'antd/lib/date-picker';
import moment from 'moment';

export const getDefaultFormat = (props: DatePickerProps & { dateFormat: string; timeFormat: string }) => {
  if (props.format) {
    return props.format;
  }
  if (props.dateFormat) {
    if (props['showTime']) {
      return `${props.dateFormat} ${props.timeFormat || 'HH:mm:ss'}`;
    }
    return props.dateFormat;
  }
  if (props['picker'] === 'month') {
    return 'YYYY-MM';
  } else if (props['picker'] === 'quarter') {
    return 'YYYY-\\QQ';
  } else if (props['picker'] === 'year') {
    return 'YYYY';
  } else if (props['picker'] === 'week') {
    return 'YYYY-wo';
  }
  return props['showTime'] ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD';
};

export const mapDateFormat = function () {
  return (props: any) => {
    const format = getDefaultFormat(props) as any;
    const onChange = props.onChange;
    return {
      ...props,
      format: format,
      value: props.value && moment(props.value).isValid() ? moment(props.value) : undefined,
      // value: momentable(props.value, format === 'YYYY-wo' ? 'YYYY-w' : format),
      onChange: (value: moment.Moment | moment.Moment[]) => {
        if (onChange) {
          onChange(value);
          // onChange(formatMomentValue(value, format));
        }
      },
    };
  };
};
