import type { SchedulerResource } from './en-US.js';

const ptBR: SchedulerResource = {
  // Titles the server registers with the authorization catalog, which resolve in this plugin's namespace.
  authorization: {
    title: 'Tarefas agendadas',
    read: 'Visualizar',
    manage: 'Gerenciar',
  },
  nav: { automation: 'Automação', schedules: 'Tarefas agendadas' },
  page: {
    title: 'Tarefas agendadas',
    description:
      'Tarefas que os plugins e a aplicação definem no código e que são executadas conforme uma programação. Veja quando são executadas e como cada execução terminou, e pause ou retome cada uma. As regras ficam no código; esta página não pode criá-las nem alterá-las.',
    loadFailed: 'Não foi possível carregar as tarefas agendadas.',
    retry: 'Tentar novamente',
    close: 'Fechar',
    copy: 'Copiar',
    copied: 'Copiado',
    loadMore: 'Carregar mais',
    none: '—',
    tabs: { tasks: 'Tarefas', runs: 'Execuções', config: 'Configuração' },
  },
  tasks: {
    attention: {
      title_one: '{{count}} item precisa de atenção',
      title_many: '{{count}} itens precisam de atenção',
      title_other: '{{count}} itens precisam de atenção',
      target:
        'O destino {{target}} de “{{title}}” não está disponível ({{state}}), então cada disparo é registrado como ignorado.',
      waiting:
        'A execução de “{{title}}” iniciada {{time}} ainda está aguardando o resultado.',
      failed: 'A última execução de “{{title}}” terminou como {{status}}.',
    },
    stats: {
      total: 'Tarefas agendadas',
      running: 'Ativas',
      attention: 'Precisam de atenção',
      next: 'Próxima execução',
      nextOf: 'Próxima execução · {{title}}',
    },
    filters: {
      all: 'Todas',
      running: 'Ativas',
      attention: 'Precisam de atenção',
      paused: 'Pausadas',
      removed: 'Removidas do código',
      search: 'Pesquisar por nome ou key',
    },
    columns: {
      task: 'Tarefa',
      rule: 'Regra',
      next: 'Próxima execução',
      last: 'Última execução',
      totals: 'Totais',
      state: 'Status',
      enabled: 'Ativada',
    },
    totals: '{{runs}} execuções · {{succeeded}} bem-sucedidas',
    noMatch: 'Nenhuma tarefa agendada corresponde a estes filtros.',
    enable: 'Retomar “{{title}}”',
    disable: 'Pausar “{{title}}”',
    toggleFailed: 'Não foi possível alterar a tarefa agendada.',
    readOnly:
      'Você pode ver as tarefas agendadas, mas não pausá-las nem retomá-las.',
    notes: {
      running:
        '“Ativa” significa apenas que a tarefa está ativada e seu destino existe; o resultado de cada execução indica se o trabalho foi bem-sucedido. Os totais contam todos os disparos, incluindo falhas e ignorados.',
      pause:
        'Pausar afeta apenas as execuções seguintes. Atualizações de código e novas implantações mantêm a chave como está.',
      removed:
        '“Removidas do código”: após `scheduler sync --finalize`, as tarefas que não estão mais no código são marcadas assim; o histórico é mantido e elas não podem ser retomadas.',
      internal:
        'Trabalhos internos em segundo plano, como novas tentativas de notificações, sincronização de e-mail, indexação de conhecimento e limpeza de execuções de agentes, não aparecem aqui; seus plugins os gerenciam.',
    },
  },
  state: {
    running: 'Ativa',
    paused: 'Pausada',
    unavailable: 'Destino indisponível',
    removed: 'Removida do código',
  },
  targetState: {
    ready: 'Disponível',
    disabled: 'Desativado',
    missing: 'Inexistente',
    invalid: 'Configuração inválida',
  },
  pause: {
    title: 'Pausar “{{title}}”?',
    description:
      'Ela deixa de ser executada no horário até que alguém a retome.',
    running:
      'Execuções já iniciadas ou aguardando resultado não são canceladas.',
    missed:
      'Ao retomar, ela continua a partir do próximo horário previsto; execuções perdidas durante a pausa não são recuperadas.',
    redeploy: 'Uma nova implantação não a retoma.',
    limit:
      'Em uma tarefa com limite de execuções, as execuções feitas até agora continuam contando.',
    cancel: 'Cancelar',
    confirm: 'Pausar',
  },
  empty: {
    title: 'Ainda não há tarefas agendadas',
    description:
      'As tarefas agendadas são definidas no código com `defineSchedule` por plugins ou pela aplicação. Instale um plugin que defina tarefas agendadas, ou defina uma na aplicação e reinicie, e elas aparecerão aqui.',
    internal:
      'Trabalhos internos em segundo plano, como novas tentativas de notificações, sincronização de e-mail e indexação de conhecimento, não aparecem aqui; eles continuam sendo executados com suas próprias regras.',
  },
  detail: {
    back: 'Tarefas agendadas',
    notFound: 'Esta tarefa agendada não existe.',
    key: 'Key',
    rule: 'Regra',
    upcoming: 'Próximas execuções',
    noUpcoming: 'Nenhuma prevista',
    window: 'Período · limite de execuções',
    unlimited: 'Ilimitado',
    windowFrom: 'a partir de {{time}}',
    windowTo: 'até {{time}}',
    limit_one: '{{count}} execução',
    limit_many: '{{count}} execuções',
    limit_other: '{{count}} execuções',
    target: 'Destino',
    totals: 'Totais',
    source: 'Definida em',
    sourceCode:
      'Código (`defineSchedule`). Para alterar a regra ou o destino, altere o código e implante novamente.',
    runs: 'Execuções',
    noRuns: 'Ainda não há execuções.',
    runsNote:
      'As execuções são listadas da mais recente para a mais antiga. A configuração do destino de uma execução nunca é retornada nem exibida. Um número de tentativas maior que 1 significa que a mesma execução foi entregue novamente; ela continua contando como uma execução.',
  },
  runs: {
    allTasks: 'Todas as tarefas agendadas',
    groups: {
      all: 'Todas',
      failed: 'Com falha · tempo esgotado',
      waiting: 'Aguardando resultado',
      skipped: 'Ignoradas',
      succeeded: 'Bem-sucedidas',
    },
    ranges: {
      day: 'Últimas 24 horas',
      week: 'Últimos 7 dias',
      month: 'Últimos 30 dias',
      quarter: 'Últimos 90 dias',
    },
    columns: {
      planned: 'Horário previsto',
      task: 'Tarefa agendada',
      result: 'Resultado',
      reason: 'Motivo · relacionado',
      executions: 'Tentativas',
      duration: 'Duração',
      summary: 'Resumo do resultado',
    },
    noRuns: 'Nenhuma execução corresponde a estes filtros.',
    notes: {
      order:
        'Execuções de todas as tarefas agendadas, da mais recente para a mais antiga. Falhas, tempos esgotados e esperas longas também aparecem no topo da aba Tarefas.',
      removed: 'As tarefas removidas do código mantêm seu histórico aqui.',
    },
  },
  status: {
    pending: 'Na fila',
    running: 'Em execução',
    waiting: 'Aguardando resultado',
    succeeded: 'Bem-sucedida',
    failed: 'Com falha',
    skipped: 'Ignorada',
    cancelled: 'Cancelada',
    timed_out: 'Tempo esgotado',
    triggered: 'Disparada (registro antigo)',
  },
  reason: {
    'target-missing': 'O destino não existe',
    'target-disabled': 'O destino está desativado',
    'target-invalid': 'A configuração do destino é inválida',
    'target-not-found': 'O tipo de destino não está registrado',
    'invalid-config': 'A configuração do destino é inválida',
    'dispatch-failed': 'Falhou ao iniciar; consulte o log do servidor',
    'observer-failed': 'Falha ao verificar o resultado do destino',
    'observer-unavailable': 'O destino não consegue informar seu resultado',
  },
  run: {
    title: '{{title}} · {{time}}',
    timeline: 'Linha do tempo',
    started: 'Iniciada',
    accepted: 'Aceita pelo destino',
    finished: 'Concluída',
    notYet: 'Ainda sem resultado',
    executions: 'Tentativas',
    target: 'Destino',
    related: 'Relacionado',
    receipt: 'Comprovante',
    summary: 'Resumo do resultado',
    reason: 'Motivo',
    waitingNote:
      'Enquanto uma execução aguarda o resultado, o agendador consulta o estado do destino até que ele informe sucesso, falha, cancelamento ou tempo esgotado. O agendador não define nenhum tempo limite; quem decide é o destino. Quando uma execução aguarda por muito tempo, abra o item relacionado para ver o progresso.',
  },
  config: {
    memory:
      'As tarefas agendadas são executadas na memória desta instância: adequado apenas para uma única instância.',
    memoryHint:
      'Com uma instância não há nada a mudar; para executar várias, siga “Mudar para Redis” abaixo.',
    shared:
      'As tarefas agendadas são executadas em {{adapter}}: várias instâncias podem executá-las.',
    columns: {
      setting: 'Configuração',
      value: 'Valor atual',
      effect: 'Efeito nas tarefas agendadas',
      source: 'Origem',
    },
    sources: {
      environment: 'Variável de ambiente',
      config: 'config.yml',
      default: 'Padrão',
      backend: 'Definido pelo backend',
    },
    rows: {
      configuration: 'Configuração de jobs',
      backend: 'Backend',
      multiInstance: 'Várias instâncias',
      concurrency: 'Concorrência',
      attempts: 'Tentativas',
      connection: 'Conexão',
    },
    builtIn: 'memory integrada',
    selectedByScheduler:
      'Escolhido por `scheduler.jobs` (`SCHEDULER_JOBS`) apenas para as tarefas agendadas.',
    selectedByDefault:
      '`scheduler.jobs` não está definido, então as tarefas agendadas seguem `jobs.default`.',
    selectedByBuiltIn:
      'Nem `scheduler.jobs` nem `jobs.default` estão definidos, então o padrão integrado é aplicado.',
    memoryBackend: 'memory (esta instância)',
    memoryEffect:
      'As regras ficam na memória deste processo e são gravadas em {{path}} quando ele para normalmente.',
    sharedEffect:
      'As regras ficam em {{adapter}}, compartilhadas por todas as instâncias.',
    plugin: '{{plugin}} registrado',
    supported: 'Compatível',
    unsupported: 'Não compatível',
    multiSupported:
      'Cada disparo é executado em uma única instância; quando uma instância falha, uma execução pode ocasionalmente ser entregue novamente.',
    multiUnsupported:
      'Cada instância executa cada tarefa agendada por conta própria, então a mesma tarefa é executada várias vezes.',
    concurrencyEffect_zero:
      'Até {{count}} execuções ao mesmo tempo; as demais aguardam na fila.',
    concurrencyEffect_one:
      'Uma execução por vez; uma execução lenta faz as outras que vencem aguardarem.',
    concurrencyEffect_many:
      'Até {{count}} execuções ao mesmo tempo; as demais aguardam na fila.',
    concurrencyEffect_other:
      'Até {{count}} execuções ao mesmo tempo; as demais aguardam na fila.',
    attemptsOk: 'Correto',
    attemptsWarn: 'Deveria ser 1',
    attemptsEffect:
      'Uma execução com falha é registrada como falha e a tarefa é executada novamente no próximo horário; mantenha este valor em 1.',
    attemptsWarnEffect:
      'Uma execução com falha já fica registrada, então uma nova tentativa da mesma execução não faz nada; defina as tentativas como 1.',
    connectionValue: '{{connection}} · namespace {{namespace}}',
    namespaceOnly: 'namespace {{namespace}}',
    connectionEffect: 'A senha nunca é exibida.',
    redis: {
      title: 'Mudar para Redis (para várias instâncias)',
      step1:
        'Instale o plugin comercial `@nocobase/app-plugin-jobs-redis` e registre-o em todas as instâncias.',
      step2:
        'Adicione um backend Redis ao `config.yml` e aponte as tarefas agendadas para ele (trecho abaixo).',
      step3:
        'Implante novamente todas as instâncias, depois volte e verifique se “Várias instâncias” mostra Compatível.',
      warning:
        'Se o nome estiver errado, o plugin não estiver registrado ou o Redis não puder ser acessado, a aplicação não inicia; ela nunca volta para memory.',
    },
    removed: {
      title: 'Tarefas agendadas removidas do código',
      consistent: 'Consistente, nada a fazer.',
      consistentHint:
        'Quando uma tarefa agendada é excluída do código e implantada, ela aparece aqui com instruções de limpeza.',
      warning_one:
        '{{count}} tarefa agendada não está mais no código desta versão, mas ainda não foi limpa.',
      warning_many:
        '{{count}} tarefas agendadas não estão mais no código desta versão, mas ainda não foram limpas.',
      warning_other:
        '{{count}} tarefas agendadas não estão mais no código desta versão, mas ainda não foram limpas.',
      warningHint:
        'Elas não são executadas no horário (o log mostra “A schedule fired that this instance has no definition for”), mas a lista de tarefas as exibe normalmente.',
      columns: {
        task: 'Tarefa agendada',
        last: 'Última execução',
        after: 'Após a limpeza',
      },
      after:
        'Marcada como “Removida do código”, nunca mais dispara e mantém o histórico.',
      neverRan: 'Nunca executada',
      how: 'Como limpar',
      howHint:
        'Quando todas as instâncias estiverem executando a nova versão, execute isto uma vez em qualquer servidor:',
      why: 'Por que não automaticamente: durante uma implantação gradual, versões antigas e novas são executadas lado a lado, e uma limpeza automática poderia remover tarefas que a versão antiga ainda usa.',
      full: 'Execute apenas em uma build completa que inclua todos os plugins; caso contrário, as tarefas dos plugins que ela não carregou também serão marcadas como removidas.',
    },
    readOnly:
      'Esta página é somente leitura: estas configurações ficam na configuração da aplicação e entram em vigor na próxima implantação. Caches, filas e outros serviços são tratados nas configurações de cluster e distribuição.',
  },
  cron: {
    everyMinute: 'A cada minuto',
    everyMinutes: 'A cada {{count}} minutos',
    everyHour: 'A cada hora, no minuto {{minute}}',
    everyHours: 'A cada {{count}} horas',
    daily: 'Todos os dias às {{time}}',
    weekdays: 'De segunda a sexta às {{time}}',
    weekly: 'Toda semana, {{day}} às {{time}}',
    monthly: 'Dia {{day}} de cada mês às {{time}}',
  },
};

export default ptBR;
