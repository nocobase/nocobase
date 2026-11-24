import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
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
    actionsFor: 'Ações de {{title}}',
    allRead: 'Tudo marcado como lido.',
    back: 'Voltar à lista',
    cancel: 'Cancelar',
    clearFilter: 'Limpar filtro',
    count: '×{{count}}',
    deleted: 'Excluído.',
    description: 'Notificações e solicitações enviadas a você.',
    empty: {
      decision: 'Nenhuma decisão aguardando você',
      info: 'Nenhuma notificação',
      todo: 'Nada aguardando você',
      unread: 'Tudo em dia',
    },
    emptyAll: 'Nada por aqui',
    emptyDescription:
      'As notificações e solicitações enviadas a você aparecem aqui.',
    filters: 'Filtros da caixa de entrada',
    forbidden: 'Você não tem permissão para fazer isso.',
    keyMove: 'Mover',
    keyOpen: 'Abertas',
    kinds: {
      all: 'Todos os tipos',
      decision: 'Decisões',
      info: 'Anteriores',
      label: 'Tipo',
      today: 'Hoje',
    },
    detailsUnavailable:
      'Não foi possível carregar alguns detalhes da caixa de entrada.',
    loadFailed: 'Não foi possível carregar a caixa de entrada',
    loadFailedDescription: 'Verifique sua conexão e tente novamente.',
    loadMore: 'Carregar mais',
    loading: 'Carregando',
    noMatchDescription: 'Limpe o filtro para ver todos os tipos.',
    nothingSelected: 'Selecione um item para visualizá-lo',
    notification: 'Notificação',
    outcomes: {
      approved: 'Aprovado',
      rejected: 'Recusado',
      withdrawn: 'Retirada',
    },
    pendingDecisions: '{{count}} aguardando',
    request: {
      approve: 'Aprovar',
      commentFor: '{{action}}: {{title}}',
      commentPlaceholder: 'Escreva algo…',
      newLine: 'para nova linha',
      quickSend: 'para enviar',
      reject: 'Recusar',
    },
    requestFailed: 'A solicitação falhou. Tente novamente.',
    resolved: 'Tratado',
    retry: 'Tentar novamente',
    unread: 'Não lidos',
    unreadCount: '{{count}} não lidos',
  },
  inboxButton: {
    title: 'Caixa de entrada',
    viewAll: 'Abrir a caixa',
    empty: 'Ainda não há mensagens',
    pending: 'Caixa de entrada, {{count}} pendentes',
    recent: 'Mensagens recentes',
    unread: 'Caixa de entrada, {{count}} não lidos',
  },
  nav: {
    inbox: 'Caixa de entrada',
  },
  common: { loading: 'Carregando' },
};

export default ptBR;
