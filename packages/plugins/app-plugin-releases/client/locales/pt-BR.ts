import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  access: {
    section: 'Versões',
    pages: {
      'rel-apps': 'Aplicativos',
    },
    businessSection: 'Versões',
    businesses: {
      apps: {
        title: 'Aplicativos',
        description:
          'Aplicativos, seus lançamentos, implantações e tempo de execução.',
        actions: {
          view: {
            title: 'Ver aplicativos',
            description:
              'Veja Apps, seus lançamentos, implantações e status de tempo de execução',
            related: 'Ver aplicativos (aqueles relacionados a eles)',
            relatedLabel: 'Aqueles que eu criei',
            relatedHint:
              'Aplicativos que criei e qualquer aplicativo relacionado a mim',
            all: 'Ver aplicativos (todos)',
          },
          readLogs: {
            title: 'Ler registros',
            description: 'Ler registros de aplicativos e implantação',
            related: 'Ler logs (aqueles relacionados a eles)',
            relatedLabel: 'Aqueles que eu criei',
            relatedHint:
              'Aplicativos que criei e qualquer aplicativo relacionado a mim',
            all: 'Ler logs (todos)',
          },
          create: {
            title: 'Criar aplicativos',
            description: 'Criar aplicativos em um ambiente',
            all: 'Criar aplicativos',
          },
          configure: {
            title: 'Configurar aplicativos',
            description:
              'Ler e alterar a configuração de um aplicativo, que pode conter segredos',
            related: 'Configurar aplicativos (aqueles relacionados a eles)',
            relatedLabel: 'Aqueles que eu criei',
            relatedHint:
              'Aplicativos que criei e qualquer aplicativo relacionado a mim',
            all: 'Configurar aplicativos (todos)',
          },
          upload: {
            title: 'Carregar versões',
            description: 'Carregar e promover lançamentos',
            related: 'Carregar lançamentos (aqueles relacionados a eles)',
            relatedLabel: 'Aqueles que eu criei',
            relatedHint:
              'Aplicativos que criei e qualquer aplicativo relacionado a mim',
            all: 'Carregar versões (todas)',
          },
          deploy: {
            title: 'Implantar',
            description:
              'Implantar e reverter em ambientes desprotegidos, solicitar implantações em ambientes protegidos',
            related: 'Implantar (aqueles relacionados a eles)',
            relatedLabel: 'Aqueles que eu criei',
            relatedHint:
              'Aplicativos que criei e qualquer aplicativo relacionado a mim',
            all: 'Implantar (todos)',
          },
          deployProtected: {
            title: 'Aprovar implantações protegidas',
            description:
              'Aprovar implantações em ambientes protegidos que não nomeiam aprovadores; apenas pessoas',
            related:
              'Aprovar implantações protegidas (aquelas relacionadas a elas)',
            relatedLabel: 'Aqueles que eu criei',
            relatedHint:
              'Aplicativos que criei e qualquer aplicativo relacionado a mim',
            all: 'Aprovar implantações protegidas (todas)',
          },
          operate: {
            title: 'Iniciar e parar',
            description: 'Iniciar, parar e reiniciar aplicativos',
            related: 'Iniciar e parar (aqueles relacionados a eles)',
            relatedLabel: 'Aqueles que eu criei',
            relatedHint:
              'Aplicativos que criei e qualquer aplicativo relacionado a mim',
            all: 'Iniciar e parar (todos)',
          },
          delete: {
            title: 'Excluir aplicativos',
            description: 'Excluir um aplicativo com seus dados',
            related: 'Excluir aplicativos (aqueles relacionados a eles)',
            relatedLabel: 'Aqueles que eu criei',
            relatedHint:
              'Aplicativos que criei e qualquer aplicativo relacionado a mim',
            all: 'Excluir aplicativos (todos)',
          },
        },
      },
    },
    recordAccess: {
      owned: 'Aplicativos que eles criaram',
    },
    settings: {
      rel: {
        environments: 'Implantar ambientes',
      },
    },
    keyScopes: {
      apps: {
        title: 'Aplicativos e implantações',
        description:
          'Leia: veja aplicativos, versões, implantações e logs. Ler e escrever: também fazer upload de lançamentos. Administrador: também implante e inicie ou interrompa aplicativos.',
        objects: 'Aplicativos',
      },
      environments: {
        title: 'Implantar ambientes',
        description: 'Leia: listar ambientes. Ler e escrever: gerencie-os.',
      },
      presets: {
        ciDeploy: {
          title: 'Implantação de CI',
          description:
            'Faça upload de versões para os aplicativos escolhidos e implante-os por 90 dias.',
        },
        ciUpload: {
          title: 'Carregamento de CI',
          description:
            'Carregar versões para os aplicativos escolhidos sem implantá-los, por 90 dias.',
        },
      },
    },
    actions: {
      read: 'Visualizar',
      manage: 'Gerenciar',
      view: 'Visualizar',
      'read-logs': 'Ler registros',
      create: 'Criar',
      configure: 'Configurar',
      upload: 'Carregar versões',
      deploy: 'Implantar',
      'deploy-protected': 'Aprovar implantações protegidas',
      operate: 'Iniciar e parar',
      delete: 'Excluir',
    },
  },
  drivers: {
    host: 'Este servidor',
  },
  ui: {
    nav: {
      apps: 'Aplicativos',
      environments: 'Implantar ambientes',
    },
    apps: {
      title: 'Aplicativos',
      description: 'Aplicativos, suas versões e onde são implantados.',
      search: 'Pesquise por ID ou nome',
      create: 'Criar aplicativo',
      id: 'ID do aplicativo',
      name: 'Nome',
      environment: 'Ambiente',
      version: 'Versão',
      state: 'Estado',
      url: 'Endereço',
      labels: 'Etiquetas',
      loadFailed: 'Não foi possível carregar os aplicativos.',
      loadOneFailed: 'Não foi possível carregar o aplicativo.',
      emptyTitle: 'Nenhum aplicativo ainda',
      emptyNoAccess: 'Peça a um administrador para criar um aplicativo.',
      emptyDescription:
        'Crie um aplicativo, carregue uma versão e implante-o em um ambiente.',
      noResults: 'Nenhum aplicativo corresponde à pesquisa.',
      created: '{{name}} criado.',
      createDescription:
        'Um aplicativo é implantado em um ambiente; seus lançamentos são carregados posteriormente.',
      idHint:
        'Letras, dígitos, sublinhados e hífens; parte do seu endereço. Não pode mudar mais tarde.',
      noEnvironment: 'Nenhum ambiente ainda',
      lastAccess: 'Última visita',
    },
    advanced: 'Avançado (opcional)',
    labels: {
      name: 'Nome',
      value: 'Valor',
      nameOf: 'Nome da etiqueta {{index}}',
      valueOf: 'Valor do rótulo {{index}}',
      remove: 'Remover rótulo {{index}}',
      add: 'Adicionar rótulo',
      hint: 'Os rótulos permitem que ferramentas e pessoas encontrem e agrupem aplicativos e lançamentos.',
      count_one: 'Etiqueta {{count}}',
      count_other: 'Etiquetas {{count}}',
      system: 'Etiquetas adicionadas pelo sistema',
      systemHint: 'Adicionado pelo sistema; não pode ser alterado aqui.',
      errors: {
        keyRequired: 'Insira um nome para este valor.',
        keyInvalid:
          'Utilize letras, dígitos, ".", "_", "/" ou "-", começando com uma letra ou dígito (no máximo 63).',
        keyDuplicate: 'Este nome já é usado.',
        valueTooLong: 'No máximo caracteres {{max}}.',
        tooMany: 'No máximo rótulos {{max}}.',
      },
      count_many: 'Etiquetas {{count}}',
    },
    policy: {
      title: 'Ambiente de execução',
      activationLabel: 'Iniciar',
      activation: {
        eager: 'Sempre em execução',
        onDemand: 'Inicia visita',
      },
      activationHint: {
        eager:
          'Iniciado quando implantado e sempre que o tempo de execução for reiniciado.',
        onDemand:
          'Iniciado pela primeira visita após uma implantação ou reinicialização do tempo de execução.',
      },
      idleLabel: 'Parar quando não for visitado por',
      dormantLabel: 'Hibernar quando não for visitado por',
      idleModeLabel: 'Comportamento do temporizador de inatividade',
      dormantModeLabel: 'Comportamento do temporizador de hibernação',
      minutes: 'minutos',
      hours: 'horas',
      neverIdle: 'Nunca',
      neverDormant: 'Nunca',
      timerMode: {
        inherit: 'Usar o valor padrão do ambiente',
        custom: 'Definir um valor personalizado',
      },
      customTimerHint:
        'Um valor personalizado vazio desativa este temporizador; o valor padrão do ambiente não é usado.',
      idleSummary: 'para após {{minutes}} min não visitado',
      dormantSummary: 'hiberna após {{hours}} h',
      timersHint:
        'Um aplicativo interrompido libera memória e inicia novamente na próxima visita. Um aplicativo em hibernação também tem seus arquivos descompactados removidos; a configuração e os dados são mantidos e a próxima visita os prepara novamente, o que leva mais tempo.',
      unsupported:
        'Este ambiente não suporta início de visita; o aplicativo continua em execução.',
      errors: {
        idleInvalid:
          'Insira minutos inteiros de 1 a {{max}} ou deixe em branco.',
        dormantInvalid:
          'Insira as horas de 0,02 (um minuto) a {{max}} ou deixe em branco.',
        dormantBeforeIdle: 'A hibernação deve ocorrer após a parada.',
      },
    },
    state: {
      pending: 'Iniciando',
      starting: 'Iniciando',
      running: 'Em execução',
      stopped: 'Parado',
      stoppedOnDemand: 'Parado (inicia na visita)',
      dormant: 'Hibernação (preparado na visita)',
      failed: 'Falha',
      unknown: 'Desconhecido',
      deploying: 'Implantação',
    },
    operate: {
      refreshFailed:
        'Não foi possível atualizar o estado do aplicativo. As operações ficam indisponíveis até que o estado seja atualizado. Verifique sua conexão e acesso e tente novamente.',
      disabled: {
        busy: 'Uma operação está em andamento.',
        unavailable:
          'O estado do aplicativo não está disponível. Atualize o estado antes de operar o aplicativo.',
        deploying: 'Uma implantação está em andamento.',
        starting: 'O aplicativo está sendo iniciado.',
        notDeployed: 'Implante uma versão primeiro.',
        alreadyRunning: 'O aplicativo já está em execução.',
        notRunning: 'O aplicativo não está em execução.',
      },
      start: 'Iniciar',
      stop: 'Parar',
      restart: 'Reiniciar',
      done: {
        start: 'O aplicativo está sendo iniciado.',
        stop: 'O aplicativo parou.',
        restart: 'O aplicativo está reiniciando.',
      },
    },
    releases: {
      title: 'Versões',
      upload: 'Carregar uma versão',
      uploadAction: 'Enviar',
      commit: 'Commit',
      commitHint:
        'Opcional: o commit a partir do qual este arquivo foi construído, salvo como o rótulo sha.',
      uploaded: 'Liberação carregada.',
      checksum: 'Soma de verificação',
      size: 'Tamanho',
      created: 'Criado',
      empty:
        'Ainda sem lançamento. Faça upload de um pacote .tar.gz criado para este aplicativo.',
      loadFailed: 'Não foi possível carregar as versões.',
    },
    deploy: {
      deploy: 'Implantar',
      started: 'Implantando {{version}}.',
      confirmProtected:
        'Este ambiente está protegido. Digite {{appId}} para implantar.',
    },
    deployments: {
      title: 'Implantações',
      kind: 'Gentil',
      status: 'Status',
      by: 'Por',
      current: 'Atual',
      logs: 'Registros',
      rollback: 'Reverter',
      rollbackStarted: 'Revertendo.',
      confirmRollbackTitle: 'Reverter {{name}}?',
      confirmRollback:
        'O aplicativo retorna para a versão dessa implantação; o que foi implantado desde então é retomado.',
      loadFailed: 'Não foi possível carregar as implantações.',
      empty: 'Ainda não implantado.',
      hideLogs: 'Ocultar registros',
      noLogs: 'Sem linhas de registro.',
      statuses: {
        queued: 'Na fila',
        deploying: 'Implantação',
        succeeded: 'Sucesso',
        failed: 'Falha',
      },
    },
    actors: {
      human: 'pessoa',
      agent: 'agente',
      key: 'tecla',
      rule: 'regra',
      system: 'sistema',
    },
    requests: {
      title: 'Solicitações de implantação',
      pendingApproval: 'Aprovação pendente',
      notice: {
        deploy: 'solicitou a implantação de {{version}} em {{environment}}',
        rollback:
          'solicitou reverter {{environment}} de volta para {{version}}',
      },
      someone: 'Alguém',
      review: 'Revisão',
      view: 'Visualizar',
      comment: 'Comentário (opcional)',
      decideFailed: 'A decisão não foi aprovada',
      request: 'Solicitar implantação',
      created: 'Implantação solicitada.',
      approve: 'Aprovar',
      confirmApproveTitle: 'Aprova a implantação de {{appId}}?',
      reject: 'Rejeitar',
      cancel: 'Retirar',
      requestedBy: 'Solicitado por',
      decidedBy: 'Decidido por',
      note: 'Nota',
      approvedToast: 'Aprovada a implantação de {{appId}}.',
      rejectedToast: 'Rejeitou a implantação de {{appId}}.',
      app: 'Aplicativo',
      commit: 'Commit',
      build: 'Construir',
      ciLog: 'Registro de IC',
      requestedAt: 'Solicitado',
      decisionNote: 'Nota de decisão',
      pinned:
        'soma de verificação {{checksum}}; aprovar implanta exatamente isso',
      loadFailed: 'Não foi possível carregar a solicitação de implantação.',
      detailTitle: {
        deploy: 'Solicitação de implantação para {{appId}}',
        rollback: 'Solicitação de reversão para {{appId}}',
      },
      reviewTitle: {
        deploy: 'Revise a solicitação de implantação para {{appId}}',
        rollback: 'Revise a solicitação de reversão para {{appId}}',
      },
      done: {
        approve: 'Solicitação aprovada.',
        reject: 'Pedido rejeitado.',
        cancel: 'Pedido retirado.',
      },
      kind: {
        deploy: 'Implantar',
        rollback: 'Reversão',
      },
      status: {
        pending: 'Pendente',
        approved: 'Aprovado',
        rejected: 'Rejeitado',
        cancelled: 'Retirado',
        deployed: 'Implantado',
        failed: 'Falha',
      },
    },
    variables: {
      title: 'Variáveis',
      description:
        'Variáveis de ambiente com as quais este aplicativo é executado. Cada alteração é salva de uma só vez e chega ao aplicativo na próxima implantação.',
      environmentDescription:
        'Cada aplicativo neste ambiente, incluindo visualizações de pull request, obtém isso, a menos que defina o seu próprio. Listado com o que a versão mais recente de cada aplicativo declara. As alterações são salvas de uma só vez e chegam ao aplicativo em sua próxima implantação.',
      add: 'Adicionar variável',
      name: 'Nome',
      value: 'Valor',
      source: 'Fonte',
      secret: 'Segredo',
      secretHint: 'Um segredo nunca mais é mostrado depois de salvo.',
      nameHint:
        'Letras maiúsculas, dígitos e sublinhados, começando com uma letra.',
      invalidName:
        'Utilize letras maiúsculas, dígitos e sublinhados, começando com uma letra.',
      valueOf: 'Valor de {{name}}',
      set: 'Definir',
      notSet: 'Não definido',
      sources: {
        app: 'Aplicativo',
        environment: 'Do meio ambiente',
        configFile: 'config.yml',
        generated: 'Gerado',
        default: 'Padrão',
        unset: 'Desativado',
      },
      tags: {
        required: 'Obrigatório',
        secret: 'Segredo',
        firstStartOnly: 'Somente na primeira partida',
        changed: 'Alterado — é necessário reiniciar',
        missing: 'Desaparecido',
        undeclared: 'Não declarado',
      },
      setValue: 'Definir valor',
      replace: 'Substituir',
      override: 'Substituir',
      overrideOf: 'Substituir {{name}}',
      overrideTitle: 'Substituir {{name}}',
      overrideHint:
        'Este aplicativo usa esse valor em vez do valor de seu ambiente. Salvo de uma vez; o aplicativo recebe isso em sua próxima implantação.',
      savedAtOnce:
        'Salvo imediatamente; o aplicativo recebe isso em sua próxima implantação.',
      updated: 'Atualizado',
      clear: 'Limpar',
      addTitle: 'Adicionar variável',
      setTitle: 'Definir {{name}}',
      save: 'Salvar',
      cancel: 'Cancelar',
      saved: '{{name}} salvo.',
      cleared: '{{name}} apagado.',
      loadFailed: 'Não foi possível carregar as variáveis.',
      emptyTitle: 'Sem variáveis',
      emptyDescription:
        'A liberação declara que nenhum e nenhum está definido. Adicione um para passá-lo para o aplicativo.',
      emptyEnvironmentTitle: 'Ainda não há variáveis',
      emptyEnvironment:
        'Adicione um para transmiti-lo a todos os aplicativos neste ambiente.',
      emptyEnvironmentReadOnly: 'Peça a um administrador para adicionar um.',
      noManifest:
        'Esta versão não declara suas variáveis, portanto nenhuma é verificada antes da implantação.',
      basis:
        'Listado como a compilação mais recente ({{version}}) os declara. O valor do próprio aplicativo vem antes do seu ambiente.',
      noBuildTitle: 'Nenhuma construção ainda',
      noBuildDescription:
        'As variáveis aparecem aqui assim que a primeira compilação do aplicativo é carregada. Você pode adicionar um manualmente agora.',
      noBuild:
        'Ainda não há construção: estes são valores definidos manualmente.',
      undeclaredTitle: 'Não declarado',
      undeclaredDescription:
        'A compilação mais recente não declara isso. Eles ainda acessam o aplicativo; limpe o valor do próprio aplicativo quando ele não for necessário.',
      setOnEnvironment: 'Definido no ambiente',
      setOnApp: 'Definir neste aplicativo',
      declaredBy: 'Declarado por',
      status: 'Status',
      noApps: 'Nenhum aplicativo declara isso',
      moreApps: '+{{count}}',
      appGroup: '{{label}} ×{{count}}',
      missingIn_one: 'Ausente no aplicativo {{count}}',
      missingIn_other: 'Ausente em aplicativos {{count}}',
      missingInTitle: 'Obrigatório e sem valor para: {{apps}}',
      environmentSet: 'Defina aqui',
      environmentNotSet: 'Não definido aqui',
      missingTitle: 'Variáveis obrigatórias não estão definidas',
      missingDescription:
        '{{names}} deve ser definido antes que a compilação mais recente possa ser implementada: no ambiente de cada aplicativo ou apenas neste aplicativo.',
      review: 'Rever variáveis',
      changedTitle: 'As alterações de variáveis não são aplicadas',
      changedDescription:
        'Uma variável foi alterada desde que o aplicativo foi implantado. Ele entra em vigor quando o aplicativo é implantado novamente.',
      apply: 'Aplicar e reiniciar',
      applied: 'Implantando novamente com as novas variáveis.',
      needs_one: 'Necessita da variável {{count}}',
      needs_other: 'Necessita de variáveis {{count}}',
      missing: '{{count}} ausente',
      bulk: {
        edit: 'Edição em massa',
        title: 'Variáveis de edição em massa',
        reviewTitle: 'Revisar alterações',
        description:
          'Cole ou edite as linhas KEY=value, como em um arquivo .env. Linhas que começam com # são ignoradas.',
        appHint:
          'Lista os valores que este aplicativo define. Os valores de seu ambiente e segredos não são mostrados: adicione uma linha para substituir ou substituir um. A remoção de uma linha limpa esse valor.',
        environmentHint:
          'Lista os valores deste ambiente. Os segredos não são mostrados: adicione uma linha para substituir um. A remoção de uma linha limpa esse valor.',
        label: 'Variáveis (.env)',
        review: 'Revisar alterações',
        back: 'Voltar',
        changes: 'Mudanças',
        noChanges: 'O texto fixa o que já existe.',
        nothing: 'Nada para salvar',
        unchanged_one: 'A variável {{count}} permanece como está.',
        unchanged_other: 'As variáveis ​​{{count}} permanecem como estão.',
        save_one: 'Salvar {{count}} alteração',
        save_other: 'Salvar {{count}} alterações',
        saved_one: 'Alteração {{count}} salva.',
        saved_other: 'Alterações {{count}} salvas.',
        secretOf: '{{name}} é um segredo',
        failedTitle: 'Algumas alterações não foram salvas',
        kinds: {
          add: 'Adicionar',
          change: 'Mudança',
          remove: 'Remover',
        },
        problems: {
          syntax: 'Linha {{line}}: escreva como KEY=valor.',
          name: 'Linha {{line}}: {{name}} não é um nome válido. Use letras maiúsculas, dígitos e sublinhados, começando com uma letra.',
          reserved:
            'Linha {{line}}: {{name}} é definido pelo tempo de execução e não pode ser uma variável.',
          duplicate:
            'Linha {{line}}: {{name}} já está configurado em uma linha anterior.',
          unterminated:
            'Linha {{line}}: a cotação em torno do valor de {{name}} não está fechada.',
        },
        unchanged_many: 'As variáveis ​​{{count}} permanecem como estão.',
        save_many: 'Salvar {{count}} alterações',
        saved_many: 'Alterações {{count}} salvas.',
      },
      missingIn_many: 'Ausente em aplicativos {{count}}',
      needs_many: 'Necessita de variáveis {{count}}',
    },
    tabs: {
      label: 'Seções de {{name}}',
      overview: 'Visão geral',
      deployments: 'Implantações',
      variables: 'Variáveis',
      settings: 'Configurações',
    },
    overview: {
      currentRelease: 'Versão atual',
      recent: 'Implantações recentes',
      viewAll: 'Ver tudo',
    },
    initialAdmin: {
      title: 'Primeiro administrador',
      expires:
        'Gerado para a primeira implantação. Salve-o agora: ele será excluído em {{hours}} h.',
      kept: 'Gerado para a primeira implantação; ele é mantido até que o aplicativo seja removido.',
      username: 'Nome de usuário',
      email: 'E-mail',
      password: 'Senha',
      show: 'Mostrar senha',
      hide: 'Ocultar senha',
      copy: 'Copiar senha',
      copied: 'Senha copiada.',
      copyFailed:
        'Não foi possível copiar a senha. Exiba-a e copie-a manualmente.',
      dismiss: 'Eu salvei',
      dismissed:
        'O primeiro administrador foi excluído do gerenciador de lançamento.',
    },
    config: {
      title: 'Avançado',
      description:
        'config.yml do aplicativo implantado; salvar recarrega o aplicativo. Prefira variáveis ​​para valores que diferem por ambiente e para segredos.',
      loadFailed: 'Não foi possível carregar a configuração.',
      discard: 'Descartar alterações',
      save: 'Salvar e recarregar',
      saved: 'Configuração salva.',
      external:
        'Este aplicativo lê sua configuração de fora do gerenciamento de versões, portanto não há config.yml para editar aqui. Defina valores que diferem por ambiente como variáveis.',
      externalTitle: 'Sem config.yml para editar',
      noFileTitle: 'Nenhum config.yml ainda',
      noFile:
        'config.yml é criado pela primeira implantação. Até então, configure o aplicativo com variáveis.',
      toVariables: 'Vá para variáveis',
      maskedHint:
        'Os valores secretos são exibidos como {{mask}}. Deixe a máscara no lugar para manter o valor armazenado ou digite um novo valor sobre ela.',
      secrets: 'Segredos',
      secretsHint:
        'Os valores armazenados nunca são mostrados. Substitua ou limpe um aqui; ele entra em vigor quando você salva.',
      newValue: 'Novo valor para {{path}}',
      replace: 'Substituir {{path}}',
      clear: 'Limpar {{path}}',
    },
    settings: {
      edit: 'Tempo de execução e rótulos',
      editShort: 'Editar',
      editDescription:
        'Quando o aplicativo é executado e como ele é rotulado. As alterações se aplicam sem reiniciá-lo.',
      save: 'Salvar',
      saved: 'Configurações salvas.',
      danger: 'Excluir aplicativo',
      delete: 'Excluir com seus dados',
      deleteDescription:
        'Remove o aplicativo, suas versões, implantações e dados. Isto não pode ser desfeito.',
      deleted: '{{name}} excluído.',
      confirmDeleteTitle: 'Excluir {{name}}?',
      confirmDelete:
        'Isso exclui {{appId}} e todos os seus dados. Digite {{appId}} para confirmar.',
    },
    common: {
      retry: 'Tentar novamente',
      refresh: 'Atualizar',
      actions: 'Ações',
      rowActions: 'Ações para {{name}}',
    },
    errors: {
      requestFailed: 'A solicitação falhou.',
      reasons: {
        IMAGE_REQUIRED:
          'Este ambiente executa imagens de lançamento e o lançamento não possui nenhuma imagem. Registre a imagem que seu CI enviou (`release image`) e, em seguida, implante-a.',
        ARCHIVE_REQUIRED:
          'Este ambiente executa arquivos de lançamento em processo; carregue o arquivo (`release upload`).',
        IMAGE_CONFLICT:
          'O release já traz outra imagem para esta plataforma; a imagem de um lançamento nunca muda.',
        INVALID_IMAGE:
          'Essa não é uma referência de imagem com um resumo sha256.',
        REGISTRY_EXISTS: 'Já existe um registro com este ID.',
        REGISTRY_IN_USE:
          'Os ambientes são extraídos deste registro; escolha outro registro para eles primeiro.',
        UNKNOWN_REGISTRY: 'Esse registro não existe.',
        INVALID_REGISTRY_URL:
          'Insira a origem do registro, como https://ghcr.io ou localhost:5000.',
        INVALID_REGISTRY_NAMESPACE:
          'O namespace contém componentes de caminho em letras minúsculas, como acme.',
        APP_EXISTS: 'Já existe um aplicativo com este ID.',
        APP_NOT_DEPLOYED: 'O aplicativo ainda não foi implantado.',
        APP_NOT_FOUND: 'O aplicativo não existe ou talvez você não o veja.',
        APPROVAL_REQUIRED:
          'Este ambiente está protegido: em vez disso, solicite a implantação.',
        ARTIFACT_TOO_LARGE: 'O pacote de lançamento é muito grande.',
        BASE_PATH_MISMATCH:
          'A versão foi construída para um caminho base diferente.',
        CHECKSUM_MISMATCH:
          'O pacote não corresponde à sua soma de verificação.',
        CONFIG_NOT_EDITABLE:
          'A configuração deste aplicativo não pode ser editada aqui.',
        CONFIG_SECRET_NOT_STORED:
          'Um valor mascarado não possui nenhum segredo armazenado em seu lugar. Digite seu valor em vez da máscara.',
        CONFIG_RELOAD_FAILED:
          'A configuração foi salva, mas o aplicativo não conseguiu recarregá-la.',
        CONFIG_TOO_LARGE: 'A configuração é muito grande.',
        CONFIRMATION_REQUIRED: 'Digite o ID do aplicativo para confirmar.',
        DEPLOYMENT_IN_PROGRESS:
          'A implantação deste aplicativo já está em andamento.',
        DEPLOYMENT_NOT_FOUND: 'A implantação não existe.',
        DRIVER_UNAVAILABLE: 'O driver do ambiente não está disponível.',
        ENVIRONMENT_DRIVER_FIXED:
          'O driver de um ambiente não pode ser alterado.',
        ENVIRONMENT_VARIANT_FIXED:
          'O modo de execução de um ambiente não pode ser alterado; crie outro ambiente.',
        ENVIRONMENT_EXISTS: 'Já existe um ambiente com este ID.',
        ENVIRONMENT_FULL: 'O ambiente atingiu seu limite de aplicativos.',
        ENVIRONMENT_IN_USE:
          'Os aplicativos ainda são implantados neste ambiente.',
        ENVIRONMENT_NOT_FOUND: 'O ambiente não existe.',
        FORBIDDEN: 'Você não tem permissão para fazer isso.',
        IDEMPOTENCY_CONFLICT:
          'A mesma solicitação foi enviada com conteúdo diferente.',
        INVALID_ACTIVATION_POLICY: 'A política de ativação não é válida.',
        INVALID_IDLE_STOP: 'A parada inativa não é válida.',
        INVALID_DORMANCY: 'O tempo de hibernação não é válido.',
        INVALID_APP_ID:
          'Use letras, dígitos, sublinhados e hífens para o ID do aplicativo, não começando com "__" e nem "novo".',
        INVALID_APPROVERS: 'Os aprovadores não são válidos.',
        INVALID_ARTIFACT_SIZE: 'O tamanho do pacote não é válido.',
        INVALID_ARTIFACT_VERSION: 'A versão de lançamento não é válida.',
        INVALID_ARTIFACT: 'O arquivo não é um pacote de lançamento válido.',
        INVALID_CHECKSUM: 'A soma de verificação não é válida.',
        INVALID_CONFIG_FILE: 'A configuração não é YAML válida.',
        INVALID_CONFIG_MODE: 'O modo de configuração não é válido.',
        INVALID_CONFIG_SECRET: 'A alteração secreta não é válida.',
        INVALID_CONTENT_TYPE: 'Carregue um pacote .tar.gz.',
        INVALID_DEPLOYMENT_INPUT: 'A solicitação de implantação não é válida.',
        INVALID_DRIVER: 'O driver não é válido.',
        INVALID_ENVIRONMENT_CONFIG:
          'As configurações de ambiente não são válidas para seu driver.',
        INVALID_ENVIRONMENT_ID:
          'Use letras minúsculas, dígitos, sublinhados e hífens para o ID do ambiente.',
        INVALID_ENVIRONMENT_SETTINGS:
          'As configurações de ambiente não são válidas.',
        INVALID_IDEMPOTENCY_KEY: 'A chave de solicitação não é válida.',
        INVALID_INPUT: 'Alguns campos da solicitação não são válidos.',
        INVALID_LABELS:
          'Escreva rótulos como chave=valor, separados por vírgulas.',
        INVALID_LOG_CURSOR: 'A posição do log não é válida.',
        INVALID_LOG_ID: 'O log não existe.',
        INVALID_NOTE: 'A nota é muito longa.',
        INVALID_PUBLIC_URL: 'O padrão URL público não é válido.',
        INVALID_REQUEST: 'A solicitação não é válida.',
        INVALID_ROLLBACK_TARGET: 'Esta implantação não pode ser revertida.',
        INVALID_SEARCH: 'A pesquisa não é válida.',
        INVALID_TICKET: 'O bilhete não é válido.',
        RELEASE_EXISTS: 'Esta versão já foi carregada.',
        RELEASE_NOT_FOUND: 'A liberação não existe.',
        REQUEST_DECIDED: 'O pedido já foi decidido.',
        REQUEST_NOT_FOUND: 'A solicitação não existe.',
        REQUEST_PENDING:
          'Uma solicitação para este aplicativo já está aguardando aprovação.',
        RESTART_FAILED: 'O aplicativo não pôde ser reiniciado.',
        SESSION_REQUIRED: 'Faça login novamente para continuar.',
        START_FAILED: 'Não foi possível iniciar o aplicativo.',
        STOP_FAILED: 'O aplicativo não pôde ser interrompido.',
        TICKET_DEPLOY_REFUSED: 'O ticket não permite esta implantação.',
        TICKET_FORBIDDEN: 'O ticket não permite isso.',
        UNSAFE_ARTIFACT: 'O pacote contém caminhos inseguros.',
        VARIABLES_MISSING:
          'Variáveis obrigatórias não estão definidas: {{names}}. Defina-os nas variáveis ​​do aplicativo ou de seu ambiente e, em seguida, implante novamente.',
        VARIABLE_RESERVED:
          'Este nome é definido pelo tempo de execução e não pode ser uma variável.',
        INVALID_VARIABLE_NAME:
          'O nome de uma variável consiste em letras maiúsculas, dígitos e sublinhados, começando com uma letra.',
        INVALID_VARIABLE_VALUE: 'O valor é muito longo.',
        VARIABLE_NOT_FOUND: 'A variável não está definida.',
        INVALID_VARIABLES_MANIFEST:
          'O manifesto de variáveis ​​da versão (dist/variables.json) não é válido.',
        INITIAL_ADMIN_UNAVAILABLE:
          'Não há primeiro administrador para mostrar.',
      },
      messages: {
        hostExited:
          'O processo do aplicativo foi interrompido antes de estar pronto.',
        hostDisabled: 'O host do aplicativo está desativado.',
        hostShutDown: 'O host do aplicativo foi encerrado.',
        hostEntryMissing:
          'O arquivo de entrada do host do aplicativo está ausente.',
        cannotRestart: 'Este host não pode ser reiniciado aqui.',
        selfDeploy:
          'O host não pode implementar o aplicativo em que é executado.',
        noStatus: 'O host não informou como foi a implantação.',
        interrupted: 'A implantação foi interrompida por uma reinicialização.',
        notReported: 'O tempo de execução não relatou o aplicativo.',
        notRunning: 'O aplicativo não está em execução após a reinicialização.',
        deploymentNotReported: 'O tempo de execução não relatou a implantação.',
        notReady: 'Ainda não está pronto; tente novamente em um momento.',
        checkTimeout: 'O teste não foi concluído em 20 segundos.',
        hostNoSettings:
          'O tempo de execução local não requer configurações de conexão.',
      },
      prefixed: {
        startFailed: 'Falha na inicialização: {{detail}}',
        stopFailed: 'Falha na parada: {{detail}}',
        restartFailed: 'Falha na reinicialização: {{detail}}',
        outcomeUnreadable: 'O resultado não pôde ser lido: {{detail}}',
      },
    },
    confirm: {
      cancel: 'Cancelar',
      typeLabel: 'Digite {{text}} para confirmar',
    },
    environments: {
      title: 'Implantar ambientes',
      description:
        'Onde os aplicativos são implantados e quem pode implantá-los lá.',
      open: 'Abrir',
      loadOneFailed: 'Não foi possível carregar o ambiente.',
      settingsTitle: 'Configurações de ambiente',
      readOnly:
        'Você pode visualizar as configurações deste ambiente, mas não pode alterá-las.',
      danger: 'Excluir ambiente',
      deleteDescription:
        'Remove o ambiente e suas variáveis. Os aplicativos implantados aqui devem ser excluídos primeiro.',
      discard: 'Descartar alterações',
      anyone: 'Qualquer pessoa que possa implantar',
      unlimited: 'Sem limite',
      apps: 'Aplicativos',
      appsDescription: 'Os aplicativos implantados neste ambiente.',
      appsEmpty: 'Nenhum aplicativo foi implantado aqui ainda.',
      sampleData: 'Carregar dados de amostra na primeira implantação',
      sampleDataHint:
        'A primeira implantação de um aplicativo aqui instala seus dados de amostra (APP_SAMPLE_DATA=true). Use-o para visualizações, não para produção.',
      add: 'Adicionar ambiente',
      edit: 'Editar',
      delete: 'Excluir',
      save: 'Salvar',
      cancel: 'Cancelar',
      check: 'Verifique',
      reachable: '{{name}} está acessível.',
      unreachable: '{{name}} não está acessível.',
      deleted: 'Ambiente {{name}} excluído.',
      saved: 'Ambiente {{name}} salvo.',
      added: 'Ambiente {{name}} adicionado.',
      loadFailed: 'Não foi possível carregar os ambientes.',
      emptyTitle: 'Nenhum ambiente ainda',
      emptyNoAccess: 'Peça a um administrador para adicionar um ambiente.',
      emptyDescription:
        'Adicione um ambiente para a implantação de aplicativos.',
      editTitle: 'Editar {{name}}',
      formDescription:
        'Onde os aplicativos são implantados, como são alcançados e quem pode implantá-los.',
      configHint: 'Configurações do driver, como objeto JSON.',
      secretHint:
        'Armazenado criptografado e nunca mais mostrado; deixe vazio para guardar.',
      invalidJson: 'Insira um objeto JSON, como {}.',
      protectedHint:
        'Toda implantação, por pessoa ou por CI, aguarda um aprovador, que digita novamente o ID do aplicativo para aprová-lo.',
      approversColumn: 'Aprovadores',
      approversPlaceholder: 'Escolha aprovadores',
      approversHint:
        'Qualquer um deles pode aprovar, inclusive seus próprios pedidos. Sem nenhuma escolha, as pessoas autorizadas a aprovar implantações protegidas decidem.',
      confirmDelete: 'Excluir o ambiente {{id}}?',
      id: 'ID do ambiente',
      name: 'Nome',
      driver: 'Motorista',
      runsOn: 'Continua',
      policy: 'Política',
      publicUrl: 'Padrão público URL',
      config: 'Configurações (JSON)',
      secret: 'Credenciais (JSON, somente gravação)',
      secretStored:
        'As credenciais são armazenadas; insira novos para substituí-los.',
      protected: 'Protegido',
      approvers: 'Aprovadores',
      pickDriver:
        'Escolha como os aplicativos neste ambiente são executados. Um ambiente mantém seu driver.',
      next: 'Continuar',
      addWith: 'Adicionar ambiente {{driver}}',
      changeDriver: 'Mudança',
      basics: 'Ambiente',
      namePlaceholder: 'Encenação',
      idHint:
        'Letras minúsculas, dígitos, sublinhados e travessões; não pode ser alterado posteriormente.',
      policyDescription: 'Quem pode implantar aqui.',
      appDefaults: 'Aplicativos',
      appDefaultsDescription:
        'No máximo este número de aplicativos, e quando um aplicativo criado sem sua própria política de tempo de execução para e fica inativo. Vazio: sem limite, nunca.',
      maxApps: 'A maioria dos aplicativos',
      defaultIdle: 'Parar após (minutos sem visita)',
      defaultDormant: 'Inativo após (horas sem visita)',
      noForm:
        'Nenhum formulário de configurações; as configurações são inseridas como JSON ({{kind}}).',
      imageSource: 'Liberar imagens',
      imageSourceDescription:
        'Extraia a imagem de cada versão de um registro por resumo, com suas credenciais de pull, para que este ambiente execute a mesma imagem que o CI enviou e outros ambientes executaram.',
      registry: 'Registro',
      noRegistry: 'Nenhum: extraia imagens públicas anonimamente',
      newRegistry: 'Novo registro',
      editRegistry: 'Editar',
      cancelRegistryEdit: 'Cancelar edição',
      registryShared:
        'As alterações se aplicam a todos os ambientes extraídos deste registro.',
    },
    registries: {
      check: 'Testar conexão',
      url: 'Endereço',
      urlHint:
        'Sua origem, como https://ghcr.io;, um endereço de host local é alcançado por HTTP.',
      namespace: 'Namespace',
      namespaceHint: 'As imagens de liberação do caminho passam, como acme.',
      pull: 'Extrair credenciais',
      pullHint:
        'Para ambientes que extraem deste registro; deixe-os de fora onde permitir pulls anônimos.',
      username: 'Nome de usuário',
      password: 'Senha ou token',
      checkOk: 'Conectado',
      checkFailed: 'O teste de conexão falhou.',
      checkFailedTitle: 'Não é possível usar o registro',
      anonymous:
        'O registro responde sem credenciais: qualquer um que o alcance pode puxar.',
      status: {
        ok: 'aceito',
        failed: 'recusou',
        notSet: 'não definido',
      },
    },
    artifacts: {
      title: 'Artefatos',
      tarball: 'Arquivar',
      image: 'Imagem',
      ran: 'Correu',
      ranTarball: 'Arquivo, em processo',
    },
    driverForm: {
      advanced: 'Configurações avançadas',
      advancedHint:
        'Os padrões são adequados para a maioria dos ambientes; abra um grupo para alterá-lo.',
      on: 'Ligado',
      off: 'Desligado',
      noLimit: 'Sem limite',
      writeOnly: '(somente gravação)',
      secretSet: 'Definir',
      secretCleared: 'Removido quando você salva',
      replace: 'Substituir',
      clear: 'Remover',
      undo: 'Desfazer',
      keepStored: 'Mantenha o armazenado',
      jsonTitle: 'Configurações do driver',
      jsonDescription:
        'Este driver não possui formulário de configurações; insira suas configurações como JSON.',
      check: 'Testar conexão',
      checkOk: 'Conectado',
      checkFailed: 'O teste de conexão falhou.',
      checkFailedTitle: 'Não foi possível conectar',
      fixErrors:
        'Algumas configurações precisam ser corrigidas; eles estão marcados acima.',
      errors: {
        required: 'Obrigatório.',
        number: 'Insira um número.',
        integer: 'Insira um número inteiro.',
        range: 'Fora da faixa permitida.',
        mapLine: 'Escreva um NAME=valor por linha.',
        mapName:
          'Os nomes são letras, dígitos e sublinhados, não começando com um dígito.',
      },
    },
    driverForms: {
      host: {
        description:
          'Executa aplicativos neste servidor: no processo filho do App Host este aplicativo é iniciado ou cada um em um contêiner Docker.',
        runtime: 'Modo de execução',
        backend: 'Modo de execução',
        backendInProcess: 'Em processo',
        backendInProcessHint:
          'É executado no processo filho do App Host que este servidor inicia, compartilhado por todos esses aplicativos. Adequado para pré-visualizações.',
        backendDocker: 'Docker',
        backendDockerHint:
          'Um contêiner por aplicativo, isolados um do outro. Adequado para testes e produção.',
        dockerConnection: 'Conexão Docker',
        dockerConnectionDescription:
          'Usa o Docker neste servidor, encontrado em DOCKER_HOST ou no contexto Docker atual, com configurações de contêiner recomendadas. Teste a conexão para ver qual Docker foi encontrada.',
        access: 'Endereço de acesso',
        publicUrl: 'Padrão público URL',
        publicUrlHint:
          'Onde as pessoas abrem um aplicativo, com {appId} no caminho ou no nome do host; vazio usa o próprio endereço do servidor.',
        check: {
          url: 'Endereço',
          apps: 'Aplicativos em execução',
          endpoint: 'Docker',
          version: 'Versão Docker',
          platform: 'Plataforma',
          errors: {
            unsupported:
              'Somente Docker neste servidor é suportado: DOCKER_HOST deve ser um soquete unix:// ou um proxy de soquete tcp://.',
            socketMissing:
              'Não há soquete Docker lá. O Docker está instalado e em execução neste servidor?',
            permission:
              'Docker recusou acesso. O usuário que este aplicativo executa não pode usar o soquete Docker.',
            refused:
              'Nada aceita conexões nesse endereço. Verifique se Docker está em execução.',
            timeout: 'Docker não respondeu a tempo.',
          },
        },
      },
    },
  },
  actions: {
    close: 'Fechar',
  },
  status: {
    loading: 'Carregando',
  },
};

export default ptBR;
