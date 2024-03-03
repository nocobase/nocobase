import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';
import { operators } from './properties';

export class IdFieldInterface extends CollectionFieldInterface {
  name = 'id';
  type = 'object';
  group = 'systemInfo';
  order = 0;
  title = '{{t("ID")}}';
  hidden = true;
  sortable = true;
  default = {
    name: 'id',
    type: 'bigInt',
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
    uiSchema: {
      type: 'number',
      title: '{{t("ID")}}',
      'x-component': 'InputNumber',
      'x-read-pretty': true,
    },
  };
  availableTypes = ['bigInt', 'integer', 'string'];
  properties = {
    'uiSchema.title': {
      type: 'string',
      title: '{{t("Field display name")}}',
      required: true,
      default: 'ID',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    name: {
      type: 'string',
      title: '{{t("Field name")}}',
      required: true,
      'x-disabled': true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      description:
        "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.')}}",
    },
  };
  filterable = {
    operators: operators.id,
  };
  titleUsable = true;
}
