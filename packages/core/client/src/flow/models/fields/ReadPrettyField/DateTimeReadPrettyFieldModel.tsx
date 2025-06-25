import React from 'react';
import dayjs from 'dayjs';
import { ReadPrettyFieldModel } from './ReadPrettyFieldModel';

export class DateTimeReadPrettyFieldModel extends ReadPrettyFieldModel {
  public static readonly supportedFieldInterfaces = [
    'date',
    'datetimeNoTz',
    'createdAt',
    'datetime',
    'updatedAt',
    'unixTimestamp',
  ];
  public render() {
    const {
      format,
      dateFormat = 'YYYY-MM-DD',
      timeFormat = 'HH:mm:ss',
      showTime,
      prefix = '',
      suffix = '',
    } = this.props;
    const finalFormat = format || (showTime ? `${dateFormat} ${timeFormat}` : dateFormat);
    const value = this.getValue();

    let formattedValue = '';
    if (value) {
      const day = dayjs(value);
      formattedValue = day.isValid() ? day.format(finalFormat) : '';
    }

    return (
      <div>
        {prefix}
        {formattedValue}
        {suffix}
      </div>
    );
  }
}

DateTimeReadPrettyFieldModel.registerFlow({
  key: 'key3',
  auto: true,
  sort: 1000,
  title: 'Specific properties',
  steps: {
    dateFormat: {
      use: 'dateDisplayFormat',
      title: 'Date display format',
      defaultParams: (ctx) => {
        const { showTime, dateFormat, timeFormat, picker } = ctx.model.props;
        return {
          picker: picker || 'date',
          dateFormat: dateFormat || 'YYYY-MM-DD',
          timeFormat: timeFormat,
          showTime,
        };
      },
    },
  },
});
