import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  demo: {
    preparing: 'Preparando los buzones de demostración…',
    setUp: 'Preparar buzones de demostración',
    setupFailed: 'No se pudieron preparar los buzones de demostración.',
  },
};

export default esES;
