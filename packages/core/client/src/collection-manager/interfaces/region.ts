import { uid } from '@formily/shared';
import { defaultProps, operators } from './properties';
import { IField } from './types';

export const region: IField = {
  name: 'region',
  type: 'object',
  group: 'choices',
  order: 3,
  title: '{{t("Indian Region")}}',
  isAssociation: true,
  default: {
    interface: 'region',
    type: 'belongsToMany',
    target: 'regions',
    targetKey: 'code',
    sortBy: 'level',
    uiSchema: {
      type: 'array',
      'x-component': 'Cascader',
      'x-component-props': {
        useDataSource: '{{ useRegionDataSource }}',
        useLoadData: '{{ useRegionLoadData }}',
        changeOnSelectLast: false,
        labelInValue: true,
        maxLevel: 4,
        fieldNames: {
          label: 'name',
          value: 'code',
          children: 'children',
        },
      },
    },
  },
  availableTypes: ['belongsToMany'],
  initialize: (values: any) => {
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
  },
  properties: {
    ...defaultProps,
    'uiSchema.x-component-props.maxLevel': {
      type: 'number',
      'x-component': 'Radio.Group',
      'x-decorator': 'FormItem',
      title: '{{t("Select level")}}',
      default: 4,
      enum: [
        { value: 1, label: '{{t("State")}}' },
        { value: 2, label: '{{t("City/District")}}' },
        { value: 3, label: '{{t("Area")}}' },
        { value: 4, label: '{{t("Pincode")}}' },
      ],
    },
    'uiSchema.x-component-props.changeOnSelectLast': {
      type: 'boolean',
      'x-component': 'Checkbox',
      'x-content': '{{t("Must select to the last level")}}',
      'x-decorator': 'FormItem',
    },
  },
  filterable: {
    children: [
      {
        name: 'name',
        title: '{{t("State")}}',
        operators: operators.string,
        schema: {
          title: '{{t("City/district")}}',
          type: 'string',
          'x-component': 'Input',
        },
      },
    ],
  },
};

