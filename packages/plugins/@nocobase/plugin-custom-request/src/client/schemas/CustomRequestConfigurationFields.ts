import { generateNTemplate } from '../locale';

export const CustomRequestConfigurationFieldsSchema = {
  type: 'object',
  properties: {
    method: {
      type: 'string',
      required: true,
      title: generateNTemplate('HTTP method'),
      'x-decorator-props': {
        tooltip: generateNTemplate(
          'When the HTTP method is Post, Put or Patch, and this custom request inside the form, the request body will be automatically filled in with the form data',
        ),
      },
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        showSearch: false,
        allowClear: false,
        className: 'auto-width',
      },
      enum: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'PATCH', value: 'PATCH' },
        { label: 'DELETE', value: 'DELETE' },
      ],
      default: 'POST',
    },
    url: {
      type: 'string',
      required: true,
      title: generateNTemplate('URL'),
      'x-decorator': 'FormItem',
      'x-component': 'Variable.RawTextArea',
      'x-component-props': {
        scope: '{{useCustomRequestVariableOptions}}',
        autoSize: true,
        fieldNames: {
          value: 'name',
          label: 'title',
        },
        placeholder: 'https://www.nocobase.com',
      },
    },
    headers: {
      type: 'array',
      'x-component': 'ArrayItems',
      'x-decorator': 'FormItem',
      title: generateNTemplate('Headers'),
      description: generateNTemplate('"Content-Type" only support "application/json", and no need to specify'),
      items: {
        type: 'object',
        properties: {
          space: {
            type: 'void',
            'x-component': 'Space',
            properties: {
              name: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {
                  placeholder: generateNTemplate('Name'),
                },
              },
              value: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Variable.Input',
                'x-component-props': {
                  scope: '{{useCustomRequestVariableOptions}}',
                  fieldNames: {
                    value: 'name',
                    label: 'title',
                  },
                  useTypedConstant: true,
                },
              },
              remove: {
                type: 'void',
                'x-decorator': 'FormItem',
                'x-component': 'ArrayItems.Remove',
              },
            },
          },
        },
      },
      properties: {
        add: {
          type: 'void',
          title: generateNTemplate('Add request header'),
          'x-component': 'ArrayItems.Addition',
        },
      },
    },
    params: {
      type: 'array',
      'x-component': 'ArrayItems',
      'x-decorator': 'FormItem',
      title: generateNTemplate('Parameters'),
      items: {
        type: 'object',
        properties: {
          space: {
            type: 'void',
            'x-component': 'Space',
            properties: {
              name: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {
                  placeholder: generateNTemplate('Name'),
                },
              },
              value: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Variable.Input',
                'x-component-props': {
                  scope: '{{useCustomRequestVariableOptions}}',
                  fieldNames: {
                    value: 'name',
                    label: 'title',
                  },
                  useTypedConstant: true,
                },
              },
              remove: {
                type: 'void',
                'x-decorator': 'FormItem',
                'x-component': 'ArrayItems.Remove',
              },
            },
          },
        },
      },
      properties: {
        add: {
          type: 'void',
          title: generateNTemplate('Add parameter'),
          'x-component': 'ArrayItems.Addition',
        },
      },
    },
    data: {
      type: 'string',
      title: generateNTemplate('Body'),
      'x-decorator': 'FormItem',
      'x-decorator-props': {},
      'x-component': 'Variable.JSON',
      'x-component-props': {
        scope: '{{useCustomRequestVariableOptions}}',
        fieldNames: {
          value: 'name',
          label: 'title',
        },
        changeOnSelect: true,
        autoSize: {
          minRows: 10,
        },
        placeholder: generateNTemplate('Input request data'),
      },
      description: generateNTemplate('Only support standard JSON data'),
    },
    timeout: {
      type: 'number',
      title: generateNTemplate('Timeout config'),
      'x-decorator': 'FormItem',
      'x-decorator-props': {},
      'x-component': 'InputNumber',
      'x-component-props': {
        addonAfter: generateNTemplate('ms'),
        min: 1,
        step: 1000,
        defaultValue: 5000,
      },
    },
  },
};
