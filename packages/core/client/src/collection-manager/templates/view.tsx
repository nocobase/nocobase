import { getConfigurableProperties } from './properties';
import { ICollectionTemplate } from './types';

export const view: ICollectionTemplate = {
  name: 'view',
  title: '{{t("View collection")}}',
  order: 4,
  color: 'yellow',
  default: {
    fields: [],
  },
  configurableProperties: {
    name: {
      title: '{{t("Collection name")}}',
      type: 'single',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-reactions': ['{{useAsyncDataSource(loadDBViews)}}'],
    },
    ...getConfigurableProperties('title', 'category'),
  },
};
