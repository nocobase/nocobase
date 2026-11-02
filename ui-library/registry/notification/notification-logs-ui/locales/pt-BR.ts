import type { NotificationResource } from './en-US.js';

const ptBR: NotificationResource = {
  logs: {
    deliveryOperations: 'Operações de entrega',
    recipeDescription:
      'Rastreie cada transferência de canal e cada tentativa do provedor.',
    redacted:
      'Corpos de mensagens, destinatários e tokens de arrendamento são editados.',
    providerAttempts: 'Tentativas do provedor',
    eyebrow: 'Notificações',
    title: 'Registros de notificação',
    description:
      'Rastreie a entrega da notificação e cada tentativa do provedor. Os corpos das mensagens, os destinatários e os tokens de arrendamento são editados.',
    refreshing: 'Refrescante…',
    refresh: 'Atualizar',
    deliveriesShown: 'Entregas mostradas',
    needAttention: 'Precisa de atenção',
    unavailable: 'Registros indisponíveis',
    recent: 'Notificações recentes',
    loading: 'Carregando histórico de entrega…',
    emptyTitle: 'Nenhuma entrega ainda',
    emptyDescription:
      'Os registros de entrega aparecerão aqui após o envio das notificações.',
    expand: 'Expandir notificação',
    collapse: 'Recolher notificação',
    noDeliveries: 'Nenhuma entrega registrada.',
    noAttempts: 'Nenhuma tentativa registrada.',
    columns: {
      source: 'Fonte',
      notificationId: 'ID de notificação',
      status: 'Status',
      deliveries: 'Entregas',
      created: 'Criado',
      channel: 'Canal',
      provider: 'Provedor',
      attempts: 'Tentativas',
      updated: 'Atualizado',
    },
  },
  status: {
    pending: 'pendente',
    processing: 'processamento',
    completed: 'concluído',
    partial: 'parcial',
    failed: 'falhou',
    unknown: 'desconhecido',
    preparing: 'preparando',
    submitting: 'enviando',
    retrying: 'tentando novamente',
    accepted: 'aceito',
  },
  errors: {
    requestFailed: 'Falha na solicitação de notificação.',
    inAppRecipientNotFound:
      'O destinatário da notificação no aplicativo não existe.',
  },
};

const resource: { notificationLogs: NotificationResource } = {
  notificationLogs: ptBR,
};
export default resource;
