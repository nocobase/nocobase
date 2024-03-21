import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';
import { operators } from './properties';
export class NanoidFieldInterface extends CollectionFieldInterface {
  name = 'nanoid';
  type = 'object';
  group = 'advanced';
  order = 0;
  title = '{{t("Nano ID")}}';
  hidden = false;
  sortable = true;
  default = {
    type: 'nanoid',
    uiSchema: {
      type: 'string',
      'x-component': 'NanoIDInput',
    },
  };
  availableTypes = ['string', 'uid'];
  properties = {
    'uiSchema.title': {
      type: 'string',
      title: '{{t("Field display name")}}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    name: {
      type: 'string',
      title: '{{t("Field name")}}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-disabled': '{{ !createOnly }}',
      description:
        "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.')}}",
    },
    customAlphabet: {
      type: 'string',
      title: '{{t("Alphabet")}}',
      default: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    size: {
      type: 'number',
      title: '{{t("Length")}}',
      default: 21,
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
    },
  };
  filterable = {
    operators: operators.string,
  };
  titleUsable = true;
}
