import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  authorization: {
    title: 'Agendamentos',
    read: 'Ler',
  },
  nav: {
    automation: 'Automação',
  },
};

export default ptBR;
