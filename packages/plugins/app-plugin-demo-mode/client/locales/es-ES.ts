import type { DemoModeResource } from './en-US.js';
const resource: DemoModeResource = {
  authorization: {
    title: 'Datos de demostración',
    read: 'Ver',
    manage: 'Generar y borrar',
    configuration: 'Configuración de demostración',
    configure: 'Configurar',
  },
  accounts: {
    menu: 'Cuenta de demostración: {{name}}',
    title: 'Cuentas de demostración',
    description:
      'Entra en la demostración con cualquiera de estas cuentas para ver lo que ve cada una.',
    enter: 'Entrar',
    signedInAs: 'Sesión de {{name}} · Cambiar',
    current: 'Actual',
    entering: 'Entrando…',
    failed: 'No se pudo entrar con esta cuenta de demostración.',
    unavailable: 'Ahora mismo no hay cuentas de demostración disponibles.',
    password: 'Iniciar sesión con contraseña',
  },
  refused: {
    title: 'Esta es una demostración. No se pueden guardar cambios.',
    description: 'El resto funciona con normalidad.',
  },
  settings: {
    title: 'Entorno de demostración',
    refresh: 'Actualizar',
    retry: 'Reintentar',
    busy: 'Se están generando o borrando los datos de demostración',
    busyHelp: 'Podrás volver a guardar los ajustes cuando termine.',
    disabled: {
      title: 'Esta aplicación no es una demostración',
      help: 'El modo de demostración está desactivado. El despliegue lo activa con NOCOBASE_DEMO_MODE=true.',
    },
    cancel: 'Cancelar',
    save: 'Guardar',
    apply: 'Aplicar cambios',
    unsaved: 'Cambios sin guardar',
    discardAndReload: 'Descartar mis cambios y recargar',
    switch: {
      on: 'Activado',
      off: 'Desactivado',
    },
    status: {
      enabled: 'Demo activada',
      help: 'Los visitantes pueden abrir todas las páginas, pero los cambios no se guardan salvo que una excepción de abajo lo permita.',
    },
    tabs: {
      overview: 'Resumen',
      schedule: 'Restablecimiento diario',
      writes: 'Escrituras de visitantes',
      simulation: 'Simulación e IA',
    },
    leave: {
      title: '¿Salir sin guardar?',
      description:
        'Se perderán los cambios que no hayas guardado en esta página.',
      stay: 'Seguir editando',
      discard: 'Descartar cambios',
    },
    errors: {
      failed: 'La solicitud no se completó. Inténtalo de nuevo.',
      conflict: 'Otro administrador guardó este ajuste primero.',
      busy: 'Se están generando o borrando los datos de demostración. Inténtalo cuando termine.',
      exists:
        'Los datos de demostración ya están generados. Restablécelos en su lugar.',
      demoModeRequired: 'Solo funciona con el modo de demostración activado.',
      accountConflict:
        'Un nombre de usuario de la demostración pertenece a una cuenta que no es suya.',
      unavailable: 'Esta aplicación no ofrece datos de demostración.',
      signedOut: 'Tu sesión ha terminado. Inicia sesión de nuevo.',
      denied: 'No tienes permiso para gestionar la demostración.',
    },
    data: {
      title: 'Datos de demostración',
      state: {
        importing: 'Generando',
        clearing: 'Borrando',
        resetting: 'Restableciendo',
        failed: 'Error',
        ready: 'Listos',
        none: 'Sin generar',
      },
      presentSummary: 'Generados en {{language}} · {{time}}',
      resettingSummary:
        'Borrando los datos actuales para generarlos de nuevo en {{language}}.',
      phase: {
        clearing: 'Borrando',
        generating: 'Generando de nuevo',
      },
      absentSummary:
        'Genera los datos de demostración para que los visitantes exploren la aplicación con una historia completa.',
      language: 'Idioma',
      clear: 'Borrar',
      reset: 'Restablecer',
      generate: 'Generar',
      failed: 'La última ejecución no terminó',
      readOnly:
        'Puedes ver los datos de demostración; generar, restablecer y borrar requiere el permiso de gestión.',
      unavailable: 'Sin datos de demostración',
      unavailableHelp:
        'Esta aplicación no registra un conjunto de datos de demostración.',
      cleared: 'Datos de demostración borrados',
      resetStarted: 'Restableciendo los datos de demostración',
      importStarted: 'Generando los datos de demostración',
      confirm: {
        import: {
          title: '¿Generar los datos de demostración?',
          description:
            'Los datos se generan en {{language}} y se activan sus cuentas de demostración.',
        },
        reset: {
          title: '¿Restablecer los datos de demostración?',
          description:
            'Se eliminan todos los datos de negocio de esta instancia, incluido lo que añadieron los visitantes, y se vuelven a generar en {{language}}.',
        },
        clear: {
          title: '¿Borrar los datos de demostración?',
          description:
            'Se eliminan todos los datos de negocio de esta instancia, incluido lo que añadieron los visitantes, y se desactivan las cuentas de demostración. Se conservan los ajustes y los administradores.',
        },
      },
    },
    visitors: {
      title: 'Cuentas de demostración',
      off: 'El acceso rápido está desactivado en este despliegue.',
      pending:
        'Las cuentas aparecerán aquí cuando los datos de demostración estén listos.',
      noData:
        'Genera primero los datos de demostración; sus cuentas aparecerán aquí.',
      credentials: 'Usuario {{username}} · contraseña {{password}}',
      copyLink: 'Copiar enlace',
      copyLinkFor: 'Copiar el enlace de acceso de {{name}}',
      openFor: 'Abrir la demostración como {{name}}',
      copied: 'Copiado',
      copyFailed:
        'No se pudo copiar. Copia el enlace desde la barra de direcciones.',
    },
    schedule: {
      description:
        'Una vez al día, elimina lo que cambiaron los visitantes y vuelve a generar los datos de demostración.',
      confirmTitle: '¿Guardar el restablecimiento diario?',
      confirmDescription:
        'A la hora indicada se eliminan todos los datos de negocio de esta instancia y se vuelven a generar.',
      summary: 'Cada día a las {{time}} ({{timezone}}), en {{language}}',
      off: 'Sin programar',
      enabled: 'Restablecer cada día',
      enabledHelp:
        'Usa el administrador que generó los datos de demostración por última vez.',
      time: 'Hora',
      hour: 'Hora',
      minute: 'Minuto',
      language: 'Idioma',
      timezone: 'Zona horaria',
      noTimezone: 'Ninguna zona horaria coincide',
      invalidTimezone: 'Elige una zona horaria de la lista.',
      next: 'Próximo restablecimiento: {{time}}',
    },
    writes: {
      intro:
        'Cuando la demo está activada, las escrituras se rechazan de forma predeterminada. Selecciona las colecciones que los visitantes necesitan modificar; los permisos de la aplicación controlan las operaciones y el acceso a los registros.',
      allow: 'Permitir',
      revoke: 'Volver a rechazar',
      confirmTitle: '¿Cambiar lo que pueden escribir los visitantes?',
      confirmDescription:
        'Los cambios de los visitantes en esto se guardan de verdad hasta el próximo restablecimiento.',
      collections: {
        title: 'Colecciones',
        description:
          'Las solicitudes autorizadas por la aplicación pueden escribir en estas colecciones.',
        label: 'Colecciones que pueden escribir los visitantes',
        placeholder: 'Buscar colecciones',
        noMatch: 'Ninguna colección coincide',
        fixed: 'Siempre escribibles',
        fixedHelp:
          'Las sesiones de inicio y las excepciones propias del despliegue (NOCOBASE_DEMO_WRITABLE_COLLECTIONS); no se pueden cambiar aquí.',
      },
    },
    simulation: {
      kind: {
        model: 'Modelo',
        tool: 'Herramienta',
        runner: 'Runner',
      },
      mocks: {
        title: 'Simulaciones',
        description:
          'Lo que responde en lugar de los servicios externos en esta demostración.',
        confirmTitle: '¿Cambiar las simulaciones?',
        confirmDescription:
          'Una simulación desactivada hace que ese trabajo falle; nunca se envía al servicio real.',
        empty: 'No hay simulaciones registradas',
        emptyHelp: 'La aplicación no ha registrado ningún servicio simulado.',
        onHelp: 'Responde con resultados simulados.',
        offHelp: 'Desactivada: el trabajo se rechaza.',
      },
      chat: {
        title: 'Chat en línea',
        description:
          'Permite a los visitantes hablar con la IA de la aplicación.',
        confirmTitle: '¿Guardar los ajustes del chat en línea?',
        confirmDescription:
          'Las conversaciones de los visitantes siguen estos ajustes desde su próximo mensaje.',
        confirmLive:
          'Un modelo real responde a los visitantes y cada conversación se cobra a su servicio de modelos.',
        enabled: 'Los visitantes pueden chatear',
        enabledHelp:
          'Desactivado: el chat rechaza los mensajes de los visitantes.',
        model: 'Respuestas de',
        simulated: 'Modelo simulado',
        live: 'Un modelo real',
        simulatedHelp: 'Respuestas guionizadas; sin coste.',
        liveHelp:
          'Responde un servicio de modelos existente; sus credenciales permanecen allí.',
        service: 'Servicio de modelos',
        modelId: 'Modelo',
        cost: 'Cada conversación de un visitante consume tokens de este servicio.',
        tools: 'Herramientas',
        noTools: 'La aplicación no declara herramientas de chat.',
        policy: {
          deny: 'Rechazar',
          read: 'Leer datos',
          mock: 'Simular',
        },
      },
    },
  },
};
export default resource;
