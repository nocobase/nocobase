import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  nav: {
    automation: '自動化',
  },
  authorization: {
    title: 'スケジュール',
    read: '読み取り',
  },
};

export default jaJP;
