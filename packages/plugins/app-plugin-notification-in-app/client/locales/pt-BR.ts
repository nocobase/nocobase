import type { InAppNotificationClientResource } from './en-US.js';

const ptBR: InAppNotificationClientResource = {
  common: {
    loading: 'Carregando',
  },
  inbox: {
    actions: {
      delete: 'Excluir',
      read: 'Marcar como lida',
      unread: 'Marcar como não lida',
    },
    actionsFor: 'Ações para {{title}}',
    allRead: 'Tudo marcado como lido.',
    back: 'Voltar à lista',
    cancel: 'Cancelar',
    categories: 'Categorias',
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
    emptyAll: 'Nada aqui',
    emptyDescription:
      'Notificações e solicitações enviadas a você aparecem aqui.',
    filters: 'Filtros da caixa de entrada',
    forbidden: 'Você não tem permissão para fazer isso.',
    keyMove: 'Mover',
    keyOpen: 'Abrir',
    kinds: {
      all: 'Todos os tipos',
      decision: 'Decisões',
      info: 'Anteriores',
      label: 'Tipo',
      today: 'Hoje',
    },
    detailsUnavailable:
      'Alguns detalhes da caixa de entrada não puderam ser carregados.',
    loadFailed: 'Não foi possível carregar a caixa de entrada',
    loadFailedDescription: 'Verifique sua conexão e tente novamente.',
    loadMore: 'Carregar mais',
    loading: 'Carregando',
    noMatchDescription: 'Limpe o filtro para ver todos os tipos.',
    nothingSelected: 'Selecione um item para visualizá-lo',
    notification: 'Notificação',
    open: 'Abrir',
    outcomes: {
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      withdrawn: 'Retirado',
    },
    pendingDecisions: '{{count}} aguardando',
    readAll: 'Marcar tudo como lido',
    request: {
      approve: 'Aprovar',
      commentFor: '{{action}}: {{title}}',
      commentPlaceholder: 'Escreva algo…',
      newLine: 'para nova linha',
      quickSend: 'para enviar',
      reject: 'Rejeitar',
    },
    requestFailed: 'A solicitação falhou. Tente novamente.',
    resolved: 'Tratado',
    retry: 'Tentar novamente',
    tabs: {
      decision: 'Pendente',
      info: 'Anteriores',
      today: 'Hoje',
    },
    title: 'Caixa de entrada',
    unread: 'Não lidas',
    unreadCount: '{{count}} não lidas',
    views: {
      all: 'Tudo',
      todo: 'Pendente',
      unread: 'Não lidas',
    },
  },
  inboxButton: {
    empty: 'Nenhuma mensagem ainda',
    pending: 'Caixa de entrada, {{count}} aguardando',
    recent: 'Mensagens recentes',
    title: 'Caixa de entrada',
    unread: 'Caixa de entrada, {{count}} não lidas',
    viewAll: 'Abrir a caixa',
  },
  nav: {
    inbox: 'Caixa de entrada',
  },
};

export default ptBR;
