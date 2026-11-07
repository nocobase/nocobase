import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ruRU: LocaleResource<typeof enUS> = {
  authorization: {
    title: 'Расписания',
    read: 'Просмотр',
  },
  nav: {
    automation: 'Автоматизация',
  },
};

export default ruRU;
