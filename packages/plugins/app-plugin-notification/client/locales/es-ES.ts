import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  templates: {
    title: 'Plantillas de notificación',
    coverage:
      'Notificaciones que el sistema envía automáticamente y su aspecto. Es posible que no aparezcan las notificaciones enviadas por flujos de trabajo o código personalizado. Esta página es de solo lectura.',
    filters: 'Filtrar plantillas',
    search: 'Buscar plantillas',
    category: 'Categoría',
    channel: 'Canal',
    all: 'Todas',
    details: 'Detalles de la plantilla',
    close: 'Cerrar',
    providedBy: 'Proporcionada por {{name}}',
    trigger: 'Cuándo se envía',
    recipients: 'Quién la recibe',
    businessRule: 'Condiciones de envío',
    languagePolicy: 'Idioma',
    combined:
      'Un mismo mensaje incluye todos los idiomas ({{languages}}). Todos los destinatarios reciben el mismo contenido.',
    singleLocale: 'Se envía solo en {{language}}.',
    status: 'Canales de envío',
    statusHelp:
      'Indica si cada canal está configurado. No prueba la conexión ni confirma que los mensajes se entreguen.',
    configured: 'Configurado',
    unconfigured: 'Sin configurar',
    enabled: 'Activado',
    disabled: 'Desactivado',
    variables: 'Variables',
    variablesHelp:
      'Marcadores que se sustituyen por valores reales al enviar la notificación.',
    language: 'Idioma',
    synthetic:
      'Usa datos de ejemplo ficticios. La vista previa nunca envía notificaciones.',
    definition: 'Plantilla con variables',
    preview: 'Vista previa',
    html: 'Versión HTML (mostrada como código)',
    technical: 'Detalles técnicos',
    templateId: 'ID de plantilla',
    package: 'Paquete',
    channelNames: 'Nombres de canal',
    channelTypes: {
      inApp: 'Mensaje en la aplicación',
      email: 'Correo electrónico',
    },
    loading: 'Cargando…',
    failed: 'No se pudieron cargar las plantillas.',
    forbidden: 'No tienes permiso para ver las plantillas de notificación.',
    notFound: 'Esta plantilla ya no existe.',
    retry: 'Reintentar',
    empty: 'Todavía no hay plantillas de notificación.',
    noResults: 'Ninguna plantilla coincide con estos filtros.',
  },
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
