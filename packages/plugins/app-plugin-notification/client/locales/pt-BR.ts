import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  templates: {
    title: 'Modelos de notificação',
    coverage:
      'Notificações que o sistema envia automaticamente e como elas são. Notificações enviadas por fluxos de trabalho ou código personalizado podem não aparecer aqui. Esta página é somente para leitura.',
    filters: 'Filtrar modelos',
    search: 'Pesquisar modelos',
    category: 'Categoria',
    channel: 'Canal',
    all: 'Todos',
    details: 'Detalhes do modelo',
    close: 'Fechar',
    providedBy: 'Fornecido por {{name}}',
    trigger: 'Quando é enviado',
    recipients: 'Quem recebe',
    businessRule: 'Condições de envio',
    languagePolicy: 'Idioma',
    combined:
      'Uma única mensagem contém todos os idiomas ({{languages}}). Todos os destinatários recebem o mesmo conteúdo.',
    singleLocale: 'Enviado somente em {{language}}.',
    status: 'Canais de envio',
    statusHelp:
      'Mostra se cada canal está configurado. Não testa a conexão nem confirma que as mensagens são entregues.',
    configured: 'Configurado',
    unconfigured: 'Não configurado',
    enabled: 'Ativado',
    disabled: 'Desativado',
    variables: 'Variáveis',
    variablesHelp:
      'Marcadores substituídos por valores reais quando a notificação é enviada.',
    language: 'Idioma',
    synthetic:
      'Usa dados de exemplo fictícios. A pré-visualização nunca envia notificações.',
    definition: 'Modelo com variáveis',
    preview: 'Pré-visualização',
    html: 'Versão HTML (exibida como código)',
    technical: 'Detalhes técnicos',
    templateId: 'ID do modelo',
    package: 'Pacote',
    channelNames: 'Nomes dos canais',
    channelTypes: {
      inApp: 'Mensagem no aplicativo',
      email: 'E-mail',
    },
    loading: 'Carregando…',
    failed: 'Não foi possível carregar os modelos.',
    forbidden: 'Você não tem permissão para ver os modelos de notificação.',
    notFound: 'Este modelo não existe mais.',
    retry: 'Tentar novamente',
    empty: 'Ainda não há modelos de notificação.',
    noResults: 'Nenhum modelo corresponde a estes filtros.',
  },
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

export default ptBR;
