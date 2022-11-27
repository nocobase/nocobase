import { defaultProps, defaultCollectionOptions } from './properties';
import { ICollectionTemplate } from './types';

export const calendarCollection: ICollectionTemplate = {
  name: 'calendarCollection',
  type: 'object',
  title: '{{t("Calendar collection")}}',
  order: 2,
  color: 'orange',
  presetFields: [
    {
      name: 'cron',
      type: 'string',
      allowNull: true,
      uiSchema: {
        type: 'string',
        title: '{{t("Cron")}}',
        'x-component': 'Select',
        enum: [
          { value: '0 0 * * *', label: '每天' },
          { value: '0 0 ? * 1', label: '每个星期一' },
          { value: '0 0 12 * * ?', label: '每天中午12点' },
          { value: '0 0 10,14,16 * * ?', label: '每天上午10点,下午2点,4点 ' },
        ],
      },
      interface: 'select',
    },
    {
      name: 'exclude',
      type: 'json',
      allowNull: true,
      interface: 'json',
      uiSchema: {
        type: 'string',
        title: '{{t("Exclude")}}',
        'x-component': 'Input.JSON',
        'x-component-props': {
          autoSize: {
            minRows: 5,
          },
        },
      },
    },
  ],
  properties: {
    ...defaultProps,
    ...defaultCollectionOptions,
  },
  //包含的interface类型
  include: [],
  // 排除的interface类型
  exclude: [],
};
