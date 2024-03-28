import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';
import { operators } from './properties';

export class UUIDFieldInterface extends CollectionFieldInterface {
  name = 'uuid';
  type = 'object';
  group = 'advanced';
  order = 0;
  title = '{{t("UUID")}}';
  hidden = false;
  sortable = true;
  default = {
    type: 'uuid',
    uiSchema: {
      type: 'string',
      'x-component': 'Input',
      'x-validator': 'uuid',
    },
  };
  availableTypes = ['string', 'uid', 'uuid'];
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
  };
  filterable = {
    operators: operators.string,
  };
  titleUsable = true;
}
