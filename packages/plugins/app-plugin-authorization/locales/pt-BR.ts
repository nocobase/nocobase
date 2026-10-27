import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  permissionSets: {
    builtIn: {
      root: 'Administrador do sistema',
      member: 'Membro',
    },
  },
  sections: {
    pages: 'Permissões de página',
    page: 'Páginas',
    business: 'Permissões comerciais',
    administration: 'Administração',
    other: 'Outros',
  },
  options: {
    defaultAndSharing: 'Usar escopo de dados padrão',
    actions: {
      assign: 'Gerenciar atribuições',
      configure: 'Configurar',
      inspect: 'Inspecionar permissões',
      read: 'Ler',
      create: 'Criar',
      update: 'Atualizar',
      delete: 'Excluir',
      access: 'Acesso',
    },
    settingsModules: {
      authorization: 'Autorização',
    },
    pages: {
      all: 'Todas as páginas',
      allDescription:
        'Permitir acesso a todas as páginas, incluindo páginas adicionadas posteriormente.',
    },
    settings: {
      inspector: 'Inspetor de permissão',
      'permission-sets': 'Conjuntos de permissões',
    },
    subjectTypes: {
      authenticated: 'Todos os usuários conectados',
      authenticatedDescription:
        'Aplica-se a todos os usuários com uma sessão de login válida.',
      user: 'Usuários',
    },
    recordAccessPolicies: {
      allRecords: 'Todos os registros',
      recordsIOwn: 'Registros que possuo',
      recordsICreated: 'Registros que criei',
      customFilter: 'Filtro personalizado',
      customFilterHint:
        'Selecione registros com uma condição de filtro personalizada.',
    },
  },
};

export default ptBR;
