import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  nav: {
    automation: 'Automatisierung',
  },
  authorization: {
    title: 'Zeitpläne',
    read: 'Lesen',
  },
};

export default deDE;
