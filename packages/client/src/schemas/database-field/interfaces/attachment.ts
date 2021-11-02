import { FieldOptions } from '.';
import { defaultProps } from './properties';
import { uid } from '@formily/shared';

export const attachment: FieldOptions = {
  name: 'attachment',
  type: 'object',
  group: 'media',
  title: '{{t("Attachment")}}',
  isAssociation: true,
  default: {
    dataType: 'belongsToMany',
    target: 'attachments',
    // name,
    uiSchema: {
      type: 'array',
      // title,
      'x-component': 'Upload.Attachment',
      'x-decorator': 'FormItem',
      'x-designable-bar': 'Upload.DesignableBar',
    },
  },
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
    'uiSchema.x-component-props.multiple': {
      type: 'boolean',
      'x-content': "{{t('Allow uploading multiple files')}}",
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      default: true,
    },
  },
};
