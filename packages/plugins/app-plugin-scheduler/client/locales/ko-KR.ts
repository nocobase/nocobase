import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const koKR: LocaleResource<typeof enUS> = {
  authorization: {
    title: '일정',
    read: '보기',
  },
  nav: {
    automation: '자동화',
  },
};

export default koKR;
