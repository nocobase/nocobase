import { FieldOptions } from '.';
import { defaultProps } from './properties';

export const attachment: FieldOptions = {
  name: 'attachment',
  type: 'object',
  group: 'media',
  title: '附件',
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
  properties: {
    ...defaultProps,
    'uiSchema.x-component-props.multiple': {
      type: 'boolean',
      'x-content': '允许上传多个文件',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      default: true,
    },
  },
};
