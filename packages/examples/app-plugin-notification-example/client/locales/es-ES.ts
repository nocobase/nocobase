import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  navigation: {
    tasks: 'Ejemplos de notificación',
    taskManagement: 'Tareas',
    taskDetail: 'Detalles de la tarea',
  },
  common: {
    close: 'Cerrar',
    loading: 'Cargando…',
    saving: 'Guardando…',
  },
  fields: {
    title: 'Título',
    description: 'Descripción',
    status: 'Estado',
    assignee: 'Persona asignada',
    creator: 'Creador',
    chooseAssignee: 'Elige un usuario',
  },
  status: {
    open: 'Abierto',
    'in-progress': 'En curso',
    done: 'Hecho',
  },
  tasks: {
    title: 'Tareas',
    description:
      'Asigna una pequeña tarea a otro usuario. El asignado recibe una notificación en la aplicación con el resumen de la tarea y puede editar la tarea desde la página de detalles. Utilice el botón de notificación en la barra superior para abrir las notificaciones de sus mensajes.',
    listTitle: 'Todas las tareas',
    listDescription:
      'Todas las tareas que usted creó o a las que se le asignaron.',
    count: 'Registros {{count}}',
    empty: 'Aún no hay tareas.',
    assignee: 'Asignado a',
    columns: {
      title: 'Título',
      description: 'Descripción',
      status: 'Estado',
      creator: 'Creador',
      assignee: 'Persona asignada',
      updatedAt: 'Última actualización',
      actions: 'Acciones',
    },
    view: 'Ver detalles',
    refresh: 'Actualizar',
    previous: 'Anterior',
    next: 'Siguiente',
    page: 'Página {{page}}',
    add: 'Nueva tarea',
    drawerTitle: 'Nueva tarea',
    drawerDescription:
      'La creación de una tarea envía su información básica al asignado.',
    create: 'Crear tarea',
    cancel: 'Cancelar',
  },
  taskDetail: {
    title: 'Detalles de la tarea',
    summary: 'Detalles de la tarea',
    createdAt: 'Creado',
    updatedAt: 'Última actualización',
    notificationHint:
      'Después de guardar una tarea, se notifica a las personas relacionadas además del editor actual: el creador y el asignado actual. Si el cesionario cambia, se notifica tanto al cesionario anterior como al nuevo.',
    edit: 'Editar tarea',
    refresh: 'Actualizar',
    save: 'Guardar cambios',
    cancel: 'Cancelar',
    back: 'Volver a tareas',
  },
};

export default esES;
