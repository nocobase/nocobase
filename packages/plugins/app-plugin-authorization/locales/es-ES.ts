import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  audit: {
    operations: {
      createPermissionSet: 'Crear un conjunto de permisos',
      assignPermissionSet: 'Asignar un conjunto de permisos',
      unassignPermissionSet: 'Retirar la asignación de un conjunto de permisos',
      updatePermissionSet: 'Editar un conjunto de permisos',
      deletePermissionSet: 'Eliminar un conjunto de permisos',
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
