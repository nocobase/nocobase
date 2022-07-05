import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { cloneDeep } from 'lodash';
import { defaultProps, recordPickerSelector, recordPickerViewer } from './properties';
import { IField } from './types';

export const linkTo: IField = {
  name: 'linkTo',
  type: 'object',
  group: 'relation',
  order: 1,
  title: '{{t("Link to")}}',
  description: '{{t("Link to description")}}',
  isAssociation: true,
  default: {
    type: 'belongsToMany',
    // name,
    uiSchema: {
      // title,
      'x-component': 'RecordPicker',
      'x-component-props': {
        // mode: 'tags',
        multiple: true,
        fieldNames: {
          label: 'id',
          value: 'id',
        },
      },
    },
    reverseField: {
      interface: 'linkTo',
      type: 'belongsToMany',
      // name,
      uiSchema: {
        // title,
        'x-component': 'RecordPicker',
        'x-component-props': {
          // mode: 'tags',
          multiple: true,
          fieldNames: {
            label: 'id',
            value: 'id',
          },
        },
      },
    },
  },
  schemaInitialize(schema: ISchema, { readPretty, block }) {
    if (block === 'Form') {
      schema['properties'] = {
        viewer: cloneDeep(recordPickerViewer),
        selector: cloneDeep(recordPickerSelector),
      };
    } else {
      if (readPretty) {
        schema['properties'] = {
          viewer: cloneDeep(recordPickerViewer),
        };
      } else {
        schema['properties'] = {
          selector: cloneDeep(recordPickerSelector),
        }
      }
    }
  },
  initialize: (values: any) => {
    if (values.type === 'belongsToMany') {
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
  },
  properties: {
    ...defaultProps,
    target: {
      type: 'string',
      title: '{{t("Related collection")}}',
      required: true,
      'x-reactions': ['{{useAsyncDataSource(loadCollections)}}'],
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-disabled': '{{ !createOnly }}',
    },
    // through: {
    //   type: 'string',
    //   title: '{{t("Junction collection")}}',
    //   'x-disabled': '{{ !createOnly }}',
    //   'x-reactions': ['{{useAsyncDataSource(loadCollections)}}'],
    //   'x-decorator': 'FormItem',
    //   'x-component': 'Select',
    //   'x-component-props': {
    //     placeholder: '{{t("Leave it blank, unless you need a custom intermediate table")}}',
    //   },
    // },
    // 'reverseField.uiSchema.title': {
    //   type: 'string',
    //   title: '{{t("Reverse field display name")}}',
    //   // required: true,
    //   'x-decorator': 'FormItem',
    //   'x-component': 'Input',
    // },
    // 'uiSchema.x-component-props.fieldNames.label': {
    //   type: 'string',
    //   title: '要显示的标题字段',
    //   required: true,
    //   'x-reactions': ['{{useAsyncDataSource(loadCollectionFields)}}'],
    //   'x-decorator': 'FormItem',
    //   'x-component': 'Select',
    // },
    'uiSchema.x-component-props.multiple': {
      type: 'boolean',
      'x-content': '{{t("Allow linking to multiple records")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
  },
  filterable: {
    nested: true,
    children: [
      // {
      //   name: 'id',
      //   title: '{{t("Exists")}}',
      //   operators: [
      //     { label: '{{t("exists")}}', value: '$exists', noValue: true },
      //     { label: '{{t("not exists")}}', value: '$notExists', noValue: true },
      //   ],
      //   schema: {
      //     title: '{{t("Exists")}}',
      //     type: 'string',
      //     'x-component': 'Input',
      //   },
      // },
    ],
  },
};
