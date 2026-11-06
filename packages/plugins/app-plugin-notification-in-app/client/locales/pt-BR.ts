import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  inbox: {
    eyebrow: 'Caixa de entrada pessoal',
    title: 'Centro de mensagens',
    unreadCount: '{{count}} não lido',
    description:
      'Atualizações dos aplicativos e fluxos de trabalho que você usa.',
    markAllRead: 'Marcar tudo como lido',
    messagesTitle: 'Mensagens',
    messagesDescription:
      'As mensagens no aplicativo mantêm um estado de leitura independente para o usuário atual.',
    unreadFilter: 'Não lido',
    unavailable: 'Caixa de entrada indisponível',
    retry: 'Tentar novamente',
    loading: 'Carregando notificações…',
    emptyTitle: 'Vocês estão todos atualizados',
    emptyDescription: 'Novas notificações aparecerão aqui.',
    loadingMore: 'Carregando…',
    loadMore: 'Carregar mais',
    scrollMore: 'Role para baixo para carregar mais',
    noMore: 'Não há mais mensagens',
    expand: 'Mostrar mais',
    collapse: 'Mostrar menos',
    channel: 'No aplicativo',
    open: 'Abrir',
    markUnread: 'Marcar como não lido',
    markRead: 'Marcos lidos',
    delete: 'Excluir notificação',
    errors: {
      update: 'Falha na atualização da caixa de entrada.',
      loadMore: 'Não foi possível carregar mais notificações.',
      markAllRead: 'Não foi possível marcar as notificações como lidas.',
    },
  },
};

export default ptBR;
