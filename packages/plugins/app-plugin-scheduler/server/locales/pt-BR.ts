import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  nav: {
    automation: 'Automação',
  },
  authorization: {
    title: 'Agendamentos',
    read: 'Ler',
  },
};

export default ptBR;
