import type { InAppNotificationClientResource } from './en-US.js';

const esES: InAppNotificationClientResource = {
  common: {
    loading: 'Cargando',
  },
  inbox: {
    actions: {
      delete: 'Eliminar',
      read: 'Marcar como leído',
      unread: 'Marcar como no leído',
    },
    actionsFor: 'Acciones para {{title}}',
    allRead: 'Todo marcado como leído.',
    back: 'Volver a la lista',
    cancel: 'Cancelar',
    categories: 'Categorías',
    clearFilter: 'Quitar filtro',
    count: '×{{count}}',
    deleted: 'Eliminado.',
    description: 'Notificaciones y solicitudes que te han enviado.',
    empty: {
      decision: 'No hay decisiones pendientes para ti',
      info: 'No hay notificaciones',
      todo: 'No tienes nada pendiente',
      unread: 'Estás al día',
    },
    emptyAll: 'No hay nada aquí',
    emptyDescription:
      'Aquí aparecen las notificaciones y solicitudes que te envían.',
    filters: 'Filtros de la bandeja de entrada',
    forbidden: 'No tienes permiso para hacer esto.',
    keyMove: 'Mover',
    keyOpen: 'Abrir',
    kinds: {
      all: 'Todos los tipos',
      decision: 'Decisiones',
      info: 'Anteriores',
      label: 'Tipo',
      today: 'Hoy',
    },
    detailsUnavailable:
      'No se pudieron cargar algunos detalles de la bandeja de entrada.',
    loadFailed: 'No se puede cargar la bandeja de entrada',
    loadFailedDescription: 'Comprueba tu conexión e inténtalo de nuevo.',
    loadMore: 'Cargar más',
    loading: 'Cargando',
    noMatchDescription: 'Quita el filtro para ver todos los tipos.',
    nothingSelected: 'Selecciona un elemento para verlo',
    notification: 'Notificación',
    open: 'Abrir',
    outcomes: {
      approved: 'Aprobada',
      rejected: 'Rechazada',
      withdrawn: 'Retirada',
    },
    pendingDecisions: '{{count}} pendientes',
    readAll: 'Marcar todo como leído',
    request: {
      approve: 'Aprobar',
      commentFor: '{{action}}: {{title}}',
      commentPlaceholder: 'Escribe algo…',
      newLine: 'para una nueva línea',
      quickSend: 'para enviar',
      reject: 'Rechazar',
    },
    requestFailed: 'La solicitud falló. Inténtalo de nuevo.',
    resolved: 'Gestionado',
    retry: 'Reintentar',
    tabs: {
      decision: 'Pendiente',
      info: 'Anteriores',
      today: 'Hoy',
    },
    title: 'Bandeja de entrada',
    unread: 'No leídos',
    unreadCount: '{{count}} sin leer',
    views: {
      all: 'Todo',
      todo: 'Pendiente',
      unread: 'No leídos',
    },
  },
  inboxButton: {
    empty: 'Aún no hay mensajes',
    pending: 'Bandeja de entrada, {{count}} pendientes',
    recent: 'Mensajes recientes',
    title: 'Bandeja de entrada',
    unread: 'Bandeja de entrada, {{count}} sin leer',
    viewAll: 'Abrir la bandeja',
  },
  nav: {
    inbox: 'Bandeja de entrada',
  },
};

export default esES;
