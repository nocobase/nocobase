import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  language: {
    label: '言語',
    switchError: '言語を切り替えることができません。',
  },
};

export default jaJP;
