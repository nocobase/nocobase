import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ruRU: LocaleResource<typeof enUS> = {
  nav: {
    automation: 'Автоматизация',
  },
  authorization: {
    title: 'Расписания',
    read: 'Просмотр',
  },
};

export default ruRU;
