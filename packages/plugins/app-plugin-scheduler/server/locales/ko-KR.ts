import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const koKR: LocaleResource<typeof enUS> = {
  nav: {
    automation: '자동화',
  },
  authorization: {
    title: '일정',
    read: '보기',
  },
};

export default koKR;
