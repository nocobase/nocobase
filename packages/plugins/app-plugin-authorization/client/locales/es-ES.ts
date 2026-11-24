import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';
import components from './components-en-US.js';
import settings from './settings-en-US.js';

const esES: LocaleResource<typeof enUS> = {
  // The Roles and permissions pages are not translated into this language yet and show in English.
  ...components,
  settings: {
    ...settings,
    unsavedCount_many: settings.unsavedCount_other,
    unsavedCountRisky_many: settings.unsavedCountRisky_other,
    review: {
      ...settings.review,
      description_many: settings.review.description_other,
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
      root: 'Administrador del sistema',
      member: 'Miembro',
    },
  },
  sections: {
    pages: 'Permisos de página',
    page: 'Páginas',
    business: 'Permisos comerciales',
    administration: 'Administración',
    other: 'Otro',
  },
  options: {
    defaultAndSharing: 'Usar alcance de datos predeterminado',
    actions: {
      assign: 'Administrar asignaciones',
      configure: 'Configurar',
      read: 'Leer',
      create: 'Crear',
      update: 'Actualizar',
      delete: 'Eliminar',
      access: 'Acceso',
    },
    settingsModules: {
      authorization: 'Autorización',
    },
    pages: {
      all: 'Todas las páginas',
      allDescription:
        'Permitir el acceso a todas las páginas, incluidas las páginas agregadas posteriormente.',
    },
    settings: {
      'permission-sets': 'Conjuntos de permisos',
      'authentication-settings': 'Inicio de sesión y autenticación',
    },
    subjectTypes: {
      authenticated: 'Todos los usuarios registrados',
      authenticatedDescription:
        'Se aplica a todos los usuarios con una sesión iniciada válida.',
      user: 'Usuarios',
    },
    recordAccessPolicies: {
      allRecords: 'Todos los registros',
      recordsIOwn: 'Registros que poseo',
      recordsICreated: 'Registros que creé',
      customFilter: 'Filtro personalizado',
      customFilterHint:
        'Seleccionar registros con una condición de filtro personalizada.',
    },
  },
};

export default esES;
