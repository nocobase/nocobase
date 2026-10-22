import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  language: {
    label: 'Langue',
    switchError: 'Impossible de changer de langue.',
  },
};

export default frFR;
