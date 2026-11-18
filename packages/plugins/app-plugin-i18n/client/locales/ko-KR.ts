import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const koKR: LocaleResource<typeof enUS> = {
  language: {
    label: '언어',
    switchError: '언어를 전환할 수 없습니다.',
  },
};

export default koKR;
