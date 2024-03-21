import { uid } from '@formily/shared';
import { defaultProps, operators } from './properties';
import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';

export class ChinaRegionFieldInterface extends CollectionFieldInterface {
  name = 'chinaRegion';
  type = 'object';
  group = 'choices';
  order = 7;
  title = '{{t("China region")}}';
  isAssociation = true;
  default = {
    interface: 'chinaRegion',
    type: 'belongsToMany',
    target: 'chinaRegions',
    targetKey: 'code',
    sortBy: 'level',
    uiSchema: {
      type: 'array',
      'x-component': 'Cascader',
      'x-component-props': {
        useDataSource: '{{ useChinaRegionDataSource }}',
        useLoadData: '{{ useChinaRegionLoadData }}',
        changeOnSelectLast: false,
        labelInValue: true,
        maxLevel: 3,
        fieldNames: {
          label: 'name',
          value: 'code',
          children: 'children',
        },
      },
    },
  };
  availableTypes = ['belongsToMany'];
  initialize(values: any): void {
    if (!values.through) {
      values.through = `t_${uid()}`;
    }
    if (!values.foreignKey) {
      values.foreignKey = `f_${uid()}`;
    }
    if (!values.otherKey) {
      values.otherKey = `f_${uid()}`;
    }
    if (!values.sourceKey) {
      values.sourceKey = 'id';
    }
    if (!values.targetKey) {
      values.targetKey = 'id';
    }
  }

  properties = {
    ...defaultProps,
    'uiSchema.x-component-props.maxLevel': {
      type: 'number',
      'x-component': 'Radio.Group',
      'x-decorator': 'FormItem',
      title: '{{t("Select level")}}',
      default: 3,
      enum: [
        { value: 1, label: '{{t("Province")}}' },
        { value: 2, label: '{{t("City")}}' },
        { value: 3, label: '{{t("Area")}}' },
        { value: 4, label: '{{t("Street")}}', disabled: true },
        { value: 5, label: '{{t("Village")}}', disabled: true },
      ],
    },
    'uiSchema.x-component-props.changeOnSelectLast': {
      type: 'boolean',
      'x-component': 'Checkbox',
      'x-content': '{{t("Must select to the last level")}}',
      'x-decorator': 'FormItem',
    },
  };

  filterable = {
    children: [
      {
        name: 'name',
        title: '{{t("Province/city/area name")}}',
        operators: operators.string,
        schema: {
          title: '{{t("Province/city/area name")}}',
          type: 'string',
          'x-component': 'Input',
        },
      },
    ],
  };
}
