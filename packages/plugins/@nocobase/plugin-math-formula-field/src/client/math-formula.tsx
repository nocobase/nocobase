import { CollectionFieldInterface, interfacesProperties } from '@nocobase/client';
const { defaultProps, operators } = interfacesProperties;

export class MathFormulaFieldInterface extends CollectionFieldInterface {
  name = 'mathFormula';
  type = 'object';
  group = 'advanced';
  order = 1;
  title = '{{t("Math formula")}}';
  description = '{{t("Compute a value based on the other fields using mathjs")}}';
  sortable = true;
  default = {
    type: 'mathFormula',
    // name,
    uiSchema: {
      type: 'number',
      // title,
      'x-disabled': true,
      'x-component': 'MathFormula.Result',
      'x-component-props': {
        stringMode: true,
        step: '1',
      },
    },
  };
  properties = {
    ...defaultProps,
    dataType: {
      type: 'string',
      title: '{{t("Data type")}}',
      'x-component': 'Select',
      'x-decorator': 'FormItem',
      default: 'number',
      'x-disabled': '{{ !createOnly }}',
      'x-reactions': [
        {
          target: 'uiSchema.x-component-props.step',
          fulfill: {
            state: {
              display: '{{$self.value !== "string" ? "visible" : "none"}}',
            },
          },
        },
      ],
      enum: [
        { value: 'string', label: '{{t("String")}}' },
        { value: 'number', label: '{{t("Number")}}' },
      ],
    },
    'uiSchema.x-component-props.step': {
      type: 'string',
      title: '{{t("Precision")}}',
      'x-component': 'Select',
      'x-decorator': 'FormItem',
      required: true,
      default: '0',
      enum: [
        { value: '0', label: '1' },
        { value: '0.1', label: '1.0' },
        { value: '0.01', label: '1.00' },
        { value: '0.001', label: '1.000' },
        { value: '0.0001', label: '1.0000' },
        { value: '0.00001', label: '1.00000' },
      ],
    },
    expression: {
      type: 'string',
      title: '{{t("Expression")}}',
      required: true,
      description: '{{mathExpressionDescription}}',
      'x-component': 'MathFormula.Expression',
      'x-decorator': 'FormItem',
      'x-component-props': {
        supports: ['number', 'percent', 'integer'],
        useCurrentFields: '{{ useCurrentFields }}',
      },
    },
  };
  filterable = {
    operators: operators.number,
  };
}
