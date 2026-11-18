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
      issues: 'Tareas',
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
        title: 'Tareas',
        description: 'Tareas y sus comentarios, en un proyecto o por separado.',
        actions: {
          view: {
            title: 'Ver tareas',
            description: 'Ver tareas en listas, tableros y sus detalles',
            related: 'Ver tareas (las que puede ver)',
            relatedLabel: 'En proyectos puedo ver',
            relatedHint:
              'Tareas sin proyecto y tareas de proyectos que puedo ver',
            all: 'Ver tareas (todas)',
          },
          create: {
            title: 'Crear tareas',
            description: 'Crear tareas, en un proyecto o por separado',
            related: 'Crear tareas (en proyectos que puede ver)',
            relatedLabel: 'En proyectos puedo ver',
            relatedHint: 'Tareas sin proyecto o en proyectos que puedo ver',
            all: 'Crear tareas (todas)',
          },
          edit: {
            title: 'Editar tareas',
            description:
              'Título, descripción, prioridad, fechas, etiquetas, ejecutores y estados abiertos',
            related: 'Editar tareas (las que puede ver)',
            relatedLabel: 'En proyectos puedo ver',
            relatedHint:
              'Tareas sin proyecto y tareas de proyectos que puedo ver',
            all: 'Editar tareas (todas)',
          },
          comment: {
            title: 'Comentar tareas',
            description:
              'Comentar, responder y resolver hilos; editar y eliminar sus propios comentarios',
            related: 'Comentar tareas (las que puede ver)',
            relatedLabel: 'En proyectos puedo ver',
            relatedHint:
              'Tareas sin proyecto y tareas de proyectos que puedo ver',
            all: 'Comentar tareas (todas)',
          },
          moderateComments: {
            title: 'Comentarios moderados',
            description: 'Eliminar los comentarios de otras personas.',
            related:
              'Moderar comentarios (en sus tareas o en proyectos que lidera)',
            relatedLabel: 'En mis tareas o en proyectos que lidero',
            relatedHint:
              'Comentarios en mis tareas y en tareas de proyectos que lidero',
            all: 'Comentarios moderados (todos)',
          },
          close: {
            title: 'Cerrar tareas',
            description: 'Marcar una tarea como terminada o cancelada',
            related: 'Cerrar tareas (las suyas o de proyectos que lidera)',
            relatedLabel: 'Los que tengo o en proyectos que dirijo',
            relatedHint: 'Mis tareas y tareas de proyectos que lidero',
            all: 'Cerrar tareas (todas)',
          },
          changeOwner: {
            title: 'Cambiar el propietario',
            description:
              'Pasar una tarea a otra persona para que sea su responsable',
            related:
              'Cambiar el propietario (los que posee o cuyo proyecto lidera)',
            relatedLabel: 'Los que tengo o en proyectos que dirijo',
            relatedHint: 'Mis tareas y tareas de proyectos que lidero',
            all: 'Cambiar el propietario (todos)',
          },
          delete: {
            title: 'Eliminar y restaurar tareas',
            description: 'Eliminar tareas y restaurar las eliminadas',
            all: 'Eliminar y restaurar tareas',
          },
        },
      },
      attachments: {
        title: 'Adjuntos',
        description: 'Archivos adjuntos a tareas y comentarios.',
        actions: {
          upload: {
            title: 'Subir archivos adjuntos',
            description:
              'Adjuntar archivos a las tareas que puede editar y a sus comentarios',
            related: 'Subir adjuntos (en tareas que puede ver)',
            relatedLabel: 'En tareas de proyectos que puedo ver',
            relatedHint:
              'Archivos en tareas sin proyecto y en tareas de proyectos que puedo ver',
            all: 'Cargar archivos adjuntos (todos)',
          },
        },
      },
    },
    collections: {
      pmProjects: 'Proyectos',
      pmIssues: 'Tareas',
    },
    recordAccess: {
      visible: 'Proyectos y tareas que puede ver',
      managed: 'Proyectos que lidera y tareas de las que es responsable',
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
        title: 'Tareas',
        description:
          'Ver tareas; crearlas, editarlas, comentarlas, cerrarlas y reasignarlas; moderar comentarios y eliminar tareas.',
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
    batchDone: 'Todas las subtareas de {{identifier}} están terminadas',
    batchDoneStage:
      'La etapa {{stage}} de las subtareas de {{identifier}} está terminada',
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
    backlog: 'Pendiente',
    blocked: 'Bloqueado',
    cancelled: 'Cancelado',
    done: 'Hecho',
    in_progress: 'En curso',
    in_review: 'En revisión',
  },
};

export default esES;
