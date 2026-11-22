import type { MailPagesResource } from './pages.en-US.js';

const pagesPtBR: MailPagesResource = {
  navigation: {
    mail: 'Correio',
    mailTeam: 'Correio da equipe',
    mailAccounts: 'Contas de correio',
    mailAccountsDescription:
      'Conecte suas caixas de correio e gerencie assinaturas, modelos e etiquetas.',
    mailSettings: 'Correio',
    mailSettingsDescription:
      'Provedores de e-mail, o status de cada conta e os registros de sincronização e envio.',
  },
  access: {
    section: 'Correio',
    team: {
      title: 'Correio da equipe',
      description: 'E-mails sincronizados dos membros, somente leitura.',
      actions: {
        view: 'Visualizar',
        process: 'Processar (marcar como lido, marcar com estrela, arquivar)',
      },
    },
    settings: {
      title: 'Correio',
      actions: {
        read: 'Visualizar',
        manage:
          'Gerenciar (tentar novamente e cancelar sincronizações e envios dos membros)',
      },
    },
  },
  pages: {
    loading: 'Carregando…',
    empty: 'Nada para mostrar.',
    member: 'Membro',
    allMembers: 'Todos os membros',
    workspace: {
      reauthorizationNotice:
        '{{addresses}} precisa ser reconectado: até lá, não sincroniza nem envia.',
      reauthorize: 'Reconectar em Contas de correio',
      needsReauthorization: 'precisa de reautorização',
    },
    accounts: {
      title: 'Contas de correio',
      description:
        'Conecte suas caixas de correio para enviar e receber no Correio. Só você vê seus e-mails; pessoas com acesso ao Correio da equipe podem lê-los sem alterá-los.',
      reauthorizationNotice:
        'A autorização de {{addresses}} não é mais aceita: não sincroniza nem envia até que você a conecte novamente com o mesmo provedor.',
      reauthorize: 'Reconectar',
      tabs: {
        accounts: 'Contas',
        signatures: 'Assinaturas',
        templates: 'Modelos',
        labels: 'Etiquetas',
        activity: 'Atividade',
      },
    },
    activity: {
      sends: 'Envios',
      syncs: 'Sincronizações',
    },
    logs: {
      started: 'Início',
      time: 'Horário',
      account: 'Conta',
      accountMember: 'Conta · membro',
      mode: 'Modo',
      initial: 'Primeira sincronização',
      incremental: 'Incremental',
      result: 'Resultado',
      allResults: 'Todos os resultados',
      detail: 'Detalhe',
      reason: 'Motivo',
      processed: '{{count}} mensagens',
      subject: 'Assunto',
      recipients: 'Destinatários',
      recipientCount: 'Destinatários',
      bulk: 'Envio em massa',
      bulkCount: '{{count}} (em massa)',
      scheduled: 'Programado',
      retry: 'Tentar novamente',
      cancel: 'Cancelar',
      window: 'Período',
      windows: {
        day: 'Últimas 24 horas',
        week: 'Últimos 7 dias',
        month: 'Últimos 30 dias',
        all: 'Todo o período',
      },
    },
    team: {
      title: 'Correio da equipe',
      description:
        'Leia os e-mails que os membros sincronizaram, para passagens de trabalho e verificações de conformidade. Abrir uma mensagem não a marca como lida e não é possível responder.',
      account: 'Conta',
      allAccounts: 'Todas as contas',
      participant: 'Endereço ou @domínio',
      keyword: 'Palavra-chave do assunto',
      memberAccount: 'Membro · conta',
      counterpart: 'Com',
      view: 'Visualizar',
      selectAll: 'Selecionar tudo nesta página',
      empty: 'Nenhum e-mail sincronizado corresponde.',
      readOnly: 'Somente leitura. Abrir não marca como lida.',
      applied: '{{succeeded}} atualizados, {{failed}} com falha.',
      actions: {
        markRead: 'Marcar como lida',
        star: 'Marcar com estrela',
        archive: 'Arquivar',
      },
    },
    settings: {
      title: 'Correio',
      description:
        'Os provedores de e-mail que os membros podem conectar e o status de conexão, sincronização e envio de cada conta. Nenhum conteúdo de mensagem é exibido aqui. Os e-mails de notificação do sistema são configurados em Notificações.',
      tabs: {
        providers: 'Provedores',
        accounts: 'Contas',
        syncRuns: 'Registros de sincronização',
        submissions: 'Registros de envio',
        runtime: 'Configuração de execução',
      },
      sources: {
        environment: 'Variável de ambiente',
        config: 'config.yml',
        default: 'Padrão',
        code: 'Código',
      },
      providers: {
        name: 'Nome',
        type: 'Tipo',
        capabilities: 'Recursos',
        accounts: 'Contas',
        source: 'Origem',
        attention: '{{count}} precisam de reautorização',
        howTo: 'Como adicionar um provedor',
        howToDescription:
          'Adicione uma entrada em mail.providers na configuração da aplicação e mantenha os segredos em variáveis de ambiente. Reinicie a aplicação para aplicá-la.',
        callbackHint:
          'Registre esta URL de redirecionamento OAuth no Google ou na Microsoft:',
      },
      accounts: {
        filter: {
          all: 'Todas',
          attention: 'Precisam de reautorização',
          suspended: 'Desativadas',
        },
        provider: 'Provedor',
        allProviders: 'Todos os provedores',
        search: 'Membro ou endereço',
        lastSynced: 'Última sincronização',
        status: 'Status',
        showRuns: 'Sincronizações',
        note: 'Administradores não podem autorizar nem remover contas dos membros. Cada membro reconecta a própria conta em Configurações pessoais › Contas de correio.',
      },
      runtime: {
        setting: 'Configuração',
        value: 'Valor atual',
        effect: 'O que afeta',
        automaticSyncInterval: 'Intervalo de sincronização automática',
        automaticSyncIntervalEffect:
          'Com que frequência as contas sem notificações push são verificadas em busca de novos e-mails.',
        syncBatchSize: 'Mensagens por lote de sincronização',
        syncBatchSizeEffect:
          'Lotes maiores concluem a primeira sincronização mais cedo, mas atingem os limites de taxa do provedor com mais facilidade.',
        oauthCallbackUrl: 'URL de redirecionamento OAuth',
        oauthCallbackUrlEffect:
          'Registre-a no console de desenvolvedores do Google ou da Microsoft.',
        oauthReturnUrl: 'Página após a autorização',
        oauthReturnUrlEffect:
          'Para onde a pessoa volta depois de conectar uma conta OAuth.',
        pushWebhook: 'Webhook de push',
        pushWebhookEffect:
          'Sem ele, Gmail e Microsoft 365 também são verificados no intervalo de sincronização.',
        jobs: 'Tarefas em segundo plano',
        jobsEffect:
          'Implantações com várias instâncias precisam de uma fila compartilhada.',
        logRetention: 'Retenção de registros',
        logRetentionEffect:
          'Sincronizações e envios concluídos mais antigos que isso são excluídos automaticamente.',
        credentialVault: 'Armazenamento de credenciais',
        credentialVaultEffect:
          'Onde ficam os tokens OAuth e as senhas das contas conectadas.',
        minutes: '{{count}} minutos',
        days: '{{count}} dias',
        keepForever: 'Mantidos para sempre',
        notConfigured: 'Não configurado',
        secretConfigured: 'Segredo configurado',
        secretMissing: 'Nenhum segredo configurado',
        jobsDefault: 'Segue jobs.default',
        vaultBuiltin: 'Integrado, no banco de dados da aplicação',
        vaultApplication: 'Registrado pela aplicação',
        copy: 'Copiar',
        copied: 'Copiado',
        readOnly:
          'Somente leitura: estas configurações vêm do config.yml e das variáveis de ambiente MAIL_* e são aplicadas após uma reinicialização.',
      },
    },
  },
};

export default pagesPtBR;
