import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  inbox: {
    title: 'Bandeja de entrada',
    views: {
      all: 'Todo',
      unread: 'No leídos',
      todo: 'Pendiente',
    },
    categories: 'Categorías',
    readAll: 'Marcar todo como leído',
    open: 'Abrir',
    actions: {
      read: 'Marcar como leído',
      unread: 'Marcar como no leído',
      delete: 'Eliminar',
    },
    tabs: {
      today: 'Hoy',
      info: 'Anteriores',
      decision: 'Pendiente',
    },
    actionsFor: 'Acciones para {{title}}',
    allRead: 'Todo marcado como leído.',
    back: 'Volver a la lista',
    cancel: 'Cancelar',
    clearFilter: 'Borrar filtro',
    count: '×{{count}}',
    deleted: 'Eliminada.',
    description: 'Notificaciones y solicitudes que te han enviado.',
    empty: {
      decision: 'No hay decisiones pendientes para ti',
      info: 'No hay notificaciones',
      todo: 'Nada pendiente para ti',
      unread: 'Todo al día',
    },
    emptyAll: 'No hay nada aquí',
    emptyDescription:
      'Aquí aparecen las notificaciones y solicitudes que te envían.',
    filters: 'Filtros de la bandeja de entrada',
    forbidden: 'No tienes permiso para hacer esto.',
    keyMove: 'Moverse',
    keyOpen: 'Abiertas',
    kinds: {
      all: 'Todos los tipos',
      decision: 'Decisiones',
      info: 'Anteriores',
      label: 'Tipo',
      today: 'Hoy',
    },
    detailsUnavailable:
      'No se pudieron cargar algunos detalles de la bandeja de entrada.',
    loadFailed: 'No se pudo cargar la bandeja de entrada',
    loadFailedDescription: 'Comprueba la conexión e inténtalo de nuevo.',
    loadMore: 'Cargar más',
    loading: 'Cargando',
    noMatchDescription: 'Borra el filtro para ver todos los tipos.',
    nothingSelected: 'Selecciona un elemento para verlo',
    notification: 'Notificación',
    outcomes: {
      approved: 'Aprobada',
      rejected: 'Rechazada',
      withdrawn: 'Retirado',
    },
    pendingDecisions: '{{count}} pendientes',
    request: {
      approve: 'Aprobar',
      commentFor: '{{action}}: {{title}}',
      commentPlaceholder: 'Escribe algo…',
      newLine: 'para una nueva línea',
      quickSend: 'para enviar',
      reject: 'Rechazar',
    },
    requestFailed: 'La solicitud falló. Inténtalo de nuevo.',
    resolved: 'Gestionada',
    retry: 'Reintentar',
    unread: 'No leídas',
    unreadCount: '{{count}} sin leer',
  },
  inboxButton: {
    title: 'Bandeja de entrada',
    viewAll: 'Abrir la bandeja',
    empty: 'Aún no hay mensajes',
    pending: 'Bandeja de entrada, {{count}} pendientes',
    recent: 'Mensajes recientes',
    unread: 'Bandeja de entrada, {{count}} sin leer',
  },
  nav: {
    inbox: 'Bandeja de entrada',
  },
  common: { loading: 'Cargando' },
};

export default esES;
