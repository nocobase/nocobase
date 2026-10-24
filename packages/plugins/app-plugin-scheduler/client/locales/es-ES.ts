import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  authorization: {
    title: 'Programaciones',
    read: 'Leer',
  },
  nav: {
    automation: 'Automatización',
  },
};

export default esES;
