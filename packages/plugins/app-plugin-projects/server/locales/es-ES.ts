import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  roles: {
    owner: 'Responsable',
    admin: 'Administrador',
    member: 'Miembro',
  },
  access: {
    sections: {
      projects: 'Proyectos',
      issues: 'Incidencias',
      settings: 'Configuración del proyecto',
      members: 'Miembros y funciones',
    },
    businesses: {
      projects: {
        title: 'Proyectos',
        description: 'Proyectos, sus integrantes, repositorios y avances.',
        actions: {
          view: {
            title: 'Ver proyectos',
            description: 'Ver proyectos, su visión general y avances',
            related: 'Ver proyectos (los que pueden ver)',
            relatedLabel: 'Los que puedo ver',
            relatedHint: 'Proyectos públicos y privados que dirijo o participo',
            all: 'Ver proyectos (todos)',
          },
          create: {
            title: 'Crear proyectos',
            description: 'Iniciar un nuevo proyecto y liderarlo',
            all: 'Crear proyectos',
          },
          manage: {
            title: 'Gestionar proyectos',
            description:
              'Cambiar nombre, cambiar estado, fechas y liderar, administrar miembros y repositorios',
            related: 'Gestionar proyectos (los que ellos lideran)',
            relatedLabel: 'Los que dirijo',
            relatedHint: 'Proyectos que dirijo',
            all: 'Administrar proyectos (todos)',
          },
          delete: {
            title: 'Eliminar proyectos',
            description: 'Eliminar proyectos y restaurar los eliminados',
            all: 'Eliminar proyectos',
          },
        },
      },
      issues: {
        title: 'Incidencias',
        description: 'Cuestiones y sus comentarios, en proyecto o solos.',
        actions: {
          view: {
            title: 'Ver problemas',
            description: 'Ver incidencias en listas, tableros y sus detalles',
            related: 'Ver problemas (los que pueden ver)',
            relatedLabel: 'En proyectos puedo ver',
            relatedHint:
              'Problemas sin proyecto y problemas en proyectos que puedo ver',
            all: 'Ver problemas (todos)',
          },
          create: {
            title: 'Crear problemas',
            description: 'Crear incidencias, en un proyecto o por su cuenta',
            related: 'Crear incidencias (en proyectos que puedan ver)',
            relatedLabel: 'En proyectos puedo ver',
            relatedHint: 'Problemas sin proyecto, o en proyectos que puedo ver',
            all: 'Crear problemas (todos)',
          },
          edit: {
            title: 'Editar problemas',
            description:
              'Título, descripción, prioridad, fechas, etiquetas, ejecutores y estados abiertos',
            related: 'Editar problemas (los que pueden ver)',
            relatedLabel: 'En proyectos puedo ver',
            relatedHint:
              'Problemas sin proyecto y problemas en proyectos que puedo ver',
            all: 'Editar números (todos)',
          },
          comment: {
            title: 'Comentar sobre temas',
            description:
              'Comentar, responder y resolver hilos; editar y eliminar sus propios comentarios',
            related: 'Comentar sobre problemas (los que pueden ver)',
            relatedLabel: 'En proyectos puedo ver',
            relatedHint:
              'Problemas sin proyecto y problemas en proyectos que puedo ver',
            all: 'Comentar sobre temas (todos)',
          },
          moderateComments: {
            title: 'Comentarios moderados',
            description: 'Eliminar los comentarios de otras personas.',
            related:
              'Comentarios moderados (sobre temas de su propiedad o cuyo proyecto lidera)',
            relatedLabel: 'En temas de mi propiedad o en proyectos que dirijo',
            relatedHint:
              'Comentarios sobre temas de mi propiedad y sobre temas de proyectos que dirijo',
            all: 'Comentarios moderados (todos)',
          },
          close: {
            title: 'Cerrar incidencias',
            description: 'Marcar una emisión realizada o cancelada',
            related:
              'Temas cerrados (los que son de su propiedad o cuyo proyecto lidera)',
            relatedLabel: 'Los que tengo o en proyectos que dirijo',
            relatedHint:
              'Problemas que poseo y problemas en proyectos que dirijo',
            all: 'Cerrar números (todos)',
          },
          changeOwner: {
            title: 'Cambiar el propietario',
            description:
              'Entregar un asunto a otra persona para que sea responsable de ello',
            related:
              'Cambiar el propietario (los que posee o cuyo proyecto lidera)',
            relatedLabel: 'Los que tengo o en proyectos que dirijo',
            relatedHint:
              'Problemas que poseo y problemas en proyectos que dirijo',
            all: 'Cambiar el propietario (todos)',
          },
          delete: {
            title: 'Eliminar y restaurar problemas',
            description: 'Eliminar problemas y restaurar los eliminados',
            all: 'Eliminar y restaurar problemas',
          },
        },
      },
      attachments: {
        title: 'Adjuntos',
        description: 'Archivos adjuntos a cuestiones y comentarios.',
        actions: {
          upload: {
            title: 'Subir archivos adjuntos',
            description:
              'Adjunte archivos a los problemas que puedan editar y a sus comentarios',
            related:
              'Cargar archivos adjuntos (sobre problemas que puedan ver)',
            relatedLabel: 'Sobre problemas en proyectos que puedo ver.',
            relatedHint:
              'Archivos de incidencias sin proyecto y de incidencias en proyectos que puedo ver',
            all: 'Cargar archivos adjuntos (todos)',
          },
        },
      },
    },
    collections: {
      pmProjects: 'Proyectos',
      pmIssues: 'Incidencias',
    },
    recordAccess: {
      visible: 'Proyectos y problemas que pueden ver',
      managed: 'Proyectos que lideran y emisiones de su propiedad',
    },
    settings: {
      pm: {
        general: 'Generales',
        labels: 'Etiquetas',
        members: 'Miembros',
      },
    },
    keyScopes: {
      projects: {
        title: 'Proyectos',
        description: 'Ver proyectos; gestionarlos; crearlos y eliminarlos.',
        objects: 'Proyectos',
      },
      issues: {
        title: 'Incidencias',
        description:
          'Ver ediciones; crearlos, editarlos, comentarlos, cerrarlos y reasignarlos; moderar comentarios y eliminar problemas.',
      },
      settings: {
        title: 'Configuración del proyecto',
        description: 'Configuraciones generales y etiquetas.',
      },
    },
    actions: {
      view: 'Ver',
      create: 'Crear',
      manage: 'Administrar',
      edit: 'Editar',
      close: 'Cerrar',
      comment: 'Comentario',
      moderateComments: 'Comentarios moderados',
      changeOwner: 'Cambiar propietario',
      delete: 'Eliminar',
      upload: 'Subir',
      read: 'Ver',
      update: 'Editar',
      invite: 'Invitar',
      assign: 'Asignar roles',
      'define-roles': 'Definir roles',
    },
  },
  notifications: {
    batchDone: 'Todos los sub-números de {{identifier}} están terminados.',
    batchDoneStage:
      'Finalizada la etapa {{stage}} de las sub-emisiones de {{identifier}}',
    commented: '{{actor}} comentó en {{identifier}}',
    dependencyReleased:
      '{{releasedBy}} está terminado, por lo que {{identifier}} puede comenzar',
    executorAssigned: '{{actor}} te asignó {{identifier}}',
    mentioned: {
      comment: '{{actor}} te mencionó en {{identifier}}',
      description: '{{actor}} te mencionó en {{identifier}}',
    },
    ownerAssigned: '{{actor}} te convirtió en propietario de {{identifier}}',
    someone: 'Alguien',
    statusChanged: '{{identifier}} movido a {{status}}',
    ownerNotified: '{{identifier}} ahora es {{status}}',
  },
  status: {
    backlog: 'Trabajo atrasado',
    blocked: 'Bloqueado',
    cancelled: 'Cancelado',
    done: 'Hecho',
    in_progress: 'En curso',
    in_review: 'En revisión',
  },
};

export default esES;
