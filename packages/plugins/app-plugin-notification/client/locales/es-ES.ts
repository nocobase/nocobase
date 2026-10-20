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
    sendTest: 'Enviar notificación de prueba',
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
  test: {
    title: 'Enviar notificación de prueba',
    description:
      'Seleccione un método de entrega, luego haga clic en Enviar. El mensaje se envía al destinatario que usted proporciona y se registra a continuación.',
    close: 'Cerrar el cuadro de diálogo de notificación de prueba',
    loadingProviders: 'Cargando Proveedores configurados…',
    noProviders: 'No se configura ningún proveedor habilitado.',
    channelProvider: 'Método de entrega',
    selectProvider: 'Seleccione un método de entrega',
    singleProviderLabel: '{{channel}} ({{provider}})',
    recipient: 'Destinatario',
    userIdPlaceholder: 'ID de usuario',
    emailHelp:
      'La dirección de correo electrónico que debe recibir esta prueba.',
    userHelp:
      'El ID de usuario que debe recibir este mensaje en la aplicación.',
    messageTitle: 'Título',
    message: 'Mensaje',
    cancel: 'Cancelar',
    sending: 'Enviando…',
    send: 'Enviar',
    defaultTitle: 'Prueba de notificación NocoBase',
    defaultBody: 'Esta es una notificación de prueba de NocoBase.',
    accepted: 'Notificación de prueba {{id}} aceptada.',
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
