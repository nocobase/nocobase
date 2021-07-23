import { ISchema } from '@formily/react';
import { defaultProps } from './properties';

export const attachment: ISchema = {
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
      'x-component': 'Upload',
      'x-decorator': 'FormItem',
      'x-designable-bar': 'Upload.DesignableBar',
    } as ISchema,
  },
  properties: {
    ...defaultProps,
  },
  operations: [
    { label: '等于', value: 'eq' },
    { label: '不等于', value: 'ne' },
  ],
};
