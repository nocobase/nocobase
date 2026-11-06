import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  templates: {
    title: 'Plantillas de notificación',
    coverage:
      'Solo escenarios registrados. Los envíos dinámicos, las funciones personalizadas y las plantillas privadas quedan fuera. Las definiciones y vistas previas son de solo lectura.',
    search: 'Buscar escenarios',
    category: 'Categoría',
    channel: 'Canal',
    all: 'Todos',
    details: 'Ver detalles',
    close: 'Cerrar detalles',
    trigger: 'Activador',
    recipients: 'Regla de destinatarios',
    businessRule: 'Activación del negocio',
    contributor: 'Origen',
    languagePolicy: 'Comportamiento del idioma',
    status: 'Configuración del canal',
    statusHelp:
      'Registrar una definición no activa las notificaciones. Tener configuración no garantiza conectividad.',
    configured: 'Configurado',
    unconfigured: 'Sin configurar',
    enabled: 'Activado',
    disabled: 'Desactivado',
    unknown: 'Desconocido',
    variables: 'Variables disponibles',
    language: 'Idioma del contenido',
    synthetic:
      'Solo datos sintéticos. La vista previa no envía notificaciones ni cambia la configuración.',
    definition: 'Definición de plantilla',
    preview: 'Vista previa sintética',
    html: 'Código HTML (texto inerte)',
    loading: 'Cargando…',
    failed: 'No se pudieron cargar las plantillas.',
    forbidden: 'No tienes permiso para ver las plantillas.',
    notFound: 'Esta plantilla ya no está registrada.',
    retry: 'Reintentar',
    empty: 'No hay escenarios registrados.',
    noResults: 'Ningún escenario coincide con los filtros.',
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
