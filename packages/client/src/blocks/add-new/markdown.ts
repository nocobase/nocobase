import { uid } from '@formily/shared';

export default () => ({
  name: `markdown_${uid()}`,
  type: 'string',
  'x-component': 'Markdown',
  'x-component-props': {},
});
