import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';
import components from './components-en-US.js';
import settings from './settings-en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  // The Roles and permissions pages are not translated into this language yet and show in English.
  ...components,
  settings: {
    ...settings,
    unsavedCount_many: settings.unsavedCount_other,
    unsavedCountRisky_many: settings.unsavedCountRisky_other,
    review: {
      ...settings.review,
      description_many: settings.review.description_other,
      description_zero: settings.review.description_other,
      highRisk_many: settings.review.highRisk_other,
    },
    members: {
      ...settings.members,
      description_many: settings.members.description_other,
    },
    permissionEditor: {
      ...settings.permissionEditor,
      attention_many: settings.permissionEditor.attention_other,
      confirmDisable_many: settings.permissionEditor.confirmDisable_other,
      noticeScopeReset_many: settings.permissionEditor.noticeScopeReset_other,
      noticeTurnOnFirst_many: settings.permissionEditor.noticeTurnOnFirst_other,
      noticeManagedRequirement_many:
        settings.permissionEditor.noticeManagedRequirement_other,
      noticeManagedDependent_many:
        settings.permissionEditor.noticeManagedDependent_other,
      tabChanges_many: settings.permissionEditor.tabChanges_other,
    },
  },
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
      'permission-sets': 'Conjuntos de permissões',
      'authentication-settings': 'Login e autenticação',
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
