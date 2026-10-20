import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  navigation: {
    mailExample: 'Exemplo de correio',
    workspace: 'Caixa de entrada e redação',
    accounts: 'Contas',
    allMail: 'Todas as correspondências',
    activity: 'Enviar atividade',
    syncLogs: 'Sincronizar registros',
  },
  workspace: {
    title: 'Caixa de entrada e redação',
    description:
      'Leia exemplos de mensagens, inspecione anexos, responda ou redija uma nova mensagem. O Provedor simulado aceita envios sem entrar em contato com um serviço de correio externo.',
  },
  activity: {
    title: 'Enviar atividade',
    description:
      'Revise os registros de entrega criados pelo fluxo de envio normal do Mail. O provedor simulado simula a aceitação e o Mail armazena a mensagem na pasta local Enviados.',
    subject: 'Assunto',
    recipients: 'Destinatários',
    account: 'Enviando conta',
    status: 'Status',
    created: 'Enviado',
    noSubject: '(sem assunto)',
    loadFailed: 'Não foi possível carregar a atividade de envio.',
    emptyTitle: 'Nenhuma atividade de envio ainda',
    emptyDescription:
      'Envie uma mensagem de amostra do espaço de trabalho para ver o resultado da entrega simulada aqui.',
    statuses: {
      pending: 'Pendente',
      submitting: 'Envio',
      accepted: 'Aceito (simulado)',
      failed: 'Falha',
      unknown: 'Desconhecido',
      cancelled: 'Cancelado',
    },
  },
  providers: {
    demo: 'Gmail (simulado)',
    'demo-microsoft': 'Microsoft 365 (simulado)',
    'demo-imap-smtp': 'IMAP/SMTP (simulado)',
  },
  accounts: {
    title: 'Contas de caixa de correio',
    description: 'Preparando as caixas de correio de amostra e suas mensagens.',
  },
  allMail: {
    title: 'Todas as correspondências',
    description:
      'Navegue pelos e-mails importados das caixas de correio simuladas, pesquise por palavra-chave e inspecione a conta de cada mensagem, leia o estado, a estrela e os metadados do anexo.',
    listTitle: 'Lista de mensagens',
    resultCount: 'Mensagens {{count}}',
    pageCount: 'Página {{page}} de {{pages}}',
    searchLabel: 'Pesquisar e-mail',
    searchPlaceholder: 'Pesquisar assunto, remetente ou conteúdo da mensagem',
    search: 'Pesquisar',
    account: 'Conta',
    from: 'De',
    subject: 'Assunto e visualização',
    flags: 'Estado da mensagem',
    date: 'Recebido',
    unread: 'Não lido',
    starred: 'Estrelado',
    attachment: 'Anexo',
    previous: 'Anterior',
    next: 'Próximo',
    emptyTitle: 'Nenhuma mensagem encontrada',
    emptyDescription:
      'Tente outra palavra-chave ou limpe a pesquisa para visualizar todas as mensagens simuladas.',
    loadFailed: 'Não foi possível carregar todos os emails.',
  },
  syncLogs: {
    title: 'Sincronizar registros',
    description:
      'Revise o histórico e as execuções de sincronização incremental para as três caixas de correio simuladas, incluindo status, fase, contagens processadas e erros.',
    account: 'Conta de caixa postal',
    mode: 'Modo de sincronização',
    status: 'Status',
    phase: 'Fase',
    progress: 'Progresso',
    started: 'Iniciado',
    completed: 'Concluído',
    error: 'Erro',
    unknownAccount: 'Conta desconhecida',
    empty:
      'Nenhuma sincronização foi executada ainda. Inicie uma sincronização na página de contas.',
    loadFailed: 'Não foi possível carregar os logs de sincronização.',
    pageCount: 'Página {{page}} de {{pages}} · {{total}} é executado',
    messages: 'Mensagens {{count}} processadas',
    batches: 'Lotes {{count}}',
    modes: {
      initial: 'Sincronização inicial',
      incremental: 'Sincronização incremental',
    },
    statuses: {
      pending: 'Pendente',
      running: 'Em execução',
      completed: 'Concluído',
      partial: 'Parcial',
      failed: 'Falha',
      cancelled: 'Cancelado',
    },
    phases: {
      preparing: 'Preparação',
      history: 'Histórico de mensagens',
      catchUp: 'Alcançando',
      incremental: 'Atualizações incrementais',
      completed: 'Concluído',
    },
  },
  demo: {
    noPreview: 'Nenhuma prévia disponível.',
    preparing: 'Preparando dados de caixa de correio de demonstração…',
    retry: 'Tentar configurar novamente',
    openWorkspace: 'Abrir espaço de trabalho de correio',
    refresh: 'Atualizar',
    loading: 'Carregando…',
  },
};

export default ptBR;
