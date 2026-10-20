import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  language: {
    label: '語言',
    switchError: '無法切換語言。',
  },
};

export default zhTW;
