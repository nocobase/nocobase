import { getConfigurableProperties } from './properties';
import { ICollectionTemplate } from './types';
import { PreviewFields } from './components/PreviewFields';
import { PreviewTable } from './components/PreviewTable';


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
    viewName: {
      title: '{{t("Connect to database view")}}',
      type: 'single',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-reactions': ['{{useAsyncDataSource(loadDBViews)}}'],
      'x-disabled': '{{ !createOnly }}',
    },
    schema: {
      type: 'string',
      'x-hidden': true,
      'x-reactions': {
        dependencies: ['viewName'],
        when: "{{isPG}}",
        fulfill: {
          state: {
            value: "{{$deps[0].split('_')?.[0]}}",
          },
        },
        otherwise: {
          state: {
            value: null,
          },
        },
      },
    },
    name: {
      type: 'string',
      'x-hidden': true,
      'x-reactions': {
        dependencies: ['viewName'],
        when: "{{isPG}}",
        fulfill: {
          state: {
            value: '{{$deps[0].match(/^([^_]+)_(.*)$/)?.[2]}}',
          },
        },
        otherwise: {
          state: {
            value: '{{$deps[0]}}',
          },
        },
      },
    },
    sources: {
      type: 'array',
      title: '{{ t("Source collections") }}',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        multiple: true,
      },
      'x-reactions': ['{{useAsyncDataSource(loadCollections)}}'],
      'x-disabled': true,
    },
    fields: {
      type: 'array',
      'x-component': PreviewFields,
      'x-visible': '{{ createOnly }}',
      'x-reactions': {
        dependencies: ['name'],
        fulfill: {
          schema: {
            'x-component-props': '{{$form.values}}', //任意层次属性都支持表达式
          },
        },
      },
    },
    preview: {
      type: 'object',
      'x-visible': '{{ createOnly }}',
      'x-component': PreviewTable,
      'x-reactions': {
        dependencies: ['name','fields'],
        fulfill: {
          schema: {
            'x-component-props': '{{$form.values}}', //任意层次属性都支持表达式
          },
        },
      },
    },
    ...getConfigurableProperties('category'),
  },
};
