import { CollectionTemplate, ICollectionTemplate, getConfigurableProperties } from '@nocobase/client';
import { generateNTemplate } from '../../locale';

export const calendar: ICollectionTemplate = {
  name: 'calendar',
  title: generateNTemplate('Calendar collection'),
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
          title: generateNTemplate('Repeats'),
          'x-component': 'CronSet',
          'x-component-props': 'allowClear',
          enum: [
            {
              label: generateNTemplate('Daily'),
              value: '0 0 0 * * ?',
            },
            {
              label: generateNTemplate('Weekly'),
              value: 'every_week',
            },
            {
              label: generateNTemplate('Monthly'),
              value: 'every_month',
            },
            {
              label: generateNTemplate('Yearly'),
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
  configurableProperties: getConfigurableProperties(
    'title',
    'name',
    'inherits',
    'category',
    'description',
    'presetFields',
  ),
};

export class CalendarCollectionTemplate extends CollectionTemplate {
  name = 'calendar';
  title = generateNTemplate('Calendar collection');
  order = 2;
  color = 'orange';
  default = {
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
          title: generateNTemplate('Repeats'),
          'x-component': 'CronSet',
          'x-component-props': 'allowClear',
          enum: [
            {
              label: generateNTemplate('Daily'),
              value: '0 0 0 * * ?',
            },
            {
              label: generateNTemplate('Weekly'),
              value: 'every_week',
            },
            {
              label: generateNTemplate('Monthly'),
              value: 'every_month',
            },
            {
              label: generateNTemplate('Yearly'),
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
  };
  availableFieldInterfaces = {
    include: [],
  };
  configurableProperties = getConfigurableProperties(
    'title',
    'name',
    'inherits',
    'category',
    'description',
    'presetFields',
  );
}
