import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ruRU: LocaleResource<typeof enUS> = {
  language: {
    label: 'Язык',
    switchError: 'Не удалось переключить язык.',
  },
};

export default ruRU;
