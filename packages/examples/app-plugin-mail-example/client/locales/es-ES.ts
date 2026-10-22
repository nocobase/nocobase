import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  navigation: {
    mailExample: 'Ejemplo de correo',
    workspace: 'Bandeja de entrada y redactar',
    accounts: 'Cuentas',
    allMail: 'Todo el correo',
    activity: 'Enviar actividad',
    syncLogs: 'Registros de sincronización',
  },
  workspace: {
    title: 'Bandeja de entrada y redactar',
    description:
      'Lea mensajes de muestra, inspeccione archivos adjuntos, responda o redacte un mensaje nuevo. El proveedor simulado acepta envíos sin ponerse en contacto con un servicio de correo externo.',
  },
  activity: {
    title: 'Enviar actividad',
    description:
      'Revisar los registros de entrega creados por el flujo de envío normal de Mail. El proveedor simulado simula la aceptación y Mail almacena el mensaje en la carpeta Enviados local.',
    subject: 'Asunto',
    recipients: 'Destinatarios',
    account: 'Cuenta de envío',
    status: 'Estado',
    created: 'Enviado',
    noSubject: '(sin tema)',
    loadFailed: 'No se pudo cargar la actividad de envío.',
    emptyTitle: 'Aún no hay actividad de envío',
    emptyDescription:
      'Envíe un mensaje de muestra desde el espacio de trabajo para ver su resultado de entrega simulada aquí.',
    statuses: {
      pending: 'Pendiente',
      submitting: 'Enviando',
      accepted: 'Aceptado (simulado)',
      failed: 'Falló',
      unknown: 'Desconocido',
      cancelled: 'Cancelado',
    },
  },
  providers: {
    demo: 'Gmail (simulacro)',
    'demo-microsoft': 'Microsoft 365 (simulacro)',
    'demo-imap-smtp': 'IMAP/SMTP (simulado)',
  },
  accounts: {
    title: 'Cuentas de buzón',
    description: 'Preparando los buzones de muestra y sus mensajes.',
  },
  allMail: {
    title: 'Todo el correo',
    description:
      'Explore el correo importado de los buzones simulados, busque por palabra clave e inspeccione la cuenta de cada mensaje, lea el estado, la estrella y los metadatos de los archivos adjuntos.',
    listTitle: 'Lista de mensajes',
    resultCount: 'Mensajes {{count}}',
    pageCount: 'Página {{page}} de {{pages}}',
    searchLabel: 'Buscar correo',
    searchPlaceholder: 'Buscar asunto, remitente o contenido del mensaje',
    search: 'Buscar',
    account: 'Cuenta',
    from: 'De',
    subject: 'Asunto y vista previa',
    flags: 'Estado del mensaje',
    date: 'Recibido',
    unread: 'No leído',
    starred: 'Destacado',
    attachment: 'Adjunto',
    previous: 'Anterior',
    next: 'Siguiente',
    emptyTitle: 'No se encontraron mensajes',
    emptyDescription:
      'Pruebe con otra palabra clave o borre la búsqueda para ver todos los mensajes simulados.',
    loadFailed: 'No se pudo cargar todo el correo.',
  },
  syncLogs: {
    title: 'Registros de sincronización',
    description:
      'Revise el historial y las ejecuciones de sincronización incremental para los tres buzones simulados, incluido el estado, la fase, los recuentos procesados ​​y los errores.',
    account: 'Cuenta de buzón',
    mode: 'Modo de sincronización',
    status: 'Estado',
    phase: 'Fase',
    progress: 'Progreso',
    started: 'Iniciado',
    completed: 'Completado',
    error: 'Error',
    unknownAccount: 'Cuenta desconocida',
    empty:
      'Aún no se ha ejecutado ninguna sincronización. Inicie una sincronización desde la página de cuentas.',
    loadFailed: 'No se pudieron cargar los registros de sincronización.',
    pageCount: 'Página {{page}} de {{pages}} · Ejecuciones de {{total}}',
    messages: 'Mensajes {{count}} procesados',
    batches: 'lotes {{count}}',
    modes: {
      initial: 'Sincronización inicial',
      incremental: 'Sincronización incremental',
    },
    statuses: {
      pending: 'Pendiente',
      running: 'En ejecución',
      completed: 'Completado',
      partial: 'Parcial',
      failed: 'Falló',
      cancelled: 'Cancelado',
    },
    phases: {
      preparing: 'Preparando',
      history: 'Historial de mensajes',
      catchUp: 'Ponerse al día',
      incremental: 'Actualizaciones incrementales',
      completed: 'Completado',
    },
  },
  demo: {
    noPreview: 'No hay vista previa disponible.',
    preparing: 'Preparando datos del buzón de demostración…',
    retry: 'Reintentar configuración',
    openWorkspace: 'Abrir espacio de trabajo de correo',
    refresh: 'Actualizar',
    loading: 'Cargando…',
  },
};

export default esES;
