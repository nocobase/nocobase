import { defaultProps, operators, primaryKey, unique, autoIncrement } from './properties';
import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';
import { i18n } from '../../i18n';
export class SortFieldInterface extends CollectionFieldInterface {
  name = 'sort';
  type = 'object';
  group = 'advanced';
  order = 1;
  title = '{{t("Sort")}}';
  sortable = true;
  titleUsable = true;
  default = {
    type: 'sort',
    uiSchema: {
      type: 'number',
      'x-component': 'InputNumber',
      'x-component-props': {
        stringMode: true,
        step: '1',
      },
      'x-validator': 'integer',
    },
  };
  availableTypes = ['sort'];
  hasDefaultValue = true;
  properties = {
    ...defaultProps,
    primaryKey,
    unique,
    autoIncrement,
  };
  filterable = {
    operators: operators.number,
  };
  validateSchema = (fieldSchema) => {
    return {
      maximum: {
        type: 'number',
        title: '{{ t("Maximum") }}',
        'x-decorator': 'FormItem',
        'x-component': 'InputNumber',
        'x-component-props': {
          precision: 0,
        },
        'x-reactions': `{{(field) => {
          const targetValue = field.query('.minimum').value();
          field.selfErrors =
            !!targetValue && !!field.value && targetValue > field.value ? '${i18n.t(
              'Maximum must greater than minimum',
            )}' : ''
        }}}`,
      },
      minimum: {
        type: 'number',
        title: '{{ t("Minimum") }}',
        'x-decorator': 'FormItem',
        'x-component': 'InputNumber',
        'x-component-props': {
          precision: 0,
        },
        'x-reactions': {
          dependencies: ['.maximum'],
          fulfill: {
            state: {
              selfErrors: `{{!!$deps[0] && !!$self.value && $deps[0] < $self.value ? '${i18n.t(
                'Minimum must less than maximum',
              )}' : ''}}`,
            },
          },
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
            label: '{{ t("Odd") }}',
            value: 'odd',
          },
          {
            label: '{{ t("Even") }}',
            value: 'even',
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
  };
}
