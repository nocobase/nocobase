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
    busyHelp: 'Aguarde a conclusão da operação de dados atual.',
    disabled: {
      title: 'Este aplicativo não é uma demonstração',
      help: 'O modo de demonstração está desligado. A implantação o liga com NOCOBASE_DEMO_MODE=true.',
    },
    errors: {
      failed: 'A solicitação não foi concluída. Tente novamente.',
      demoModeRequired: 'Isso só funciona com o modo de demonstração ligado.',
      signedOut: 'Sua sessão terminou. Entre novamente.',
      denied:
        'Você não tem permissão para visualizar as configurações da demonstração.',
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
      absentSummary: 'Nenhum dado de demonstração foi gerado ainda.',
      failed: 'A última execução não terminou',
      unavailable: 'Sem dados de demonstração',
      unavailableHelp:
        'Este aplicativo não registra um conjunto de dados de demonstração.',
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
