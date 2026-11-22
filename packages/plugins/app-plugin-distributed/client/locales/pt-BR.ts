import type { DistributedResource } from './en-US.js';

const ptBR: DistributedResource = {
  view: {
    deployment: 'Modo de implantação',
    multi: 'Várias instâncias',
    configuration: 'Configuração atual',
    checks: 'Verificações entre instâncias',
    backends: 'Backends dos serviços',
    readiness: 'Verificações antes de escalar',
    pending: 'Pendentes',
    all: 'Todas',
    empty: 'Nenhuma verificação pendente.',
    blockers: 'Correções obrigatórias · {{count}}',
    scope:
      'Configuração desta instância. Implante novamente o aplicativo após alterar a configuração.',
  },
  nav: {
    title: 'Cluster e distribuição',
    description:
      'Quais backends esta instância usa e se a aplicação pode rodar em várias instâncias.',
  },
  page: {
    description:
      'Para rodar em vários servidores ou processos, cache, bloqueios, tarefas em segundo plano, filas, mensagens em tempo real e geração de IDs precisam usar backends compartilhados. Esta página mostra os backends que esta instância realmente selecionou e de onde vem cada configuração, e verifica se a aplicação pode rodar com segurança em várias instâncias. As configurações ficam na configuração da aplicação; faça um novo deploy depois de alterá-las.',
    loading: 'Carregando…',
    loadFailed: 'Não foi possível carregar o status.',
    retry: 'Tentar novamente',
  },
  summary: {
    single: 'Instância única',
    singleCaption: 'A configuração atual atende a uma instância',
    singleBlockedCaption: 'Há itens a corrigir mesmo com uma instância',
    shared: '{{shared}} / {{total}}',
    sharedCaption: 'serviços compartilhados',
    requiredCaption: 'a corrigir',
    recommendedCaption: 'recomendados',
  },
  sections: {
    scale: 'Pode rodar em várias instâncias?',
    services: 'Serviços compartilhados',
    idGeneration: 'Geração de IDs',
    checklist: 'Antes de entrar em produção',
    notes: 'Observações',
  },
  level: {
    required: 'Obrigatório',
    recommended: 'Recomendado',
    ok: 'OK',
  },
  singleBlocked:
    'Mesmo com uma única instância, os itens marcados como “Corrigir” precisam de atenção.',
  singleHint:
    'Rodar uma única instância não exige nenhuma alteração. Para escalar: prepare o Redis e um banco de dados PostgreSQL ou MySQL compartilhado → instale os plugins de Redis necessários → altere a configuração → verifique com duas instâncias.',
  fix: 'Como corrigir',
  table: {
    service: 'Serviço',
    backend: 'Backend selecionado',
    sharing: 'Escopo',
    plugin: 'Plugin de Redis',
    source: 'Origem',
    adapter: 'Adaptador',
  },
  services: {
    caching: {
      name: 'Cache',
      usage: 'Estado de login, permissões, cache de configuração',
    },
    concurrency: {
      name: 'Bloqueios de concorrência',
      usage: 'Migrações, numeração, idempotência',
    },
    jobs: {
      name: 'Tarefas em segundo plano',
      usage: 'Tarefas agendadas, indexação de conhecimento',
    },
    queue: { name: 'Fila', usage: 'Entrega de notificações' },
    realtime: {
      name: 'Mensagens em tempo real',
      usage: 'Caixa de entrada, presença',
    },
  },
  sharing: {
    shared: 'Compartilhado entre instâncias',
    local: 'Somente esta instância',
    unknown: 'Não declarado',
  },
  source: { configured: 'Configurado', default: 'Padrão' },
  notSet: '(não definido)',
  unavailable: 'Não usado por esta aplicação',
  unregistered: 'Adaptador não registrado',
  selections: 'Escolhidos por nome',
  selection: '{{consumer}} → {{backend}}',
  howToChange: 'Como alterar',
  howToChangeIntro:
    'Instale o plugin de Redis de cada serviço, registre o plugin de servidor dele e selecione-o na configuração:',
  idGeneration: {
    mode: 'Modo',
    modeHint:
      'Com várias instâncias, atribua os worker IDs automaticamente para que cada instância receba o seu.',
    auto: 'Automático · um worker ID por instância',
    manual: 'Manual · workerId {{workerId}}',
  },
  checklist: {
    intro:
      'A página não consegue verificar estes itens sozinha. Confirme-os agindo em duas instâncias:',
    files:
      'Um arquivo enviado na instância A pode ser baixado pela instância B',
    realtime:
      'Uma mensagem gerada em A chega em tempo real a um usuário conectado a B, e nada se perde após reconectar',
    queue:
      'Uma tarefa enfileirada em A pode ser processada por B, e novas tentativas não repetem efeitos colaterais',
    secrets:
      'Todas as instâncias usam as mesmas secrets.keys, e o login funciona entre instâncias',
    websocket:
      'O balanceador de carga encaminha conexões WebSocket e corresponde ao caminho e ao domínio da aplicação',
  },
  notes: {
    current:
      'Esta página mostra apenas a instância à qual você está conectado. Ela não consegue saber se as outras instâncias têm a mesma configuração; faça o deploy de todas a partir de uma única configuração.',
    noTest:
      'Não há “Testar conexão”: os plugins de Redis se conectam quando a aplicação inicia, e a aplicação não inicia se eles não conseguirem. Erros de conexão durante a execução aparecem nos logs.',
    instances:
      'A lista de instâncias em execução só aparece com worker IDs automáticos, fornecidos por um plugin comercial.',
  },
  checks: {
    database: {
      sqlite: {
        title: 'Banco de dados',
        detail:
          'O SQLite atende a apenas uma instância. Várias instâncias precisam de PostgreSQL ou MySQL.',
        fix: 'Migre os dados para PostgreSQL ou MySQL e aponte a conexão principal do banco de dados para ele.',
      },
      shared: {
        title: 'Banco de dados',
        detail:
          '{{dialect}} pode ser compartilhado por várias instâncias. Antes de publicar, confirme que todas as instâncias se conectam ao mesmo banco de dados.',
      },
    },
    service: {
      unregistered: {
        title: '{{service}}',
        detail:
          '{{configPath}} seleciona o adaptador “{{adapter}}”, que nenhum plugin registrado fornece. O serviço falhará no primeiro uso.',
        fix: 'Instale e registre o plugin que fornece “{{adapter}}”, ou selecione outro backend.',
      },
      local: {
        title: '{{service}} ainda é local a esta instância',
        detail:
          'Cada instância mantém seu próprio estado. Instale {{plugin}} e defina {{configPath}} com um backend Redis.',
        fix: 'Instale {{plugin}}, registre o plugin de servidor dele e selecione-o:',
      },
      undeclared: {
        title: '{{service}}',
        detail:
          'O adaptador “{{adapter}}” não declara se é compartilhado entre instâncias. Confirme com o plugin que o fornece.',
      },
      selectionUndeclared: {
        title: '{{service}}',
        detail:
          '{{consumer}} usa explicitamente o backend “{{backend}}”, cujo adaptador não declara se é compartilhado entre instâncias. Confirme com o plugin que o fornece.',
      },
      selectionLocal: {
        title: '{{service}}',
        detail:
          '{{consumer}} usa explicitamente o backend “{{backend}}”, que é local a esta instância.',
      },
    },
    services: {
      local: {
        title:
          'Cache, bloqueios, tarefas em segundo plano, fila, mensagens em tempo real',
        detail: 'Tudo local a esta instância: {{services}}.',
      },
    },
    files: {
      local: {
        title: 'Armazenamento de arquivos',
        detail:
          'Os arquivos de {{collections}} ficam no disco deste host; as outras instâncias não conseguem lê-los.',
        fix: 'Use um armazenamento compartilhado, como S3, para essas coleções de arquivos e mova os arquivos existentes para lá.',
      },
      defaultLocal: {
        title: 'Armazenamento de arquivos',
        detail:
          'O armazenamento padrão guarda os arquivos no disco deste host; as outras instâncias não conseguem lê-los.',
        fix: 'Defina como padrão um armazenamento compartilhado, como S3.',
      },
      shared: {
        title: 'Armazenamento de arquivos',
        detail:
          'Nenhuma coleção de arquivos guarda arquivos no disco deste host.',
      },
      unchecked: {
        title: 'Armazenamento de arquivos',
        detail:
          'Não foi possível ler as coleções de arquivos das conexões {{connections}}, então não se sabe se guardam arquivos no disco deste servidor.',
      },
    },
    idGeneration: {
      auto: {
        title: 'Geração de IDs',
        detail:
          'Atribuição automática: cada instância recebe seu próprio worker ID.',
      },
      manual: {
        title: 'Geração de IDs',
        detail:
          'Worker ID manual {{workerId}}. Duas instâncias com o mesmo worker ID podem gerar os mesmos IDs.',
        fix: 'Dê a cada instância seu próprio SNOWFLAKE_WORKER_ID, ou instale um plugin que atribua worker IDs automaticamente.',
      },
    },
    secrets: {
      set: {
        title: 'Segredos',
        detail:
          'secrets.keys está definido. Garanta que todas as instâncias usem as mesmas chaves.',
      },
      missing: {
        title: 'Segredos',
        detail:
          'secrets.keys não está definido. Todas as instâncias precisam das mesmas chaves para ler o que as outras criptografam.',
        fix: 'Gere uma chave com openssl rand -hex 32 e defina-a em todas as instâncias.',
      },
    },
    publicOrigin: {
      invalid: {
        title: 'Endereço público',
        detail:
          'app.publicOrigin está definido, mas não é um endereço http ou https.',
        fix: 'Defina app.publicOrigin como o endereço que os usuários abrem, por exemplo https://apps.example.com.',
      },
      set: {
        title: 'Endereço público',
        detail: 'app.publicOrigin = {{origin}}',
      },
      missing: {
        title: 'Endereço público',
        detail:
          'app.publicOrigin não está definido. Atrás de um balanceador de carga, links e callbacks precisam do endereço público.',
        fix: 'Defina app.publicOrigin como o endereço que os usuários abrem.',
      },
    },
    checkFailed: {
      title: 'Uma verificação não pôde ser executada',
      detail: 'A verificação “{{check}}” falhou; consulte os logs.',
    },
  },
};

export default ptBR;
