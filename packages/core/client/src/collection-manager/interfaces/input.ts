import { ISchema } from '@formily/react';
import { defaultProps, operators, unique, primaryKey } from './properties';
import { i18n } from '../../i18n';
import { registerValidateRules } from '@formily/validator';
import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';

registerValidateRules({
  username(value) {
    return /^[^@.<>"'/]{2,16}$/.test(value) || i18n.t('Must be 2-16 characters in length (excluding @.<>"\'/)');
  },
});

export class InputFieldInterface extends CollectionFieldInterface {
  name = 'input';
  type = 'object';
  group = 'basic';
  order = 1;
  title = '{{t("Single line text")}}';
  sortable = true;
  default = {
    interface: 'input',
    type: 'string',
    uiSchema: {
      type: 'string',
      'x-component': 'Input',
    },
  };
  availableTypes = ['string', 'uid'];
  hasDefaultValue = true;
  properties = {
    ...defaultProps,
    layout: {
      type: 'void',
      title: '{{t("Index")}}',
      'x-component': 'Space',
      'x-decorator': 'FormItem',
      'x-decorator-props': {
        style: {
          marginBottom: '0px',
        },
      },
      properties: {
        primaryKey,
        unique,
      },
    },
  };
  filterable = {
    operators: operators.string,
  };
  titleUsable = true;
  schemaInitialize(schema: ISchema, { block }) {
    if (['Table', 'Kanban'].includes(block)) {
      schema['x-component-props'] = schema['x-component-props'] || {};
      schema['x-component-props']['ellipsis'] = true;
    }
  }
  validateSchema(fieldSchema) {
    return {
      max: {
        type: 'number',
        title: '{{ t("Max length") }}',
        minimum: 0,
        'x-decorator': 'FormItem',
        'x-component': 'InputNumber',
        'x-component-props': {
          precision: 0,
        },
        'x-reactions': `{{(field) => {
          const targetValue = field.query('.min').value();
          field.selfErrors =
            !!targetValue && !!field.value && targetValue > field.value ? '${i18n.t(
              'Max length must greater than min length',
            )}' : ''
        }}}`,
      },
      min: {
        type: 'number',
        title: '{{ t("Min length") }}',
        minimum: 0,
        'x-decorator': 'FormItem',
        'x-component': 'InputNumber',
        'x-component-props': {
          precision: 0,
        },
        'x-reactions': {
          dependencies: ['.max'],
          fulfill: {
            state: {
              selfErrors: `{{!!$deps[0] && !!$self.value && $deps[0] < $self.value ? '${i18n.t(
                'Min length must less than max length',
              )}' : ''}}`,
            },
          },
        },
      },
      len: {
        type: 'number',
        title: '{{ t("Length") }}',
        minimum: 0,
        'x-decorator': 'FormItem',
        'x-component': 'InputNumber',
        'x-component-props': {
          precision: 0,
        },
      },
      format: {
        type: 'string',
        title: '{{ t("Format") }}',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        'x-component-props': {
          allowClear: true,
        },
        enum: [
          {
            label: '{{ t("url") }}',
            value: 'url',
          },
          {
            label: '{{ t("email") }}',
            value: 'email',
          },
          {
            label: '{{ t("ipv6") }}',
            value: 'ipv6',
          },
          {
            label: '{{ t("ipv4") }}',
            value: 'ipv4',
          },
          {
            label: '{{ t("number") }}',
            value: 'number',
          },
          {
            label: '{{ t("integer") }}',
            value: 'integer',
          },
          {
            label: '{{ t("idcard") }}',
            value: 'idcard',
          },
          {
            label: '{{ t("qq") }}',
            value: 'qq',
          },
          {
            label: '{{ t("phone") }}',
            value: 'phone',
          },
          {
            label: '{{ t("money") }}',
            value: 'money',
          },
          {
            label: '{{ t("zh") }}',
            value: 'zh',
          },
          {
            label: '{{ t("date") }}',
            value: 'date',
          },
          {
            label: '{{ t("zip") }}',
            value: 'zip',
          },
        ],
      },
      pattern: {
        type: 'string',
        title: '{{ t("Regular expression") }}',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        'x-component-props': {
          prefix: '/',
          suffix: '/',
        },
      },
    };
  }
}
