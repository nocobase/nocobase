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
};
