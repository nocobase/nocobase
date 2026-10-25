import type { DemoModeResource } from './en-US.js';
const resource: DemoModeResource = {
  authorization: {
    title: 'Dados de demonstração',
    read: 'Visualizar',
    manage: 'Gerar e limpar',
    configuration: 'Configuração de demonstração',
    configure: 'Configurar',
  },
  menu: {
    label: 'Modo de demonstração',
    switchAccount: 'Trocar de conta',
    title: 'Este é um ambiente de demonstração',
    description:
      'Os dados são redefinidos automaticamente todos os dias. As alterações não são salvas.',
    accountsDescription:
      'Troque para uma das contas abaixo para ver o que cada perfil pode acessar.',
    loading: 'Carregando contas…',
  },
  accounts: {
    title: 'Contas',
    description:
      'Entre na demonstração com qualquer uma destas contas para ver o que cada uma vê.',
    enter: 'Entrar',
    current: 'Atual',
    entering: 'Entrando…',
    failed: 'Não foi possível entrar nesta conta.',
    unavailable: 'Nenhuma conta está disponível no momento.',
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
    busyHelp:
      'Aguarde a conclusão da operação de dados atual antes de iniciar outra.',
    disabled: {
      title: 'Este aplicativo não é uma demonstração',
      help: 'O modo de demonstração está desligado. A implantação o liga com NOCOBASE_DEMO_MODE=true.',
    },
    cancel: 'Cancelar',
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
      unavailable: 'Nenhuma conta está disponível no momento.',
      title: 'Contas',
      username: 'Usuário {{username}}',
      copyLink: 'Copiar link',
      copyLinkFor: 'Copiar o link de entrada de {{name}}',
      openFor: 'Abrir a demonstração como {{name}}',
      copied: 'Copiado',
      copyFailed:
        'Não foi possível copiar. Copie o link da barra de endereços.',
    },
    schedule: {
      title: 'Redefinição diária',
      description:
        'Os dados de demonstração são redefinidos automaticamente todos os dias. A programação é configurada por variáveis de ambiente.',
      time: 'Horário',
      language: 'Idioma',
      timezone: 'Fuso horário',
      next: 'Próxima redefinição: {{time}}',
    },
  },
};
export default resource;
