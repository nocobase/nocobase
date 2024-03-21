import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';
import { i18n } from '../../i18n';
import { defaultProps, operators, unique } from './properties';

export class NumberFieldInterface extends CollectionFieldInterface {
  name = 'number';
  type = 'object';
  group = 'basic';
  order = 7;
  title = '{{t("Number")}}';
  sortable = true;
  default = {
    type: 'double',
    uiSchema: {
      type: 'number',
      'x-component': 'InputNumber',
      'x-component-props': {
        stringMode: true,
        step: '1',
      },
    },
  };
  availableTypes = ['double', 'float', 'decimal'];
  hasDefaultValue = true;
  properties = {
    ...defaultProps,
    unique,
    'uiSchema.x-component-props.step': {
      type: 'string',
      title: '{{t("Precision")}}',
      'x-component': 'Select',
      'x-decorator': 'FormItem',
      default: '1',
      enum: [
        { value: '1', label: '1' },
        { value: '0.1', label: '1.0' },
        { value: '0.01', label: '1.00' },
        { value: '0.001', label: '1.000' },
        { value: '0.0001', label: '1.0000' },
        { value: '0.00001', label: '1.00000' },
      ],
    },
  };
  filterable = {
    operators: operators.number,
  };
  titleUsable = true;
  validateSchema(fieldSchema) {
    return {
      maximum: {
        type: 'number',
        title: '{{ t("Maximum") }}',
        'x-decorator': 'FormItem',
        'x-component': 'InputNumber',
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
            label: '{{ t("Integer") }}',
            value: 'integer',
          },
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
  }
}
