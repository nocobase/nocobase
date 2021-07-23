import { ISchema } from '@formily/react';
import { defaultProps } from './properties';

export const markdown: ISchema = {
  name: 'markdown',
  type: 'object',
  title: 'Markdown',
  group: 'media',
  default: {
    dataType: 'text',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Markdown',
      'x-decorator': 'FormItem',
      'x-designable-bar': 'Markdown.DesignableBar',
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
