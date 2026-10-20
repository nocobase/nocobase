import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  inbox: {
    eyebrow: 'Bandeja de entrada personal',
    title: 'Centro de mensajes',
    unreadCount: '{{count}} no leído',
    description:
      'Actualizaciones de las aplicaciones y flujos de trabajo que utiliza.',
    markAllRead: 'Marcar todo como leído',
    messagesTitle: 'Mensajes',
    messagesDescription:
      'Los mensajes dentro de la aplicación mantienen un estado de lectura independiente para el usuario actual.',
    unreadFilter: 'No leído',
    unavailable: 'Bandeja de entrada no disponible',
    retry: 'Reintentar',
    loading: 'Cargando notificaciones…',
    emptyTitle: 'Estáis todos atrapados',
    emptyDescription: 'Nuevas notificaciones aparecerán aquí.',
    loadingMore: 'Cargando…',
    loadMore: 'Cargar más',
    scrollMore: 'Desplácese hacia abajo para cargar más',
    noMore: 'No más mensajes',
    expand: 'Mostrar más',
    collapse: 'Mostrar menos',
    channel: 'En la aplicación',
    open: 'Abierto',
    markUnread: 'Marcar como no leído',
    markRead: 'Marcos leído',
    delete: 'Eliminar notificación',
    errors: {
      update: 'Error en la actualización de la bandeja de entrada.',
      loadMore: 'No se pudieron cargar más notificaciones.',
      markAllRead: 'No se pudieron marcar las notificaciones como leídas.',
    },
  },
};

export default esES;
