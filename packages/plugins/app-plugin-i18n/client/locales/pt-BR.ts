import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  language: {
    label: 'Idioma',
    switchError: 'Não é possível mudar o idioma.',
  },
};

export default ptBR;
