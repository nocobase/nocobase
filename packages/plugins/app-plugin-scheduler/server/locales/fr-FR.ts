import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  nav: {
    automation: 'Automatisation',
  },
  authorization: {
    title: 'Planifications',
    read: 'Lire',
  },
};

export default frFR;
