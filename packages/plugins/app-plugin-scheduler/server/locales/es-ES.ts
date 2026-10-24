import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  nav: {
    automation: 'Automatización',
  },
  authorization: {
    title: 'Programaciones',
    read: 'Leer',
  },
};

export default esES;
