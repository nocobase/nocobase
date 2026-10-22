import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  modelSuggestions: {
    design:
      'Design, arquitetura, investigação de problemas complexos e revisão de alterações importantes.',
    routine:
      'Implementações com escopo claro, pequenas correções, testes e redação.',
    small: 'Alterações pequenas e mecânicas, rápidas e econômicas.',
    explanation:
      'Compreensão de requisitos e redação de propostas e explicações.',
    large: 'Implementações maiores, alterações entre pacotes e refatoração.',
    review: 'Revisão de código e análise de falhas de CI.',
  },
  actions: {
    back: 'Voltar',
    cancel: 'Cancelar',
    close: 'Fechar',
    delete: 'Excluir',
    edit: 'Editar',
    save: 'Salvar',
  },
  common: {
    refresh: 'Atualizar',
    cancel: 'Cancelar',
    copy: 'Copiar',
    copied: 'Copiado',
    save: 'Salvar',
    close: 'Fechar',
    create: 'Criar',
    createNamed: 'Criar "{{name}}"',
    creating: 'Criando…',
    noOptions: 'Sem opções',
    forbidden: 'Você não tem permissão para fazer isso.',
    loading: 'Carregando',
    notFound: 'Já não existe.',
    requestFailed: 'A solicitação falhou. Tente novamente.',
    retry: 'Tentar novamente',
    secretKept: 'Definir — deixe em branco para mantê-lo',
  },
  status: {
    loading: 'Carregando',
  },
  unsavedChanges: {
    description: 'O que você digitou não foi enviado e será perdido.',
    discard: 'Descartar',
    keepEditing: 'Continue editando',
    title: 'Descartar alterações não salvas?',
  },
  errors: {
    TOOLS_REFRESH_UNSUPPORTED:
      'Este runner não permite atualizar o status. Reinicie-o.',
    RUNNER_REFRESH_UNAVAILABLE:
      'Não é possível atualizar o status de um runner revogado.',
    CONFLICT: 'Entretanto mudou. Recarregue e tente novamente.',
    REVISION_CONFLICT: 'Entretanto mudou. Recarregue e tente novamente.',
    FORBIDDEN: 'Você não tem permissão para fazer isso.',
    AGENT_NOT_FOUND: 'Já não existe.',
    RUN_NOT_FOUND: 'Já não existe.',
    SKILL_NOT_FOUND: 'Já não existe.',
    SKILL_VERSION_NOT_FOUND: 'Já não existe.',
    CONVERSATION_NOT_FOUND: 'Já não existe.',
    RUNNER_NOT_FOUND: 'Já não existe.',
    VARIABLE_NOT_FOUND: 'Já não existe.',
    MODEL_SERVICE_NOT_FOUND: 'Já não existe.',
    SCOPE_NOT_FOUND: 'Já não existe.',
    INVALID_INPUT: 'Alguns valores não são válidos.',
    SECRETS_KEY_MISSING:
      'Variáveis ​​não podem ser salvas ou mostradas: o servidor não possui chave secreta. Peça a um administrador para definir secrets.keys na configuração do aplicativo.',
  },
  command: {
    copy: 'Copiar comando',
    copied: 'Copiado',
    copyFailed:
      'Não foi possível copiar. Selecione o comando e copie-o você mesmo.',
  },
  tools: {
    claude: 'Claude Code',
    codex: 'Codex',
    opencode: 'OpenCode',
    pi: 'Pi',
  },
  agents: {
    title: 'Agentes',
    description:
      'Cada ferramenta de codificação e modelo que um executor relata é um agente. O gerente de projeto entrega cada etapa de um problema ao agente cuja descrição se ajusta a ele.',
    fromRunners: 'Agentes de executores',
    discovery: {
      selectAll: 'Selecionar todos os resultados',
      selectFirst: 'Selecione os primeiros resultados {{limit}}',
      selectionCount: 'Grupos {{count}}/{{limit}} selecionados',
      clearSelection: 'Limpar seleção',
      new: 'Novas descobertas ({{count}})',
      ignored: 'Ignorado ({{count}})',
      search: 'Pesquisar modelos ou provedores',
      select: 'Selecione {{name}}',
      ignore: 'Ignorar',
      restore: 'Restaurar',
      ignoreSelected: 'Ignorar selecionado',
      restoreSelected: 'Restaurar selecionado',
      enabled: 'Mostrar ativado',
      disabled: 'Mostrar desabilitado',
      provider: 'Provedor e executor',
      saved: 'Preferências de descoberta salvas',
    },
    filterLabel: 'Mostrar agentes',
    filters: {
      all: 'Todos {{count}}',
      enabled: '{{count}} habilitado',
      pending: 'Para habilitar {{count}}',
      unreported: 'Nenhum executor {{count}}',
    },
    loadFailed: 'Não foi possível carregar os agentes',
    emptyTitle: 'Nenhum agente ainda',
    emptyDescription:
      'Conecte um executor com uma ferramenta de codificação conectada: cada um de seus modelos aparece aqui como um agente a ser habilitado.',
    noneInFilter: 'Nenhum agente aqui.',
    howToAdd:
      'Para adicionar um agente, instale uma ferramenta de codificação em um executor e entre em um modelo que você possa usar: assim que o executor relatar isso, ele aparecerá aqui, e você o habilita escrevendo no que ele é bom. Um agente que apenas executores pessoais trabalha apenas nas questões iniciadas por seus proprietários.',
    goodAtMissing: 'Ainda não escrito',
    columns: {
      agent: 'Agente',
      goodAt: 'Bom em',
      where: 'Onde funciona',
      effort: 'Esforço de raciocínio',
      state: 'Status',
    },
    where: {
      none: 'Sem executor',
      team_one: 'Executor da equipe {{count}}',
      team_other: 'Executores da equipe {{count}}',
      personal_one: 'Executor pessoal {{count}} online',
      personal_other: 'Executores pessoais {{count}} online',
      both: 'Equipe {{team}} · Pessoal {{personal}}',
      names: '{{names}}',
      noneOnline: 'Nenhum executor online agora',
      personalOnly: 'Somente executores pessoais',
      lastReported: 'Último relatório {{when}}',
      team_many: 'Executores da equipe {{count}}',
      personal_many: 'Executores pessoais {{count}} online',
    },
    state: {
      enabled: 'Habilitado',
      pending: 'Para habilitar',
      disabled: 'Desabilitado',
      unreported: 'Sem executor',
    },
    effort: {
      default: 'Padrão da ferramenta',
      off: 'Desligado',
      minimal: 'Mínimo',
      low: 'Baixo',
      medium: 'Médio',
      high: 'Alto',
      xhigh: 'Extra alto',
      max: 'Máx.',
      ultra: 'Ultra',
    },
    enable: {
      button: 'Preencha e ative',
      buttonFor: 'Preencha e habilite {{name}}',
      title: 'Habilitar {{name}}',
      reportedBy_one: 'Relatado pelo executor {{count}} online: {{names}}.',
      reportedBy_other: 'Relatado por executores {{count}} online: {{names}}.',
      noRunnerNow: 'Nenhum executor que o tenha está online agora.',
      goodAtHint:
        'O gerente do projeto decide o que entregar a este agente com estas palavras. Diga o que é adequado e o que não é.',
      goodAtRequired: 'Escreva em que ele é bom antes de ativá-lo.',
      effortHint:
        'O gerente de projeto não pode alterá-lo quando entrega o trabalho.',
      personalOnly:
        'Apenas os executores pessoais o possuem: o gerente do projeto entrega o trabalho apenas nas questões que seus proprietários iniciam.',
      submit: 'Habilitar',
      done: '{{name}} está habilitado',
      reportedBy_many: 'Relatado por executores {{count}} online: {{names}}.',
    },
    edit: {
      button: 'Editar',
      buttonFor: 'Editar {{name}}',
      title: 'Editar {{name}}',
      enabled: 'Habilitado',
      done: '{{name}} salvo',
    },
  },
  agentTypes: {
    label: 'Tipo de agente',
    question: 'Que tipo de agente?',
    online: 'On-line',
    runner: 'Executor',
    onlineHint:
      'Respostas em segundos no servidor através de um serviço modelo. Não é necessário tempo de execução; não pode tocar no código.',
    runnerHint:
      'Aciona uma ferramenta de codificação em tempo de execução e funciona em um diretório de trabalho: código, arquivos, comandos.',
    immutable:
      'Um agente mantém seu tipo; crie outro agente para o outro tipo.',
    onServer: 'No servidor',
    filterAll: 'Todos os tipos',
    noneOfType: 'Nenhum agente deste tipo.',
  },
  agentSkills: {
    title: 'Habilidades',
    description:
      'Manuais que o agente lê quando uma tarefa corresponde à sua descrição. Colocado em seu diretório de trabalho antes de cada execução.',
    manage: 'Gerenciar habilidades',
    placeholder: 'Selecionar habilidades',
    empty: 'Nenhuma habilidade ainda.',
    save: 'Salvar habilidades',
    descriptionOnline:
      'Manuais que o agente lê quando uma tarefa corresponde à sua descrição, em uma sandbox somente leitura no servidor.',
    onlineScripts:
      'Os scripts não são executados para agentes online: o agente pode lê-los, não executá-los.',
    skippedScripts: ': {{paths}}',
    pathSeparator: ', ',
  },
  brief: {
    preview: 'Pré-visualização do prompt completo',
    previewTitle: 'Pré-visualização do prompt completo',
    previewDescription:
      'Que série deste agente seria enviada agora, sobre um assunto inventado. Nada está na fila.',
    scenario: 'Cenário',
    sample:
      'Sobre um assunto inventado: {{subject}}. Os valores marcados como [amostra] são compostos.',
    previewFailed: 'Não foi possível renderizar o prompt completo.',
    system: 'Solicitação do sistema',
    showAs: 'Mostrar como',
    rendered: 'Renderizado',
    raw: 'Cru',
    platform:
      'Regras e tarefas da plataforma · sobre caracteres {{size}} (Inglês)',
    platformNote:
      'As regras da plataforma são enviadas em inglês; o agente ainda responde no seu idioma.',
    agentPrompt: 'Solicitação do agente (escrita por você)',
    noAgentPrompt: 'Este agente não possui prompt próprio.',
    firstMessage: 'Primeira mensagem',
    empty: 'Vazio',
    previewPlaceholders:
      'As notas entre colchetes sobre o tempo de execução são preenchidas pelo tempo de execução que o executa: seus diretórios de trabalho e os prompts de inicialização dos diretórios que ele acabou de preparar.',
    placeholders:
      'Os espaços reservados {{runner.…}} são preenchidos pelo tempo de execução que o executa: seus diretórios de trabalho e os prompts de inicialização dos diretórios que ele acabou de preparar.',
    layers: {
      system: 'Regras',
      task: 'Tarefa',
      context: 'Contexto',
      agent: 'Solicitação do agente',
      turn: 'Primeiro turno',
    },
  },
  envVars: {
    title: 'Variáveis de ambiente',
    description:
      'Passado para a ferramenta de codificação em cada execução e mascarado nos registros de execução; os valores não são mostrados novamente após salvar. Qualquer pessoa que utilize um agente compartilhado pode receber esses valores em seu próprio computador; marque segredos de alto risco como "Somente tempos de execução da equipe".',
    add: 'Adicionar variável',
    addTitle: 'Adicionar variável de ambiente',
    editTitle: 'Substituir {{name}}',
    writeOnly:
      'O valor é armazenado criptografado e substitui o valor anterior.',
    name: 'Nome',
    nameHint: 'Letras maiúsculas, dígitos e sublinhados.',
    value: 'Valor',
    valueTooLong: 'O valor é maior que 8 KB.',
    keepValueHint: 'Deixe em branco para manter o valor atual.',
    teamRunnersOnly: 'Somente tempos de execução de equipe',
    teamRunnersOnlyHint:
      'Sem ele, uma execução envia o valor para o tempo de execução que o utiliza, incluindo o tempo de execução pessoal de qualquer pessoa que possa usar o agente. Com ele, apenas um tempo de execução de equipe realiza execuções que obtenham essa variável.',
    teamRunnersOnlyBadge: 'Somente tempos de execução de equipe',
    fromRunner: 'Extrair do tempo de execução',
    fromRunnerHint:
      'Nenhum valor é mantido aqui: o tempo de execução que realiza uma execução o fornece a partir de sua própria máquina, ali configurada com `{{command}}` ou passada com `--pass-env`. Um tempo de execução que não fornece falha na execução antes de iniciar.',
    fromRunnerBadge: 'Do tempo de execução',
    valueRequired:
      'Insira um valor ou continue extraindo-o do tempo de execução.',
    empty: 'Sem variáveis ​​de ambiente.',
    scope: 'Escopo',
    updated: 'Atualizado',
    actionsHead: 'Ações',
    edit: 'Substituir valor',
    actions: 'Ações para {{name}}',
    accessLog: 'Registro de acesso',
    accessLogAll: 'Ver o log de acesso completo',
    accessLogOf: 'Log de acesso de {{name}}',
    accessLogDescription:
      'Quem visualizou, definiu ou excluiu as variáveis ​​e quando, e quais execuções as receberam.',
    delete: 'Excluir',
    deleteTitle: 'Excluir {{name}}?',
    deleteDescription: 'As execuções posteriores não recebem mais a variável.',
    deleteConfirm: 'Excluir',
    deleted: '{{name}} excluído.',
    saved: '{{name}} salvo.',
    updatedBy: '{{name}} · {{time}}',
    reveal: 'Revelar valores',
    revealTitle: 'Revelar os valores?',
    revealAudit:
      'A revelação fica registrada no log de acesso com seu nome e horário.',
    revealedTitle: 'Valores de variáveis',
    revealedNote: 'Esta revelação foi gravada. Feche-o quando terminar.',
    runner: 'Tempo de execução {{id}}',
    auditsEmpty: 'Nada registrado ainda.',
    auditAction: {
      reveal: 'revelado',
      set: 'definir',
      delete: 'excluído',
      deliver: 'recebido para uma corrida',
    },
    nameProblems: {
      required: 'Digite um nome.',
      pattern:
        'Use apenas letras maiúsculas, dígitos e sublinhados, sem começar com dígito.',
      reserved: 'Este nome está reservado.',
      duplicate: 'Existe uma variável com este nome; edite-o.',
    },
  },
  scopeVariables: {
    title: 'Variáveis e segredos',
    description:
      'Dado a todos os agentes que trabalham aqui. Variáveis ​​mais específicas (de um diretório de trabalho e depois do agente) prevalecem sobre elas.',
  },
  scopes: {
    workdir: 'Diretório de trabalho',
  },
  subjects: {
    conversation: 'Conversa',
    consultation: 'Consulta',
  },
  usage: {
    otherUse: {
      title: 'Outro uso de modelo',
      description:
        'Chamadas de modelo fora das execuções do agente, como indexação e pesquisa na base de conhecimento.',
      purpose: 'Uso',
      source: 'Perguntado por',
      model: 'Modelo',
      calls: 'Chamadas',
      units: 'Itens',
      purposes: {
        embedding: 'Incorporações',
        rerank: 'Reclassificação',
        text: 'Texto utilitário',
      },
    },
    title: 'Uso',
    description:
      'Quais execuções de agentes são usadas e quanto custam nos preços do modelo atual.',
    loadFailed: 'Não foi possível carregar o uso',
    groupBy: 'Agrupar por',
    groupByValue: 'Agrupar por {{group}}',
    empty: 'Não há corridas neste período.',
    total: 'Total',
    noGroup: 'Nenhum',
    unknown: 'Desconhecido',
    onlineTool: 'Online (serviços modelo)',
    setPrices: 'Definir preços',
    chart: {
      title: 'Tendência diária',
      metric: 'Mostrar',
      cost: 'Custo',
      tokens: 'Fichas',
      total: 'Total',
      other: 'Outros',
    },
    pricedNote:
      'O custo cobre {{priced}} de execuções {{total}}; esses modelos ainda não têm preço: {{models}}.',
    filters: {
      allGroups: 'Todos: {{group}}',
      agent: 'Agente',
      allAgents: 'Todos os agentes',
      person: 'Acordado por',
      allPeople: 'Todos',
      range: 'Período',
      presets: 'Alcances rápidos',
    },
    presets: {
      last7: 'Últimos 7 dias',
      last30: 'Últimos 30 dias',
      thisMonth: 'Este mês',
      lastMonth: 'Mês passado',
      last90: 'Últimos 90 dias',
    },
    groups: {
      agent: 'Agente',
      person: 'Acordado por',
      group: 'Grupo',
      subject: 'Assunto',
      day: 'Dia',
      model: 'Modelo',
      tool: 'Ferramenta de codificação',
      type: 'Tipo de agente',
    },
    columns: {
      runs: 'Execuções',
      duration: 'Duração',
      input: 'Entrada',
      output: 'Saída',
      cacheRead: 'Leitura de cache',
      cacheWrite: 'Gravação em cache',
      cost: 'Custo estimado',
    },
  },
  defaultSkills: {
    title: 'Habilidades padrão',
    description:
      'Cada agente que trabalha aqui também adquire essas habilidades.',
    save: 'Salvar habilidades',
    saved: 'Habilidades padrão salvas.',
  },
  runs: {
    title: 'Registro de execução',
    empty: 'Ainda não há corridas.',
    loadFailed: 'Não é possível carregar o log de execução',
    unknownAgent: 'Agente',
    attempt: 'tentativa {{attempt}} de {{max}}',
    viewTranscript: 'Ver transcrição',
    transcriptTitle: 'Transcrição da execução',
    viewAll: 'Ver todos {{count}}',
    allTitle: 'Todas as execuções ({{count}})',
    filters: {
      agent: 'Agente',
      status: 'Status',
      allAgents: 'Todos os agentes',
      allStatuses: 'Todos os status',
    },
    noMatch: 'Nenhuma execução corresponde a esses filtros.',
    cancel: 'Parar',
    stopping: 'Parando…',
    cancelTitle: 'Parar esta corrida?',
    cancelDescription: '{{name}} será parado. O que já mudou fica.',
    cancelRequested: 'Parada solicitada',
    retry: 'Tentar novamente',
    retried: 'Execução enfileirada novamente',
    viewBrief: 'Ver prompt completo',
    briefTitle: 'Solicitação completa',
    briefDescription:
      'O que o agente foi informado quando esta corrida foi reivindicada pela última vez.',
    briefOf: 'Tentativa {{attempt}}, reivindicada {{time}}',
    briefUnavailable:
      'Nenhum prompt completo está disponível para esta execução.',
    processDataCleared:
      'Os dados do processo de execução foram apagados sob a política de retenção.',
    briefFailed: 'Não foi possível carregar o prompt completo',
    workspaceReset: {
      button: 'Limpar diretório de trabalho',
      title: 'Limpar o diretório de trabalho?',
      description:
        'A próxima execução começa com uma nova verificação e recebe novamente os prompts de inicialização. As alterações que não foram enviadas por push serão perdidas nesse tempo de execução. Um diretório usado no local nunca é excluído.',
      confirm: 'Limpar',
      done: 'A próxima execução começa com uma nova verificação.',
    },
    stateChanged: 'A execução mudou de estado. O log foi atualizado.',
    status: {
      queued: 'Na fila',
      dispatched: 'Despachado',
      running: 'Em execução',
      completed: 'Turno encerrado',
      failed: 'Falha',
      cancelled: 'Cancelado',
      cancelling: 'Parando',
    },
    trigger: {
      retry: 'Tentar novamente',
      message: 'Mensagem',
      consultation: 'Consulta',
    },
    activity: {
      queued: '{{name}} estava na fila',
      dispatched: '{{name}} está iniciando',
      running: '{{name}} começou a funcionar',
      completed: '{{name}} terminou seu turno',
      failed: '{{name}} falhou',
      cancelled: '{{name}} foi parado',
    },
    live: {
      working: '{{name}} está funcionando',
      workingFor: '{{name}} está funcionando · {{minutes}} min',
      queued: '{{name}} está na fila',
    },
  },
  transcript: {
    title: 'Transcrição da execução',
    notFound: 'Esta execução não existe.',
    waiting: 'Aguardando o início do agente…',
    empty: 'Esta execução não registrou eventos.',
    fetchFailed: 'Não foi possível buscar novos eventos. Tentando novamente…',
    expand: 'Mostrar tudo',
    truncated:
      'Resumindo: o texto completo era demasiado longo para ser guardado.',
    summary_one: 'Criado evento {{created}} · {{count}}',
    summary_other: 'Criados eventos {{created}} · {{count}}',
    took: 'pegou {{duration}}',
    pendingInputs_one: 'Comentário {{count}} aguardando o agente',
    pendingInputs_other: 'Comentários {{count}} aguardando o agente',
    inputDelivered_one: 'Entregue ao agente',
    inputDelivered_other: 'Entradas {{count}} entregues ao agente',
    tokens: 'Entrada de tokens {{input}}, saída {{output}}',
    kinds: {
      text: 'Agente',
      thinking: 'Pensando',
      toolUse: 'Ferramenta',
      toolResult: 'Resultado',
      allowed: 'Permitido',
      denied: 'Negado',
      input: 'Entrada',
      checkout: 'Finalização da compra',
      status: 'Status',
      error: 'Erro',
      usage: 'Uso',
    },
    summary_many: 'Criados eventos {{created}} · {{count}}',
    pendingInputs_many: 'Comentários {{count}} aguardando o agente',
    inputDelivered_many: 'Entradas {{count}} entregues ao agente',
    inputDelivered_zero: 'Entradas {{count}} entregues ao agente',
  },
  failures: {
    runnerUpgrade:
      'Interrompido para atualização da máquina de execução; a corrida continuará.',
    runnerDiskFull: 'A máquina de execução ficou sem espaço em disco.',
    runnerOfflineBeforeStart:
      'O tempo de execução ficou off-line antes de iniciar a execução.',
    runnerOffline: 'O tempo de execução ficou offline.',
    leaseExpired: 'O tempo de execução parou de relatar.',
    startTimeout: 'O tempo de execução não iniciou a execução a tempo.',
    cancelled: 'Cancelado.',
    idleTimeout: 'O agente parou de progredir.',
    setupFailed: 'A corrida não pôde ser preparada.',
    cliUnavailable:
      'O tempo de execução não pôde instalar a CLI do aplicativo.',
    workspaceBusy:
      'O diretório de trabalho está ocupado; esperando por outra tentativa.',
    checkoutFailed: 'A verificação do repositório falhou.',
    toolAuth:
      'A ferramenta de codificação não está conectada no tempo de execução.',
    toolQuota: 'A ferramenta de codificação ficou sem cota.',
    toolRateLimit: 'A ferramenta de codificação tinha taxa limitada.',
    toolNetwork:
      'A ferramenta de codificação não conseguiu acessar seu serviço.',
    toolProcess: 'A ferramenta de codificação foi encerrada inesperadamente.',
    contextOverflow: 'A conversa tornou-se demasiado longa para o modelo.',
    delegatedQueueTimeout: 'Tempo limite da fila de delegação; retirado',
    queuedExpired: 'Nenhum tempo de execução demorou a ser executado.',
    modelUnavailable: 'O modelo do agente não está disponível.',
    stepLimit: 'O agente chamou as ferramentas muitas vezes sem responder.',
    policyRefused:
      'Nenhuma política de tempo de execução permite esse trabalho.',
    prepareNetwork:
      'O tempo de execução não pôde alcançar o host do repositório durante a preparação da execução.',
    repoAccessUnavailable:
      'A credencial de um repositório não pôde ser emitida agora; a execução será tentada novamente.',
    repoAccessDenied:
      'A aplicação não emitirá credencial para um dos repositórios da execução.',
    unknown: 'A execução falhou.',
  },
  runtimes: {
    refresh: {
      button: 'Atualizar status',
      checking: 'Verificando…',
      restart: 'Reinicie o runner para atualizar seu status.',
    },
    capacity: {
      actual: 'Last effective slots: {{slots}}',
      online: 'Effective slots · online settings',
      pending: 'Waiting for runner to sync online settings',
      legacy: 'Legacy local slots · upgrade the application server',
      upgrade: 'Sync status unavailable · upgrade the runner',
      lastReported: 'Last reported: {{time}}',
    },
    quota: {
      workspaceStatus: {
        active: 'O trabalho continua',
        ended: 'Finalizado · limpeza permitida',
        checks: 'Finalizado · cheques pendentes',
        inUse: 'Retido: em uso',
        changed: 'Retido: reutilizado',
        trackedChanges: 'Retido: arquivos não confirmados',
        unpushed: 'Retido: trabalho não empurrado',
        missingEvidence: 'Retido: verificação necessária',
        gitFailed: 'Retido: falha na verificação do Git',
        runNotFound: 'Retido: execução não encontrada',
        ownershipUnknown: 'Retido: proprietário não verificado',
        ambiguousSubject: 'Retido: tarefa ambígua',
        bindingUnavailable: 'Retido: ligação indisponível',
        subjectUnknown: 'Retido: tarefa desconhecida',
        unknown: 'Retido: não verificado',
      },
      usageLimit: 'Limite de uso',
      shortReset: 'redefine {{time}}',
      shortUnknown: 'redefinir desconhecido',
      automatic: 'Limpa sozinho na reinicialização.',
      since: 'desde {{time}}',
      marks_one: 'Marca de cota {{count}}',
      marks_other: 'Marcas de cota {{count}}',
      queueHint:
        'Um agente na cota ainda pode ser selecionado. O trabalho ficará na fila com o prazo de espera existente.',
      partial: 'Executa em {{available}} · {{blocked}} na cota',
      workspaceSize: 'Tamanho do espaço de trabalho: {{value}}',
      providers_one: 'Provedor {{count}} na cota',
      providers_other: 'Provedores {{count}} na cota',
      runColumns: {
        issue: 'Questão/conversa',
        agent: 'Agente',
        status: 'Status',
        started: 'Iniciado',
        duration: 'Duração',
      },
      filter: {
        all: 'Todos',
        active: 'Ativo',
        retained: 'Retido',
        ended: 'Terminado',
      },
      columns: {
        directory: 'Diretório/tarefa',
        type: 'Tipo',
        size: 'Tamanho',
        push: 'Estado de envio',
        status: 'Status',
        lastUsed: 'Usado pela última vez',
      },
      previous: 'Anterior',
      next: 'Próximo',
      working: 'Trabalhando',
      readOnly: 'Cópia somente leitura',
      clean: 'Limpar',
      unpushed: 'Não empurrado',
      overview: 'Visão geral',
      workspaces: 'Espaços de trabalho',
      runs: 'Execuções',
      title: 'Cota',
      reached: 'Cota atingida',
      unknown: 'Hora de reinicialização desconhecida',
      resets: 'Reinicia {{time}}',
      near: 'Perto do limite',
      clear: 'Limpar',
      clearMark: 'Marca clara',
      confirm: 'Limpar esta marca? {{target}} volta a trabalhar.',
      observed: 'Último {{time}} relatado',
      usedPercent: '{{percent}}% usado',
      ok: 'OK',
      hint: 'Os tempos de reinicialização conhecidos restauram a elegibilidade automaticamente. Para reinicializações desconhecidas, restaure a cota e limpe a marca. Somente o proprietário e os administradores do tempo de execução podem limpar as marcas.',
      marks_many: 'Marcas de cota {{count}}',
      providers_many: 'Provedores {{count}} na cota',
    },
    workspaces: {
      paused:
        'Novo trabalho é pausado até que o espaço em disco seja recuperado. As execuções existentes continuam.',
      working: 'Tipo: Diretório de trabalho',
      readOnly: 'Tipo: Cópia somente leitura',
      size: 'Tamanho: {{value}}',
      pushed: 'Estado de envio: limpo, sem trabalho não enviado',
      unpushed:
        'Estado push: trabalho não confirmado, não enviado ou não verificado',
      notApplicable: 'Estado push: Não aplicável',
      title: 'Diagnóstico do espaço de trabalho',
      low: 'Pouco espaço em disco',
      previousLow: 'Último relatório: pouco espaço em disco',
      notReported: 'Nenhum relatório de espaço de trabalho recebido ainda',
      diskUnknown: 'Não foi possível medir o espaço em disco',
      thresholdOff: 'Nenhum aviso de espaço livre mínimo configurado',
      free: 'Espaço livre: {{value}}',
      threshold: 'Espaço livre mínimo: {{value}}',
      reportedAt: 'Último relatado: {{time}}',
      stale:
        'São leituras anteriores; o espaço em disco atual não foi confirmado.',
      empty: 'Nenhum diretório de trabalho no último relatório',
      ended: 'Terminado',
      active: 'O trabalho continua',
      unknown: 'Não é possível confirmar se o trabalho terminou',
      oldRunner: 'Este executor não forneceu motivos de diagnóstico',
      noCleanup: 'O resultado da limpeza local não foi recebido',
      discardsUntracked: 'A limpeza descartará arquivos não rastreados',
      decision: {
        settled:
          'A obra terminou; verificações de limpeza locais são necessárias',
        active: 'O trabalho continua',
        runNotFound: 'Não é possível confirmar: execução não encontrada',
        ownershipUnknown:
          'Não é possível confirmar: a propriedade do executor não pôde ser verificada',
        ambiguousSubject: 'Não é possível confirmar: chave de assunto ambígua',
        bindingUnavailable:
          'Não é possível confirmar: o aplicativo não possui vinculação ao espaço de trabalho',
        subjectUnknown:
          'Não é possível confirmar: o aplicativo não conseguiu resolver o assunto',
      },
      cleanup: {
        allowed: 'Terminou; limpeza permitida',
        inUse: 'Retido: diretório está em uso',
        changed: 'Retido: o diretório foi reutilizado',
        trackedChanges:
          'Retido: arquivos rastreados possuem alterações não confirmadas',
        unpushed:
          'Retido: commits não enviados ou objetos de commit locais insuficientes',
        missingEvidence: 'Retido: evidência de confirmação insuficiente',
        gitFailed: 'Retido: falha na verificação do Git',
      },
    },
    title: 'Ambientes de execução',
    description:
      'Os tempos de execução que executam os agentes e as ferramentas de codificação relatadas por cada um.',
    add: 'Adicionar tempo de execução',
    loadFailed: 'Não foi possível carregar os tempos de execução',
    emptyTitle: 'Nenhum tempo de execução conectado ainda',
    emptyDescription:
      'Depois que um tempo de execução é conectado, os agentes executores assumem o trabalho lá com suas ferramentas de codificação.',
    noneConnected: 'Nenhum tempo de execução está conectado.',
    revokedList_one: '{{count}} tempo de execução revogado',
    revokedList_other: '{{count}} tempos de execução revogados',
    lastSeen: 'Visto pela última vez {{time}}',
    activity: {
      online: '{{active}}/{{slots}} on-line',
      busy: 'Ocupado {{active}}/{{slots}}',
      low_disk: 'Pouco espaço em disco {{active}}/{{slots}}',
      offline: 'Off-line · {{time}}',
      offlineNever: 'Off-line',
    },
    toolUsage: {
      label: 'Executado por ferramenta de codificação',
      item: '{{tool}} {{used}}/{{limit}}',
    },
    toolSlots: {
      label: 'Limites por ferramenta de codificação',
      hint: 'Quantas execuções de cada ferramenta de codificação são necessárias de uma só vez, como menos para uma ferramenta cuja assinatura permite menos sessões. Deixe um vazio para limitá-lo apenas pelas execuções simultâneas.',
      none: 'Sem limite',
      invalid: 'Insira números inteiros de 1 a 64 ou deixe-os em branco.',
      inputLabel: 'Execuções de {{tool}} de uma só vez',
      overTotal:
        'O limite de {{tools}} está acima do máximo de execuções simultâneas ({{slots}}): no máximo {{slots}} é executado de uma só vez.',
      noneChecked:
        'Verifique uma ferramenta de codificação acima para limitá-la.',
    },
    toolTable: {
      tool: 'Ferramenta',
      enabled: 'Ligado',
      state: 'Status',
      limit: 'Imediatamente',
      active: 'Em execução',
    },
    policy: {
      title: 'Política local',
      description:
        'O que o proprietário do tempo de execução permite, conforme relatado. É alterado na máquina, não aqui.',
      none: 'Nenhuma política local: aceita qualquer trabalho para o qual esteja registrado.',
      any: 'Qualquer',
      nothing: 'Nenhum',
      agents: 'Agentes',
      subjects: 'Assuntos',
      repos: 'Repositórios',
    },
    variables: {
      title: 'Variáveis desta máquina',
      description:
        'As variáveis ​​que ele fornece às execuções que as retiram do tempo de execução, por nome; os valores ficam na máquina. Defina um lá com `nocobase-runner env set NAME` ou passe-o com `--pass-env NAME`.',
      none: 'Nenhum: uma execução que utiliza uma variável do tempo de execução falha aqui antes de ser iniciada.',
      unknown:
        'Não relatado: seu runner é mais antigo que esse recurso. Atualize o executor para vê-los.',
    },
    jobs: {
      allow: 'Permitir trabalhos de construção',
      hint: 'Builds e outras etapas configuradas por este aplicativo são executadas sem um modelo. Este tempo de execução relata: {{kinds}}.',
      unsupported:
        'O executor deste tempo de execução não aceita jobs. Atualize o runner para ativar isso.',
    },
    noTools: 'Nenhuma ferramenta de codificação encontrada',
    actionsFor: 'Ações para {{name}}',
    columns: {
      name: 'Nome',
      status: 'Status',
      tools: 'Ferramentas',
      sharing: 'Compartilhamento',
      version: 'Executor',
      lastSeen: 'Visto pela última vez',
      slots: 'Máximo de execuções simultâneas',
    },
    detail: {
      general: 'Geral',
      tools: 'Ferramentas',
      toolsDescription:
        'As ferramentas de codificação relatadas. Trabalho para uma ferramenta que está desligada, ou cuja cota está esgotada, não é enviado aqui. Switches e limites são salvos em “Salvar”.',
      version: 'Executor {{version}}',
      runs: 'Execuções recentes',
      runsEmpty: 'Ainda não há corridas.',
      runsFailed: 'Não foi possível carregar suas execuções.',
      readOnly: 'Somente seu proprietário pode alterá-lo.',
      owner: 'Proprietário {{name}}',
    },
    status: {
      updatePending: 'Executor aguardando atualização',
      pruning: 'Executor limpando loja compartilhada',
      online: 'On-line',
      offline: 'Off-line',
      revoked: 'Revogado',
      upgrade_required: 'Atualização necessária',
    },
    upgradeRequired: {
      title: 'Este tempo de execução precisa de uma atualização',
      older:
        'Seu executor {{version}} fala o protocolo do agente {{protocol}}; esta aplicação precisa do protocolo {{required}}. Ele permanece conectado, mas não executa nada até ser atualizado.',
      newer:
        'Seu executor {{version}} fala o protocolo do agente {{protocol}}, mais recente que esta aplicação (protocolo {{required}}). Ele permanece conectado, mas não executa nada até executar um executor que este aplicativo atende.',
      latest:
        'Esta aplicação atende ao executor {{latest}}. Execute isto em seu host para atualizá-lo:',
      noLatest:
        'Instale um executor que fale o protocolo {{required}} ou execute-o em seu host para atualizá-lo:',
      reinstall:
        'Seu executor não diz como foi instalado. Instale-o novamente em seu host com o comando Adicionar tempo de execução.',
    },
    tool: {
      signedIn: 'Conectado',
      signedOut: 'Não conectado',
      notInstalled: 'Não instalado',
      off: 'Desligado',
      offHint:
        'Desligado: o trabalho desta ferramenta não é enviado para este tempo de execução.',
      enableLabel: 'Execute {{tool}} em {{name}}',
      version: 'Versão {{version}}',
    },
    trust: {
      label: 'Para quem trabalha',
      team: 'Equipe',
      teamHint:
        'Executa o trabalho iniciado por qualquer pessoa da equipe, com suas variáveis ​​e segredos. Para servidores compartilhados e VMs.',
      ownerOnly: 'Pessoal',
      ownerOnlyHint:
        'Executa apenas o trabalho que você inicia. O padrão para um tempo de execução que você adiciona.',
      personalOnly:
        'Este tempo de execução será pessoal: ele executa apenas o trabalho que você iniciar. Você pode compartilhá-lo com a equipe mais tarde.',
    },
    share: {
      title: 'Compartilhar {{name}} com a equipe?',
      description:
        'As execuções de outras pessoas serão executadas neste tempo de execução, com suas variáveis e segredos, e poderão ler o que está nele. Compartilhe apenas se estiver tudo bem.',
      confirm: 'Compartilhe com a equipe',
    },
    edit: {
      button: 'Editar',
      title: 'Editar {{name}}',
      name: 'Nome',
      nameRequired: 'Digite um nome.',
      slotsHint: 'Quantas execuções o tempo de execução leva de uma só vez.',
      slotsInvalid: 'Insira um número inteiro de 1 a 64.',
      saved: '{{name}} salvo',
    },
    upgrade: {
      show: 'Versão {{version}}: um executor mais recente está disponível',
      available: 'Atualização disponível',
      badge: 'Atualizável',
      title: 'Um executor mais recente para {{name}}',
      description: '{{version}} instalado, esta aplicação atende {{latest}}.',
      hint: 'Ele se atualiza quando nenhum agente está em execução. Para atualizá-lo agora, execute-o em seu host.',
    },
    revoke: {
      title: 'Revogar a credencial de {{name}}?',
      description:
        'Seu executor para na próxima solicitação e suas execuções voltam para a fila. Para conectá-lo novamente, adicione o tempo de execução novamente.',
      confirm: 'Revogar',
      done: 'Revogada a credencial de {{name}}',
    },
    delete: {
      title: 'Excluir {{name}}?',
      description:
        'O tempo de execução revogado é removido da lista. Suas corridas passadas permanecem.',
      confirm: 'Excluir',
      done: '{{name}} excluído',
    },
    revokedList_many: '{{count}} tempos de execução revogados',
  },
  connect: {
    title: 'Adicionar tempo de execução',
    description:
      'Execute o comando abaixo em um host que possua uma ferramenta de codificação instalada: um servidor, uma VM ou seu próprio dispositivo. Os agentes são executados lá com acesso total, como o usuário que executa o executor, e podem ler e alterar qualquer coisa que o usuário possa, incluindo chaves SSH e outras credenciais. O executor não é um limite de segurança: execute-o como um usuário dedicado, em um contêiner ou em uma VM.',
    createCredential: 'Gerar comando de instalação',
    advanced: 'Avançado: limites por ferramenta de codificação',
    run: 'Execute isso nesse host. Ele baixa o executor (nocobase-runner) e a CLI deste aplicativo, registra o executor e o inicia no login:',
    nodeRequired:
      'O host precisa do Node.js 24 ou mais recente (verifique com node --version). O comando para e diz como instalá-lo quando estiver faltando.',
    installed: 'Já tem o nocobase-runner instalado? Em vez disso, registre-o:',
    unsupported:
      'O executor ainda não funciona no Windows. Use macOS ou Linux ou WSL.',
    tokenOnce:
      'O comando carrega uma credencial única para um tempo de execução "{{trust}}". Funciona uma vez, até {{time}}.',
    after:
      'Em segundos, o tempo de execução aparece na lista, com cada ferramenta de codificação encontrada…',
    tokenTools: 'Ferramentas de codificação: {{tools}}.',
    tools: 'Ferramentas de codificação',
    toolsHint:
      'Este tempo de execução oferece trabalho apenas para as ferramentas verificadas. Você pode alterá-lo na página Runtimes a qualquer momento.',
    toolsRequired: 'Escolha pelo menos uma ferramenta de codificação.',
    slots: 'Máximo de execuções simultâneas',
    slotsHint:
      'Quantas execuções o tempo de execução leva de uma só vez. Você pode alterá-lo na página Runtimes a qualquer momento.',
    tokenSlots: 'Máximo de execuções simultâneas: {{slots}}.',
    tokenToolSlots: 'Por ferramenta de codificação: {{limits}}.',
    connected: '{{name}} está conectado.',
    done: 'Concluído',
    system: {
      macos: 'macOS',
      linux: 'Linux',
      windows: 'Windows',
    },
  },
  chat: {
    untitled: 'Conversa sem título',
    renamed: 'Renomeado',
    archivedNamed: 'Arquivado “{{title}}”',
    unarchived: 'Conversa restaurada',
    undo: 'Desfazer',
    sendFailed: 'A mensagem não foi enviada. Tente novamente.',
    availability: {
      online: 'On-line',
      agentMissing: 'Excluído',
      agentArchived: 'Não habilitado',
      forbidden: 'Não disponível para você',
      noModel: 'Configure primeiro um modelo de chat',
      noRunner: 'Nenhum executor online, não pode ser escolhido',
      othersPersonal:
        'Somente os executores pessoais de outras pessoas o possuem',
      modelUnavailable: 'Modelo indisponível',
    },
    offline: {
      fallbackDone: 'Esta conversa agora usa outro agente',
      restoreDone: 'Mudou de volta',
      newSession: 'O agente inicia uma nova sessão e lê esta conversa.',
    },
    notice: {
      switchedToDefault:
        'Mudou para {{name}}, o padrão do sistema, até {{own}} retornar.',
      switchedToOnline:
        '{{own}} não tem nenhum executor para você agora, então {{name}} responde até que {{own}} retorne.',
      onlineFallbackUnavailable:
        'O agente substituto online não pode responder ({{reason}}). Esta conversa permanece com {{own}} enquanto espera por um runner.',
      switchedBack: 'De volta com {{name}}.',
      runFailed: 'O agente parou antes de responder.',
      runFailedReason: 'O agente parou antes de responder: {{reason}}',
      runCancelled: 'Cancelamento solicitado.',
    },
    consultation: {
      unavailableTitle: 'Agente consultado indisponível',
      snapshotTitle: '{{name}} solicitado no momento',
      title: 'Consultado {{name}}',
    },
    steps: {
      thinking: 'Pensando…',
      reading: 'Olhando para {{subject}}',
      working: 'Trabalhando em {{subject}}',
    },
    agents: {
      personalOnly: 'Somente executores pessoais',
      hint: 'Lista os agentes habilitados e diz por que nenhum deles pode responder agora. As respostas são executadas em um executor: a primeira resposta espera que alguém a responda, geralmente alguns segundos.',
      chooseFor: 'Escolha um agente',
      empty: 'Nenhum agente que você possa escolher',
      none: 'Nenhum agente',
      unknown: 'Agente desconhecido',
      placeholder: 'Escolha um agente',
      myDefault: 'Meu padrão',
      systemDefault: 'Padrão do sistema',
    },
  },
  chatProfile: {
    loadFailed: 'Não foi possível carregar as configurações do seu agente',
    defaultAgent: 'Meu agente de chat padrão',
    systemDefault: 'Padrão do sistema',
    systemDefaultNamed: 'Padrão do sistema ({{name}})',
    noDefault: 'Nenhum padrão do sistema está definido.',
    saved: 'Agente de chat padrão salvo',
  },
  models: {
    title: 'Modelos',
    description:
      'Os modelos de atendimento online que os agentes chamam e os modelos que cada um oferece: modelos de chat para agentes, modelos de incorporação e reclassificação para pesquisa.',
  },
  defaultModel: {
    title: 'Modelo de bate-papo padrão',
    description:
      'Agentes on-line sem modelos próprios de resposta, como um novo agente ou um que veio com o aplicativo.',
    none: 'Nenhum modelo de chat está ativado ainda. Adicione um serviço de modelo e ative um modelo de chat: o primeiro se torna o padrão.',
    saved: 'O modelo de chat padrão agora é {{model}}.',
  },
  services: {
    list: 'Serviços modelo',
    columns: {
      name: 'Nome',
      provider: 'Tipo de provedor',
      status: 'Status',
    },
    loadFailed: 'Não foi possível carregar os serviços do modelo',
    empty: {
      title: 'Nenhum serviço modelo ainda',
      description:
        'Depois de adicionar um serviço modelo, os agentes online poderão responder por meio dele.',
      readOnly: 'Peça a um administrador para adicionar um serviço modelo.',
    },
    add: {
      open: 'Adicionar serviço',
      title: 'Adicionar um serviço de modelo',
      provider: 'Tipo de provedor',
      created: '{{title}} adicionado.',
    },
    status: {
      on: 'Ligado',
      off: 'Desligado',
      noKey: 'Nenhuma chave API',
      noModels: 'Nenhum modelo em',
    },
    service: {
      edit: 'Editar {{title}}',
      defaultHost: 'Padrão do provedor',
      actions: 'Mais ações para {{title}}',
      turnOn: 'Ligar',
      turnOff: 'Desligue',
      turnedOn: '{{title}} está ativado.',
      turnedOff: '{{title}} está desligado.',
      name: 'Nome',
      enabled: 'Habilitado',
      enabledHint:
        'Os agentes online podem usar seus modelos somente enquanto ele estiver ativado.',
      saved: '{{title}} salvo.',
      delete: 'Excluir',
      deleteTitle: 'Excluir {{title}}?',
      deleteDescription:
        'Os agentes que usam seus modelos param de responder até receberem outro, e seus preços de modelo são excluídos.',
      deleted: '{{title}} excluído.',
    },
    connection: {
      apiKey: 'Chave API',
      keyPlaceholder: 'Cole a chave API',
      baseUrl: 'URL base',
      baseUrlHint: 'Vazio usa o padrão do provedor, {{url}}.',
      baseUrlRequired: 'O endereço do API do provedor.',
      baseUrlInvalid: 'A base URL começa com http:// ou https://.',
      test: 'Testar conexão',
      testing: 'Testando…',
      testOk: 'Conectado: {{model}} atendido.',
      testFailed: '{{model}} não respondeu: {{message}}',
      testNeedsModel: 'Verifique um modelo para testar a conexão.',
      openCodeHint:
        'OpenCode envia x-opencode-session com cada solicitação (um ID de sessão por conversa). Atende cada família de modelos através de seu próprio API: DeepSeek, GLM, Kimi e MiMo através de DeepSeek ou OpenAI-compatible, Claude, MiniMax e Qwen através de Anthropic, GPT e Grok através OpenAI. Adicione um serviço de cada tipo que você precisar, tudo com esta base URL.',
    },
    models: {
      title: 'Modelos',
      description:
        'Verifique os modelos que este serviço oferece e diga para que serve cada um: modelos de chat respondem a agentes, incorporação de texto de índice de modelos para pesquisa, reclassificação de modelos ordenam resultados de pesquisa. Um modelo de incorporação pode solicitar vetores de um tamanho.',
      fetching: 'Buscando os modelos do provedor…',
      fetchFailed: 'O provedor não listou seus modelos: {{message}}',
      fetch: 'Buscar modelos',
      search: 'Pesquisar modelos',
      noMatch: 'Nenhum modelo corresponde.',
      empty:
        'Nenhum modelo ainda. Obtenha-os do provedor ou adicione um por seu ID.',
      add: 'Adicionar modelo',
      addPlaceholder: 'ID do modelo',
      kind: 'Para que serve {{model}}',
      kinds: {
        chat: 'Bate-papo',
        embedding: 'Incorporação',
        rerank: 'Reclassificar',
      },
      test: 'Teste {{model}}',
      testOk: 'Respondido como {{kind}}.',
      testFailed: 'Não respondeu: {{message}}',
      notKind: {
        chat: 'Este modelo não se parece com um modelo de chat',
        embedding: 'Este modelo não se parece com um modelo de incorporação',
        rerank: 'Este modelo não se parece com um modelo de reclassificação',
      },
      looksLike: '{{notKind}}: responde como {{kind}}.',
      kindNouns: {
        chat: 'um modelo de bate-papo',
        embedding: 'um modelo de incorporação',
        rerank: 'um modelo de reclassificação',
      },
      dimensions: 'Tamanho do vetor de {{model}}',
      dimensionsPlaceholder: 'Padrão',
      counts: {
        chat: 'Bate-papo {{count}}',
        embedding: 'Incorporação {{count}}',
        rerank: '{{count}} reclassificação',
      },
    },
  },
  prices: {
    loadFailed: 'Não foi possível carregar os preços dos modelos',
    section: {
      title: 'Preços dos modelos',
      description:
        'Por milhão de tokens, entrada/saída. Os relatórios calculam os custos deles.',
      online: 'Online (serviços modelo)',
      noOnline:
        'Ainda não há modelo para precificar. Ative primeiro um serviço de modelo e seus modelos.',
      runner: 'Runner (ferramentas de codificação)',
    },
    price: {
      model: 'Modelo',
      state: 'Fonte de preço e ações',
      input: 'Entrada / 1M',
      output: 'Saída / 1M',
      inputOf: 'Preço de entrada de {{model}}, por milhão de tokens',
      outputOf: 'Preço de saída de {{model}}, por milhão de tokens',
      save: 'Salvar o preço de {{model}}',
      saved: 'Preço de {{model}} salvo.',
      remove: 'Remova o preço de {{model}}',
      removed: 'Preço de {{model}} removido.',
      unpriced: 'Sem preço',
      unpricedHint:
        'Seu custo aparece “—” nos relatórios até que tenha um preço.',
      via: 'por {{pattern}}',
      viaHint:
        'Precificado pela regra {{pattern}}. Economizar aqui dá a este modelo seu próprio preço.',
      invalid: 'Os preços são números de 0 ou mais.',
      readOnly:
        'Somente quem administra os preços dos modelos pode alterá-los.',
    },
    tool: {
      description:
        'Qual o custo das execuções {{tool}}, precificado pelo modelo que cada execução relata.',
      subscription: 'Assinatura (não cobrada)',
      subscriptionTag: 'Assinatura',
      subscriptionHint:
        'Pago por plano mensal: suas corridas não custam nada nos relatórios.',
      subscribed: '{{tool}} é cobrado por assinatura.',
      unsubscribed: '{{tool}} é faturado pelos seus preços.',
      seen: 'Modelos vistos em execuções',
      noneSeen: 'Nenhuma versão do {{tool}} relatou um modelo ainda.',
      rules: 'Regras de preço ({{count}})',
      rulesHint:
        'Uma regra é um ID de modelo ou um padrão como claude-sonnet-4*; a partida mais específica vence.',
      ruleModel: 'Modelo ou padrão',
      addRule: 'Adicionar preço',
      ruleAdded: 'Preço de {{model}} adicionado.',
    },
  },
  skills: {
    attachments: 'Anexos',
    globalMount: 'Anexo global',
    globalMountDescription:
      'Salva imediatamente. Todas as corridas futuras recebem esta habilidade.',
    mountSaved: 'Configurações de anexo salvas.',
    mountRetry: 'Não foi possível carregar as configurações. Tentar novamente',
    unavailableTarget: 'Alvo indisponível',
    noAttachments: 'Não anexado em lugar nenhum.',
    title: 'Habilidades',
    description:
      'Instruções reutilizáveis com arquivos de suporte. Anexe padrões de equipe globalmente ou a um projeto ou diretório de trabalho.',
    new: 'Nova habilidade',
    newTitle: 'Nova habilidade',
    newDescription:
      'Escreva SKILL.md: seus nomes iniciais e descrevem a habilidade. Adicione arquivos agora ou mais tarde.',
    breadcrumb: 'Habilidade',
    loadFailed: 'Não foi possível carregar habilidades',
    backToList: 'Voltar às habilidades',
    emptyTitle: 'Nenhuma habilidade ainda',
    emptyDescription:
      'Depois de adicionar uma habilidade, os agentes leem seu SKILL.md sempre que uma tarefa exigir isso.',
    emptyReadOnly: 'Peça a um administrador para adicionar uma habilidade.',
    content: 'SKILL.md',
    contentHint:
      'O nome do front issue é o nome da pasta da habilidade: alterá-lo renomeia a habilidade. A descrição informa aos agentes quando lê-la.',
    contentTooLarge: 'SKILL.md é maior que {{max}}.',
    emptyContent: 'Esta habilidade ainda não tem conteúdo.',
    created: 'Habilidade criada "{{name}}"',
    saved: 'Salvo como versão {{version}}.',
    saveVersion: 'Salvar nova versão',
    editing: 'Edição',
    note: 'Nota',
    notePlaceholder: 'O que mudou nesta versão (opcional)',
    deleted: 'Habilidade excluída "{{name}}".',
    edit: 'Editar',
    delete: 'Excluir habilidade',
    deleteTitle: 'Excluir habilidade "{{name}}"?',
    deleteDescription:
      'Todo agente e todo lugar que usa essa habilidade como padrão a perde.',
    readOnly:
      'Somente o criador da habilidade e os administradores do espaço de trabalho podem alterar essa habilidade.',
    conflict:
      'Alguém acabou de mudar essa habilidade. A versão mais recente é carregada; tente novamente.',
    conflictTitle: 'Alguém acabou de mudar essa habilidade',
    conflictDraft:
      'Alguém salvou uma nova versão depois que você começou a editar, portanto suas alterações não foram salvas. Copie o que deseja manter, carregue a versão mais recente e edite novamente.',
    loadLatest: 'Carregar a versão mais recente',
    mountedAgents: 'Agentes vinculados',
    noAgents: 'Ainda não vinculado a nenhum agente.',
    defaults: 'Habilidade padrão de: {{places}}.',
    defaultsSeparator: ', ',
    files: 'Arquivos',
    usage: 'Arquivos {{files}}/{{maxFiles}} · {{size}}/{{maxSize}}',
    uploadTooLarge: '{{name}} é maior que {{max}}.',
    uploadInvalidName:
      '{{name}} não pode ser adicionado aqui; renomeie-o primeiro.',
    skillTooLarge: 'Uma habilidade possui no máximo {{max}} ao todo.',
    tooManyFiles: 'Uma habilidade contém no máximo arquivos {{max}}.',
    filesTooLarge: 'Maior que {{max}}: {{paths}}.',
    binaryFile: 'Arquivo binário, {{size}}. Não pode ser editado aqui.',
    executable: 'Executável',
    scriptBadge: 'Roteiro',
    scriptsNote:
      'Possui scripts: os agentes online podem lê-los, mas nunca executá-los',
    compatibility: 'Compatibilidade: {{value}}',
    fileContent: 'Conteúdo de {{path}}',
    export: 'Exportar',
    exportVersion: 'Exportar versão {{version}} como zip',
    import: 'Importar',
    importVersion: 'Importar nova versão',
    imported: 'Habilidade importada "{{name}}".',
    importInvalid: 'O SKILL.md do arquivo não pode ser usado: {{problem}}',
    tree: {
      label: 'Arquivos de habilidade',
      newFile: 'Novo arquivo',
      newFolder: 'Nova pasta',
      upload: 'Carregar arquivos',
      actionsFor: 'Ações para {{name}}',
      rename: 'Renomear',
      delete: 'Excluir',
      download: 'Baixar',
      replace: 'Substituir',
      markExecutable: 'Marcar como executável',
      unmarkExecutable: 'Marcar como não executável',
      dropHint: 'Solte os arquivos em uma pasta para carregá-los lá.',
    },
    entry: {
      description: 'Os nomes são verificados nos arquivos já existentes.',
      folderHint:
        'Uma pasta vazia não é salva: adicione um arquivo a ela antes de salvar.',
      location: 'Localização',
      root: 'Pasta de habilidades (/)',
      name: 'Nome',
      renameTitle: 'Renomear "{{name}}"',
      conventional: {
        scripts:
          'Os agentes de código podem ser executados. Os agentes online apenas leem.',
        references: 'Os agentes de documentação leem quando precisam.',
        assets: 'Modelos, imagens e outros recursos.',
      },
      problems: {
        required: 'Digite um nome.',
        invalid: 'Use um nome sem "/", diferente de "." e "..".',
        taken: 'Um arquivo ou pasta com este nome já existe.',
        reserved: 'SKILL.md é a habilidade em si; escolha outro nome.',
      },
      deleteFileTitle: 'Excluir arquivo "{{name}}"?',
      deleteFolderTitle: 'Excluir a pasta "{{name}}" e tudo que há nela?',
      deleteDescription: 'É retirado deste projecto; versões salvas mantêm-no.',
    },
    editor: {
      write: 'Escreva',
      preview: 'Visualização',
      nothingToPreview: 'Nada para visualizar ainda.',
      noPreview: 'Nenhuma prévia deste tipo de arquivo.',
    },
    frontMatter: {
      title: 'Corrija o assunto frontal de SKILL.md',
      reasons: {
        missing:
          'Inicie SKILL.md com título entre duas linhas "---", com nome e descrição.',
        yaml: 'O assunto inicial não é YAML válido.',
        notMapping:
          'O assunto inicial deve ser chaves e valores, como "nome: minha habilidade".',
        required: 'Adicione {{field}}.',
        empty: '{{field}} não deve estar vazio.',
        type: '{{field}} tem o tipo errado.',
        tooLong: '{{field}} é maior que {{max}} caracteres.',
        pattern:
          'o nome usa letras minúsculas, dígitos e hífens simples e não começa nem termina com hífen.',
        mismatch: 'nome deve ser o nome da pasta que contém SKILL.md.',
        taken: 'Outra habilidade tem este nome; escolha outro.',
      },
    },
    template: {
      description: 'O que esta habilidade faz e quando um agente deve usá-la.',
      title: 'Nova habilidade',
      whenToUse: 'Quando usar',
      whenToUseHint: 'Descrever as tarefas que exigem esta habilidade.',
      steps: 'Etapas',
      stepsHint: '1. A primeira coisa a fazer.\n2. A próxima.',
      examples: 'Exemplos',
      examplesHint: 'Mostre uma entrada e a aparência de um bom resultado.',
    },
    columns: {
      name: 'Nome',
      description: 'Descrição',
      files: 'Arquivos',
      version: 'Versão',
      agents: 'Agentes',
      updated: 'Atualizado',
    },
    versions: {
      title: 'Versões',
      description:
        'Cada salvamento cria uma nova versão; os agentes sempre recebem a versão mais recente.',
      current: 'Atual',
      compare: 'Comparar',
      compareTitle: 'Versão {{version}} → versão {{current}}',
      compareDescription:
        'Linhas removidas desde então em vermelho, adicionadas em verde.',
      unchanged: 'inalterado',
      restore: 'Restaurar',
      restoreTitle: 'Restaurar versão {{version}}?',
      restoreDescription:
        'É salvo novamente como a versão mais recente; os agentes obtêm-no na próxima corrida. Nada se perde: a versão atual fica no histórico.',
      restored: 'Versão {{version}} restaurada como versão {{current}}.',
    },
  },
  runWait: {
    capacity:
      'Slots usados aqui {{used}}/{{limit}}; {{detail}}; relatado gratuitamente em aplicativos {{reportedFree}}',
    reasons: {
      updatePending:
        'Runner aguardando atualização; novo trabalho está pausado',
      pruning:
        'Executor de limpeza de loja compartilhada; novo trabalho está pausado',
      toolNotInstalled:
        'Nenhum executor conectado possui esta ferramenta instalada',
      incompatible:
        'Os executores conectados não suportam esta carga de trabalho; atualização necessária',
      restricted: 'Política do executor, diretório ou restrições de variáveis',
      unknown: 'A elegibilidade da carga de trabalho não foi estabelecida',
      agentArchived: 'O agente é arquivado',
      delayed: 'Programado para {{until}}',
      noRunnerOnline: 'Sem tempo de execução online',
      runnersOffline: 'Seus tempos de execução estão offline',
      toolUnavailable:
        'Ferramenta não conectada, desativada ou modelo solicitado indisponível ({{tool}})',
      noSharedRunner:
        'Somente executores pessoais de outras pessoas estão online',
      missingFeatures: 'Nenhum tempo de execução suporta {{features}}',
      secretsNotAllowed:
        'Precisa de um tempo de execução de equipe: {{variables}} é apenas para tempos de execução de equipe',
      sameWorkActive: 'Depois da corrida já nele',
      concurrencyFull: 'Simultaneidade completa ({{active}}/{{limit}})',
      runnersBusy: 'Os executores compatíveis estão cheios',
      toolSlotsFull: 'Slots {{tool}} cheios ({{used}}/{{limit}})',
      setupRetrying: 'A preparação falhou; tentando novamente: {{detail}}',
      next: 'Próximo para um tempo de execução gratuito',
    },
    unknown: 'Na fila ({{reason}})',
    unknownValue: '—',
  },
  access: {
    section: 'Equipe de agentes',
    businessSection: 'Equipe de agentes',
    businesses: {
      agents: {
        title: 'Agentes e habilidades',
        description: 'Os agentes da equipe e as habilidades que utilizam.',
        actions: {
          edit: {
            title: 'Agentes de mudança e competências',
            description:
              'Altere as configurações, habilidades e variáveis de um agente, arquive, restaure e exclua, e edite habilidades. Um agente não recebe nenhuma capacidade além da do próprio editor',
            related:
              'Agentes de mudança e habilidades (agentes que eles possuem e habilidades que eles criaram)',
            relatedLabel: 'Agentes que possuo e habilidades que criei',
            relatedHint:
              'Agentes dos quais sou proprietário e habilidades que criei',
            all: 'Agentes de mudança e habilidades (todos)',
          },
        },
      },
    },
    settings: {
      agents: {
        agents: 'Agentes',
        runners: 'Ambientes de execução',
        prices: 'Preços dos modelos',
        services: 'Serviços modelo',
      },
    },
    actions: {
      read: 'Visualizar',
      manage: 'Gerenciar',
    },
    keyScopes: {
      agents: {
        title: 'Agentes',
        description:
          'Veja agentes, habilidades e corridas; altere agentes e habilidades, cancele e tente novamente.',
      },
      runners: {
        title: 'Ambientes de execução',
        description:
          'Veja executores e tokens de registro; gerenciar executores.',
      },
      prices: {
        title: 'Preços dos modelos',
        description:
          'Veja os preços do modelo a partir dos quais os custos são estimados; mude-os.',
      },
      services: {
        title: 'Serviços modelo',
        description:
          'Veja os serviços de modelo e os modelos que eles oferecem, nunca suas chaves.',
      },
    },
  },
};

export default ptBR;
