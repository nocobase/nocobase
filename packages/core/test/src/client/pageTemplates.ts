import { PageConfig } from './e2eUtils';

/**
 * 一个空的 group 页面
 */
export const groupPageEmpty: PageConfig = {
  type: 'group',
  name: 'Empty group',
  pageSchema: {
    type: 'void',
  },
};

export const linkPage: PageConfig = {
  type: 'link',
  name: 'Link',
  url: '/',
  pageSchema: {
    type: 'void',
  },
};
