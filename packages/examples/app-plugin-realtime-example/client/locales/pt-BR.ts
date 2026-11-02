import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  business: {
    scenarios: 'Cenários em tempo real',
    tabs: {
      tasks: 'Tarefas',
      inbox: 'Caixa de entrada',
      exports: 'Exportações',
      lab: 'Laboratório de capacidade',
    },
    assignee: 'Responsável atribuído',
    creator: 'Criado por',
    updated: 'Última atualização',
    statusLabel: 'Status',
    detail: 'Detalhes da tarefa',
    saving: 'Salvando…',
    saved: 'Status da tarefa atualizado',
    updating: 'Atualizando…',
    previous: 'Anterior',
    next: 'Próximo',
    close: 'Fechar',
    cancel: 'Cancelar',
    create: 'Criar',
    created: 'Tarefa criada "{{title}}"',
    status: {
      open: 'Fazer',
      'in-progress': 'Em andamento',
      done: 'Concluído',
    },
    actions: {
      'in-progress': 'Iniciar',
      done: 'Concluído',
      open: 'Reabrir',
    },
    form: {
      help: 'Descreva o trabalho e escolha quem deverá cuidar dele.',
      title: 'Título',
      description: 'Descrição',
      choose: 'Escolha um cessionário',
      titleRequired: 'Insira um título de 1 a 200 caracteres.',
      descriptionRequired: 'Descreva o que precisa ser feito.',
      assigneeRequired: 'Escolha um destinatário ativo.',
    },
    errors: {
      session: 'Sua sessão terminou. Faça login novamente.',
      forbidden:
        'Você não tem mais acesso a esta tarefa. Feche-o e verifique com seu criador.',
      missing:
        'Este registro não existe mais. Feche-o ou retorne à lista atual.',
      failed: 'A solicitação falhou. Por favor, tente novamente.',
      active: 'Uma exportação ainda está em andamento. Espere terminar.',
    },
    read: 'Ler',
    unread: 'Não lido',
    markRead: 'Marcos lidos',
    markUnread: 'Marcar como não lido',
    markedRead: 'Notificação marcada como lida',
    markedUnread: 'Notificação marcada como não lida',
    loadMore: 'Carregar mais',
    jobs: {
      queued: 'Na fila',
      running: 'Exportação',
      completed: 'Pronto para download',
      failed: 'Falha',
    },
    tasks: {
      title: 'Colaboração de tarefas',
      description:
        'Atribua o trabalho e acompanhe seu progresso juntos em tempo real.',
      try: 'Experimente duas janelas: crie uma tarefa aqui, depois observe-a aparecer e alterar o status na outra janela. Somente as tarefas que você criou ou foram atribuídas ficam visíveis.',
      create: 'Nova tarefa',
      empty: 'Nenhuma tarefa ainda',
      emptyHelp:
        'Crie uma tarefa real, atribua-a a você ou a um colega e siga-a aqui.',
      stageEmpty: 'Nenhuma tarefa nesta fase nesta página',
      page: 'Página {{page}} · Total de tarefas {{count}}. As colunas mostram até 30 tarefas nesta página.',
    },
    inbox: {
      title: 'Caixa de entrada pessoal',
      description:
        'Receba atribuições de tarefas e atualizações e mantenha o status de leitura sincronizado nas janelas.',
      try: 'Atribua uma tarefa a si mesmo para receber uma notificação. Para colaboração, use outra conta: as atualizações notificam os outros participantes. Esta caixa de entrada inclui todas as notificações do seu aplicativo.',
      empty: 'Nenhuma notificação ainda',
      emptyHelp:
        'Crie uma tarefa atribuída a você mesmo em Tarefas e depois volte aqui.',
    },
    exports: {
      missing:
        'Este arquivo de exportação não está mais disponível. Crie uma nova exportação para baixar suas tarefas atuais.',
      title: 'Exportações de tarefas',
      description:
        'Exporte suas tarefas visíveis em segundo plano e baixe o CSV resultante.',
      try: 'Inicie uma exportação, troque de página e retorne para fazer o download. Outra janela segue o mesmo trabalho. O progresso conta linhas reais; uma pequena exportação pode terminar imediatamente.',
      create: 'Exportar tarefas',
      empty: 'Nenhuma exportação ainda',
      emptyHelp:
        'Gere um instantâneo CSV de suas tarefas, incluindo suas descrições, status e responsáveis.',
      accepted: 'Exportação iniciada',
      active:
        'Uma exportação está em andamento. Você pode sair desta página e voltar mais tarde.',
      file: 'CSV de tarefas',
      rows: 'Linhas {{processed}}/{{total}} processadas',
      progress: 'Progresso da exportação',
      limit:
        'A exportação ultrapassa 5.000 tarefas. Este exemplo suporta no máximo 5.000 linhas por exportação.',
      failed:
        'A exportação falhou. Use tarefas de exportação para iniciar uma nova tentativa.',
      download: 'Baixar',
      downloaded: 'Download de CSV iniciado',
      retention:
        'Suas últimas 20 exportações são retidas. Cada arquivo é um instantâneo das tarefas que você pode acessar quando foi gerado.',
    },
  },
  routeOverlay: {
    close: 'Fechar',
  },
  title: 'Exemplos em tempo real',
  description:
    'Explore assinaturas, controle de acesso e recuperação com eventos ao vivo e instantâneos observáveis.',
  scope:
    'Os valores de demonstração pertencem à sua conta, permanecem apenas neste processo e são redefinidos após uma hora de inatividade ou reinicialização do servidor.',
  account: 'Conta corrente',
  loading: 'Carregando',
  working: 'Trabalhando…',
  retry: 'Tentar novamente',
  reload: 'Demonstração de recarga',
  signIn: 'Faça login novamente',
  cancel: 'Cancelar',
  connection: 'Conexão',
  subscription: 'Assinatura',
  events: 'Eventos recebidos',
  ready: 'Agradecimentos',
  snapshot: 'Instantâneo observado',
  reads: 'Leituras de instantâneo concluídas',
  readAt: 'Última leitura bem-sucedida',
  waiting: 'Esperando pelo primeiro evento…',
  none: 'Ainda não disponível',
  topic: 'Tópico',
  receipt: 'Recibo da última publicação',
  pause: 'Pausar assinatura',
  resume: 'Retomar assinatura',
  reconnect: 'Reconectar',
  states: {
    idle: 'Inativo',
    connecting: 'Conectando',
    open: 'Abrir',
    reconnecting: 'Reconectando',
    closed: 'Fechado',
    pending: 'Pendente',
    subscribing: 'Assinando',
    subscribed: 'Inscrito',
    error: 'Erro',
  },
  clock: {
    title: '1. Tópico público e gancho React',
    description:
      'useRealtimeTopic assina o relógio público. Pausar libera o relógio deste card.',
    latest: 'Último horário do servidor',
    paused: 'Este cartão está pausado. Retome para receber novos ticks.',
    initial:
      'O relógio começa a publicar quando seu primeiro assinante é reconhecido.',
  },
  personal: {
    title: '2. Eventos pessoais',
    description:
      'publishFor segmenta sua conta. Outra aba desta conta recebe o evento; outra conta não.',
    send: 'Enviar para minha conta',
    empty: 'Nenhum evento pessoal ainda. Envie um para observar a entrega.',
    recovery:
      'onReady lê o instantâneo pessoal mais recente após cada confirmação.',
  },
  room: {
    title: '3. Autorização dinâmica de recursos',
    description:
      'Esta sala usa a mesma política de proprietário e acesso para leituras HTTP e entrega em tempo real.',
    allowed: 'Acesso concedido',
    denied: 'Acesso negado',
    grant: 'Conceder acesso',
    revoke: 'Revogar acesso',
    retry: 'Tentar novamente assinatura',
    send: 'Publicar alteração de sala',
    grantHint: 'Conceda acesso e tente novamente a assinatura negada.',
    retryHint:
      'O acesso é concedido. Tente novamente para obter uma nova confirmação.',
    revokeTitle: 'Revogar o acesso à sua sala de demonstração?',
    revokeDescription:
      'As assinaturas existentes perdem o acesso e apagam o instantâneo da sala. Você pode conceder acesso novamente.',
    blocked: 'O instantâneo da sala fica oculto enquanto o acesso é negado.',
    success: 'Acesso à sala atualizado',
  },
  counter: {
    title: '4. Atualização e atualização consolidadas',
    description:
      'Cinco invalidações atualizam um contador. useRealtimeRefresh une leituras; compare os aumentos de contagem após a preparação inicial.',
    burst: 'Publicar 5 alterações',
    pause: 'Pausar atualização ao vivo',
    resume: 'Retomar atualização ao vivo',
    paused:
      'A atualização do instantâneo está pausada; o observador de eventos permanece ativo. Publique novamente e retome para se atualizar.',
    running:
      'A atualização do instantâneo está ativa. As guias ocultas são atualizadas quando ficam visíveis novamente.',
    refreshing: 'Atualizando instantâneo…',
    note: 'Este valor vem apenas da leitura API, nunca da resposta da publicação.',
  },
  unknown: {
    title: '5. Erros de assinatura',
    description:
      'Um tópico não declarado é rejeitado sem interromper os tópicos permitidos.',
    try: 'Tente um tópico desconhecido',
    explanation:
      'TOPIC_NOT_FOUND é esperado aqui. O servidor deve declarar um tópico antes que ele possa ser assinado.',
    initial: 'Inicia a tentativa de observar um erro real de protocolo.',
  },
  recovery: {
    title: '6. Recuperação de conexão',
    description:
      'Desconecte os soquetes locais desta conta, incluindo outras guias. O cliente se reconecta automaticamente e onReady busca novamente as alterações perdidas.',
    disconnect: 'Simular desconexão',
    history: 'Estados de conexão recentes',
    note: 'Reconectar na parte superior reabre a conexão do aplicativo compartilhado. Os eventos são transitórios: os instantâneos recuperam o estado sem reprodução.',
    instruction:
      'Publicar alterações de outra aba. Retome uma atualização pausada para recuperar o atraso; reconectar recupera instantâneos enquanto a atualização está ativa.',
    disconnected: 'Soquetes em tempo real desconectados',
  },
  published: 'Publicação aceita',
  errors: {
    request: 'A solicitação falhou. Tente novamente.',
    session: 'Sua sessão terminou. Faça login novamente.',
    forbidden: 'Acesso negado. Verifique suas permissões atuais.',
    expired: 'A demonstração expirou. Recarregue-o para criar uma nova sala.',
    capacity: 'A manifestação está ocupada. Tente novamente mais tarde.',
    subscription:
      'A assinatura falhou. Reconecte ou tente novamente após o acesso ser restaurado.',
  },
};

export default ptBR;
