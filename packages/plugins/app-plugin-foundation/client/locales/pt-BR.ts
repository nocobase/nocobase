import type { FoundationResource } from './en-US.js';

const ptBR: FoundationResource = {
  nav: {
    settings: 'Configurações do sistema',
    foundation: 'Base do aplicativo',
  },
  page: {
    title: 'Base do aplicativo',
    description:
      'Sua aplicação se concentra no negócio. Dados, permissões e fluxos são sustentados pelo NocoBase Core, com recursos comuns desenvolvidos, testados e mantidos pelo NocoBase e atualizados nas versões oficiais.',
    bandTitle: 'NocoBase Core',
    bandDescription:
      'As capacidades em uso acendem em sequência. Selecione uma para ver sua função.',
    score: '{{active}} / {{total}}',
    scoreCaption: 'capacidades sustentam o aplicativo',
    refresh: 'Atualizar',
    refreshing: 'Coletando…',
    updatedAt: 'Coletado em {{time}}',
    loading: 'Coletando capacidades…',
    refreshFailed:
      'A atualização falhou. Exibindo o último resultado coletado com sucesso.',
    loadFailed: 'Não foi possível carregar a visão geral.',
    forbidden:
      'Somente administradores com acesso irrestrito podem ver esta página.',
    retry: 'Tentar novamente',
    undetermined_one: 'Não foi possível determinar {{count}} capacidade',
    undetermined_other: 'Não foi possível determinar {{count}} capacidades',
    highlightsLabel: 'Números principais',
    unavailable: 'Indisponível',
    lowerBound: 'Valor mínimo: parte dos dados não pôde ser lida.',
  },
  matrix: {
    title: 'Módulos de negócio e recursos da base',
    description:
      'Veja quais recursos sustentam cada módulo. Selecione uma marca para conhecer a relação e o que precisaria implementar por conta própria.',
    modules: 'Módulos de negócio',
    summary: '{{count}} recursos · {{pages}} páginas',
    inspect: 'Ver {{module}} × {{capability}}',
    unknown: 'Não identificado',
    empty:
      'Nenhum módulo encontrado. Eles aparecerão automaticamente ao adicionar páginas e navegação.',
    legend:
      '✓ Integração identificada; · relação não identificada. Referências de código descrevem dependências, não execuções.',
    partial:
      'Algumas dependências não puderam ser lidas. As relações confirmadas continuam visíveis.',
    evidence: {
      page: 'Página registrada na aplicação',
      authentication: 'A página exige autenticação',
      authorization: 'Acesso à página controlado por permissões',
      provider: 'Página fornecida por este provedor',
      source: 'Provedor referenciado pelo código da página',
      apiSource: 'Provedor referenciado pelo código da API correspondente',
    },
  },
  inventory: {
    recognitionNotes: 'Notas de identificação',
    title: 'Capacidades e fornecedores',
    description:
      'As capacidades refletem o núcleo, os plugins oficiais e Pro e as extensões conectadas ao aplicativo.',
    discovered: 'pacotes fornecedores encontrados',
    mapped: 'pacotes fornecedores classificados',
    unmapped: 'aguardando classificação',
    partial: 'Descoberta incompleta. Não foi possível ler: {{sources}}.',
    selectedCategory: 'Fornecedores de {{category}}',
    usageBoundary:
      'O status descreve a categoria inteira, sem afirmar que cada pacote está habilitado, configurado ou em uso.',
    noCategoryProviders:
      'O catálogo atual não reconheceu fornecedores desta categoria.',
    extensionsTitle: 'Fornecedores adicionais · aguardando identificação',
    extensionsDescription:
      'Fornecedores sem categoria continuam visíveis. Não são classificados automaticamente como integrações ou sem uso.',
    noExtensions: 'Nenhum fornecedor adicional foi encontrado no escopo atual.',
    discoveryBoundary:
      'Escopo: dependências diretas, fornecedores conhecidos, contribuições públicas de banco de dados e API encaminhada e contribuições do cliente observadas no navegador. Não enumera todas as contribuições, extensões indiretas ou módulos locais. Origem e edição Pro exigem catálogo confiável; nome e licença não bastam.',
    versionUnknown: 'Versão indisponível',
    origin: 'Origem',
    officialCatalog: 'Catálogo NocoBase',
    unverifiedOrigin: 'Origem não verificada',
    installation: 'Instalação',
    installed: 'Manifesto encontrado',
    manifestUnavailable: 'Manifesto indisponível',
    registration: 'Registro',
    observed: 'Contribuição atual em execução observada',
    registrationUnknown: 'Não confirmado · não significa desabilitado',
    evidence: 'Evidência',
    noEvidence: 'Nenhuma confirmada',
    categories: 'Categorias',
    awaitingRecognition: 'Aguardando classificação',
    evidenceLabels: {
      manifest: 'Manifesto do pacote instalado',
      databaseContribution: 'Contribuição de tarefas de banco de dados',
      apiContribution: 'Contribuição de API encaminhada',
      foundationRuntime: 'Serviço da base em execução',
      clientContribution: 'Contribuição do cliente observada no navegador',
      serverRegistration: 'Registro de plugin do servidor',
    },
  },
  status: {
    active: 'Em uso',
    needsSetup: 'Disponível, requer configuração',
    unused: 'Ainda sem uso',
    undetermined: 'Indeterminado',
    legendActive: 'Em uso {{count}}',
    legendNeedsSetup: 'Requer configuração {{count}}',
    legendUnused: 'Ainda sem uso {{count}}',
  },
  detail: {
    businessModules: 'Módulos de negócio relacionados',
    inThisApp: 'Neste aplicativo',
    withoutFoundation: 'Sem a base',
    onceInUse: 'Ao utilizar',
    whyNot: 'Por que não está em uso',
    liveData: 'Dados reais',
    parts: 'Componentes',
    packages: 'Fornecido por pacotes NocoBase',
    noPackages: 'Nenhum pacote desta capacidade está instalado.',
    noFacts: 'Nenhum fato confirmado ainda.',
    partial:
      'Parte da evidência não pôde ser lida; os valores mínimos incluem apenas o que foi lido.',
    failed:
      'Não foi possível examinar esta capacidade. Atualize para tentar novamente.',
    unreadable: 'Não foi possível ler: {{sources}}',
    timeout: 'A verificação excedeu o tempo limite.',
  },
  capabilities: {
    dataModeling: {
      name: 'Modelagem de dados',
      tagline: 'Coleções, campos, relações e migrações',
      without:
        'Seria preciso implementar alterações de esquema, consultas, filtros, paginação, proteção contra injeção e compatibilidade entre bancos.',
      onceInUse:
        'Migrações definem coleções consultadas por uma interface comum nos bancos compatíveis.',
    },
    files: {
      name: 'Gerenciamento de arquivos',
      tagline: 'Uploads, armazenamento e anexos',
      without:
        'Seria preciso criar uploads, adaptadores, validação de tamanho e tipo e links de download.',
      onceInUse:
        'Um contrato comum de coleção e armazenamento gerencia os anexos.',
    },
    usersAndOrganizations: {
      name: 'Usuários e organizações',
      tagline: 'Contas, login e convites',
      without:
        'Seria preciso criar cadastro, sessões, recuperação de senha e administração segura de contas.',
      onceInUse: 'Contas, login e convites são gerenciados em um só lugar.',
    },
    permissions: {
      name: 'Permissões',
      tagline: 'Conjuntos de permissões e regras de acesso',
      without:
        'Seria preciso verificar o acesso em cada API, sem gerenciamento central.',
      onceInUse:
        'Conjuntos autorizam páginas, dados e ações, com validação no servidor em cada requisição.',
    },
    workflows: {
      name: 'Fluxos e aprovações',
      tagline: 'Ciclos de vida, transições e agendamentos',
      without:
        'Seria preciso implementar estados, transições, histórico, tentativas e limites de tempo.',
      onceInUse:
        'Ciclos de vida oferecem transições controladas, histórico e efeitos com novas tentativas.',
    },
    aiAgents: {
      name: 'IA e agentes',
      tagline: 'Serviços de modelos, agentes e executores',
      without:
        'Seria preciso integrar modelos, proteger chaves, registrar consumo e executar agentes com segurança.',
      onceInUse: 'Configure modelos e agentes uma vez, com registro de uso.',
    },
    knowledge: {
      name: 'Base de conhecimento',
      tagline: 'Espaços, documentos e busca',
      without:
        'Seria preciso criar armazenamento, versões, permissões e busca de documentos.',
      onceInUse:
        'Espaços gerenciam documentos, versões e acesso para pessoas e agentes.',
    },
    mail: {
      name: 'E-mail',
      tagline: 'Caixas de correio, sincronização e envio',
      without:
        'Seria preciso conectar serviços, sincronizar pastas e tratar autorização e novas tentativas.',
      onceInUse:
        'Conecte caixas para ler, sincronizar e enviar e-mails no aplicativo.',
    },
    notifications: {
      name: 'Notificações',
      tagline: 'Canais, entregas e mensagens internas',
      without:
        'Seria preciso implementar envio, tentativas, deduplicação e histórico por canal.',
      onceInUse:
        'Canais configurados oferecem envio com tentativas, deduplicação e histórico.',
    },
    integrations: {
      name: 'Integrações',
      tagline: 'Chaves API e acesso externo',
      without:
        'Seria preciso emitir e validar credenciais de cada sistema externo.',
      onceInUse:
        'Sistemas externos usam chaves API com as permissões do proprietário.',
    },
    interface: {
      name: 'Interface e configuração',
      tagline: 'Páginas, navegação, idiomas e temas',
      without:
        'Seria preciso criar rotas, menus, traduções e temas antes das páginas de negócio.',
      onceInUse: 'O cliente NocoBase fornece páginas, menus, idiomas e temas.',
    },
    audit: {
      name: 'Auditoria',
      tagline: 'Registro de operações sensíveis',
      without:
        'Seria preciso registrar manualmente quem realizou cada alteração importante.',
      onceInUse:
        'Um registro central preserva as operações sensíveis do aplicativo.',
    },
    operations: {
      name: 'Operações',
      tagline: 'Migrações, tarefas, filas e segredos',
      without:
        'Seria preciso administrar atualizações, tarefas em segundo plano, filas e segredos com código próprio.',
      onceInUse:
        'O servidor fornece migrações registradas, tarefas, filas e gestão de segredos.',
    },
  },
  reasons: {
    installedNotUsed:
      'Instalado, mas nenhuma evidência de ativação ou uso atual foi identificada.',
    noRecognizedAudit:
      'O catálogo atual não reconhece fornecedores de auditoria; outras extensões podem oferecê-la.',
    noDatabase: 'O aplicativo não usa banco de dados.',
    notRegistered: 'O plugin fornecedor não está registrado no aplicativo.',
    notProvided: 'NocoBase Core ainda não fornece esta capacidade.',
    noFileCollection: 'Nenhuma coleção armazena arquivos.',
    noDrive:
      'Há coleções de arquivos, mas o armazenamento não foi configurado.',
    noAccounts: 'O aplicativo não tem contas.',
    onlyUnrestrictedAccess:
      'Somente administradores têm acesso irrestrito; ainda não há permissões para outros usuários.',
    noWorkflows:
      'Não há ciclos de vida persistidos nem agendamentos habilitados.',
    noSchedules: 'Nenhum agendamento está habilitado.',
    noModelOrRunner:
      'É necessário um modelo habilitado e um agente, ou um executor.',
    noModelService: 'Nenhum serviço de modelo está habilitado.',
    noAgent: 'Nenhum agente foi definido.',
    noDocuments: 'Os espaços de conhecimento não têm documentos.',
    noConnectedMailbox: 'Nenhuma caixa de correio está conectada.',
    noChannel: 'Nenhum canal de notificação está configurado.',
    noApiKey: 'Não há chaves API.',
    noUsedApiKey: 'Há chaves API, mas ainda não foram utilizadas.',
    noClient: 'O aplicativo não fornece cliente NocoBase.',
    notConfigured: 'Não configurado.',
  },
  facts: {
    collectionOwnershipUnknown:
      'Foi encontrada uma extensão em execução sem classificação. A origem das coleções é incerta; os totais de negócio foram omitidos.',
    noApplicationCollections:
      'A camada de dados funciona, mas ainda não há coleções próprias do aplicativo.',
    applicationCollections: '{{count}} coleções próprias: {{names}}.',
    relations: '{{count}} relações entre elas.',
    fileCollections: '{{count}} coleções de arquivos: {{names}}.',
    accounts: '{{count}} contas acessam pela autenticação NocoBase.',
    permissionSets:
      '{{count}} conjuntos de permissões além do irrestrito: {{names}}.',
    accessRules:
      '{{count}} regras de compartilhamento, restrição ou acesso padrão.',
    lifecyclesWithoutTransitions:
      'O armazenamento de ciclos de vida está pronto; ainda não há transições.',
    lifecycles:
      '{{count}} ciclos de vida registraram {{transitions}} transições: {{names}}.',
    schedules: '{{count}} agendamentos habilitados.',
    agents: '{{count}} agentes, {{runs}} execuções.',
    documents: '{{count}} documentos de conhecimento.',
    mailboxes: '{{count}} caixas de correio conectadas.',
    mailboxesNeedAttention:
      '{{count}} caixas exigem atenção para voltar a sincronizar.',
    channels: '{{count}} canais de notificação: {{names}}.',
    usedApiKeys: '{{count}} chaves API usadas para chamar o aplicativo.',
    locales: '{{count}} idiomas: {{names}}.',
    migrations:
      '{{count}} migrações executadas, {{own}} próprias do aplicativo.',
    latestMigration: 'Última execução: {{at}}.',
    registeredExtension: 'A extensão está registrada neste aplicativo.',
  },
  parts: {
    accounts: 'Contas',
    organizations: 'Organizações',
    permissionSets: 'Conjuntos de permissões',
    sharingRules: 'Regras de compartilhamento',
    restrictionRules: 'Regras de restrição',
    defaultAccess: 'Acesso padrão',
    lifecycles: 'Ciclos de vida',
    schedules: 'Agendamentos',
    modelServices: 'Serviços de modelos',
    agents: 'Agentes',
    runners: 'Executores',
    migrations: 'Migrações',
    jobs: 'Tarefas',
    queue: 'Fila',
    secrets: 'Segredos',
    caching: 'Cache',
  },
  metrics: {
    businessRecords: 'registros de negócio',
    businessCollections: 'coleções de negócio',
    views: 'visualizações',
    fields: 'campos',
    relations: 'relações',
    systemCollections: 'coleções de sistema NocoBase',
    files: 'arquivos',
    storedBytes: 'armazenamento registrado',
    fileCollections: 'coleções de arquivos',
    accounts: 'contas',
    disabledAccounts: 'contas desabilitadas',
    invitations: 'convites',
    grants: 'autorizações',
    permissionSets: 'conjuntos de permissões',
    assignments: 'atribuições',
    sharingRules: 'regras de compartilhamento',
    restrictionRules: 'regras de restrição',
    defaultAccess: 'regras de acesso padrão',
    transitions: 'transições de estado',
    lifecycles: 'ciclos de vida com transições',
    effectsSucceeded: 'efeitos concluídos',
    effectsFailed: 'efeitos com falha',
    effectsPending: 'efeitos pendentes',
    schedules: 'agendamentos habilitados',
    scheduleOccurrences: 'ocorrências de agendamento',
    agents: 'agentes',
    modelServices: 'serviços de modelos habilitados',
    runners: 'executores',
    runs: 'execuções',
    modelCalls: 'chamadas ao modelo fora de execuções',
    tokens: 'tokens',
    documents: 'documentos',
    spaces: 'espaços de conhecimento',
    chunks: 'fragmentos',
    connectedMailboxes: 'caixas de correio conectadas',
    mailboxesNeedAttention: 'caixas que exigem atenção',
    messages: 'mensagens',
    submissions: 'mensagens submetidas para envio',
    failedSubmissions: 'envios com falha',
    acceptedDeliveries: 'entregas aceitas pelos fornecedores',
    notifications: 'notificações',
    deliveries: 'entregas',
    failedDeliveries: 'entregas com falha',
    pendingDeliveries: 'entregas em andamento',
    deliveryAttempts: 'tentativas de entrega',
    inAppMessages: 'mensagens internas',
    inAppMessagesRead: 'mensagens internas lidas',
    channels: 'canais',
    usedApiKeys: 'chaves API utilizadas',
    apiKeys: 'chaves API habilitadas',
    locales: 'idiomas',
    migrations: 'migrações executadas',
    applicationMigrations: 'migrações próprias do aplicativo',
    seeds: 'seeds executadas',
  },
  dynamic: {
    pending: 'Aguardando identificação',
    pendingDescription:
      'O plugin está registrado; sua configuração e uso real ainda não foram determinados.',
  },
};

export default ptBR;
