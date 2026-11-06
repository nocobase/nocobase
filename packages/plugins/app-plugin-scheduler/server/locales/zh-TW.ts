import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  nav: {
    automation: '自動化',
  },
  authorization: {
    title: '排程',
    read: '讀取',
  },
};

export default zhTW;
