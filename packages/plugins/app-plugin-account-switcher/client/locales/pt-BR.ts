import type { AccountSwitcherResource } from './en-US.js';

const ptBR: AccountSwitcherResource = {
  menu: {
    switchAccount: 'Trocar de conta',
    search: 'Pesquisar por nome ou e-mail',
    loading: 'Carregando contas…',
    empty: 'Nenhuma conta encontrada',
    more: 'Mais {{count}}. Pesquise para restringir a lista.',
    loadFailed: 'Não foi possível carregar as contas.',
  },
  banner: {
    actingAs: 'Atuando como {{name}}',
    description: 'As alterações são registradas nesta conta.',
    return: 'Voltar para {{name}}',
  },
  errors: {
    switchFailed: 'Não foi possível trocar de conta. Tente novamente.',
    returnFailed: 'Não foi possível voltar à sua conta. Tente novamente.',
  },
};

export default ptBR;
