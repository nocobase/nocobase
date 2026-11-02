import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  language: {
    label: 'Idioma',
    switchError: 'No se puede cambiar de idioma.',
  },
};

export default esES;
