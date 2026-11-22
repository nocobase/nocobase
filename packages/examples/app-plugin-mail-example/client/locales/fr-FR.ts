import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  demo: {
    preparing: 'Préparation des boîtes de démonstration…',
    setUp: 'Préparer les boîtes de démonstration',
    setupFailed: 'Impossible de préparer les boîtes de démonstration.',
  },
};

export default frFR;
