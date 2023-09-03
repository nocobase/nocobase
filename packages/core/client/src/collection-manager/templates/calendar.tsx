import { getConfigurableProperties } from './properties';
import { ICollectionTemplate } from './types';

export const calendar: ICollectionTemplate = {
  name: 'calendar',
  title: '{{t("Calendar collection")}}',
  order: 2,
  color: 'orange',
  default: {
    createdBy: true,
    updatedBy: true,
    createdAt: true,
    updatedAt: true,
    sortable: true,
    fields: [
      {
        name: 'cron',
        type: 'string',
        uiSchema: {
          type: 'string',
          title: '{{t("Repeats")}}',
          'x-component': 'CronSet',
          'x-component-props': 'allowClear',
          enum: [
            {
              label: '{{t("Daily")}}',
              value: '0 0 0 * * ?',
            },
            {
              label: '{{t("Weekly")}}',
              value: 'every_week',
            },
            {
              label: '{{t("Monthly")}}',
              value: 'every_month',
            },
            {
              label: '{{t("Yearly")}}',
              value: 'every_year',
            },
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
  configurableProperties: getConfigurableProperties('title', 'name', 'inherits', 'category', 'description'),
};
