import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  access: {
    section: 'Versiones',
    pages: {
      'rel-apps': 'Aplicaciones',
    },
    businessSection: 'Versiones',
    businesses: {
      apps: {
        title: 'Aplicaciones',
        description:
          'Aplicaciones, sus lanzamientos, implementaciones y tiempo de ejecución.',
        actions: {
          view: {
            title: 'Ver aplicaciones',
            description:
              'Ver aplicaciones, sus lanzamientos, implementaciones y estado de ejecución',
            related: 'Ver aplicaciones (las relacionadas con ellas)',
            relatedLabel: 'Los que creé',
            relatedHint:
              'Aplicaciones que creé y cualquier aplicación relacionada conmigo',
            all: 'Ver aplicaciones (todas)',
          },
          readLogs: {
            title: 'Leer registros',
            description: 'Leer registros de implementación y aplicaciones',
            related: 'Leer registros (los relacionados con ellos)',
            relatedLabel: 'Los que creé',
            relatedHint:
              'Aplicaciones que creé y cualquier aplicación relacionada conmigo',
            all: 'Leer registros (todos)',
          },
          create: {
            title: 'Crear aplicaciones',
            description: 'Crear aplicaciones en un entorno',
            all: 'Crear aplicaciones',
          },
          configure: {
            title: 'Configurar aplicaciones',
            description:
              'Leer y cambiar la configuración de una aplicación, que puede contener secretos',
            related:
              'Configurar aplicaciones (aquellas relacionadas con ellas)',
            relatedLabel: 'Los que creé',
            relatedHint:
              'Aplicaciones que creé y cualquier aplicación relacionada conmigo',
            all: 'Configurar aplicaciones (todas)',
          },
          upload: {
            title: 'Subir lanzamientos',
            description: 'Subir y promocionar lanzamientos',
            related: 'Subir comunicados (los relacionados con ellos)',
            relatedLabel: 'Los que creé',
            relatedHint:
              'Aplicaciones que creé y cualquier aplicación relacionada conmigo',
            all: 'Subir versiones (todas)',
          },
          deploy: {
            title: 'Implementar',
            description:
              'Implementar y revertir en entornos desprotegidos, solicitar implementaciones en entornos protegidos',
            related: 'Despliegue (los relacionados con ellos)',
            relatedLabel: 'Los que creé',
            relatedHint:
              'Aplicaciones que creé y cualquier aplicación relacionada conmigo',
            all: 'Implementar (todos)',
          },
          deployProtected: {
            title: 'Aprobar implementaciones protegidas',
            description:
              'Aprobar implementaciones en entornos protegidos que no nombran aprobadores; solo personas',
            related:
              'Aprobar despliegues protegidos (los relacionados con ellos)',
            relatedLabel: 'Los que creé',
            relatedHint:
              'Aplicaciones que creé y cualquier aplicación relacionada conmigo',
            all: 'Aprobar implementaciones protegidas (todas)',
          },
          operate: {
            title: 'Iniciar y detener',
            description: 'Iniciar, detener y reiniciar aplicaciones',
            related: 'Iniciar y detener (los relacionados con ellos)',
            relatedLabel: 'Los que creé',
            relatedHint:
              'Aplicaciones que creé y cualquier aplicación relacionada conmigo',
            all: 'Iniciar y detener (todos)',
          },
          delete: {
            title: 'Eliminar aplicaciones',
            description: 'Eliminar una App con sus datos',
            related: 'Eliminar aplicaciones (las relacionadas con ellas)',
            relatedLabel: 'Los que creé',
            relatedHint:
              'Aplicaciones que creé y cualquier aplicación relacionada conmigo',
            all: 'Eliminar aplicaciones (todas)',
          },
        },
      },
    },
    recordAccess: {
      owned: 'Aplicaciones que crearon',
    },
    settings: {
      rel: {
        environments: 'Implementar entornos',
      },
    },
    keyScopes: {
      apps: {
        title: 'Aplicaciones e implementaciones',
        description:
          'Leer: ver aplicaciones, lanzamientos, implementaciones y registros. Leer y escribir: subir también comunicados. Administrador: también implementa e inicia o detiene aplicaciones.',
        objects: 'Aplicaciones',
      },
      environments: {
        title: 'Implementar entornos',
        description: 'Leer: enumerar entornos. Leer y escribir: gestionarlos.',
      },
      presets: {
        ciDeploy: {
          title: 'Despliegue de CI',
          description:
            'Cargue versiones de las aplicaciones elegidas e impleméntelas durante 90 días.',
        },
        ciUpload: {
          title: 'Carga de CI',
          description:
            'Cargar versiones de las aplicaciones elegidas sin implementarlas, durante 90 días.',
        },
      },
    },
    actions: {
      read: 'Ver',
      manage: 'Administrar',
      view: 'Ver',
      'read-logs': 'Leer registros',
      create: 'Crear',
      configure: 'Configurar',
      upload: 'Subir lanzamientos',
      deploy: 'Implementar',
      'deploy-protected': 'Aprobar implementaciones protegidas',
      operate: 'Iniciar y detener',
      delete: 'Eliminar',
    },
  },
  drivers: {
    host: 'Este servidor',
  },
  ui: {
    nav: {
      apps: 'Aplicaciones',
      environments: 'Implementar entornos',
    },
    apps: {
      title: 'Aplicaciones',
      description: 'Aplicaciones, sus lanzamientos y dónde se implementan.',
      search: 'Buscar por ID o nombre',
      create: 'Crear aplicación',
      id: 'ID de aplicación',
      name: 'Nombre',
      environment: 'Entorno',
      version: 'Versión',
      state: 'Estado',
      url: 'Dirección',
      labels: 'Etiquetas',
      loadFailed: 'No se pudieron cargar las aplicaciones.',
      loadOneFailed: 'No se pudo cargar la aplicación.',
      emptyTitle: 'Aún no hay aplicaciones',
      emptyNoAccess: 'Solicite a un administrador que cree una aplicación.',
      emptyDescription:
        'Cree una aplicación, luego cargue una versión e impleméntela en un entorno.',
      noResults: 'Ninguna aplicación coincide con la búsqueda.',
      created: '{{name}} creado.',
      createDescription:
        'Una aplicación se implementa en un entorno; sus lanzamientos se cargan después.',
      idHint:
        'Letras, dígitos, guiones bajos y guiones; parte de su dirección. No puede cambiar más tarde.',
      noEnvironment: 'Aún no hay entorno',
      lastAccess: 'Última visita',
    },
    advanced: 'Avanzado (opcional)',
    labels: {
      name: 'Nombre',
      value: 'Valor',
      nameOf: 'Nombre de la etiqueta {{index}}',
      valueOf: 'Valor de la etiqueta {{index}}',
      remove: 'Quitar etiqueta {{index}}',
      add: 'Añadir etiqueta',
      hint: 'Las etiquetas permiten que las herramientas y las personas encuentren y agrupen aplicaciones y lanzamientos.',
      count_one: 'Etiqueta {{count}}',
      count_other: 'Etiquetas {{count}}',
      system: 'Etiquetas agregadas por el sistema',
      systemHint: 'Agregado por el sistema; No se puede cambiar aquí.',
      errors: {
        keyRequired: 'Ingrese un nombre para este valor.',
        keyInvalid:
          'Utilice letras, dígitos, ".", "_", "/" o "-", comenzando con una letra o dígito (como máximo 63).',
        keyDuplicate: 'Este nombre ya está en uso.',
        valueTooLong: 'Como máximo caracteres {{max}}.',
        tooMany: 'Como máximo etiquetas {{max}}.',
      },
      count_many: 'Etiquetas {{count}}',
    },
    policy: {
      title: 'Entorno de ejecución',
      activationLabel: 'Iniciar',
      activation: {
        eager: 'Siempre corriendo',
        onDemand: 'Comienza en la visita',
      },
      activationHint: {
        eager:
          'Se inicia cuando se implementa y cada vez que se reinicia el tiempo de ejecución.',
        onDemand:
          'Iniciado en su primera visita después de una implementación o un reinicio del tiempo de ejecución.',
      },
      idleLabel: 'Detener cuando no haya sido visitado por',
      dormantLabel: 'Hibernar cuando no sea visitado durante',
      idleModeLabel: 'Comportamiento del temporizador de inactividad',
      dormantModeLabel: 'Comportamiento del temporizador de hibernación',
      minutes: 'minutos',
      hours: 'horas',
      neverIdle: 'Nunca',
      neverDormant: 'Nunca',
      timerMode: {
        inherit: 'Usar el valor predeterminado del entorno',
        custom: 'Establecer un valor personalizado',
      },
      customTimerHint:
        'Un valor personalizado vacío desactiva este temporizador; no utiliza el valor predeterminado del entorno.',
      idleSummary: 'se detiene después de {{minutes}} min sin visitar',
      dormantSummary: 'hiberna después de {{hours}} h',
      timersHint:
        'Una aplicación detenida libera su memoria y comienza de nuevo en la siguiente visita. A una aplicación en hibernación también se le eliminan los archivos descomprimidos; la configuración y los datos se guardan, y para la siguiente visita se vuelve a preparar, lo que lleva más tiempo.',
      unsupported:
        'Este entorno no admite el inicio de la visita; la aplicación sigue funcionando.',
      errors: {
        idleInvalid:
          'Ingrese minutos completos desde 1 hasta {{max}}, o déjelo vacío.',
        dormantInvalid:
          'Ingrese horas desde 0.02 (un minuto) hasta {{max}}, o déjelo vacío.',
        dormantBeforeIdle: 'La hibernación debe venir después de la parada.',
      },
    },
    state: {
      pending: 'Iniciando',
      starting: 'Iniciando',
      running: 'En ejecución',
      stopped: 'Detenido',
      stoppedOnDemand: 'Detenido (comienza en la visita)',
      dormant: 'Hibernando (preparado en visita)',
      failed: 'Falló',
      unknown: 'Desconocido',
      deploying: 'Despliegue',
    },
    operate: {
      refreshFailed:
        'No se pudo actualizar el estado de la aplicación. Las operaciones no están disponibles hasta que se actualice el estado. Verifique su conexión y acceso, luego vuelva a intentarlo.',
      disabled: {
        busy: 'Una operación está en curso.',
        unavailable:
          'El estado de la aplicación no está disponible. Actualice el estado antes de operar la aplicación.',
        deploying: 'Hay un despliegue en curso.',
        starting: 'La aplicación se está iniciando.',
        notDeployed: 'Implemente una versión primero.',
        alreadyRunning: 'La aplicación ya se está ejecutando.',
        notRunning: 'La ​​aplicación no se está ejecutando.',
      },
      start: 'Iniciar',
      stop: 'Detener',
      restart: 'Reiniciar',
      done: {
        start: 'La aplicación se está iniciando.',
        stop: 'La aplicación se detuvo.',
        restart: 'La aplicación se está reiniciando.',
      },
    },
    releases: {
      title: 'Versiones',
      upload: 'Subir un comunicado',
      uploadAction: 'Subir',
      commit: 'Commit',
      commitHint:
        'Opcional: la confirmación a partir de la cual se creó este archivo, guardada como la etiqueta sha.',
      uploaded: 'Lanzamiento cargado.',
      checksum: 'Suma de comprobación',
      size: 'Tamaño',
      created: 'Creado',
      empty:
        'Aún no se ha publicado. Cargue un paquete .tar.gz creado para esta aplicación.',
      loadFailed: 'No se pudieron cargar las versiones.',
    },
    deploy: {
      deploy: 'Implementar',
      started: 'Implementación de {{version}}.',
      confirmProtected:
        'Este entorno está protegido. Escriba {{appId}} para implementar.',
    },
    deployments: {
      title: 'Despliegues',
      kind: 'Amable',
      status: 'Estado',
      by: 'Por',
      current: 'Actual',
      logs: 'Registros',
      rollback: 'Revertir',
      rollbackStarted: 'Retrocediendo.',
      confirmRollbackTitle: '¿Revertir {{name}}?',
      confirmRollback:
        'La aplicación regresa al lanzamiento de esa implementación; lo que se ha desplegado desde entonces se retira.',
      loadFailed: 'No se pudieron cargar las implementaciones.',
      empty: 'Aún no implementado.',
      hideLogs: 'Ocultar registros',
      noLogs: 'Sin líneas de registro.',
      statuses: {
        queued: 'En cola',
        deploying: 'Despliegue',
        succeeded: 'Tuvo éxito',
        failed: 'Falló',
      },
    },
    actors: {
      human: 'persona',
      agent: 'agente',
      key: 'clave',
      rule: 'regla',
      system: 'sistema',
    },
    requests: {
      title: 'Solicitudes de implementación',
      pendingApproval: 'Pendiente de aprobación',
      notice: {
        deploy: 'solicitó implementar {{version}} en {{environment}}',
        rollback: 'solicitó revertir {{environment}} a {{version}}',
      },
      someone: 'Alguien',
      review: 'Revisión',
      view: 'Ver',
      comment: 'Comentario (opcional)',
      decideFailed: 'La decisión no se aprobó',
      request: 'Solicitar implementación',
      created: 'Despliegue solicitado.',
      approve: 'Aprobar',
      confirmApproveTitle: '¿Aprobar el despliegue de {{appId}}?',
      reject: 'Rechazar',
      cancel: 'Retirar',
      requestedBy: 'Solicitado por',
      decidedBy: 'Decidido por',
      note: 'Nota',
      approvedToast: 'Aprobó el despliegue de {{appId}}.',
      rejectedToast: 'Rechazó el despliegue de {{appId}}.',
      app: 'Aplicación',
      commit: 'Commit',
      build: 'Construir',
      ciLog: 'Registro de CI',
      requestedAt: 'Solicitado',
      decisionNote: 'Nota de decisión',
      pinned:
        'suma de comprobación {{checksum}}; aprobar implementa exactamente esto',
      loadFailed: 'No se pudo cargar la solicitud de implementación.',
      detailTitle: {
        deploy: 'Solicitud de implementación para {{appId}}',
        rollback: 'Solicitud de reversión para {{appId}}',
      },
      reviewTitle: {
        deploy: 'Revisar la solicitud de implementación para {{appId}}',
        rollback: 'Revisar la solicitud de reversión para {{appId}}',
      },
      done: {
        approve: 'Solicitud aprobada.',
        reject: 'Solicitud rechazada.',
        cancel: 'Solicitud retirada.',
      },
      kind: {
        deploy: 'Implementar',
        rollback: 'Revertir',
      },
      status: {
        pending: 'Pendiente',
        approved: 'Aprobado',
        rejected: 'Rechazado',
        cancelled: 'Retirado',
        deployed: 'Desplegado',
        failed: 'Falló',
      },
    },
    variables: {
      title: 'Variables',
      description:
        'Variables de entorno con las que se ejecuta esta aplicación. Cada cambio se guarda a la vez y llega a la aplicación con su siguiente implementación.',
      environmentDescription:
        'Cada aplicación en este entorno, incluidas las vistas previas de solicitudes de extracción, las obtiene a menos que establezca las suyas propias. Listado con lo que declara la versión más reciente de cada aplicación. Los cambios se guardan de inmediato y llegan a una aplicación en su próxima implementación.',
      add: 'Añadir variable',
      name: 'Nombre',
      value: 'Valor',
      source: 'Fuente',
      secret: 'Secreto',
      secretHint: 'Un secreto nunca se vuelve a mostrar una vez guardado.',
      nameHint:
        'Letras mayúsculas, dígitos y guiones bajos, comenzando con una letra.',
      invalidName:
        'Utilice letras mayúsculas, dígitos y guiones bajos, comenzando con una letra.',
      valueOf: 'Valor de {{name}}',
      set: 'Establecer',
      notSet: 'No establecido',
      sources: {
        app: 'Aplicación',
        environment: 'Del medio ambiente',
        configFile: 'config.yml',
        generated: 'Generado',
        default: 'Predeterminado',
        unset: 'Desarmado',
      },
      tags: {
        required: 'Requerido',
        secret: 'Secreto',
        firstStartOnly: 'Solo primer inicio',
        changed: 'Modificado: es necesario reiniciar',
        missing: 'Desaparecido',
        undeclared: 'No declarado',
      },
      setValue: 'Valor establecido',
      replace: 'Reemplazar',
      override: 'Anulación',
      overrideOf: 'Anular {{name}}',
      overrideTitle: 'Anular {{name}}',
      overrideHint:
        'Esta aplicación toma este valor en lugar del de su entorno. Salvado de una vez; la aplicación lo obtiene con su próxima implementación.',
      savedAtOnce:
        'Salvado de inmediato; la aplicación lo obtiene con su próxima implementación.',
      updated: 'Actualizado',
      clear: 'Borrar',
      addTitle: 'Añadir variable',
      setTitle: 'Establecer {{name}}',
      save: 'Guardar',
      cancel: 'Cancelar',
      saved: '{{name}} guardado.',
      cleared: '{{name}} borrado.',
      loadFailed: 'No se pudieron cargar las variables.',
      emptyTitle: 'Sin variables',
      emptyDescription:
        'El comunicado declara que no hay ninguno y que no hay ninguno configurado. Añada uno para pasarlo a la aplicación.',
      emptyEnvironmentTitle: 'Aún no hay variables',
      emptyEnvironment:
        'Añada uno para pasarlo a cada aplicación en este entorno.',
      emptyEnvironmentReadOnly: 'Pídale a un administrador que añada uno.',
      noManifest:
        'Esta versión no declara sus variables, por lo que ninguna se verifica antes de una implementación.',
      basis:
        'Listados como la compilación más reciente ({{version}}) los declara. El valor propio de la aplicación está por encima del de su entorno.',
      noBuildTitle: 'Aún no se ha construido',
      noBuildDescription:
        'Las variables aparecen aquí una vez que se carga la primera compilación de la aplicación. Puedes añadir uno a mano ahora.',
      noBuild:
        'Aún no se ha construido: estos son valores establecidos a mano.',
      undeclaredTitle: 'No declarado',
      undeclaredDescription:
        'La compilación más reciente no los declara. Todavía llegan a la aplicación; borre el valor propio de la aplicación una vez que no sea necesaria.',
      setOnEnvironment: 'Configurar en ambiente',
      setOnApp: 'Configurar en esta aplicación',
      declaredBy: 'Declarado por',
      status: 'Estado',
      noApps: 'Ninguna app lo declara',
      moreApps: '+{{count}}',
      appGroup: '{{label}}×{{count}}',
      missingIn_one: 'Falta en la aplicación {{count}}',
      missingIn_other: 'Falta en aplicaciones {{count}}',
      missingInTitle: 'Requerido y sin valor para: {{apps}}',
      environmentSet: 'Establecer aquí',
      environmentNotSet: 'No establecido aquí',
      missingTitle: 'Las variables requeridas no están configuradas',
      missingDescription:
        'Se debe configurar {{names}} antes de poder implementar la compilación más reciente: en el entorno para cada aplicación allí, o solo en esta aplicación.',
      review: 'Revisar variables',
      changedTitle: 'No se aplican cambios de variables',
      changedDescription:
        'Una variable cambió desde que se implementó la aplicación. Entra en vigor cuando la aplicación se implementa nuevamente.',
      apply: 'Aplicar y reiniciar',
      applied: 'Implementando nuevamente con las nuevas variables.',
      needs_one: 'Necesita la variable {{count}}',
      needs_other: 'Necesita variables {{count}}',
      missing: 'Falta {{count}}',
      bulk: {
        edit: 'Edición masiva',
        title: 'Variables de edición masiva',
        reviewTitle: 'Revisar cambios',
        description:
          'Pegue o edite líneas KEY=value, como en un archivo .env. Las líneas que comienzan con # se ignoran.',
        appHint:
          'Enumera los valores que esta aplicación establece. Los valores de su entorno y Secretos no se muestran: añada una línea para anular o reemplazar uno. Eliminar una línea borra ese valor.',
        environmentHint:
          'Enumera los valores de este entorno. Los secretos no se muestran: añada una línea para reemplazar uno. Eliminar una línea borra ese valor.',
        label: 'Variables (.env)',
        review: 'Revisar cambios',
        back: 'Volver',
        changes: 'Cambios',
        noChanges: 'El texto establece lo que ya está ahí.',
        nothing: 'Nada que guardar',
        unchanged_one: 'La variable {{count}} permanece como está.',
        unchanged_other: 'Las variables {{count}} permanecen como están.',
        save_one: 'Guardar {{count}} cambio',
        save_other: 'Guardar {{count}} cambios',
        saved_one: 'Cambio {{count}} guardado.',
        saved_other: 'Cambios de {{count}} guardados.',
        secretOf: '{{name}} es un secreto',
        failedTitle: 'Algunos cambios no fueron guardados',
        kinds: {
          add: 'Añadir',
          change: 'Cambiar',
          remove: 'Quitar',
        },
        problems: {
          syntax: 'Línea {{line}}: escribirla como CLAVE=valor.',
          name: 'Línea {{line}}: {{name}} no es un nombre válido. Utilice letras mayúsculas, dígitos y guiones bajos, comenzando con una letra.',
          reserved:
            'Línea {{line}}: {{name}} lo establece el tiempo de ejecución y no puede ser una variable.',
          duplicate:
            'Línea {{line}}: {{name}} ya está configurado en una línea anterior.',
          unterminated:
            'Línea {{line}}: la cotización alrededor del valor de {{name}} no está cerrada.',
        },
        unchanged_many: 'Las variables {{count}} permanecen como están.',
        save_many: 'Guardar {{count}} cambios',
        saved_many: 'Cambios de {{count}} guardados.',
      },
      missingIn_many: 'Falta en aplicaciones {{count}}',
      needs_many: 'Necesita variables {{count}}',
    },
    tabs: {
      label: 'Secciones de {{name}}',
      overview: 'Descripción general',
      deployments: 'Despliegues',
      variables: 'Variables',
      settings: 'Configuración',
    },
    overview: {
      currentRelease: 'Versión actual',
      recent: 'Implementaciones recientes',
      viewAll: 'Ver todo',
    },
    initialAdmin: {
      title: 'Primer administrador',
      kept: 'Generado para el primer despliegue; se conserva hasta que se elimina la aplicación.',
      username: 'Nombre de usuario',
      email: 'Correo electrónico',
      password: 'Contraseña',
      show: 'Mostrar contraseña',
      hide: 'Ocultar contraseña',
      copy: 'Copiar contraseña',
      copied: 'Contraseña copiada.',
      copyFailed:
        'No se pudo copiar la contraseña. Muéstrala y cópiala manualmente.',
      dismiss: 'Lo he guardado',
      dismissed:
        'El primer administrador fue eliminado del administrador de versiones.',
    },
    config: {
      title: 'Avanzado',
      description:
        'config.yml de la aplicación implementada; guardar recarga la aplicación. Prefiera variables para valores que difieran según el entorno y los secretos.',
      loadFailed: 'No se pudo cargar la configuración.',
      discard: 'Descartar cambios',
      save: 'Guardar y recargar',
      saved: 'Configuración guardada.',
      external:
        'Esta aplicación lee su configuración desde fuera de la administración de versiones, por lo que no hay ningún config.yml para editar aquí. Establezca valores que difieran según el entorno como variables.',
      externalTitle: 'No hay config.yml para editar',
      noFileTitle: 'Aún no hay config.yml',
      noFile:
        'config.yml se crea en la primera implementación. Hasta entonces, configura la aplicación con variables.',
      toVariables: 'Ir a variables',
      maskedHint:
        'Los valores secretos se muestran como {{mask}}. Deje la máscara en su lugar para conservar el valor almacenado o escriba un nuevo valor sobre ella.',
      secrets: 'Secretos',
      secretsHint:
        'Los valores almacenados nunca se muestran. Reemplace o borre uno aquí; entra en vigor cuando guardas.',
      newValue: 'Nuevo valor para {{path}}',
      replace: 'Reemplazar {{path}}',
      clear: 'Borrar {{path}}',
    },
    settings: {
      edit: 'Tiempo de ejecución y etiquetas',
      editShort: 'Editar',
      editDescription:
        'Cuándo se ejecuta la aplicación y cómo se etiqueta. Los cambios se aplican sin reiniciarlo.',
      save: 'Guardar',
      saved: 'Configuraciones guardadas.',
      danger: 'Eliminar aplicación',
      delete: 'Eliminar con sus datos',
      deleteDescription:
        'Elimina la aplicación, sus versiones, implementaciones y datos. Esto no se puede deshacer.',
      deleted: '{{name}} eliminado.',
      confirmDeleteTitle: '¿Eliminar {{name}}?',
      confirmDelete:
        'Esto elimina {{appId}} y todos sus datos. Escriba {{appId}} para confirmar.',
    },
    common: {
      retry: 'Reintentar',
      refresh: 'Actualizar',
      actions: 'Acciones',
      rowActions: 'Acciones para {{name}}',
    },
    errors: {
      requestFailed: 'La ​​solicitud falló.',
      reasons: {
        IMAGE_REQUIRED:
          'Este entorno ejecuta imágenes de publicación y la publicación no tiene ninguna imagen allí. Registre la imagen que su CI envió (`release image`) y luego impleméntela.',
        ARCHIVE_REQUIRED:
          'Este entorno ejecuta archivos de lanzamiento en proceso; sube el archivo (`release upload`).',
        IMAGE_CONFLICT:
          'El comunicado ya cuenta con otra imagen para esta plataforma; La imagen de un lanzamiento nunca cambia.',
        INVALID_IMAGE:
          'Esa no es una referencia de imagen con un resumen sha256.',
        REGISTRY_EXISTS: 'Ya existe un registro con este ID.',
        REGISTRY_IN_USE:
          'Los entornos se extraen de este registro; elija otro registro para ellos primero.',
        UNKNOWN_REGISTRY: 'Ese registro no existe.',
        INVALID_REGISTRY_URL:
          'Ingrese el origen del registro, como https://ghcr.io o localhost:5000.',
        INVALID_REGISTRY_NAMESPACE:
          'El espacio de nombres son componentes de ruta en minúsculas, como acme.',
        APP_EXISTS: 'Ya existe una aplicación con este ID.',
        APP_NOT_DEPLOYED: 'La aplicación aún no se ha implementado.',
        APP_NOT_FOUND: 'La aplicación no existe o es posible que no la veas.',
        APPROVAL_REQUIRED:
          'Este entorno está protegido: solicite la implementación en su lugar.',
        ARTIFACT_TOO_LARGE: 'El paquete de lanzamiento es demasiado grande.',
        BASE_PATH_MISMATCH: 'La versión se creó para una ruta base diferente.',
        CHECKSUM_MISMATCH:
          'El paquete no coincide con su suma de verificación.',
        CONFIG_NOT_EDITABLE:
          'La configuración de esta aplicación no se puede editar aquí.',
        CONFIG_SECRET_NOT_STORED:
          'Un valor enmascarado no tiene ningún secreto almacenado en su lugar. Escriba su valor en lugar de la máscara.',
        CONFIG_RELOAD_FAILED:
          'La configuración se guardó, pero la aplicación no pudo recargarla.',
        CONFIG_TOO_LARGE: 'La configuración es demasiado grande.',
        CONFIRMATION_REQUIRED: 'Escriba la ID de la aplicación para confirmar.',
        DEPLOYMENT_IN_PROGRESS: 'Ya se está implementando esta aplicación.',
        DEPLOYMENT_NOT_FOUND: 'La implementación no existe.',
        DRIVER_UNAVAILABLE: 'El controlador del entorno no está disponible.',
        ENVIRONMENT_DRIVER_FIXED:
          'El controlador de un entorno no se puede cambiar.',
        ENVIRONMENT_VARIANT_FIXED:
          'El modo de ejecución de un entorno no se puede cambiar; cree otro entorno en su lugar.',
        ENVIRONMENT_EXISTS: 'Ya existe un entorno con este ID.',
        ENVIRONMENT_FULL: 'El entorno ha llegado a su límite de aplicaciones.',
        ENVIRONMENT_IN_USE:
          'Las aplicaciones todavía están implementadas en este entorno.',
        ENVIRONMENT_NOT_FOUND: 'El entorno no existe.',
        FORBIDDEN: 'No tiene permiso para hacer esto.',
        IDEMPOTENCY_CONFLICT:
          'Se envió la misma solicitud con diferente contenido.',
        INVALID_ACTIVATION_POLICY: 'La política de activación no es válida.',
        INVALID_IDLE_STOP: 'La parada en ralentí no es válida.',
        INVALID_DORMANCY: 'El tiempo de hibernación no es válido.',
        INVALID_APP_ID:
          'Utilice letras, dígitos, guiones bajos y guiones para el ID de la aplicación, sin comenzar con "__" ni "nuevo".',
        INVALID_APPROVERS: 'Los aprobadores no son válidos.',
        INVALID_ARTIFACT_SIZE: 'El tamaño del paquete no es válido.',
        INVALID_ARTIFACT_VERSION: 'La versión de lanzamiento no es válida.',
        INVALID_ARTIFACT: 'El archivo no es un paquete de versión válido.',
        INVALID_CHECKSUM: 'La suma de verificación no es válida.',
        INVALID_CONFIG_FILE: 'La configuración no es YAML válida.',
        INVALID_CONFIG_MODE: 'El modo de configuración no es válido.',
        INVALID_CONFIG_SECRET: 'El cambio secreto no es válido.',
        INVALID_CONTENT_TYPE: 'Cargar un paquete .tar.gz.',
        INVALID_DEPLOYMENT_INPUT:
          'La solicitud de implementación no es válida.',
        INVALID_DRIVER: 'El controlador no es válido.',
        INVALID_ENVIRONMENT_CONFIG:
          'La configuración del entorno no es válida para su controlador.',
        INVALID_ENVIRONMENT_ID:
          'Utilice letras minúsculas, dígitos, guiones bajos y guiones para el ID del entorno.',
        INVALID_ENVIRONMENT_SETTINGS:
          'La ​​configuración del entorno no es válida.',
        INVALID_IDEMPOTENCY_KEY: 'La clave de solicitud no es válida.',
        INVALID_INPUT: 'Algunos campos de la solicitud no son válidos.',
        INVALID_LABELS:
          'Escriba etiquetas como clave=valor, separadas por comas.',
        INVALID_LOG_CURSOR: 'La posición del registro no es válida.',
        INVALID_LOG_ID: 'El registro no existe.',
        INVALID_NOTE: 'La nota es demasiado larga.',
        INVALID_PUBLIC_URL: 'El patrón público URL no es válido.',
        INVALID_REQUEST: 'La solicitud no es válida.',
        INVALID_ROLLBACK_TARGET: 'No se puede revertir esta implementación.',
        INVALID_SEARCH: 'La búsqueda no es válida.',
        INVALID_TICKET: 'El boleto no es válido.',
        RELEASE_EXISTS: 'Esta versión ya ha sido cargada.',
        RELEASE_NOT_FOUND: 'El comunicado no existe.',
        REQUEST_DECIDED: 'La solicitud ya ha sido resuelta.',
        REQUEST_NOT_FOUND: 'La solicitud no existe.',
        REQUEST_PENDING:
          'Una solicitud para esta aplicación ya está esperando aprobación.',
        RESTART_FAILED: 'No se pudo reiniciar la aplicación.',
        SESSION_REQUIRED: 'Inicie sesión nuevamente para continuar.',
        START_FAILED: 'No se pudo iniciar la aplicación.',
        STOP_FAILED: 'No se pudo detener la aplicación.',
        TICKET_DEPLOY_REFUSED: 'El ticket no permite esta implementación.',
        TICKET_FORBIDDEN: 'El ticket no permite esto.',
        UNSAFE_ARTIFACT: 'El paquete contiene rutas inseguras.',
        VARIABLES_MISSING:
          'Las variables requeridas no están configuradas: {{names}}. Configúrelos en las variables de la aplicación o de su entorno y luego impleméntelos nuevamente.',
        VARIABLE_RESERVED:
          'Este nombre lo establece el tiempo de ejecución y no puede ser una variable.',
        INVALID_VARIABLE_NAME:
          'El nombre de una variable consta de letras mayúsculas, dígitos y guiones bajos, que comienzan con una letra.',
        INVALID_VARIABLE_VALUE: 'El valor es demasiado largo.',
        VARIABLE_NOT_FOUND: 'La variable no está configurada.',
        INVALID_VARIABLES_MANIFEST:
          'El manifiesto de variables de la versión (dist/variables.json) no es válido.',
        INITIAL_ADMIN_UNAVAILABLE:
          'No hay un primer administrador para mostrar.',
      },
      messages: {
        hostExited:
          'El proceso de la aplicación se detuvo antes de que estuviera lista.',
        hostDisabled: 'El host de la aplicación está apagado.',
        hostShutDown: 'El host de la aplicación se cerró.',
        hostEntryMissing:
          'Falta el archivo de entrada del host de la aplicación.',
        cannotRestart: 'Este host no se puede reiniciar desde aquí.',
        selfDeploy:
          'El host no puede implementar la aplicación en la que se ejecuta.',
        noStatus: 'El host no informó cómo fue la implementación.',
        interrupted: 'La implementación fue interrumpida por un reinicio.',
        notReported: 'El tiempo de ejecución no informó la aplicación.',
        notRunning: 'La aplicación no se ejecuta después del reinicio.',
        deploymentNotReported:
          'El tiempo de ejecución no informó la implementación.',
        notReady: 'Aún no está listo; Inténtalo de nuevo en un momento.',
        checkTimeout: 'La prueba no finalizó en 20 segundos.',
        hostNoSettings:
          'El tiempo de ejecución local no requiere configuración de conexión.',
      },
      prefixed: {
        startFailed: 'Error al iniciar: {{detail}}',
        stopFailed: 'Fallo en la detención: {{detail}}',
        restartFailed: 'Error al reiniciar: {{detail}}',
        outcomeUnreadable: 'No se pudo leer el resultado: {{detail}}',
      },
    },
    confirm: {
      cancel: 'Cancelar',
      typeLabel: 'Escriba {{text}} para confirmar',
    },
    environments: {
      title: 'Implementar entornos',
      description:
        'Dónde se implementan las aplicaciones y quién puede implementarlas allí.',
      open: 'Abrir',
      loadOneFailed: 'No se pudo cargar el entorno.',
      settingsTitle: 'Configuración del entorno',
      readOnly: 'Puede ver la configuración de este entorno pero no cambiarla.',
      danger: 'Eliminar entorno',
      deleteDescription:
        'Elimina el entorno y sus variables. Las aplicaciones implementadas aquí deben eliminarse primero.',
      discard: 'Descartar cambios',
      anyone: 'Cualquier persona que pueda desplegar',
      unlimited: 'Sin límite',
      apps: 'Aplicaciones',
      appsDescription: 'Las aplicaciones implementadas en este entorno.',
      appsEmpty: 'Aún no se han implementado aplicaciones aquí.',
      sampleData: 'Cargar datos de muestra en la primera implementación',
      sampleDataHint:
        'La primera implementación de una aplicación aquí instala sus datos de muestra (APP_SAMPLE_DATA=true). Úselo para vistas previas, no para producción.',
      add: 'Añadir entorno',
      edit: 'Editar',
      delete: 'Eliminar',
      save: 'Guardar',
      cancel: 'Cancelar',
      check: 'Verificar',
      reachable: '{{name}} es accesible.',
      unreachable: '{{name}} no es accesible.',
      deleted: 'Entorno {{name}} eliminado.',
      saved: 'Entorno {{name}} guardado.',
      added: 'Se agregó el entorno {{name}}.',
      loadFailed: 'No se pudieron cargar los entornos.',
      emptyTitle: 'Aún no hay entornos',
      emptyNoAccess: 'Solicite a un administrador que añada un entorno.',
      emptyDescription: 'Añada un entorno para implementar aplicaciones.',
      editTitle: 'Editar {{name}}',
      formDescription:
        'Dónde se implementan las aplicaciones, cómo se llega a ellas y quién puede implementarlas allí.',
      configHint: 'La configuración del controlador, como un objeto JSON.',
      secretHint:
        'Almacenado cifrado y nunca más mostrado; dejar vacío para conservar.',
      invalidJson: 'Ingrese un objeto JSON, como {}.',
      protectedHint:
        'Cada implementación, realizada por una persona o por CI, espera a un aprobador, quien vuelve a escribir el ID de la aplicación para aprobarla.',
      approversColumn: 'Aprobadores',
      approversPlaceholder: 'Elegir aprobadores',
      approversHint:
        'Cualquiera de ellos podrá aprobar, incluidas sus propias solicitudes. Sin elegir ninguno, deciden las personas autorizadas a aprobar implementaciones protegidas.',
      confirmDelete: '¿Eliminar el entorno {{id}}?',
      id: 'ID de entorno',
      name: 'Nombre',
      driver: 'Conductor',
      runsOn: 'Se ejecuta en',
      appCount: 'Aplicaciones',
      purpose: 'Uso',
      purposeHint:
        'Cada entorno tiene un solo uso: vistas previas de pull requests o pruebas de versiones.',
      purposes: { preview: 'Vistas previas', test: 'Pruebas' },
      policy: 'Política',
      publicUrl: 'Patrón público URL',
      config: 'Configuración (JSON)',
      secret: 'Credenciales (JSON, solo escritura)',
      secretStored:
        'Las credenciales se almacenan; introduzca otros nuevos para reemplazarlos.',
      protected: 'Protegido',
      approvers: 'Aprobadores',
      pickDriver:
        'Elija cómo se ejecutan las aplicaciones en este entorno. Un entorno mantiene a su conductor.',
      next: 'Continuar',
      addWith: 'Añadir entorno {{driver}}',
      changeDriver: 'Cambiar',
      basics: 'Entorno',
      namePlaceholder: 'Puesta en escena',
      idHint:
        'Letras minúsculas, dígitos, guiones bajos y guiones; no se puede cambiar más tarde.',
      policyDescription: 'Quién puede desplegarse aquí.',
      appDefaults: 'Aplicaciones',
      appDefaultsDescription:
        'Como máximo, esta cantidad de aplicaciones, y cuando una aplicación creada sin su propia política de tiempo de ejecución se detiene y queda inactiva. Vacío: sin límite, nunca.',
      maxApps: 'La mayoría de las aplicaciones',
      defaultIdle: 'Detener después (minutos sin visita)',
      defaultDormant: 'Inactivo después (horas sin visitas)',
      noForm:
        'Sin formulario de configuración; los ajustes se introducen como JSON ({{kind}}).',
      imageSource: 'Publicar imágenes',
      imageSourceDescription:
        'Extraiga la imagen de cada versión de un registro mediante resumen, con sus credenciales de extracción, de modo que este entorno ejecute la misma imagen que CI impulsó y ejecutaron otros entornos.',
      registry: 'Registro',
      noRegistry: 'Ninguno: extraer imágenes públicas de forma anónima',
      newRegistry: 'Nuevo registro',
      editRegistry: 'Editar',
      cancelRegistryEdit: 'Cancelar edición',
      registryShared:
        'Los cambios se aplican a todos los entornos que extraen de este registro.',
    },
    registries: {
      check: 'Conexión de prueba',
      url: 'Dirección',
      urlHint:
        'Su origen, como https://ghcr.io;, se alcanza una dirección de host local a través de HTTP.',
      namespace: 'Espacio de nombres',
      namespaceHint:
        'Las imágenes de publicación de ruta se encuentran a continuación, como acme.',
      pull: 'Extraer credenciales',
      pullHint:
        'Para entornos que extraen de este registro; déjelos afuera donde permita extracciones anónimas.',
      username: 'Nombre de usuario',
      password: 'Contraseña o token',
      checkOk: 'Conectado',
      checkFailed: 'La ​​prueba de conexión falló.',
      checkFailedTitle: 'No se puede utilizar el registro',
      anonymous:
        'El registro responde sin credenciales: quien llegue puede tirar.',
      status: {
        ok: 'aceptado',
        failed: 'se negó',
        notSet: 'no establecido',
      },
    },
    artifacts: {
      title: 'Artefactos',
      tarball: 'Archivar',
      image: 'Imagen',
      ran: 'Corrió',
      ranTarball: 'Archivo, en proceso',
    },
    driverForm: {
      advanced: 'Configuración avanzada',
      advancedHint:
        'Los valores predeterminados se adaptan a la mayoría de los entornos; abre un grupo para cambiarlo.',
      on: 'En',
      off: 'Desactivado',
      noLimit: 'Sin límite',
      writeOnly: '(solo escritura)',
      secretSet: 'Establecer',
      secretCleared: 'Eliminado al guardar',
      replace: 'Reemplazar',
      clear: 'Quitar',
      undo: 'Deshacer',
      keepStored: 'Conserva el almacenado',
      jsonTitle: 'Configuración del controlador',
      jsonDescription:
        'Este controlador no tiene formulario de configuración; ingrese su configuración como JSON.',
      check: 'Conexión de prueba',
      checkOk: 'Conectado',
      checkFailed: 'La ​​prueba de conexión falló.',
      checkFailedTitle: 'No se pudo conectar',
      fixErrors:
        'Algunas configuraciones necesitan ser arregladas; están marcados arriba.',
      errors: {
        required: 'Obligatorio.',
        number: 'Ingrese un número.',
        integer: 'Ingrese un número entero.',
        range: 'Fuera del rango permitido.',
        mapLine: 'Escriba un NOMBRE=valor por línea.',
        mapName:
          'Los nombres son letras, dígitos y guiones bajos, que no comienzan con un dígito.',
      },
    },
    driverForms: {
      host: {
        description:
          'Ejecuta aplicaciones en este servidor: en el proceso secundario de App Host se inicia esta aplicación, o cada una en un contenedor Docker.',
        runtime: 'Modo de ejecución',
        backend: 'Modo de ejecución',
        backendInProcess: 'En proceso',
        backendInProcessHint:
          'Se ejecuta en el proceso secundario de App Host que inicia este servidor, compartido por todas esas aplicaciones. Adecuado para vistas previas.',
        backendDocker: 'Docker',
        backendDockerHint:
          'Un contenedor por aplicación, aislado entre sí. Adecuado para pruebas y producción.',
        dockerConnection: 'Conexión Docker',
        dockerConnectionDescription:
          'Utiliza el Docker en este servidor, que se encuentra en DOCKER_HOST o en el contexto actual Docker, con la configuración de contenedor recomendada. Pruebe la conexión para ver qué Docker encontró.',
        access: 'Dirección de acceso',
        publicUrl: 'Patrón público URL',
        publicUrlHint:
          'Donde las personas abren una aplicación, con {appId} en la ruta o el nombre del host; vacío utiliza la propia dirección del servidor.',
        check: {
          url: 'Dirección',
          apps: 'Aplicaciones en ejecución',
          endpoint: 'Docker',
          version: 'Versión Docker',
          platform: 'Plataforma',
          errors: {
            unsupported:
              'Solo se admite Docker en este servidor: DOCKER_HOST debe ser un socket unix:// o un proxy de socket tcp://.',
            socketMissing:
              'Allí no hay ningún conector Docker. ¿Docker está instalado y ejecutándose en este servidor?',
            permission:
              'Docker denegó el acceso. El usuario que ejecuta esta aplicación no puede utilizar el socket Docker.',
            refused:
              'Nada acepta conexiones en esa dirección. Compruebe que Docker se esté ejecutando.',
            timeout: 'Docker no respondió a tiempo.',
          },
        },
      },
    },
  },
  actions: {
    close: 'Cerrar',
  },
  status: {
    loading: 'Cargando',
  },
};

export default esES;
