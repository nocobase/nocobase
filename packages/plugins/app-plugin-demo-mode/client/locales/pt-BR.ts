import type { DemoModeResource } from './en-US.js';
const resource: DemoModeResource = {
  authorization: {
    title: 'Dados de demonstração',
    read: 'Visualizar',
    manage: 'Gerar e limpar',
    configuration: 'Configuração de demonstração',
    configure: 'Configurar',
  },
  accounts: {
    menu: 'Conta de demonstração: {{name}}',
    title: 'Contas de demonstração',
    description:
      'Entre na demonstração com qualquer uma destas contas para ver o que cada uma vê.',
    enter: 'Entrar',
    signedInAs: 'Conectado como {{name}} · Trocar',
    current: 'Atual',
    entering: 'Entrando…',
    failed: 'Não foi possível entrar com esta conta de demonstração.',
    unavailable: 'Nenhuma conta de demonstração disponível no momento.',
    password: 'Entrar com senha',
  },
  refused: {
    title: 'Esta é uma demonstração. As alterações não podem ser salvas.',
    description: 'As demais funções operam normalmente.',
  },
  settings: {
    title: 'Ambiente de demonstração',
    refresh: 'Atualizar',
    retry: 'Tentar novamente',
    busy: 'Os dados de demonstração estão sendo gerados ou limpos',
    busyHelp: 'Você poderá salvar as configurações novamente quando terminar.',
    disabled: {
      title: 'Este aplicativo não é uma demonstração',
      help: 'O modo de demonstração está desligado. A implantação o liga com NOCOBASE_DEMO_MODE.',
    },
    cancel: 'Cancelar',
    save: 'Salvar',
    apply: 'Aplicar alterações',
    unsaved: 'Alterações não salvas',
    discardAndReload: 'Descartar minhas alterações e recarregar',
    switch: {
      on: 'Ligado',
      off: 'Desligado',
    },
    mode: {
      readOnly: 'Somente leitura',
      observe: 'Observação',
      readOnlyHelp:
        'Os visitantes podem abrir todas as páginas, mas as alterações não são salvas, a menos que uma exceção abaixo permita.',
      observeHelp:
        'Nada é recusado: as gravações que o modo somente leitura recusaria são apenas registradas, para descobrir o que permitir.',
    },
    tabs: {
      overview: 'Visão geral',
      schedule: 'Redefinição diária',
      writes: 'Gravações de visitantes',
      simulation: 'Simulação e IA',
    },
    leave: {
      title: 'Sair sem salvar?',
      description: 'As alterações não salvas nesta página serão perdidas.',
      stay: 'Continuar editando',
      discard: 'Descartar alterações',
    },
    errors: {
      failed: 'A solicitação não foi concluída. Tente novamente.',
      conflict: 'Outro administrador salvou esta configuração primeiro.',
      busy: 'Os dados de demonstração estão sendo gerados ou limpos. Tente quando terminar.',
      exists:
        'Os dados de demonstração já foram gerados. Redefina-os em vez disso.',
      demoModeRequired: 'Isso só funciona com o modo de demonstração ligado.',
      accountConflict:
        'Um nome de usuário da demonstração pertence a uma conta que ela não possui.',
      unavailable: 'Este aplicativo não oferece dados de demonstração.',
      signedOut: 'Sua sessão terminou. Entre novamente.',
      denied: 'Você não tem permissão para gerenciar a demonstração.',
    },
    data: {
      title: 'Dados de demonstração',
      state: {
        importing: 'Gerando',
        clearing: 'Limpando',
        failed: 'Falhou',
        ready: 'Prontos',
        none: 'Não gerados',
      },
      presentSummary: 'Gerados em {{language}} · {{time}}',
      absentSummary:
        'Gere os dados de demonstração para que os visitantes explorem o aplicativo com uma história completa.',
      language: 'Idioma',
      clear: 'Limpar',
      reset: 'Redefinir',
      generate: 'Gerar',
      failed: 'A última execução não terminou',
      readOnly:
        'Você pode ver os dados de demonstração; gerar, redefinir e limpar exige a permissão de gerenciamento.',
      unavailable: 'Sem dados de demonstração',
      unavailableHelp:
        'Este aplicativo não registra um conjunto de dados de demonstração.',
      cleared: 'Dados de demonstração limpos',
      resetStarted: 'Redefinindo os dados de demonstração',
      importStarted: 'Gerando os dados de demonstração',
      confirm: {
        import: {
          title: 'Gerar os dados de demonstração?',
          description:
            'Os dados são gerados em {{language}} e suas contas de demonstração são ativadas.',
        },
        reset: {
          title: 'Redefinir os dados de demonstração?',
          description:
            'Todos os dados de negócio desta instância são excluídos, inclusive o que os visitantes adicionaram, e gerados novamente em {{language}}.',
        },
        clear: {
          title: 'Limpar os dados de demonstração?',
          description:
            'Todos os dados de negócio desta instância são excluídos, inclusive o que os visitantes adicionaram, e as contas de demonstração são desativadas. Configurações e administradores permanecem.',
        },
      },
    },
    visitors: {
      title: 'Entrada de visitantes',
      description:
        'Os visitantes entram em qualquer uma destas contas sem senha e podem alternar entre elas no canto de cada página.',
      off: 'O acesso rápido está desligado nesta implantação (NOCOBASE_DEMO_QUICK_SIGN_IN=false).',
      noData:
        'Gere primeiro os dados de demonstração; as contas aparecerão aqui.',
      credentials: 'Usuário {{username}} · senha {{password}}',
      copyLink: 'Copiar link',
      copyLinkFor: 'Copiar o link de entrada de {{name}}',
      openFor: 'Abrir a demonstração como {{name}}',
      copied: 'Copiado',
      copyFailed:
        'Não foi possível copiar. Copie o link da barra de endereços.',
      embed: 'Incorporar em uma página',
      copyEmbed: 'Copiar o código de incorporação',
      embedHelp:
        'A página precisa estar no mesmo site desta demonstração, como outro subdomínio do mesmo domínio; caso contrário, o navegador não mantém os visitantes conectados dentro do quadro.',
    },
    schedule: {
      title: 'Redefinição diária',
      description:
        'Uma vez por dia, exclui o que os visitantes alteraram e gera os dados de demonstração novamente.',
      confirmTitle: 'Salvar a redefinição diária?',
      confirmDescription:
        'No horário abaixo, todos os dados de negócio desta instância são excluídos e gerados novamente.',
      summary: 'Todos os dias às {{time}} ({{timezone}}), em {{language}}',
      off: 'Não agendada',
      enabled: 'Redefinir todos os dias',
      enabledHelp:
        'Usa o administrador que gerou os dados de demonstração por último.',
      time: 'Horário',
      hour: 'Hora',
      minute: 'Minuto',
      language: 'Idioma',
      timezone: 'Fuso horário',
      noTimezone: 'Nenhum fuso horário corresponde',
      invalidTimezone: 'Escolha um fuso horário da lista.',
      next: 'Próxima redefinição: {{time}}',
    },
    writes: {
      intro:
        'No modo somente leitura, toda alteração é recusada. Abra apenas o que os visitantes precisam experimentar e apenas para os registros da demonstração; as permissões de negócio continuam valendo.',
      allow: 'Permitir',
      revoke: 'Recusar novamente',
      scope: 'Escopo',
      confirmTitle: 'Alterar o que os visitantes podem gravar?',
      confirmDescription:
        'As alterações dos visitantes nisto são salvas de verdade até a próxima redefinição.',
      operation: {
        insert: 'Criar',
        update: 'Editar',
        delete: 'Excluir',
      },
      capabilities: {
        title: 'Operações de negócio',
        description:
          'Operações que o aplicativo marcou como seguras para abrir, cada uma limitada a um escopo.',
        empty: 'Nenhuma operação registrada',
        emptyHelp:
          'O aplicativo não registrou nenhuma operação que possa ser aberta em uma demonstração.',
      },
      tables: {
        title: 'Tabelas',
        description:
          'Qualquer solicitação autorizada pode gravar nestas tabelas. Use para estado que ninguém possa usar indevidamente, como preferências de visualização.',
        label: 'Tabelas que os visitantes podem gravar',
        placeholder: 'Pesquisar tabelas',
        noMatch: 'Nenhuma tabela corresponde',
        fixed: 'Sempre graváveis',
        fixedHelp:
          'Sessões de login e as exceções da própria implantação (NOCOBASE_DEMO_ALLOW_TABLES); não podem ser alteradas aqui.',
      },
    },
    simulation: {
      kind: {
        model: 'Modelo',
        tool: 'Ferramenta',
        runner: 'Runner',
      },
      mocks: {
        title: 'Simulações',
        description:
          'O que responde no lugar dos serviços externos nesta demonstração.',
        confirmTitle: 'Alterar as simulações?',
        confirmDescription:
          'Uma simulação desligada faz esse trabalho falhar; ele nunca é enviado ao serviço real.',
        empty: 'Nenhuma simulação registrada',
        emptyHelp: 'O aplicativo não registrou nenhum serviço simulado.',
        onHelp: 'Responde com resultados simulados.',
        offHelp: 'Desligada: o trabalho é recusado.',
      },
      chat: {
        title: 'Chat online',
        description:
          'Permite que os visitantes conversem com a IA do aplicativo.',
        confirmTitle: 'Salvar as configurações do chat online?',
        confirmDescription:
          'As conversas dos visitantes seguem estas configurações a partir da próxima mensagem.',
        confirmLive:
          'Um modelo real responde aos visitantes e cada conversa é cobrada do seu serviço de modelos.',
        enabled: 'Os visitantes podem conversar',
        enabledHelp: 'Desligado: o chat recusa as mensagens dos visitantes.',
        model: 'Respostas de',
        simulated: 'Modelo simulado',
        live: 'Um modelo real',
        simulatedHelp: 'Respostas roteirizadas; sem custo.',
        liveHelp:
          'Um serviço de modelos existente responde; as credenciais ficam nele.',
        service: 'Serviço de modelos',
        modelId: 'Modelo',
        cost: 'Cada conversa de visitante consome tokens deste serviço.',
        tools: 'Ferramentas',
        noTools: 'O aplicativo não declara ferramentas de chat.',
        policy: {
          deny: 'Recusar',
          read: 'Ler dados',
          mock: 'Simular',
        },
      },
    },
  },
};
export default resource;
