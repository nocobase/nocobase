import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  authorization: {
    title: 'Planifications',
    read: 'Lire',
  },
  nav: {
    automation: 'Automatisation',
  },
};

export default frFR;
