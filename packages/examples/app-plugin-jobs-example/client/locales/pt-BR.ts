import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  authorization: {
    title: 'Exemplos de cronogramas de trabalhos',
    update: 'Regras de início e parada',
  },
  navigation: {
    group: 'Exemplo de empregos',
    jobs: 'Trabalhos pontuais',
    schedules: 'Agendamentos',
  },
  jobs: {
    title: 'Trabalhos em segundo plano',
    description:
      'Cada trabalho espera na fila, depois funciona por dez segundos e relata 10% de progresso a cada segundo. O progresso chega em WebSocket enquanto esta página está aberta.',
    create: 'Criar trabalho',
    creating: 'Criando…',
    listTitle: 'Seus trabalhos',
    count: 'Trabalhos {{count}}',
    empty: 'Ainda não há empregos. Crie um para observar seu progresso.',
    loading: 'Carregando…',
    job: 'Trabalho {{id}}',
    createdAt: 'Criado {{time}}',
    attempt: 'Tentativa {{attempt}}',
    progress: 'Progresso',
    live: 'Ao vivo',
    offline: 'Reconectando',
  },
  schedules: {
    title: 'Agendamentos',
    description:
      'Regras recorrentes em um ScheduleExecutor. Cada regra que esta página pode iniciar é definida em código, portanto, seu manipulador é registrado antes do início do executor - uma regra iniciada antes de uma reinicialização continua em execução depois dela. As alterações chegam por WebSocket enquanto esta página está aberta.',
    listTitle: 'Regras',
    loading: 'Carregando…',
    start: 'Iniciar',
    stop: 'Parar',
    builtIn: 'Construído em',
    every: 'Cada {{seconds}}s',
    cron: 'Cron {{cron}} (UTC)',
    limit: 'no máximo vezes {{limit}}',
    nextRun: 'Próxima execução em {{seconds}}s',
    nextRunDue: 'Próxima execução prevista para agora',
    noNextRun: 'Não há mais corridas',
    firings: '{{count}} é executado nesta instância',
    delay: 'iniciou {{ms}} ms atrasado',
    noRuns: 'Ainda não há corridas.',
    live: 'Ao vivo',
    offline: 'Reconectando',
    rule: {
      heartbeat: 'Batimento cardíaco',
      interval: 'Intervalo',
      limited: 'Limitado',
      cron: 'Cron',
    },
    ruleDescription: {
      heartbeat:
        'O plugin escreve esta regra a cada inicialização e nunca a interrompe.',
      interval:
        'Altera o intervalo enquanto ele é executado; a próxima execução é planejada a partir da nova.',
      limited:
        'Termina sozinho após cinco execuções. Comece novamente por mais cinco.',
      cron: 'Executa no início de cada minuto.',
    },
    state: {
      active: 'Ativo',
      ended: 'Terminado',
      stopped: 'Parado',
    },
    outcome: {
      running: 'Em execução',
      succeeded: 'Sucesso',
      failed: 'Falha',
    },
  },
  status: {
    queued: 'Na fila',
    running: 'Em execução',
    completed: 'Concluído',
    failed: 'Falha',
  },
};

export default ptBR;
