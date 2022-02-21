import { defaultProps } from './properties';
import { IField } from './types';

export const markdown: IField = {
  name: 'markdown',
  type: 'object',
  title: 'Markdown',
  group: 'media',
  default: {
    type: 'text',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Markdown',
    },
  },
  properties: {
    ...defaultProps,
  },
};
