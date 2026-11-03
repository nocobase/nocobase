import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  access: {
    section: 'Versiones',
    pages: {
      'rel-apps': 'Aplicaciones',
    },
    businessSection: 'Versiones',
    businesses: {
      apps: {
        title: 'Aplicaciones',
        description:
          'Aplicaciones, sus lanzamientos, implementaciones y tiempo de ejecución.',
        actions: {
          view: {
            title: 'Ver aplicaciones',
            description:
              'Ver aplicaciones, sus lanzamientos, implementaciones y estado de ejecución',
            related: 'Ver aplicaciones (las relacionadas con ellas)',
            relatedLabel: 'Los que creé',
            relatedHint:
              'Aplicaciones que creé y cualquier aplicación relacionada conmigo',
            all: 'Ver aplicaciones (todas)',
          },
          readLogs: {
            title: 'Leer registros',
            description: 'Leer registros de implementación y aplicaciones',
            related: 'Leer registros (los relacionados con ellos)',
            relatedLabel: 'Los que creé',
            relatedHint:
              'Aplicaciones que creé y cualquier aplicación relacionada conmigo',
            all: 'Leer registros (todos)',
          },
          create: {
            title: 'Crear aplicaciones',
            description: 'Crear aplicaciones en un entorno',
            all: 'Crear aplicaciones',
          },
          configure: {
            title: 'Configurar aplicaciones',
            description:
              'Leer y cambiar la configuración de una aplicación, que puede contener secretos',
            related:
              'Configurar aplicaciones (aquellas relacionadas con ellas)',
            relatedLabel: 'Los que creé',
            relatedHint:
              'Aplicaciones que creé y cualquier aplicación relacionada conmigo',
            all: 'Configurar aplicaciones (todas)',
          },
          upload: {
            title: 'Subir lanzamientos',
            description: 'Subir y promocionar lanzamientos',
            related: 'Subir comunicados (los relacionados con ellos)',
            relatedLabel: 'Los que creé',
            relatedHint:
              'Aplicaciones que creé y cualquier aplicación relacionada conmigo',
            all: 'Subir versiones (todas)',
          },
          deploy: {
            title: 'Implementar',
            description:
              'Implementar y revertir en entornos desprotegidos, solicitar implementaciones en entornos protegidos',
            related: 'Despliegue (los relacionados con ellos)',
            relatedLabel: 'Los que creé',
            relatedHint:
              'Aplicaciones que creé y cualquier aplicación relacionada conmigo',
            all: 'Implementar (todos)',
          },
          deployProtected: {
            title: 'Aprobar implementaciones protegidas',
            description:
              'Aprobar implementaciones en entornos protegidos que no nombran aprobadores; solo personas',
            related:
              'Aprobar despliegues protegidos (los relacionados con ellos)',
            relatedLabel: 'Los que creé',
            relatedHint:
              'Aplicaciones que creé y cualquier aplicación relacionada conmigo',
            all: 'Aprobar implementaciones protegidas (todas)',
          },
          operate: {
            title: 'Iniciar y detener',
            description: 'Iniciar, detener y reiniciar aplicaciones',
            related: 'Iniciar y detener (los relacionados con ellos)',
            relatedLabel: 'Los que creé',
            relatedHint:
              'Aplicaciones que creé y cualquier aplicación relacionada conmigo',
            all: 'Iniciar y detener (todos)',
          },
          delete: {
            title: 'Eliminar aplicaciones',
            description: 'Eliminar una App con sus datos',
            related: 'Eliminar aplicaciones (las relacionadas con ellas)',
            relatedLabel: 'Los que creé',
            relatedHint:
              'Aplicaciones que creé y cualquier aplicación relacionada conmigo',
            all: 'Eliminar aplicaciones (todas)',
          },
        },
      },
    },
    recordAccess: {
      owned: 'Aplicaciones que crearon',
    },
    settings: {
      rel: {
        environments: 'Implementar entornos',
      },
    },
    keyScopes: {
      apps: {
        title: 'Aplicaciones e implementaciones',
        description:
          'Leer: ver aplicaciones, lanzamientos, implementaciones y registros. Leer y escribir: subir también comunicados. Administrador: también implementa e inicia o detiene aplicaciones.',
        objects: 'Aplicaciones',
      },
      environments: {
        title: 'Implementar entornos',
        description: 'Leer: enumerar entornos. Leer y escribir: gestionarlos.',
      },
      presets: {
        ciDeploy: {
          title: 'Despliegue de CI',
          description:
            'Cargue versiones de las aplicaciones elegidas e impleméntelas durante 90 días.',
        },
        ciUpload: {
          title: 'Carga de CI',
          description:
            'Cargar versiones de las aplicaciones elegidas sin implementarlas, durante 90 días.',
        },
      },
    },
    actions: {
      read: 'Ver',
      manage: 'Administrar',
      view: 'Ver',
      'read-logs': 'Leer registros',
      create: 'Crear',
      configure: 'Configurar',
      upload: 'Subir lanzamientos',
      deploy: 'Implementar',
      'deploy-protected': 'Aprobar implementaciones protegidas',
      operate: 'Iniciar y detener',
      delete: 'Eliminar',
    },
  },
  drivers: {
    host: 'Este servidor',
  },
};

export default esES;
