import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  logs: {
    deliveryOperations: 'Operaciones de entrega',
    recipeDescription:
      'Rastree cada transferencia de canal y cada intento de proveedor.',
    redacted:
      'Los cuerpos de los mensajes, los destinatarios y los tokens de arrendamiento están redactados.',
    providerAttempts: 'Intentos del proveedor',
    eyebrow: 'Notificaciones',
    title: 'Registros de notificaciones',
    description:
      'Seguimiento de la entrega de notificaciones y de cada intento del proveedor. Los cuerpos de los mensajes, los destinatarios y los tokens de arrendamiento están redactados.',
    refreshing: 'Refrescante…',
    refresh: 'Actualizar',
    deliveriesShown: 'Entregas mostradas',
    needAttention: 'Necesito atención',
    unavailable: 'Registros no disponibles',
    recent: 'Notificaciones recientes',
    loading: 'Cargando historial de entregas…',
    emptyTitle: 'Aún no hay entregas',
    emptyDescription:
      'Los registros de entrega aparecerán aquí después de que se envíen las notificaciones.',
    expand: 'Ampliar notificación',
    collapse: 'Contraer notificación',
    noDeliveries: 'No se registraron entregas.',
    noAttempts: 'No se registraron intentos.',
    columns: {
      source: 'Fuente',
      notificationId: 'ID de notificación',
      status: 'Estado',
      deliveries: 'Entregas',
      created: 'Creado',
      channel: 'Canal',
      provider: 'Proveedor',
      attempts: 'Intentos',
      updated: 'Actualizado',
    },
  },
  status: {
    pending: 'pendiente',
    processing: 'procesamiento',
    completed: 'completado',
    partial: 'parcial',
    failed: 'falló',
    unknown: 'desconocido',
    preparing: 'preparando',
    submitting: 'presentando',
    retrying: 'reintentando',
    accepted: 'aceptado',
  },
  errors: {
    requestFailed: 'La solicitud de notificación falló.',
    inAppRecipientNotFound:
      'El destinatario de la notificación dentro de la aplicación no existe.',
  },
};

export default esES;
