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
      help: 'O modo de demonstração está desligado. A implantação o liga com NOCOBASE_DEMO_MODE=true.',
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
    status: {
      help: 'No modo de demonstração, você pode abrir todas as páginas, mas as alterações não são salvas, a menos que uma exceção abaixo permita.',
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
        resetting: 'Redefinindo',
        failed: 'Falhou',
        ready: 'Prontos',
        none: 'Não gerados',
      },
      presentSummary: 'Gerados em {{language}} · {{time}}',
      resettingSummary:
        'Limpando os dados atuais para gerá-los novamente em {{language}}.',
      phase: {
        clearing: 'Limpando',
        generating: 'Gerando novamente',
      },
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
      title: 'Contas de demonstração',
      off: 'O acesso rápido está desligado nesta implantação.',
      pending:
        'As contas aparecem aqui quando os dados de demonstração estiverem prontos.',
      noData:
        'Gere primeiro os dados de demonstração; as contas aparecerão aqui.',
      credentials: 'Usuário {{username}} · senha {{password}}',
      copyLink: 'Copiar link',
      copyLinkFor: 'Copiar o link de entrada de {{name}}',
      openFor: 'Abrir a demonstração como {{name}}',
      copied: 'Copiado',
      copyFailed:
        'Não foi possível copiar. Copie o link da barra de endereços.',
    },
    schedule: {
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
        'Quando a demonstração está ativada, as gravações são recusadas por padrão. Selecione as coleções que os visitantes precisam modificar; as permissões do aplicativo controlam as operações e o acesso aos registros.',
      allow: 'Permitir',
      revoke: 'Recusar novamente',
      confirmTitle: 'Alterar o que os visitantes podem gravar?',
      confirmDescription:
        'As alterações dos visitantes nisto são salvas de verdade até a próxima redefinição.',
      collections: {
        title: 'Koleksias',
        description:
          'As solicitações autorizadas pelo aplicativo podem gravar nestas coleções.',
        label: 'Koleksias que os visitantes podem gravar',
        placeholder: 'Pesquisar koleksias',
        noMatch: 'Nenhuma koleksia corresponde',
        fixed: 'Sempre graváveis',
        fixedHelp:
          'Sessões de login e as exceções da própria implantação (NOCOBASE_DEMO_WRITABLE_COLLECTIONS); não podem ser alteradas aqui.',
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
        enabled: 'Os visitantes podem conversar',
        enabledHelp: 'Desligado: o chat recusa as mensagens dos visitantes.',
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
