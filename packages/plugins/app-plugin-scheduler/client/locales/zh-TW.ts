import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  authorization: {
    title: '排程',
    read: '讀取',
  },
  nav: {
    automation: '自動化',
  },
};

export default zhTW;
