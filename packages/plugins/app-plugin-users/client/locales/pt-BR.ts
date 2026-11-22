import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  // The shared list, form and overlay components (`components/`).
  actions: {
    close: 'Fechar',
  },
  dataTable: {
    filters: 'Filtros',
    filtersApplied: 'Filtros · {{count}}',
    firstPage: 'Ir para a primeira página',
    hideColumn: 'Ocultar',
    lastPage: 'Ir para a última página',
    nextPage: 'Ir para a próxima página',
    pageOf: 'Página {{page}} de {{pageCount}}',
    previousPage: 'Ir para a página anterior',
    rowsPerPage: 'Linhas por página',
    selectPage: 'Selecionar tudo nesta página',
    selectedCount: '{{selected}} de {{total}} linha(s) selecionada(s).',
    sort: 'Ordenar',
    sortAscending: 'Cresc.',
    sortBy: 'Ordenar por',
    sortDescending: 'Decr.',
    toggleColumns: 'Alternar colunas',
    view: 'Visualizar',
  },
  formFeedback: {
    denied:
      'Você não pode enviar este formulário com seu acesso atual. Seus dados foram mantidos.',
    failed:
      'Não foi possível salvar. Seus dados foram mantidos. Tente novamente.',
    field: 'Este valor foi rejeitado. Verifique-o e tente novamente.',
    invalid: 'Verifique os campos destacados e tente novamente.',
    network:
      'Não foi possível conectar. Verifique sua conexão e tente novamente. Seus dados foram mantidos.',
  },
  listFeedback: {
    clear: 'Limpar filtros',
    loading: 'Carregando',
    refreshFailed: 'Falha ao atualizar; exibindo os dados anteriores',
    retry: 'Tentar novamente',
    retrying: 'Tentando novamente…',
    signIn: 'Entrar',
    empty: 'Ainda não há dados',
    noResults: 'Nenhum resultado',
    forbidden: 'Acesso negado',
    unauthenticated: 'Sessão expirada',
    failed: 'Não foi possível carregar a lista',
  },
  pendingFeedback: {
    longWait:
      'Está demorando mais que o normal. Você pode continuar aguardando.',
    working: 'Processando…',
  },
  routeOverlay: {
    close: 'Fechar',
  },
  status: {
    loading: 'Carregando',
    refreshing: 'Atualizando',
  },
  management: {
    actions: 'Ações',
    actionsFor: 'Ações para {{name}}',
    all: 'Todos os status',
    allRoles: 'Todos os papéis',
    assignedRoles: 'Papéis atribuídos',
    backToSource: 'Voltar à página anterior',
    cancel: 'Cancelar',
    clear: 'Limpar filtros',
    confirm: 'Confirmar',
    conflict:
      'A solicitação entra em conflito com os dados atuais. Revise o registro mais recente antes de tentar novamente.',
    create: 'Criar',
    created: 'Usuário "{{name}}" criado',
    denied: 'Você não tem acesso. Entre em contato com um administrador.',
    disable: 'Desativar',
    disableHint:
      'Este usuário não poderá entrar e as sessões existentes serão encerradas.',
    disableTitle: 'Desativar o usuário "{{name}}"?',
    disabled: 'Desativado',
    discardHint: 'As alterações não salvas serão perdidas.',
    discardTitle: 'Descartar alterações?',
    editUser: 'Editar usuário',
    email: 'E-mail',
    enable: 'Ativar',
    enableHint: 'Este usuário poderá entrar novamente.',
    enableTitle: 'Ativar o usuário "{{name}}"?',
    enabled: 'Ativado',
    failed: 'Não foi possível concluir a solicitação. Tente novamente.',
    identityConflict: 'Este e-mail ou nome de usuário já está em uso.',
    invalidEmail: 'Informe um e-mail válido',
    invalidRequest:
      'Alguns valores são inválidos. Verifique os dados ou filtros e tente novamente.',
    listChanged: 'A lista mudou. Tente novamente.',
    loading: 'Carregando',
    missing: 'Este registro não existe ou foi excluído.',
    name: 'Nome',
    newUser: 'Novo usuário',
    noAssignedRoles: 'Nenhum papel atribuído',
    noRoleAccess:
      'Este usuário ainda pode entrar e usar os recursos básicos da conta. Nenhum acesso de negócio é concedido por papéis.',
    noRolesFound: 'Nenhum papel encontrado.',
    password: 'Senha inicial',
    passwordPolicy: 'A senha não atende à política de senhas atual.',
    required: 'Preencha este campo',
    retry: 'Tentar novamente',
    revokeHint: 'Este usuário precisará entrar novamente.',
    revokeRoleHint: 'O acesso concedido pelos papéis listados será removido.',
    revokeRoleTitle: 'Revogar papéis de "{{name}}"?',
    revokeSessions: 'Revogar sessões',
    revokeTitle: 'Revogar as sessões de "{{name}}"?',
    roleFilter: 'Filtrar por papel',
    roleFilterIncomplete:
      'Escolha um escopo de papel e um papel, ou limpe os filtros.',
    save: 'Salvar',
    saved: '"{{name}}" salvo',
    saving: 'Salvando…',
    searchRoles: 'Buscar papéis',
    selectRoles: 'Selecionar papéis',
    sessionEnded: 'Sua sessão terminou. Entre novamente.',
    signInAgain: 'Entrar novamente',
    status: 'Status',
    total_one: '{{count}} usuário',
    total_other: '{{count}} usuários',
    userActionSaved: {
      disable: 'Usuário "{{name}}" desativado',
      enable: 'Usuário "{{name}}" ativado',
      revokeSessions: 'Sessões ativas de "{{name}}" revogadas',
    },
    userSearch: 'Buscar nomes, nomes de usuário ou e-mails',
    username: 'Nome de usuário',
    users: 'Usuários',
    usersDescription: 'Gerencie contas, acessos e sessões ativas.',
    total_many: '{{count}} de usuários',
  },
  humanOnly: {
    manageAccounts:
      'Somente uma pessoa gerencia contas: nenhuma chave de API pode fazer isso.',
  },
  page: {
    loading: 'Carregando',
  },
  notificationTemplates: {
    invitation: {
      contributor: 'Usuários',
      category: 'Contas',
      name: 'Convite de usuário',
      trigger:
        'Um administrador convida alguém, ou reenvia um convite, com e-mail selecionado.',
      recipients:
        'A pessoa convidada, no endereço de e-mail informado para ela.',
      businessRule:
        'Enviado sempre que um convite é criado ou reenviado com e-mail selecionado. Não há uma opção separada para desativá-lo.',
      languagePolicy:
        'Escrito em um único idioma, escolhido ao convidar: o idioma da interface de quem convida, a menos que outro seja escolhido. O reenvio mantém o mesmo idioma. Se esse idioma não tiver texto de e-mail, o e-mail usa o idioma padrão do aplicativo e o inglês.',
      channel: 'Remetente do e-mail de convite',
      variables: {
        app: 'Nome do aplicativo',
        inviter: 'Nome de quem enviou o convite',
        items: 'Funções ou acessos concedidos pelo convite',
        date: 'Quando o convite expira, no idioma do e-mail e em UTC',
        url: 'Link para aceitar o convite; a pré-visualização usa um link fictício',
      },
    },
  },
  accept: {
    title: 'Aceite o convite',
    language: 'Idioma',
    description: '{{inviter}} convidou você.',
    summary: 'Você também participará: {{items}}',
    loading: 'Carregando o convite…',
    email: 'E-mail',
    name: 'Nome',
    username: 'Nome de usuário (opcional)',
    usernameHint: 'Você pode usar este nome de usuário para entrar.',
    password: 'Senha',
    nameRequired: 'Digite seu nome.',
    passwordTooShort: 'A senha precisa de pelo menos caracteres {{min}}.',
    submit: 'Crie uma conta e participe',
    join: 'Aceitar convite',
    submitting: 'Juntando-se…',
    signedIn:
      'Você está conectado como {{name}}. Saia para aceitar este convite com uma nova conta.',
    signOut: 'Sair',
    signOutFailed: 'Não foi possível sair.',
    existingAccount:
      'Este endereço já possui uma conta. Faça login com ele para continuar.',
    alreadyHaveAccount: 'Já tem uma conta? Entre',
    goToLogin: 'Vá para fazer login',
    errors: {
      notFound: 'Este link de convite não é válido.',
      expired: 'Este convite expirou. Peça um novo.',
      accepted: 'Este convite já foi aceito.',
      revoked: 'Este convite foi revogado.',
      password: 'A senha não atende aos requisitos.',
      usernameConflict:
        'Este nome já é usado como nome de usuário ou e-mail. Escolha outro.',
      accountConflict: 'Uma conta com este endereço não pode ser criada.',
      failed: 'Algo correu mal. Por favor, tente novamente.',
    },
  },
};

export default ptBR;
