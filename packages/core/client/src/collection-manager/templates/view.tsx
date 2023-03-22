import { getConfigurableProperties } from './properties';
import { ICollectionTemplate } from './types';
import { PreviewFields } from './components/PreviewFields';

export const view: ICollectionTemplate = {
  name: 'view',
  title: '{{t("Connect to database view")}}',
  order: 4,
  color: 'yellow',
  default: {
    fields: [],
  },
  divider: true,
  configurableProperties: {
    title: {
      type: 'string',
      title: '{{ t("Collection display name") }}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    name: {
      title: '{{t("Connect to database view")}}',
      type: 'single',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-reactions': ['{{useAsyncDataSource(loadDBViews)}}'],
    },
    source: {
      type: 'string',
      title: '{{ t("Source collections") }}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        multiple: true,
      },
      'x-reactions': ['{{useAsyncDataSource(loadCollections)}}'],
      'x-disabled': true,
    },
    previewFields: {
      type: 'void',
      'x-component': PreviewFields,
    },
    ...getConfigurableProperties('category'),
  },
};
