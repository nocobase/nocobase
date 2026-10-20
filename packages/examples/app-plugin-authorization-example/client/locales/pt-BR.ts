import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  practice: {
    intro:
      'Use as contas abaixo em vez de um administrador. Os administradores ignoram as restrições. Esses são exercícios independentes de colaboração de vendas, não um fluxo de trabalho completo de aprovação de orçamento até pedido. Cada exercício começa a partir do estado de registro propagado.',
    read: {
      title: 'Um assistente consulta informações do projeto',
      steps:
        'Entrar como sales_assistant: Projetos mostra project-1, project-2 e project-3, mas nenhuma ação de edição. Cotações e pedidos permanecem limitados ao projeto de propriedade.',
      reason:
        'O compartilhamento do projeto concede registros apenas para visualização; não concede edição nem registros relacionados. O confidencial project-4 permanece excluído.',
    },
    scopes: {
      title: 'Um engenheiro prepara e envia uma cotação',
      steps:
        'Faça login como sales_engineer: edite e envie seu quote-2. Você pode consultar quote-5, mas não pode alterar ou enviar orçamento de colega. Você pode continuar preparando o quote-6, mas não pode submetê-lo para um projeto fora de sua região.',
      reason:
        'As cotações não confidenciais são material de referência interna em todas as regiões. O preparador possui o conteúdo; a responsabilidade regional rege a submissão. A visualização não permite a edição. Os pedidos existentes fazem referência a cotações aceitas separadas; enviar uma cotação prática não cria um pedido.',
    },
    handover: {
      title: 'Um engenheiro delegado assume uma cotação',
      steps:
        'Um proprietário de projeto da região Sul entrega quote-7 para sales_proposal, um engenheiro da região Norte. Faça login como sales_proposal, edite a cotação e envie-a. Como administrador, redefina os registros e remova sales_proposal da regra de compartilhamento de entrega de cotação de proposta. Faça login novamente: a conta não pode mais editar ou enviar esta cotação.',
      reason:
        'A entrega permite a edição e envio deste orçamento, além do acesso ao projeto necessário para envio; não delega toda a região Sul. A função de engenheiro concede operações, enquanto o compartilhamento identifica os registros. Como exercício avançado, retire o escopo do projeto ou da cotação: o envio requer ambos.',
    },
    delivery: {
      title: 'Um especialista em entrega atende um pedido',
      steps:
        'Faça login como sales_delivery. Abra order-2, atribua uma transportadora, mantenha cheques e insira uma referência de entrega. Após a confirmação da entrega, nem suas relações nem seu estado de entrega poderão ser alterados novamente. Redefina os registros antes de repetir o exercício.',
      reason:
        'A equipe de entrega insere apenas pedidos; links para cotações e projetos não concedem acesso a essas páginas.',
    },
  },
  reset: {
    action: 'Redefinir registros de prática',
    cancel: 'Cancelar',
    confirm:
      'Restaurar os projetos, cotações e pedidos iniciais para cada conta demo? As alterações nesses registros serão substituídas.',
    description:
      'Um administrador pode redefinir registros comerciais aqui antes de repetir um exercício. As configurações de contas e permissões são preservadas; restaure quaisquer alterações de autorização manualmente.',
    done: 'Registros de prática restaurados. Atualize todas as listas de registros abertas.',
  },
  access: {
    title: 'Suas funções',
    direct: 'Atribuição direta',
    coverage:
      'Cada conta de exemplo mantém suas responsabilidades de trabalho por meio de uma atribuição direta.',
  },
  rules: {
    public: 'Excluir projetos confidenciais',
    delivery: 'Pedidos regionais para entrega',
    handover: 'Entrega da cotação da proposta',
    projects: 'Exemplos de projetos compartilhados',
  },
  accountMenus: {
    assistant: 'Projetos, cotações e pedidos (somente leitura)',
    engineer:
      'Consultar cotações não confidenciais; edite suas próprias cotações e envie dentro da região atribuída',
    manager:
      'Gerenciar projetos próprios; cotações e pedidos são somente leitura',
    delivery: 'Apenas encomendas; confirmar entregas regionais',
    proposal: 'Edite e envie o quote-7 entregue',
    coordinator: 'Gerenciar project-8, fora da região de origem',
  },
  relations: {
    access: {
      notGranted: 'Somente leitura: a coordenação de entrega não é concedida.',
      outsideScope:
        'Somente leitura: este pedido está fora do seu escopo de entrega.',
      notReady: 'Os pedidos entregues não podem ser alterados.',
    },
    title: 'Relacionamentos de pedidos',
    description:
      'Atribua uma transportadora ativa, mantenha cheques e gerencie transportadoras colaboradoras. Experimente uma conta de entrega e uma conta somente leitura para comparar o acesso.',
    order: 'Pedido',
    carrier: 'Transportadora',
    unassigned: 'Nenhum atribuído',
    assign: 'Atribuir operadora',
    disconnect: 'Remover atribuição',
    checks: 'Verificações de entrega',
    done: 'Concluído',
    pending: 'Pendente',
    toggle: 'Alternar conclusão',
    delete: 'Excluir verificação',
    checkTitle: 'Verifique o título',
    add: 'Adicionar cheque',
    collaborators: 'Transportadoras colaboradoras',
    note: 'Nota de colaboração',
    addProposal: 'Adicionar operadora selecionada',
    replace: 'Substitua pela transportadora selecionada',
    clear: 'Remover todos os colaboradores',
    unavailable: 'Estas relações não são acessíveis.',
    loading: 'Carregando relacionamentos…',
  },
  sales: {
    manageRelations: 'Organizar a entrega do pedido',
    saveFirst: 'Salve as alterações antes de enviar.',
    states: {
      draft: 'Rascunho',
      submitted: 'Enviado',
      accepted: 'Aceito',
      ready: 'Pronto',
      delivered: 'Entregue',
    },
    errors: {
      session: 'Sessão expirada. Faça login novamente.',
      input: 'Verifique o valor e os campos obrigatórios.',
      conflict:
        'O estado do registro mudou. Atualize antes de tentar novamente.',
      request: 'Solicitação falhou. Verifique sua conexão e tente novamente.',
    },
    operation: {
      outsideScope: 'Fora do escopo de operação permitido',
      notReady: 'Somente pedidos prontos podem ser entregues',
      allowed: 'Dentro do escopo de envio',
      notGranted: 'Somente leitura — operação não concedida',
      quoteScope: 'Fora do escopo de cotação permitido',
      projectScope: 'Projeto fora do escopo permitido',
      notDraft: 'Somente rascunhos podem ser enviados',
      invalidAmount: 'O valor deve ser positivo',
    },
    preparedBy: 'Preparado por',
    parentProject: 'Projeto',
    sourceQuote: 'Citação da fonte',
    relationships: 'Registros relacionados',
    relatedQuotes: 'Cotações de projetos',
    relatedOrders: 'Pedidos de projetos',
    filtered: 'Filtrado por',
    clearFilter: 'Limpar filtro',
    noPageAccess: 'Sem acesso à página',
    descriptions: {
      projects:
        'Abrir cotações e pedidos relacionados de um projeto. As listas relacionadas mostram apenas registros que esta conta pode acessar.',
      quotes:
        'Um projeto pode ter vários orçamentos. O envio verifica o escopo do projeto e o preparador de cotação de forma independente e, em seguida, valida o status e o valor do rascunho.',
      orders:
        'Cada pedido faz referência à sua cotação e projeto de origem. As contas de entrega apenas inserem Pedidos; as referências não concedem acesso a outras páginas ou registros.',
    },
    delivery: 'Entrega',
    orders: 'Pedidos',
    editProject: 'Editar informações do projeto',
    editQuote: 'Editar preços',
    submit: 'Enviar cotação',
    submitScopes: {
      projects: 'Projetos vinculados às cotações',
      quotes: 'Cotações permitidas para envio',
    },
    deliver: 'Confirmar entrega',
    amount: 'Montante',
    status: 'Status',
    deliveryReference: 'Referência de entrega',
    group: 'Colaboração de vendas',
    title: 'Exemplo de permissões de vendas',
    projects: 'Projetos',
    quotes: 'Orçamentos',
    view: 'Visualizar',
    edit: 'Editar notas',
    intro:
      'Explore os limites de acesso de assistentes que consultam registros, engenheiros que preparam cotações, entregas de cotações delegadas e equipes de entrega que atendem pedidos.',
    record: 'Registro',
    notes: 'Notas',
    save: 'Salvar',
    refresh: 'Atualizar',
    loading: 'Carregando…',
    empty: 'Nenhum registro acessível',
    readOnly: 'Somente leitura',
    saved: 'Salvo',
    scope: {
      prepared: 'Citações preparadas por mim',
      title: 'Escopo dos dados de vendas',
      unrestricted: 'Sem restrição',
      region: 'Minha região',
      own: 'Projeto pai de minha propriedade',
      public: 'Projetos não confidenciais',
    },
  },
  title: 'Exemplo de permissões de vendas',
  overview: 'Guia',
  actions: 'Ações',
  testAccounts: 'Exemplos de contas',
  account: 'Conta',
  permissionSet: 'Conjunto de permissões',
  password: 'Exemplo de senha: AuthzExample123!',
  tryTitle: 'Configurar e verificar',
  roles: {
    assistant: 'Assistente de vendas',
    engineer: 'Engenheiro de vendas',
    manager: 'Gerente de projetos',
    delivery: 'Especialista em entregas',
  },
  forbidden: 'Você não tem permissão para esta operação.',
  error: 'Falha ao carregar. Por favor, tente novamente.',
};

export default ptBR;
