import type { PartialLocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

/** The inbox's main words; the rest falls back to English. */
const ptBR: PartialLocaleResource<typeof enUS> = {
  inbox: {
    title: 'Caixa de entrada',
    views: {
      all: 'Tudo',
      unread: 'Não lidas',
      todo: 'Pendente',
    },
    categories: 'Categorias',
    readAll: 'Marcar tudo como lido',
    open: 'Abrir',
    actions: {
      read: 'Marcar como lida',
      unread: 'Marcar como não lida',
      delete: 'Excluir',
    },
    tabs: {
      today: 'Hoje',
      info: 'Anteriores',
      decision: 'Pendente',
    },
  },
  inboxButton: {
    title: 'Caixa de entrada',
    viewAll: 'Abrir a caixa',
  },
  nav: {
    inbox: 'Caixa de entrada',
  },
};

export default ptBR;
