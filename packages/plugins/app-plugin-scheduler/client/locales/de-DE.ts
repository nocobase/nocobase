import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  authorization: {
    title: 'Zeitpläne',
    read: 'Lesen',
  },
  nav: {
    automation: 'Automatisierung',
  },
};

export default deDE;
