import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  business: {
    scenarios: 'Escenarios en tiempo real',
    tabs: {
      tasks: 'Tareas',
      inbox: 'Bandeja de entrada',
      exports: 'Exportaciones',
      lab: 'Laboratorio de capacidad',
    },
    assignee: 'Persona asignada',
    creator: 'Creado por',
    updated: 'Última actualización',
    statusLabel: 'Estado',
    detail: 'Detalles de la tarea',
    saving: 'Guardando…',
    saved: 'Estado de la tarea actualizado',
    updating: 'Actualizando…',
    previous: 'Anterior',
    next: 'Siguiente',
    close: 'Cerrar',
    cancel: 'Cancelar',
    create: 'Crear',
    created: 'Tarea creada "{{title}}"',
    status: {
      open: 'Para hacer',
      'in-progress': 'En curso',
      done: 'Hecho',
    },
    actions: {
      'in-progress': 'Iniciar',
      done: 'Completo',
      open: 'Reabrir',
    },
    form: {
      help: 'Describa la obra y elija quién debe encargarse de ella.',
      title: 'Título',
      description: 'Descripción',
      choose: 'Elige un cesionario',
      titleRequired: 'Ingrese un título de 1 a 200 caracteres.',
      descriptionRequired: 'Describa lo que es necesario hacer.',
      assigneeRequired: 'Elija un cesionario activo.',
    },
    errors: {
      session: 'Su sesión ha finalizado. Inicia sesión nuevamente.',
      forbidden:
        'Ya no tienes acceso a esta tarea. Ciérralo y consulta con su creador.',
      missing:
        'Este registro ya no existe. Ciérrelo o regrese a la lista actual.',
      failed: 'La solicitud falló. Por favor inténtalo de nuevo.',
      active: 'Aún se está ejecutando una exportación. Espere a que termine.',
    },
    read: 'Leer',
    unread: 'No leído',
    markRead: 'Marcos leído',
    markUnread: 'Marcar como no leído',
    markedRead: 'Notificación marcada como leída',
    markedUnread: 'Notificación marcada como no leída',
    loadMore: 'Cargar más',
    jobs: {
      queued: 'En cola',
      running: 'Exportación',
      completed: 'Listo para descargar',
      failed: 'Falló',
    },
    tasks: {
      title: 'Colaboración en tareas',
      description: 'Asigne trabajo y siga su progreso juntos en tiempo real.',
      try: 'Pruebe con dos ventanas: cree una tarea aquí, luego observe cómo aparece y cambie el estado en la otra ventana. Sólo las tareas que usted creó o que tiene asignadas son visibles.',
      create: 'Nueva tarea',
      empty: 'Aún no hay tareas',
      emptyHelp:
        'Cree una tarea real, asígnesela a usted mismo o a un colega y sígala aquí.',
      stageEmpty: 'No hay tareas en esta etapa en esta página',
      page: 'Página {{page}} · Tareas {{count}} en total. Las columnas muestran hasta 30 tareas en esta página.',
    },
    inbox: {
      title: 'Bandeja de entrada personal',
      description:
        'Reciba asignaciones de tareas y actualizaciones, y mantenga sincronizado el estado de lectura en todas las ventanas.',
      try: 'Asígnate una tarea para recibir una notificación. Para colaborar, utilice otra cuenta: las actualizaciones notifican a los demás participantes. Esta bandeja de entrada incluye todas las notificaciones de su aplicación.',
      empty: 'Aún no hay notificaciones',
      emptyHelp:
        'Cree una tarea asignada a usted mismo en Tareas y luego regrese aquí.',
    },
    exports: {
      missing:
        'Este archivo de exportación ya no está disponible. Cree una nueva exportación para descargar sus tareas actuales.',
      title: 'Exportaciones de tareas',
      description:
        'Exporte sus tareas visibles en segundo plano y descargue el CSV resultante.',
      try: 'Inicie una exportación, cambie de página y luego regrese para descargarla. Otra ventana sigue el mismo trabajo. El progreso cuenta filas reales; una pequeña exportación puede finalizar inmediatamente.',
      create: 'Exportar tareas',
      empty: 'Aún no hay exportaciones',
      emptyHelp:
        'Genere una instantánea CSV de sus tareas, incluidas sus descripciones, estado y asignados.',
      accepted: 'Exportación iniciada',
      active:
        'Una exportación está en curso. Puedes salir de esta página y volver más tarde.',
      file: 'Tareas CSV',
      rows: 'Filas {{processed}} / {{total}} procesadas',
      progress: 'Progreso de exportación',
      limit:
        'La exportación supera las 5.000 tareas. Este ejemplo admite como máximo 5000 filas por exportación.',
      failed:
        'La exportación falló. Utilice Exportar tareas para iniciar un nuevo intento.',
      download: 'Descargar',
      downloaded: 'Descarga CSV iniciada',
      retention:
        'Se conservan sus últimas 20 exportaciones. Cada archivo es una instantánea de las tareas a las que podía acceder cuando se generó.',
    },
  },
  routeOverlay: {
    close: 'Cerrar',
  },
  title: 'Ejemplos en tiempo real',
  description:
    'Explore las suscripciones, el control de acceso y la recuperación con eventos en vivo e instantáneas observables.',
  scope:
    'Los valores de demostración pertenecen a su cuenta, viven únicamente en este proceso y se restablecen después de una hora de inactividad o un reinicio del servidor.',
  account: 'Cuenta corriente',
  loading: 'Cargando',
  working: 'Trabajando…',
  retry: 'Reintentar',
  reload: 'Demostración de recarga',
  signIn: 'Iniciar sesión nuevamente',
  cancel: 'Cancelar',
  connection: 'Conexión',
  subscription: 'Suscripción',
  events: 'Eventos recibidos',
  ready: 'Agradecimientos',
  snapshot: 'Instantánea observada',
  reads: 'Lecturas de instantáneas completadas',
  readAt: 'Última lectura exitosa',
  waiting: 'Esperando el primer evento…',
  none: 'Aún no disponible',
  topic: 'Tema',
  receipt: 'Recibo de la última publicación',
  pause: 'Pausar suscripción',
  resume: 'Reanudar suscripción',
  reconnect: 'Reconectar',
  states: {
    idle: 'Inactivo',
    connecting: 'Conectando',
    open: 'Abierto',
    reconnecting: 'Reconexión',
    closed: 'Cerrado',
    pending: 'Pendiente',
    subscribing: 'Suscripción',
    subscribed: 'Suscrito',
    error: 'Error',
  },
  clock: {
    title: '1. Tema público y gancho de React',
    description:
      'useRealtimeTopic se suscribe al reloj público. Al hacer una pausa, se libera el reloj de esta tarjeta.',
    latest: 'Última hora del servidor',
    paused: 'Esta tarjeta está en pausa. Reanudar para recibir nuevos ticks.',
    initial:
      'El reloj comienza a publicar cuando se reconoce su primer suscriptor.',
  },
  personal: {
    title: '2. Eventos personales',
    description:
      'PublishFor apunta a su cuenta. Otra pestaña de esta cuenta recibe el evento; otra cuenta no.',
    send: 'Enviar a mi cuenta',
    empty: 'Aún no hay eventos personales. Envíe uno para observar la entrega.',
    recovery:
      'onReady lee la última instantánea personal después de cada reconocimiento.',
  },
  room: {
    title: '3. Autorización dinámica de recursos',
    description:
      'Esta sala utiliza la misma política de propietario y acceso para lecturas de HTTP y entrega en tiempo real.',
    allowed: 'Acceso concedido',
    denied: 'Acceso denegado',
    grant: 'Conceder acceso',
    revoke: 'Revocar acceso',
    retry: 'Reintentar suscripción',
    send: 'Cambio de sala de publicación',
    grantHint:
      'Otorgue acceso y luego vuelva a intentar la suscripción denegada.',
    retryHint:
      'Se concede acceso. Vuelva a intentar obtener un nuevo reconocimiento.',
    revokeTitle: '¿Revocar el acceso a su sala de demostración?',
    revokeDescription:
      'Las suscripciones existentes pierden el acceso y se borra la instantánea de la sala. Puedes otorgar acceso nuevamente.',
    blocked:
      'La instantánea de la sala está oculta mientras se deniega el acceso.',
    success: 'Acceso a la habitación actualizado',
  },
  counter: {
    title: '4. Actualización y puesta al día fusionadas',
    description:
      'Cinco invalidaciones actualizan un contador. useRealtimeRefresh fusiona lecturas; comparar los aumentos del recuento después de la preparación inicial.',
    burst: 'Publicar 5 cambios',
    pause: 'Pausar actualización en vivo',
    resume: 'Reanudar actualización en vivo',
    paused:
      'La actualización de instantáneas está en pausa; el observador de eventos permanece activo. Publique nuevamente y luego continúe para ponerse al día.',
    running:
      'La actualización de instantáneas está activa. Las pestañas ocultas se actualizan cuando vuelven a ser visibles.',
    refreshing: 'Instantánea refrescante…',
    note: 'Este valor proviene únicamente de la lectura API, nunca de la respuesta de publicación.',
  },
  unknown: {
    title: '5. Errores de suscripción',
    description:
      'Un tema no declarado se rechaza sin detener los temas permitidos.',
    try: 'Prueba con un tema desconocido',
    explanation:
      'Se espera TOPIC_NOT_FOUND aquí. El servidor debe declarar un tema antes de poder suscribirse.',
    initial: 'Iniciar el intento de observar un error de protocolo real.',
  },
  recovery: {
    title: '6. Recuperación de la conexión',
    description:
      'Desconecte los enchufes locales de esta cuenta, incluidas otras pestañas. El cliente se vuelve a conectar automáticamente y onReady recupera los cambios perdidos.',
    disconnect: 'Simular desconexión',
    history: 'Estados de conexión recientes',
    note: 'Volver a conectar en la parte superior vuelve a abrir la conexión de la aplicación compartida. Los eventos son transitorios: las instantáneas recuperan su estado sin repetición.',
    instruction:
      'Publicar cambios desde otra pestaña. Reanudar una actualización pausada para ponerse al día; reconnect recupera instantáneas mientras la actualización está activa.',
    disconnected: 'Sockets de tiempo real desconectados',
  },
  published: 'Publicación aceptada',
  errors: {
    request: 'La solicitud falló. Intentar otra vez.',
    session: 'Su sesión ha finalizado. Inicia sesión nuevamente.',
    forbidden: 'Acceso denegado. Verifique sus permisos actuales.',
    expired:
      'La manifestación ha expirado. Vuelve a cargarlo para crear una nueva habitación.',
    capacity: 'La manifestación está ocupada. Vuelve a intentarlo más tarde.',
    subscription:
      'La suscripción falló. Vuelva a conectarse o vuelva a intentarlo después de restaurar el acceso.',
  },
};

export default esES;
