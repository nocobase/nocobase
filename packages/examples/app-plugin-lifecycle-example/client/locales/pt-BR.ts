import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  navigation: {
    parameters: 'Parâmetros de tempo de execução',
    group: 'Fluxo de trabalho',
    tickets: 'Central de atendimento',
    expenses: 'Relatórios de despesas',
    invoices: 'Faturamento eletrônico',
    orders: 'Pagamento do pedido',
    exports: 'Exportações de dados',
    purchases: 'Venda relâmpago',
    fulfilments: 'Envio',
    subscriptions: 'Assinaturas',
  },
  parameters: {
    fields: {
      paymentWindowMinutes: {
        title: 'Tempo limite de pagamento (minutos)',
        description:
          'Cancele um pedido não pago após esta espera. As alterações se aplicam aos cronômetros de pagamento recentemente agendados; os temporizadores existentes mantêm o tempo devido.',
      },
      escalateAfterMinutes: {
        title: 'Tempo limite de revisão do gerente (minutos)',
        description:
          'Escale uma revisão pendente do gerente após esta espera. As alterações se aplicam aos cronômetros de revisão recentemente agendados; os temporizadores existentes mantêm o tempo devido.',
      },
      waitMinutes: {
        title: 'Tempo limite de resposta do cliente (minutos)',
        description:
          'Fechar um ticket se o cliente não responder dentro desta espera. As alterações se aplicam aos cronômetros recentemente agendados; os temporizadores existentes mantêm o tempo devido.',
      },
      querySeconds: {
        title: 'Atraso na consulta do status da fatura (segundos)',
        description:
          'Consulte o fornecedor da fatura se nenhum retorno de chamada chegar durante esta espera. As alterações se aplicam a consultas recentemente agendadas; as consultas existentes mantêm o devido tempo.',
      },
      pollSeconds: {
        title: 'Intervalo de verificação do progresso da exportação (segundos)',
        description:
          'Espere um pouco antes de verificar uma exportação em andamento. As alterações se aplicam a verificações recentemente agendadas; os cheques existentes mantêm o seu devido tempo.',
      },
      maxMinutes: {
        title: 'Tempo limite de conclusão da exportação (minutos)',
        description:
          'Defina o prazo de conclusão quando um trabalho de exportação for iniciado. Um trabalho inacabado expira nesse prazo. As mudanças não alteram os prazos de trabalho existentes.',
      },
      periodMinutes: {
        title: 'Período de renovação da assinatura (minutos)',
        description:
          'Utilize esta duração para calcular o novo final do período após uma cobrança bem-sucedida. As alterações serão aplicadas após a próxima cobrança bem-sucedida; o final do período atual permanece fixo.',
      },
      dunningMinutes: {
        title:
          'Falha no intervalo de novas tentativas de pagamento de renovação (minutos)',
        description:
          'Espere um pouco antes de tentar novamente um pagamento de renovação com falha. As alterações se aplicam a novas tentativas agendadas; as tentativas existentes mantêm o devido tempo.',
      },
      maxDunning: {
        title: 'Limite de falha de pagamento de renovação',
        description:
          'Cancele a assinatura na próxima tentativa automática se a contagem de pagamentos com falha atingir esse limite. As alterações se aplicam na próxima decisão de nova tentativa.',
      },
      reopenDays: {
        title: 'Prazo de reabertura de ingressos (dias)',
        description:
          'Permitir a reabertura dentro de alguns dias após o fechamento de um ticket; caso contrário, será necessário um novo ticket. Cada solicitação de reabertura usa a configuração mais recente.',
      },
    },
    loading: 'Carregando parâmetros…',
    title: 'Parâmetros de tempo de execução',
    description:
      'Altere apenas valores declarados por código. A estrutura do fluxo de trabalho, as decisões e os tempos limite permanecem no código.',
    ruleExplanation:
      'Todas as condições em um grupo devem corresponder. Grupos separados são somados. Coloque usuários alternativos em grupos separados.',
    allConditions: 'Combine todas essas condições',
    alsoInclude: 'Incluir também',
    selectionType: 'Tipo de seleção',
    searchReference: 'Pesquisa por nome',
    noMatches: 'Sem referências correspondentes',
    previousPage: 'Página anterior',
    nextPage: 'Próxima página',
    reference: 'Referência',
    remove: 'Remover',
    addCondition: 'Adicionar condição',
    addGroup: 'Incluir também outro grupo',
    revision: 'Revisão {{revision}}',
    codeDefaults: 'Padrões de código',
    databaseVersion: 'Configuração salva',
    snapshotEffect:
      'Instantâneo: corrigido no primeiro envio; retido após devolução ou retirada',
    liveEffect:
      'As leituras futuras de parâmetros usam a configuração mais recente; os cronômetros e prazos existentes permanecem fixos.',
    yes: 'Sim',
    no: 'Não',
    invalidObject: 'Insira um objeto JSON válido.',
    saved: 'Configuração salva.',
    conflict:
      'A revisão mudou. Suas entradas foram preservadas; revise os valores atuais antes de tentar novamente.',
    currentRevision: 'Revisão salva atual: {{revision}}',
    keepDraft: 'Mantenha minhas informações e use esta revisão',
    save: 'Salvar valores',
    readOnly: 'Você pode ler esses valores, mas não pode alterá-los.',
    preview: 'Pré-visualização de candidatos para Lin',
    candidates: 'Candidatos',
    noCandidates: 'Nenhum candidato elegível; a submissão será recusada.',
    editCurrent: 'Editar configuração atual',
    historyBoundary:
      'Isto edita a configuração atual. Os factos históricos e os candidatos atribuídos existentes permanecem inalterados.',
    history: 'Uso real de parâmetros',
    effectivePreview: 'Valores efetivos para este registro agora',
    firstSnapshot: 'Instantâneo do primeiro envio',
    notRecorded: 'Não registrado',
    diagramEntry: 'Entrada de diagrama opcional',
    diagramHint:
      'Clique em um nó vinculado ou transição para abrir o editor compartilhado. As entradas não consolidadas mostram seus detalhes originais. Clicar nunca executa uma transição.',
    workflow: 'Fluxo de trabalho',
    types: {
      department: 'Departamento',
      role: 'Função',
      user: 'Pessoa',
    },
  },
  invoices: {
    title: 'Faturamento eletrônico',
    list: 'Faturas',
    new: 'Nova fatura',
    empty: 'Nenhuma fatura aqui.',
    pick: 'Escolha uma fatura para acompanhar sua emissão.',
    description:
      'Faturar um pedido de sandbox concluído. Aguarde o webhook da plataforma; consulta após {{seconds}} segundos sem um. O envio é tentado até 3 vezes.',
    shows:
      'Envio, retornos de chamada, consultas de tempo limite e novas tentativas compartilham uma solicitação do provedor. As notificações repetidas aplicam-se uma vez e as novas tentativas nunca emitem uma segunda fatura.',
    orderSummary: 'Pedido #{{order}} · {{amount}}',
    fields: {
      order: 'Pedido concluído',
      customer: 'Cliente',
      amount: 'Montante',
      taxNumber: 'Número fiscal',
      request: 'Solicitação do provedor',
      number: 'Número da fatura',
      queries: 'Consultas',
    },
    actions: {
      submit: 'Solicitar fatura',
      retryInvoice: 'Tentar novamente a fatura',
    },
    form: {
      title: 'Solicite uma fatura eletrônica',
      ordersHint:
        'Escolha um pedido de demonstração concluído. Cada pedido pode ter apenas uma fatura.',
      order: 'Pedido #{{order}} · {{customer}} · {{amount}} · Concluído',
      invoiceTitle: 'Título da fatura',
      failSubmissions: 'Envios que falham propositalmente',
      failHint:
        'Defina 1 ou 2 para ver novas tentativas automáticas; 3 paradas em questão falharam. Tente novamente a fatura e depois se recupere.',
      submit: 'Criar',
    },
    banner: {
      draft: 'Ainda não solicitado.',
      submitting: 'Envio da solicitação; as falhas são repetidas…',
      awaiting: 'Aguardando webhook da plataforma; consultando em {{time}}.',
      querying: 'Consultando a plataforma de faturamento…',
      issued: 'Fatura emitida. O PDF de demonstração está pronto.',
      failed: 'Problema falhou: {{error}} Você pode tentar a fatura novamente.',
    },
    outside: {
      title: 'Plataforma de faturamento (sandbox)',
      description:
        'Simule a plataforma externa concluindo uma solicitação e enviando seu webhook. Nenhum sistema tributário real está conectado.',
      result: 'Resultado da plataforma',
      hint: 'Segure o webhook e emita com sucesso: a fatura ainda espera e consulta o resultado após 30 segundos. A entrega do evento antigo posteriormente não pode ser emitida novamente.',
      issue: 'Emissão com sucesso',
      fail: 'Rejeitar fatura',
      download: 'Baixe o PDF de amostra',
      pdfHint: 'O arquivo diz SANDBOX INVOICE e não é uma nota fiscal válida.',
    },
  },
  identity: {
    label: 'Conectado como',
  },
  roles: {
    agent: 'Agentes de suporte',
    customer: 'Clientes',
    applicant: 'Funcionários',
    manager: 'Gerentes',
    director: 'Executivos',
    finance: 'Finanças',
  },
  common: {
    signedInUser: 'Usuário conectado',
    system: 'Sistema',
    unassigned: 'Não atribuído',
    loading: 'Carregando…',
    cancel: 'Cancelar',
    close: 'Fechar',
    demoOptions: 'Opções de demonstração',
  },
  tickets: {
    title: 'Central de atendimento',
    agentDescription:
      'Receba novos tickets, responda aos clientes e resolva-os. Um ticket aguardando o cliente se fecha quando ele fica em silêncio e a resposta do cliente o traz de volta ao seu destinatário.',
    customerDescription:
      'Peça ajuda à equipe de suporte e acompanhe a conversa. Um ticket fechado pode ser reaberto por dias {{days}}.',
    queue: 'Fila de tickets',
    mine: 'Meus ingressos',
    newTicket: 'Novo bilhete',
    empty: 'Não há ingressos aqui.',
    pick: 'Escolha um ticket para ler a conversa.',
    filters: {
      all: 'Todos',
      new: 'Novo',
      open: 'Abrir',
      awaitingCustomer: 'Esperando',
      closed: 'Fechado',
    },
    form: {
      title: 'Contate o suporte',
      subject: 'Assunto',
      subjectPlaceholder: 'Resuma o problema em uma frase',
      category: 'Categoria',
      priority: 'Prioridade',
      description: 'Descrição',
      descriptionPlaceholder:
        'O que aconteceu, o que você esperava e as etapas para reproduzi-lo',
      failNotifications: 'Entregas de e-mail que falham propositalmente',
      failHint:
        'Cada resposta a este ticket lhe envia um e-mail. Faça com que as primeiras tentativas falhem para observar o efeito novamente.',
      submit: 'Enviar tíquete',
    },
    categories: {
      account: 'Conta e login',
      billing: 'Faturamento',
      howto: 'Como faço para…',
      incident: 'Algo está quebrado',
    },
    priorities: {
      low: 'Baixo',
      normal: 'Normal',
      high: 'Alto',
      urgent: 'Urgente',
    },
    meta: {
      customer: 'Cliente',
      category: 'Categoria',
      priority: 'Prioridade',
      assignee: 'Responsável atribuído',
      created: 'Criado',
    },
    banner: {
      new: 'Esperando que um agente o pegue.',
      open: '{{assignee}} está trabalhando nisso.',
      awaiting:
        'Aguardando o cliente. Fecha automaticamente em {{time}} sem resposta.',
      overdue: 'A espera acabou; a próxima varredura o fecha.',
      resolved: 'Resolvido pelo suporte.',
      timeout: 'Fechado automaticamente: o cliente não respondeu a tempo.',
      reopenUntil: 'Você pode reabri-lo até {{date}}.',
      reopenExpired: 'Já não pode ser reaberto; por favor abra um novo ticket.',
    },
    thread: {
      wrote: '{{name}} · {{time}}',
      accept: '{{actor}} pegou o ingresso',
      resolve: '{{actor}} marcou como resolvido',
      autoClose: 'Fechado automaticamente após esperar {{minutes}} minutos',
      reopen: '{{actor}} reabriu o ticket',
      delivery: {
        queued: 'E-mail para cliente na fila',
        running: 'Enviando e-mail para o cliente…',
        succeeded: 'Enviado por e-mail ao cliente',
        failed: 'E-mail falhou após tentativas de {{attempts}}: {{error}}',
        retrying:
          'Falha na tentativa de e-mail {{attempts}}, nova tentativa: {{error}}',
      },
    },
    composer: {
      agentPlaceholder: 'Responder ao cliente…',
      customerPlaceholder: 'Adicione uma resposta…',
      reopenPlaceholder: 'Diga-nos o que ainda está errado…',
      reply: 'Enviar resposta',
      accept: 'Pegue o ingresso',
      resolve: 'Marcos resolveu',
      customerReply: 'Enviar',
      reopen: 'Reabrir',
      nothing: 'Nada para você fazer neste ticket agora.',
    },
  },
  expenses: {
    title: 'Relatórios de despesas',
    applicantDescription:
      'Reivindicar despesas comerciais. Até {{auto}} é aprovado automaticamente; acima disso seu gerente aprova e acima de {{finance}} o diretor financeiro também.',
    approverDescription:
      'Relatórios aguardando sua aprovação. Um relatório que você deixa por {{minutes}} minutos passa para seu próprio gerente.',
    finalApproverDescription: 'Relatórios aguardando sua aprovação.',
    mine: 'Meus relatórios',
    approvals: 'Esperando por mim',
    newReport: 'Novo relatório',
    empty: 'Nenhum relatório aqui.',
    emptyApprovals: 'Nada espera pela sua aprovação.',
    pick: 'Escolha um relatório para vê-lo.',
    number: 'Relatório {{id}}',
    editor: {
      title: 'Finalidade',
      titlePlaceholder: 'Por exemplo: feira comercial de Xangai, outubro',
      purpose: 'Detalhes',
      purposePlaceholder:
        'Quem foi, por que e tudo o que um aprovador deve saber',
      items: 'Despesas',
      date: 'Data',
      category: 'Categoria',
      description: 'Descrição',
      amount: 'Valor (¥)',
      addItem: 'Adicionar despesa',
      removeItem: 'Remover',
      total: 'Total',
      failPayments: 'Tentativas de pagamento que falham propositalmente',
      failHint:
        'Um relatório aprovado é pago por um efeito. Faça com que as primeiras tentativas falhem para vê-lo tentar novamente.',
      save: 'Salvar rascunho',
      saved: 'Salvo.',
      submit: 'Enviar para aprovação',
      resubmit: 'Reenviar',
    },
    categories: {
      transport: 'Transporte',
      lodging: 'Alojamento',
      meals: 'Refeições',
      office: 'Material de escritório',
      entertainment: 'Entretenimento para clientes',
      other: 'Outros',
    },
    steps: {
      submit: 'Enviado',
      manager: 'Gerente',
      finance: 'Finanças',
      payment: 'Pago',
    },
    meta: {
      applicant: 'Requerente',
      approver: 'Esperando por',
      created: 'Criado',
      paymentRef: 'Referência de pagamento',
      total: 'Total',
    },
    banner: {
      draft: 'Rascunho. Somente você pode vê-lo até enviá-lo.',
      awaiting:
        'Aguardando {{approver}}. Passa para seu gerente em {{time}} sem decisão.',
      awaitingFinal: 'Aguardando {{approver}}.',
      overdue: 'A espera acabou; a próxima varredura passa adiante.',
      needsInfo: '{{actor}} enviou de volta: {{reason}}',
      rejected: '{{actor}} rejeitou: {{reason}}',
      approved: 'Aprovado. O pagamento está a caminho.',
      paymentRetrying:
        'Falha na tentativa de pagamento {{attempts}}, nova tentativa: {{error}}',
      paymentFailed:
        'O pagamento falhou após tentativas de {{attempts}}: {{error}}. As finanças farão o acompanhamento.',
      paid: 'Pago. Referência {{ref}}.',
    },
    timeline: {
      title: 'Histórico de aprovação',
      empty: 'Ainda não enviado.',
      autoApproved: 'Dentro de {{limit}}: aprovado automaticamente',
      escalated: 'Nenhuma decisão a tempo; passou para o próximo gerente',
      paid: 'Pagamento concluído',
    },
    decision: {
      title: 'Sua decisão',
      placeholder: 'Comentário (obrigatório para enviar de volta ou rejeitar)',
      approve: 'Aprovar',
      requestInfo: 'Enviar de volta',
      reject: 'Rejeitar',
    },
    withdraw: 'Retirar',
  },
  flowDiagram: {
    overview: 'Visão geral do diagrama',
    actualSize: 'Tamanho real',
    states: 'Estados',
    transitions: 'Transições',
    configurable: 'Parâmetros',
    current: 'Atual',
    visited: 'Visitado',
    initial: 'Inicial',
    final: 'Final',
    state: 'Estado',
    zoomOut: 'Diminuir zoom',
    zoomIn: 'Ampliar',
    fit: 'Ajustar para visualizar',
    empty: 'Nenhum estado para exibir.',
    loading: 'Layout do diagrama…',
    failed: 'Não é possível traçar este diagrama.',
    nodeHelp: 'Pressione Enter ou Espaço para selecionar um estado.',
    edgeHelp: 'Pressione Enter ou Espaço para selecionar uma transição.',
  },
  diagramStatus: {
    traversed: 'Percorrido',
    end: 'Fim',
    current: 'Atual',
    visited: 'Visitado',
    available: 'Disponível',
    pending: 'Não percorrido',
  },
  flows: {
    customer: 'Cliente',
    final: 'Este está terminado; nada mais o move.',
    process: 'Processo',
    legend:
      'O estado atual tem um preenchimento mais forte; os estados visitados e as transições reais percorridas compartilham uma cor de destaque. A legenda identifica transições disponíveis e partes não percorridas. Os estados iniciais têm fronteiras com pílulas, os estados finais têm fronteiras duplas. Selecione um estado ou transição para obter detalhes. ⚙ somente servidor, ⏱ gatilho, ✓/✗ continuação do efeito.',
    nothing: 'Nada para você fazer aqui agora; espera pelo lado de fora.',
  },
  webhooks: {
    title: 'Webhooks',
    hint: 'O que o sandbox enviou, reteve ou entregou e como cada entrega foi respondida. Entregue um novamente para ver um replay ou os retidos em outra ordem.',
    empty: 'Ainda não há webhooks.',
    hold: 'Segure o webhook',
    deliver: 'Entregar',
    deliverAgain: 'Entregar novamente',
    deliveries_one: 'hora {{count}} entregue',
    deliveries_other: 'tempos {{count}} entregues',
    occurred: 'Aconteceu {{time}}',
    outcomes: {
      applied: 'Aplicado',
      replayed: 'Repetido',
      ignored: 'Ignorado',
      retry: 'Tentarei novamente',
      held: 'Realizado',
    },
    deliveries_many: 'tempos {{count}} entregues',
  },
  orders: {
    title: 'Pagamento do pedido',
    list: 'Pedidos',
    new: 'Nova ordem',
    empty: 'Nenhum pedido aqui.',
    pick: 'Escolha um pedido para ver onde está seu pagamento.',
    shows:
      'O pagamento é confirmado pelo webhook do provedor, não pela página: o pedido espera como um estado, e o webhook – por mais atrasado, antecipado ou frequente que chegue – o move exatamente uma vez. Um pagamento recebido após o cancelamento do pedido será reembolsado.',
    description:
      'Os clientes pagam no checkout hospedado pelo provedor de pagamento; o pedido segue em frente quando o webhook do provedor chega. Um pedido não pago é fechado após {{minutes}} minutos.',
    nothing: 'Nada a fazer: o pedido aguarda o provedor de pagamento.',
    actions: {
      checkout: 'Pagar',
      cancel: 'Cancelar pedido',
      ship: 'Navio',
      refundOrder: 'Reembolso',
      retryRefund: 'Tentar novamente o reembolso',
    },
    form: {
      title: 'Faça um pedido',
      item: 'Artigo',
      amount: 'Valor (¥)',
      failCheckouts: 'Tentativas de checkout que falham propositalmente',
      failRefunds: 'Tentativas de reembolso que falham propositalmente',
      failHint:
        'A abertura do checkout e o reembolso são efeitos com novas tentativas; faça com que eles deixem de observar as novas tentativas e onde o pedido termina.',
      submit: 'Fazer pedido',
    },
    fields: {
      customer: 'Cliente',
      amount: 'Montante',
      attempt: 'Rodada de pagamento',
      session: 'Sessão de checkout',
      paymentRef: 'Pagamento',
      refundRef: 'Reembolso',
    },
    banner: {
      draft: 'Ainda não pago.',
      creatingCheckout: 'Abrindo o checkout do provedor…',
      awaitingPayment:
        'Aguardando o provedor de pagamento. Fecha em {{time}} se não pagar.',
      overdue: 'A janela acabou; a próxima varredura o fecha.',
      paymentFailed: '{{error}} Pague novamente, ou fecha em {{time}}.',
      paid: 'Pago, pronto para envio.',
      cancelled: {
        customer: 'Cancelado pelo cliente.',
        timeout: 'Fechado: não pago a tempo.',
        refundRequested: 'Reembolsado a pedido do cliente.',
      },
      refunding: 'Reembolsando…',
      refundNeedsAttention:
        'O reembolso falhou: {{error}} Aguarda alguém tentar novamente.',
      refunded: 'Reembolsado.',
      fulfilled: 'Pago e enviado.',
    },
    sessionStatus: {
      open: 'abrir',
      paid: 'pago',
      declined: 'recusou',
      expired: 'expirou',
    },
    outside: {
      title: 'Provedor de pagamento (sandbox)',
      description:
        'Reproduz o cliente no checkout do provedor e o provedor enviando seu webhook. Mantenha um webhook para entregá-lo com atraso, duas vezes ou após o cancelamento.',
      checkout: 'Check-out hospedado',
      session: 'Sessão {{id}}: {{status}}.',
      noSession: 'Nenhum caixa está aberto; o cliente paga primeiro.',
      pay: 'Pagar',
      decline: 'Recusar o cartão',
      tryThis:
        'Experimente: segure o webhook, pague, cancele o pedido e depois entregue o webhook retido — o dinheiro chega após o cancelamento e é reembolsado.',
    },
  },
  exports: {
    title: 'Exportações de dados',
    list: 'Exportações',
    new: 'Nova exportação',
    empty: 'Não há exportações aqui.',
    pick: 'Escolha uma exportação para assisti-la sendo pesquisada.',
    shows:
      'O fornecedor não tem webhook, então o ciclo de vida pergunta: um gatilho dispara uma autotransição a cada poucos segundos e entrar no estado novamente pesquisa o fornecedor. Um prazo fixado no registro encerra a espera.',
    description:
      'O fornecedor processa as exportações lentamente e não chama ninguém de volta, então cada exportação pesquisa a cada {{seconds}} segundos e desiste após {{minutes}} minutos.',
    nothing: 'Nada a fazer: a exportação está sondando o fornecedor.',
    actions: {
      submit: 'Iniciar exportação',
      retry: 'Exportar novamente',
      cancel: 'Cancelar',
    },
    outcomes: {
      success: 'consegue',
      failure: 'falha',
      stuck: 'fica preso em 60%',
    },
    jobStatus: {
      running: 'correndo',
      succeeded: 'feito',
      failed: 'falhou',
      cancelled: 'cancelado',
    },
    form: {
      title: 'Solicitar uma exportação',
      name: 'Nome',
      duration: 'O fornecedor leva (segundos)',
      outcome: 'O trabalho do fornecedor',
      hint: 'Um trabalho travado nunca termina: a exportação atinge o prazo e interrompe o trabalho.',
      submit: 'Criar',
    },
    fields: {
      vendor: 'Fornecedor',
      vendorValue: '{{seconds}}, {{outcome}}',
      job: 'Trabalho de fornecedor',
      polls: 'Pesquisas',
      deadline: 'Prazo',
    },
    banner: {
      draft: 'Não iniciado.',
      starting: 'Enviando o trabalho ao fornecedor…',
      processing: 'O fornecedor está trabalhando nisso. Desiste em {{time}}.',
      done: 'Pronto: {{url}}',
      failed: 'Falha: {{error}}',
      timedOut:
        'O fornecedor não finalizou antes do prazo; seu trabalho foi interrompido.',
      cancelled: 'Cancelado.',
    },
    outside: {
      title: 'Fornecedor (sandbox)',
      description:
        'O que a exportação sabe sobre o trabalho do vendedor: apenas o que viu na sua última pesquisa. O fornecedor não envia nenhum webhook, então nada mais pode.',
      lifecycleSide: 'O que a exportação sabe',
      lifecycleHint:
        'Jó {{id}}, segundo a última pesquisa; a próxima enquete o atualiza.',
      lastPoll:
        'A última pesquisa viu {{status}}, {{progress}}% (pesquisas {{count}}).',
      noPoll: 'Ainda não pesquisado.',
      nextPoll: 'Próxima pesquisa sobre {{time}}.',
      pollDue: 'A próxima varredura faz uma sondagem.',
      noJob: 'Ainda não há emprego no fornecedor.',
    },
  },
  purchases: {
    title: 'Venda relâmpago',
    list: 'Compras',
    new: 'Nova compra',
    empty: 'Nenhuma compra aqui.',
    pick: 'Escolha uma compra para seguir seus passos.',
    shows:
      'Uma compra abrange dois sistemas que uma reversão do banco de dados não pode desfazer. Cada etapa é um estado com um efeito, e quando a cobrança é recusada a reserva é desfeita por uma etapa própria — portanto, o que ainda é devido é sempre o estado do registro.',
    description:
      'O armazém retém as unidades e o provedor de pagamento recebe o dinheiro. Quando o cartão é recusado, as unidades são devolvidas através de uma etapa compensatória; uma compensação que continua falhando, para e espera por uma pessoa.',
    nothing: 'Nada a fazer: a compra está caminhando.',
    actions: {
      submit: 'Fazer pedido',
      abandon: 'Descartar',
      retryRelease: 'Tente liberar novamente',
    },
    items: {
      headphones: 'Fones de ouvido',
      keyboard: 'Teclado mecânico',
      lamp: 'Candeeiro de secretária',
    },
    form: {
      title: 'Compre na venda relâmpago',
      item: 'Artigo',
      quantity: 'Quantidade',
      total: 'Total {{total}}',
      declineCharge: 'O cartão foi recusado',
      failReleases: 'Liberações de estoque que falham propositalmente',
      failHint:
        'Recusar o cartão para assistir à compensação; faça o lançamento falhar 3 vezes ou mais para vê-lo parar e esperar por uma pessoa.',
      submit: 'Criar',
    },
    fields: {
      customer: 'Cliente',
      amount: 'Montante',
      reservation: 'Reserva',
      paymentRef: 'Pagamento',
    },
    banner: {
      draft: 'Ainda não colocado.',
      reserving: 'Reservando as unidades…',
      charging: 'Unidades detidas; carregando o cartão…',
      releasing: 'A cobrança falhou ({{error}}); devolvendo as unidades...',
      compensationNeedsAttention:
        'Não foi possível devolver as unidades: {{error}} Espera que alguém tente novamente a liberação.',
      confirmed: 'Confirmado: unidades reservadas e pagas.',
      cancelled: {
        customer: 'Descartado.',
        outOfStock: 'Cancelado: {{error}}',
        paymentDeclined:
          'Cancelado: o cartão foi recusado e as unidades foram devolvidas.',
      },
    },
    outside: {
      title: 'Armazém e provedor de pagamento (sandbox)',
      description:
        'Cada etapa é um efeito em um sistema fora da aplicação; o desfazer também é um passo.',
      steps: 'Etapas',
      stepsHint: 'A última execução do efeito de cada etapa.',
      reserve: 'Estoque de reserva',
      charge: 'Carregar o cartão',
      release: 'Liberar estoque (compensação)',
      notYet: 'Não executado',
      stock: 'Estoque em armazém',
      stockHint: 'Observe as unidades saindo e voltando.',
      item: 'Artigo',
      available: 'Disponível',
      reserved: 'Reservado',
    },
  },
  fulfilments: {
    title: 'Envio',
    list: 'Remessas',
    new: 'Nova remessa',
    empty: 'Nenhuma remessa aqui.',
    pick: 'Escolha uma remessa para reproduzir seu pagamento, armazém e transportadora.',
    shows:
      'Uma remessa espera por dois sinais de dois sistemas, seja qual for a ordem em que chegam, e depois segue os eventos da transportadora – aplicados quando eles aconteceram, não quando chegaram.',
    description:
      'Uma remessa sai assim que o pagamento é capturado e o armazém a separa, em qualquer ordem. Os webhooks da operadora chegam atrasados ​​e fora de serviço; apenas um evento mais recente o move.',
    nothing: 'Nada que você possa fazer: o carregamento espera pelo exterior.',
    actions: {
      ship: 'Mão para transportador',
      cancel: 'Cancelar envio',
    },
    signals: {
      payment: 'pagamento capturado',
      pick: 'armazém selecionado',
    },
    and: 'e',
    carrier: {
      booked: 'Reservado',
      pickedUp: 'Recolhido',
      inTransit: 'Em trânsito',
      outForDelivery: 'Fora para entrega',
      delivered: 'Entregue',
      exception: 'Exceção',
    },
    form: {
      title: 'Abrir uma remessa',
      name: 'Nome',
      customer: 'Cliente',
      submit: 'Criar',
    },
    fields: {
      customer: 'Cliente',
      paid: 'Pagamento capturado',
      picked: 'Escolhido',
      tracking: 'Número de rastreamento',
      carrier: 'Transportadora diz',
      carrierAt: 'A partir de',
    },
    banner: {
      preparing: 'Aguardando: {{waiting}}.',
      readyToShip: 'Pago e retirado: pronto para entregar ao transportador.',
      booking: 'Reservando a transportadora…',
      shipped: 'A caminho.',
      exception:
        'A transportadora relatou um problema; um evento mais recente o limpa.',
      delivered: 'Entregue.',
      cancelled: 'Cancelado.',
    },
    outside: {
      title: 'Provedor de pagamento, armazém e transportadora (sandbox)',
      description:
        'Envie o webhook de cada sistema, agora ou em espera. Entregue os retidos em outro pedido para ver quais se aplicam.',
      signals: 'Dois sinais',
      signalsHint:
        'Qualquer um pode vir primeiro; o segundo segue em frente com a remessa.',
      capture: 'Pagamento capturado',
      pick: 'Armazém selecionado',
      carrierTitle: 'Transportadora',
      carrierHint:
        'Eventos sobre o pacote, cada um com a hora em que aconteceu.',
      status: 'Status',
      location: 'Localização',
      offset: 'Minutos a partir de agora',
      send: 'Enviar',
      offsetHint:
        'O último campo muda quando a varredura ocorreu: um número negativo informa uma varredura mais antiga.',
      scramble: 'Segure três digitalizações para entregar em qualquer ordem',
    },
  },
  subscriptions: {
    title: 'Assinaturas',
    list: 'Assinaturas',
    new: 'Inscrever-se',
    empty: 'Não há assinaturas aqui.',
    pick: 'Escolha uma assinatura para acompanhar seu faturamento.',
    shows:
      'Uma assinatura fica ativa → cobrando → ativa uma vez por período, enquanto durar. A renovação vence no final do período da assinatura, conforme constatado pela varredura; uma carta recusada é repetida por um gatilho até desistir.',
    description:
      'Carregado a cada {{period}} minutos. Uma cobrança recusada é repetida a cada minuto(s) {{dunning}}; após {{tries}} tentar, a assinatura será cancelada.',
    nothing:
      'Não há nada que você possa fazer: o faturamento é executado por conta própria.',
    actions: {
      updateCard: 'Atualizar cartão',
      cancel: 'Cancelar inscrição',
    },
    plans: {
      basic: 'Básico',
      pro: 'Pró',
    },
    periodN_one: 'Período {{count}}',
    periodN_other: 'Períodos {{count}}',
    form: {
      title: 'Inscrever-se',
      plan: 'Plano',
      charge: '{{price}} é cobrado agora e no início de cada período.',
      cardDeclines: 'Cobranças recusadas pelo cartão',
      failHint:
        'As recusas são respostas, não interrupções: a cobrança não é repetida de uma só vez, mas pelo gatilho de cobrança, sob uma nova chave.',
      submit: 'Inscrever-se',
    },
    fields: {
      customer: 'Cliente',
      periods: 'Períodos pagos',
      periodEnd: 'Período termina',
      dunning: 'Tentativas falhadas',
      lastCharge: 'Última carga',
      card: 'Cartão',
      cardWorks: 'Obras',
      cardValue_one: 'recusa a próxima cobrança',
      cardValue_other: 'recusa as próximas {{count}} cobranças',
      cardValue_many: 'recusa as próximas {{count}} cobranças',
      cardValue_zero: 'não recusa nenhuma cobrança ({{count}})',
    },
    banner: {
      renewing: 'Carregando o cartão…',
      active: 'Ativo. Renova em {{time}}.',
      due: 'O período terminou; a próxima varredura o renova.',
      pastDue:
        '{{error}} Tente {{tries}} de {{max}}; próxima tentativa em {{time}}.',
      cancelled: {
        customer: 'Cancelamento da assinatura.',
        unpaid: 'Cancelado: o cartão continuou sendo recusado.',
      },
    },
    outside: {
      title: 'Faturamento (sandbox)',
      description:
        'Cada carga é uma sequência do efeito de carga, codificado pelo período e pela tentativa.',
      charges: 'Cobranças',
      chargesHint: 'O mais antigo primeiro.',
      noCharges: 'Nenhuma acusação ainda.',
      sweep: 'Varredura de renovação',
      sweepHint:
        'As renovações são encontradas pela varredura no final do período de cada assinatura; ele é executado a cada 10 segundos ou agora.',
    },
    periodN_many: 'Períodos {{count}}',
  },
  guide: {
    title: 'Sobre este exemplo',
    show: 'Mostrar',
    hide: 'Esconder',
    purpose: 'O que mostra',
    howTo: 'Como experimentar',
    samples:
      'Os registros de amostra são carregados quando o aplicativo é instalado com dados de amostra (APP_SAMPLE_DATA=true). Em um banco de dados instalado sem eles, execute “pnpm nocobase db sample”.',
    invoices: {
      purpose:
        'Use uma solicitação de provedor para demonstrar retornos de chamada, consultas de tempo limite e novas tentativas, com um PDF de amostra para download.',
      step1:
        'Abra a amostra do pedido nº 1024, solicite-a e clique em Emitir com sucesso no sandbox. Após o webhook, baixe o PDF de amostra.',
      step2:
        'Entregar novamente a mesma notificação: ela é reproduzida e nenhuma segunda fatura é emitida.',
      step3:
        'No pedido nº 1026, mantenha o webhook e emita com sucesso. Após 30 segundos, a consulta é concluída. Uma entrega posterior não poderá emitir novamente.',
      step4:
        'A amostra 晨光书店 falha no envio 3 vezes. Tentar novamente a recuperação da fatura após falha no problema e mantém a mesma solicitação do fornecedor.',
    },
    tickets: {
      purpose:
        'Um ticket permanece onde está em seu próprio campo de status, e cada alteração – aceitar, responder, resolver, reabrir – é uma transição declarada na fonte. A conversa é o log de transição: cada mensagem é a entrada da transição que causou. Os e-mails são executados como efeitos após a confirmação da transição, com novas tentativas, e um ticket deixado aguardando seu cliente é fechado por um gatilho.',
      step1:
        'Use “Conectado como” no canto superior direito para alternar entre os agentes de suporte e os clientes. Os agentes veem toda a fila; um cliente vê apenas seus próprios tickets.',
      step2:
        'Como agente, abra o novo ticket “无法登录管理后台” e responda. Agora aguarda o cliente e fecha-se após alguns minutos de silêncio; os gatilhos são varridos a cada 10 segundos.',
      step3:
        'Mude para 王女士 e responda a um ticket que está esperando por ela: ele volta para seu agente. Um ticket fechado pode ser reaberto pelo cliente por 7 dias — experimente como 李先生 em “如何导出本月的订单报表？”.',
      step4:
        'Registre um ticket como cliente com “Entregas de e-mail que falham propositalmente” definido em Opções de demonstração e, em seguida, responda como um agente: “Sob o capô” mostra o efeito do e-mail falhando e tentando novamente.',
    },
    expenses: {
      purpose:
        'Um relatório de despesas é encaminhado pelo seu valor: até ¥ 5.000 ele é aprovado automaticamente, acima disso o gerente do requerente aprova, e acima de ¥ 50.000 também o diretor financeiro. Os aprovadores aprovam, devolvem ou rejeitam com um motivo, um gerente ocioso é preterido por um gatilho e um relatório aprovado é pago por um efeito que então o marca como pago.',
      step1:
        'Use “Conectado como” para interpretar os funcionários 林晓 e 何东, seus gerentes, o executivo e o diretor financeiro. Um funcionário vê seus próprios relatórios; um aprovador vê o que espera por ele.',
      step2:
        'Como 林晓, envie a minuta “杭州客户拜访” (¥872): ela é aprovada automaticamente e paga um momento depois. “Sob o capô” mostra o efeito do pagamento e a transição “paga” que ele disparou.',
      step3:
        'Mude para 赵静, o diretor financeiro, e aprove “法兰克福展会参展”, que 陈明 já aprovou: acima de ¥ 50.000, precisa de ambos.',
      step4:
        'Como 何东, reenvie “北京客户现场支持”, que foi enviado de volta para obter mais informações, e aprove-o como 孙磊. Um relatório deixado com um gerente por 3 minutos é encaminhado para o gerente do gerente.',
      step5:
        'Em “Sob o capô”, “O que a identidade atual pode fazer” fornece o motivo de cada ação que a pessoa atual pode não realizar. Abra um relatório de espera em duas janelas e atue em ambas: a segunda é recusada porque a versão que viu está obsoleta.',
    },
    orders: {
      purpose:
        'Um pedido é marcado como pago apenas pelo webhook do provedor de pagamento, nunca pela página. Enquanto espera, é apenas um estado registrado — sem cronômetro, sem solicitação aberta — e um webhook que chega atrasado, adiantado ou duas vezes ainda o move exatamente uma vez. O dinheiro que chega após o cancelamento do pedido é reembolsado.',
      step1:
        'Abra o pedido de amostra “降噪耳机 × 1” e clique em “Pagar”: um efeito abre o checkout hospedado do provedor e o pedido aguarda o pagamento.',
      step2:
        'No cartão tracejado “Provedor de pagamento (sandbox)”, pague ou recuse o cartão. O webhook que o provedor envia é o que movimenta o pedido; “Entregar novamente” é respondido Repetido.',
      step3:
        'Marque “Segurar o webhook”, pague, clique em “Cancelar pedido” e entregue o webhook retido: o pagamento chega após o cancelamento e é reembolsado.',
      step4:
        'A amostra “机械键盘 × 1” falha em sua primeira verificação propositalmente, para mostrar o efeito de nova tentativa. Um pedido não pago expira após 3 minutos.',
    },
    exports: {
      purpose:
        'O fornecedor não envia nenhum webhook, então a exportação o pesquisa: um gatilho aciona a “sondagem” de autotransição, a reentrada em “processamento” executa a verificação e o prazo escrito no registro decide quando desistir.',
      step1:
        'Abra “9 月订单明细” e clique em “Iniciar exportação”. O vendedor leva 30 segundos; observe “O que o fornecedor sabe” à frente do que a exportação sabe até a próxima pesquisa.',
      step2:
        'Inicie “全年客户名单”, cujo trabalho do fornecedor trava: no prazo final, a exportação expira e interrompe o trabalho do fornecedor. “Exportar de novo” inicia uma nova rodada.',
      step3:
        'Em “Under the Hood”, cada enquete é uma transição no log e cada verificação é uma execução de efeito.',
    },
    purchases: {
      purpose:
        'Uma compra de venda relâmpago abrange dois sistemas: o armazém reserva o estoque e, em seguida, o provedor de pagamento cobra o cartão. Quando a cobrança é recusada, a reserva é desfeita através de uma etapa compensatória própria; uma compensação que continua falhando e parando em um estado em que a pessoa tenta novamente.',
      step1:
        'Abra a amostra de compra de duas lâmpadas e clique em “Fazer pedido”: as unidades são reservadas, o cartão é cobrado e a compra é finalizada.',
      step2:
        'Faça a compra do teclado de amostra, cujo cartão foi recusado, e observe a unidade sair do “estoque do armazém” e voltar.',
      step3:
        'Criar uma compra com o cartão recusado e “Liberações de estoque que falham propositalmente” definido como 3: a liberação para e aguarda “Tentar novamente a liberação”.',
    },
    fulfilments: {
      purpose:
        'Uma remessa espera por dois sinais de dois sistemas – o pagamento capturado e a coleta do armazém – em qualquer ordem que chegue, e então segue a transportadora. Os eventos da operadora são aplicados quando ocorreram, não quando chegaram, e um evento mais antigo é recusado como obsoleto.',
      step1:
        'Abra o envio de amostra e envie “Armazém selecionado” e “Pagamento capturado” em qualquer ordem: o segundo move-o para pronto para envio.',
      step2:
        'Clique em “Entregar à transportadora” e envie as digitalizações da transportadora, cada uma com um status e uma localização.',
      step3:
        'Marque “Segure três varreduras para entregar em qualquer ordem” e entregue a varredura mais recente primeiro: as anteriores são ignoradas como obsoletas.',
      step4:
        'Um “minutos a partir de agora” negativo relata uma varredura que aconteceu antes, que é a aparência de um evento tardio.',
    },
    subscriptions: {
      purpose:
        'Uma assinatura é cobrada no início de cada período enquanto ele durar. A varredura do plug-in renova cada um deles no final do seu próprio período, e uma cobrança recusada é tentada novamente pelo gatilho de cobrança, sob uma nova chave, até que seja recuperada ou a assinatura seja cancelada.',
      step1:
        'Clique em “Assinar” e escolha um plano: a primeira cobrança é executada de uma só vez. Não há assinatura de amostra, pois a criação de uma cobra o cartão.',
      step2:
        'Assine com “Cobranças recusadas no cartão” definido como 1: o prazo vence, é tentado novamente um minuto depois e se recupera. “Atualizar cartão” recupera-o imediatamente.',
      step3:
        'Um período dura 3 minutos; “Executar gatilhos agora” em “Varredura de renovação” renova o que for devido sem esperar pela próxima varredura.',
    },
  },
  blockers: {
    invoiceRequestMismatch:
      'O resultado pertence a outra solicitação de fatura.',
    agentOnly: 'Somente um agente de suporte pode trabalhar em tickets.',
    requesterOnly: 'Somente o cliente que preencheu o ticket pode fazer isso.',
    systemOnly: 'O sistema faz isso sozinho depois que a espera passa.',
    reopenExpired:
      'Fechado há muito tempo para reabrir; em vez disso, registre um novo ticket.',
    applicantOnly: 'Somente o requerente pode fazer isso com seu relatório.',
    approverOnly:
      'Somente o atual aprovador pode decidir sobre este relatório.',
    topApprover: 'O aprovador atual já é o nível mais alto.',
    customersOnly:
      'Somente um cliente pode registrar um ticket, para si mesmo.',
    applicantsOnly:
      'Somente um funcionário pode apresentar um relatório de despesas, para si mesmo.',
    alreadyPaid: 'O pagamento já foi confirmado.',
    alreadyPicked: 'O armazém já retirou.',
    staleCarrierEvent: 'Um evento de operadora mais recente já foi aplicado.',
    periodNotOver: 'O período atual ainda não terminou.',
  },
  problems: {
    orderRef: 'Escolha um pedido de sandbox concluído.',
    taxNumber: 'Insira um número fiscal de 15 a 20 letras ou dígitos.',
    message: 'Escreva uma mensagem.',
    reason: 'Dê uma razão.',
    subject: 'Dê um assunto ao ticket.',
    description: 'Descreva o problema.',
    category: 'Escolha uma categoria.',
    priority: 'Escolha uma prioridade.',
    title: 'Dê-lhe um nome.',
    amountCents: 'O valor deve ser maior que 0.',
    durationSeconds: 'O fornecedor leva entre 5 e 600 segundos.',
    vendorOutcome: 'Escolha como o trabalho termina.',
    sku: 'Escolha um item.',
    quantity: 'Compre entre 1 e 5.',
    plan: 'Escolha um plano.',
    customerId: 'Escolha o cliente.',
  },
  errors: {
    EXPENSE_NOT_FOUND: 'O relatório de despesas não existe.',
    OWN_EXPENSE_ONLY: 'Somente o solicitante pode editar este relatório.',
    EXPENSE_LOCKED:
      'Um relatório em análise não pode ser editado; retire-o primeiro.',
    EXPENSE_CHANGED:
      'O relatório mudou enquanto você o editava; recarregue-o e tente novamente.',
    SANDBOX_SESSION_CLOSED: 'O checkout não está mais aberto.',
    SANDBOX_NOT_FOUND: 'A sandbox não possui tal objeto.',
    UNKNOWN_WEBHOOK_EVENT: 'O sandbox não envia esse evento.',
    WEBHOOK_EVENT_NOT_FOUND: 'Nenhum evento de webhook.',
  },
  lifecycle: {
    title: 'Sob o capô',
    hint: 'Qual o ciclo de vida registrado para este registro. Um aplicativo real não mostraria isso aos seus usuários.',
    available: 'O que a identidade atual pode fazer',
    final: 'Nenhuma transição sai deste estado.',
    diagram: 'Diagrama interativo',
    diagramHint:
      'toMermaid(describe()) desenha o ciclo de vida como um diagrama de estado; cole-o em qualquer renderizador Mermaid.',
    retry: 'Tentar novamente',
    cancel: 'Cancelar',
    continue: 'Continuar',
    continuationWaits: '{{transition}} espera: {{error}}',
    continuationAbandoned:
      '{{transition}} desistiu após tentativas de {{attempts}}, até continuar manualmente: {{error}}',
    states: 'Estados',
    parameters: 'Parâmetros',
    transitions: 'Registro de transição',
    effects: 'Efeitos executados',
    noTransitions: 'Nenhuma transição ainda.',
    noEffects: 'Nenhum efeito ainda.',
    attempts: '{{attempts}}/{{max}}',
    runTriggers: 'Execute gatilhos agora',
    sweepNote:
      'De qualquer forma, os gatilhos são varridos a cada 10 segundos; isso executa a varredura imediatamente.',
    swept_one: 'A varredura disparou a transição {{count}}.',
    swept_other: 'A varredura disparou transições {{count}}.',
    columns: {
      time: 'Tempo',
      transition: 'Transição',
      change: 'Mudança',
      actor: 'Por',
      input: 'Entrada',
      effect: 'Efeito',
      status: 'Status',
      attempts: 'Tentativas',
      error: 'Último erro',
    },
    swept_many: 'A varredura disparou transições {{count}}.',
  },
  states: {
    review: 'Em revisão',
    submitting: 'Envio',
    awaitingIssue: 'Aguardando emissão',
    querying: 'Consulta',
    issued: 'Emitido',
    issueFailed: 'Problema falhou',
    new: 'Novo',
    open: 'Abrir',
    awaitingCustomer: 'Aguardando cliente',
    closed: 'Fechado',
    draft: 'Rascunho',
    awaitingManager: 'Aguardando gerente',
    awaitingFinance: 'Aguardando financiamento',
    needsInfo: 'Enviado de volta',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    paid: 'Pago',
    creatingCheckout: 'Abertura de checkout',
    awaitingPayment: 'Aguardando pagamento',
    paymentFailed: 'Falha no pagamento',
    cancelled: 'Cancelado',
    refunding: 'Reembolso',
    refundNeedsAttention: 'Reembolso precisa de atenção',
    refunded: 'Reembolsado',
    fulfilled: 'Enviado',
    starting: 'Iniciando',
    processing: 'Processamento',
    done: 'Concluído',
    failed: 'Falha',
    timedOut: 'Tempo limite esgotado',
    reserving: 'Reserva de estoque',
    charging: 'Cobrando',
    releasing: 'Liberação de estoque',
    compensationNeedsAttention: 'Compensação travada',
    confirmed: 'Confirmado',
    preparing: 'Preparação',
    readyToShip: 'Pronto para enviar',
    booking: 'Transportadora de reservas',
    shipped: 'Em trânsito',
    exception: 'Exceção da operadora',
    delivered: 'Entregue',
    renewing: 'Cobrando',
    active: 'Ativo',
    pastDue: 'Vencido',
  },
  transitions: {
    retry: 'Tentar novamente',
    jobStarted: 'Trabalho enviado',
    startFailed: 'Falha no envio',
    poll: 'Resultado da enquete',
    jobDone: 'Exportação concluída',
    jobFailed: 'Falha na exportação',
    cancel: 'Cancelar',
    paymentCaptured: 'Pagamento capturado',
    picked: 'Armazém selecionado',
    ship: 'Navio',
    booked: 'Transportadora reservada',
    trackingUpdated: 'Rastreamento atualizado',
    checkout: 'Abrir checkout',
    checkoutCreated: 'Check-out aberto',
    checkoutFailed: 'Falha na finalização da compra',
    paymentSucceeded: 'Pagamento bem-sucedido',
    paymentDeclined: 'Pagamento recusado',
    paidAfterCancel: 'Pagamento após cancelamento',
    expire: 'Fechar após tempo limite',
    refundOrder: 'Reembolso',
    refunded: 'Reembolso concluído',
    refundFailed: 'Falha no reembolso',
    retryRefund: 'Tentar novamente o reembolso',
    charged: 'Carga bem-sucedida',
    chargeFailed: 'Carga falhou',
    renew: 'Renovar quando devido',
    retryCharge: 'Tentar cobrar novamente',
    updateCard: 'Atualizar cartão',
    abandon: 'Abandonar',
    stockReserved: 'Estoque reservado',
    stockUnavailable: 'Estoque indisponível',
    stockReleased: 'Estoque liberado',
    releaseFailed: 'Falha na liberação de estoque',
    retryRelease: 'Tentar novamente a liberação de estoque',
    retryInvoice: 'Tentar novamente a fatura',
    submitted: 'Solicitação enviada',
    submissionFailed: 'Falha no envio',
    query: 'Consultar fatura',
    stillPending: 'Ainda pendente',
    issued: 'Fatura emitida',
    issueFailed: 'Problema falhou',
    queryFailed: 'Falha na consulta',
    create: 'Criado',
    accept: 'Tome',
    reply: 'Responder',
    customerReply: 'Resposta do cliente',
    resolve: 'Resolver',
    autoClose: 'Fechar automaticamente',
    reopen: 'Reabrir',
    submit: 'Enviar',
    approve: 'Aprovar',
    reject: 'Rejeitar',
    requestInfo: 'Enviar de volta',
    resubmit: 'Reenviar',
    withdraw: 'Retirar',
    escalate: 'Escalada',
    paid: 'Marcos pagou',
  },
  runs: {
    queued: 'Na fila',
    running: 'Em execução',
    succeeded: 'Sucesso',
    failed: 'Falha',
    dead: 'Desistiu',
    cancelled: 'Cancelado',
  },
};

export default ptBR;
