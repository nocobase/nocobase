import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';
import { defaultProps } from './properties';

export class LinkToFieldInterface extends CollectionFieldInterface {
  name = 'linkTo';
  type = 'object';
  group = 'relation';
  order = 1;
  title = '{{t("Link to")}}';
  description = '{{t("Link to description")}}';
  isAssociation = true;
  default = {
    type: 'belongsToMany',
    uiSchema: {
      'x-component': 'AssociationField',
      'x-component-props': {
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
      uiSchema: {
        'x-component': 'AssociationField',
        'x-component-props': {
          multiple: true,
          fieldNames: {
            label: 'id',
            value: 'id',
          },
        },
      },
    },
  };
  // availableTypes = ['belongsToMany'];
  schemaInitialize(schema: ISchema, { readPretty, block, targetCollection }) {
    if (targetCollection?.titleField && schema['x-component-props']) {
      schema['x-component-props'].fieldNames = schema['x-component-props'].fieldNames || {
        value: targetCollection.filterTargetKey || 'id',
      };
      schema['x-component-props'].fieldNames.label = targetCollection.titleField;
    }
    if (['Table', 'Kanban'].includes(block)) {
      schema['x-component-props'] = schema['x-component-props'] || {};
      schema['x-component-props']['ellipsis'] = true;
      // 预览文件时需要的参数
      schema['x-component-props']['size'] = 'small';
    }
  }
  initialize = (values: any) => {
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
  };
  properties = {
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
    'uiSchema.x-component-props.multiple': {
      type: 'boolean',
      'x-content': '{{t("Allow linking to multiple records")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
  };
  filterable = {
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
  };
}
