import { getConfigurableProperties } from './properties';
import { ICollectionTemplate } from './types';

export const calendar: ICollectionTemplate = {
  name: 'calendar',
  title: '{{t("Calendar collection")}}',
  order: 2,
  color: 'orange',
  default: {
    fields: [
      {
        name: 'cron',
        type: 'string',
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
      },
    ],
  },
  availableFieldInterfaces: {
    include: [],
  },
  configurableProperties: getConfigurableProperties('title', 'name', 'inherits'),
};
