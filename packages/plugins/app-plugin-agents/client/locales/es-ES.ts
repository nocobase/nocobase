import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  modelSuggestions: {
    design:
      'Razonamiento más potente: propuestas, arquitectura, investigaciones difíciles y revisión de cambios importantes; también implementación habitual y cambios entre paquetes.',
    large:
      'Implementaciones grandes, cambios entre paquetes, refactorización e implementación habitual; también propuestas, revisión de código y cambios pequeños.',
    review:
      'Revisión de código y análisis de fallos de CI; también propuestas e investigaciones difíciles.',
    routine:
      'Implementación habitual, pequeños arreglos, pruebas y textos; también análisis de fallos de CI.',
    small:
      'Cambios pequeños, ediciones mecánicas y pruebas, económicos y rápidos; también análisis de fallos de CI.',
    explanation: 'Comprender requisitos, explicar y redactar propuestas.',
  },
  goodAtTemplates: {
    fill: 'Rellenar desde plantilla',
    design: 'Diseño y revisión',
    large: 'Implementación grande',
    review: 'Revisión de código y CI',
    routine: 'Implementación habitual',
    small: 'Cambios pequeños',
    explanation: 'Explicaciones y propuestas',
    undo: 'Deshacer',
  },
  actions: {
    back: 'Volver',
    cancel: 'Cancelar',
    close: 'Cerrar',
    delete: 'Eliminar',
    edit: 'Editar',
    save: 'Guardar',
  },
  common: {
    refresh: 'Actualizar',
    cancel: 'Cancelar',
    copy: 'Copiar',
    copied: 'Copiado',
    save: 'Guardar',
    close: 'Cerrar',
    create: 'Crear',
    createNamed: 'Crear "{{name}}"',
    creating: 'Creando…',
    noOptions: 'Sin opciones',
    forbidden: 'No está permitido hacer esto.',
    loading: 'Cargando',
    notFound: 'Ya no existe.',
    requestFailed: 'La solicitud falló. Intentar otra vez.',
    retry: 'Reintentar',
    secretKept: 'Establecer: déjelo vacío para conservarlo',
  },
  status: {
    loading: 'Cargando',
  },
  unsavedChanges: {
    description: 'Lo que ingresó no ha sido enviado y se perderá.',
    discard: 'Descartar',
    keepEditing: 'Sigue editando',
    title: '¿Descartar cambios no guardados?',
  },
  errors: {
    boundRunnerIncompatible:
      'Este entorno no puede ejecutar el Agent seleccionado. Cambia de entorno para continuar.',
    CONFLICT: 'Entretanto cambió. Vuelva a cargar y vuelva a intentarlo.',
    REVISION_CONFLICT:
      'Entretanto cambió. Vuelva a cargar y vuelva a intentarlo.',
    FORBIDDEN: 'No está permitido hacer esto.',
    AGENT_NOT_FOUND: 'Ya no existe.',
    RUN_NOT_FOUND: 'Ya no existe.',
    SKILL_NOT_FOUND: 'Ya no existe.',
    SKILL_VERSION_NOT_FOUND: 'Ya no existe.',
    CONVERSATION_NOT_FOUND: 'Ya no existe.',
    RUNNER_NOT_FOUND: 'Ya no existe.',
    VARIABLE_NOT_FOUND: 'Ya no existe.',
    MODEL_SERVICE_NOT_FOUND: 'Ya no existe.',
    SCOPE_NOT_FOUND: 'Ya no existe.',
    INVALID_INPUT: 'Algunos valores no son válidos.',
    SECRETS_KEY_MISSING:
      'Las variables no se pueden guardar ni mostrar: el servidor no tiene clave secreta. Pídale a un administrador que configure secrets.keys en la configuración de la aplicación.',
  },
  command: {
    copy: 'Comando de copia',
    copied: 'Copiado',
    copyFailed:
      'No se pudo copiar. Seleccione el comando y cópielo usted mismo.',
  },
  tools: {
    claude: 'Claude Code',
    codex: 'Codex',
    opencode: 'OpenCode',
    pi: 'Pi',
    gemini: 'Gemini CLI',
    copilot: 'GitHub Copilot',
    cursor: 'Cursor',
    qwen: 'Qwen Code',
    kimi: 'Kimi CLI',
    codebuddy: 'CodeBuddy Code',
    qoder: 'Qoder CLI',
    goose: 'Goose',
    auggie: 'Auggie',
    droid: 'Factory Droid',
    kilo: 'Kilo Code',
    cline: 'Cline',
    amp: 'Amp',
    vibe: 'Mistral Vibe',
    dsh: 'DeepSeek Harness',
  },
  agents: {
    unavailableNow: 'No disponible ahora',
    title: 'Agentes',
    description:
      'Añade Agents a partir de los modelos que informan los entornos de ejecución. El Lead Agent encarga cada paso de una tarea al Agent cuya descripción encaja.',
    fromRunners: 'Agentes de entornos de ejecución',
    display: {
      search: 'Búsqueda de modelos o proveedores',
      select: 'Seleccione {{name}}',
      showDisabled: 'Mostrar deshabilitados',
      hideDisabled: 'Ocultar deshabilitados',
    },
    filterLabel: 'Mostrar Agents',
    filters: {
      all: 'Todos {{count}}',
      enabled: 'Habilitado {{count}}',
      unreported: 'Sin entorno de ejecución {{count}}',
    },
    loadFailed: 'No se pudieron cargar los Agents',
    loadMore: 'Cargar más',
    emptyTitle: 'Aún no hay Agents',
    emptyDescription:
      'Conecte un entorno de ejecución con una herramienta de codificación con la sesión iniciada y añada un Agent desde «Modelos disponibles».',
    noneInFilter: 'Ningún Agent aquí.',
    howToAdd:
      'Para añadir un Agent, instala una herramienta de programación en un entorno de ejecución e inicia sesión en un modelo que puedas usar: cuando el entorno lo informe, añádelo desde Modelos disponibles escribiendo en qué es bueno. Un Agent que solo tienen entornos personales trabaja solo en tareas que inician sus propietarios.',
    goodAtMissing: 'Aún no escrito',
    columns: {
      agent: 'Agente',
      goodAt: 'Bueno en',
      where: 'Donde corre',
      effort: 'Esfuerzo de razonamiento',
      state: 'Estado',
    },
    where: {
      none: 'Ningún entorno de ejecución',
      team_one: '{{count}} entorno de ejecución del equipo',
      team_other: '{{count}} entornos de ejecución del equipo',
      personal_one: '{{count}} entorno de ejecución personal en línea',
      personal_other: '{{count}} entornos de ejecución personales en línea',
      both: 'Equipo {{team}} · Personal {{personal}}',
      names: '{{names}}',
      noneOnline: 'Ningún entorno de ejecución en línea ahora',
      personalOnly: 'Solo entornos de ejecución personales',
      lastReported: 'Último reportado {{when}}',
      team_many: '{{count}} entornos de ejecución del equipo',
      personal_many: '{{count}} entornos de ejecución personales en línea',
    },
    state: {
      enabled: 'Habilitado',
      disabled: 'Deshabilitado',
      unreported: 'Ningún entorno de ejecución',
    },
    effort: {
      default: 'Valor predeterminado de la herramienta',
      off: 'Desactivado',
      minimal: 'Mínimo',
      low: 'Bajo',
      medium: 'Medio',
      high: 'Alto',
      xhigh: 'Extra alto',
      max: 'Máximo',
      ultra: 'Ultra',
    },
    enable: {
      reportedBy_one:
        'Reportado por el entorno de ejecución {{count}} en línea: {{names}}.',
      reportedBy_other:
        'Reportado por entornos de ejecución {{count}} en línea: {{names}}.',
      noRunnerNow:
        'Ningún entorno de ejecución que lo tenga está en línea ahora.',
      goodAtHint:
        'El Lead Agent decide qué entregarle a este Agent con estas palabras. Di lo que conviene y lo que no.',
      goodAtRequired: 'Escriba en qué es bueno antes de habilitarlo.',
      effortHint: 'El Lead Agent no puede cambiarlo cuando entrega el trabajo.',
      personalOnly:
        'Solo lo tienen entornos personales: el Lead Agent le encarga trabajo solo en tareas que inician sus propietarios.',
      reportedBy_many:
        'Reportado por entornos de ejecución {{count}} en línea: {{names}}.',
    },
    edit: {
      button: 'Editar',
      buttonFor: 'Editar {{name}}',
      title: 'Editar {{name}}',
      enabled: 'Habilitado',
      done: '{{name}} guardado',
    },
    available: {
      open: 'Añadir Agent',
      title: 'Modelos disponibles',
      description:
        'Solo las herramientas marcadas en el entorno de ejecución se detectan y aparecen aquí. Las combinaciones recomendadas por la aplicación se crean y habilitan solas en cuanto un entorno de ejecución las reporta; añada un Agent a partir de cualquier otra.',
      recommended: 'Se habilita automáticamente al reportarse',
      added: 'Añadido',
      add: 'Añadir',
      status: {
        available: 'Disponible',
        needsSetup: 'Requiere configuración',
        versionTooOld: 'Versión demasiado antigua',
        failed: 'Detección fallida',
      },
      details: 'Detalles de la herramienta',
      setupCommand: 'Ejecute {{command}} en el entorno de ejecución.',
      setupUnknown:
        'Esta herramienta necesita configuración, pero no conocemos el comando para ello.',
      upgradeAdvice:
        'Actualiza la herramienta y su adaptador ACP a las últimas versiones en el entorno y vuelve a detectar.',
      minimumVersionUnknown:
        'Se desconoce la versión mínima compatible de la herramienta. Consulte su documentación de compatibilidad.',
      noDetail: 'La herramienta no dio más detalles.',
      showMore: 'Mostrar más',
      showLess: 'Mostrar menos',
      groupSearchPlaceholder: 'Buscar los modelos de esta herramienta',
      group_one: '{{tool}} · {{count}} modelo · {{runners}}',
      group_other: '{{tool}} · {{count}} modelos · {{runners}}',
      group_many: '{{tool}} · {{count}} modelos · {{runners}}',
      runners_one: '{{count}} entorno de ejecución',
      runners_other: '{{count}} entornos de ejecución',
      runners_many: '{{count}} entornos de ejecución',
      noModels: 'No hay ningún modelo aquí.',
      selectedCount_one: '{{count}} seleccionado',
      selectedCount_other: '{{count}} seleccionados',
      selectedCount_many: '{{count}} seleccionados',
      addSelected: 'Añadir {{count}}',
      confirmTitle_one: 'Añadir {{count}} Agent',
      confirmTitle_other: 'Añadir {{count}} Agents',
      confirmTitle_many: 'Añadir {{count}} agentes',
      confirmAction_one: 'Añadir {{count}}',
      confirmAction_other: 'Añadir {{count}}',
      confirmAction_many: 'Añadir {{count}}',
      goodAtNeeded: '¿En qué es bueno?',
      addedCount_one: 'Se añadió {{count}} Agent.',
      addedCount_other: 'Se añadieron {{count}} Agents.',
      addedCount_many: 'Se añadieron {{count}} agentes.',
      addedPartial:
        'Se añadieron {{succeeded}}; {{failed}} no se pudieron añadir. El motivo está debajo de cada uno.',
      addFailed:
        '{{failed}} no se pudieron añadir. El motivo está debajo de cada uno; inténtelo de nuevo.',
    },
  },
  agentTypes: {
    label: 'Tipo de agente',
    question: '¿Qué tipo de Agent?',
    online: 'En línea',
    runner: 'Ejecutor',
    onlineHint:
      'Respuestas en segundos en el servidor a través de un servicio modelo. No se necesita entorno de ejecución; no puede tocar el código.',
    runnerHint:
      'Controla una herramienta de codificación en entorno de ejecución y funciona en un directorio de trabajo: código, archivos, comandos.',
    immutable: 'Un Agent mantiene su tipo; crear otro Agent para el otro tipo.',
    onServer: 'En el servidor',
    filterAll: 'Todos los tipos',
    noneOfType: 'Ningún Agent de este tipo.',
  },
  agentSkills: {
    title: 'Habilidades',
    description:
      'Manuales que el Agent lee cuando una tarea coincide con su descripción. Colocado en su directorio de trabajo antes de cada ejecución.',
    manage: 'Administrar habilidades',
    placeholder: 'Seleccionar habilidades',
    empty: 'Aún no tengo habilidades.',
    save: 'Guardar habilidades',
    descriptionOnline:
      'Manuales que el Agent lee cuando una tarea coincide con su descripción, en un entorno limitado de solo lectura en el servidor.',
    onlineScripts:
      'Los scripts no se ejecutan para los Agents en línea: el Agent puede leerlos, no ejecutarlos.',
    skippedScripts: ': {{paths}}',
    pathSeparator: ', ',
  },
  brief: {
    preview: 'Vista previa del mensaje completo',
    previewTitle: 'Vista previa del mensaje completo',
    previewDescription:
      '¡Menuda tirada de este Agent se enviaría ahora, sobre un tema inventado! No hay nada en cola.',
    scenario: 'Escenario',
    sample:
      'Sobre un tema inventado: {{subject}}. Los valores marcados [muestra] están compuestos.',
    previewFailed: 'No se pudo representar el mensaje completo.',
    system: 'Aviso del sistema',
    showAs: 'Mostrar como',
    rendered: 'Renderizado',
    raw: 'Sin procesar',
    platform:
      'Reglas y tareas de la plataforma · sobre caracteres {{size}} (inglés)',
    platformNote:
      'Las reglas de la plataforma se envían en inglés; el Agent aún responde en su idioma.',
    agentPrompt: 'Aviso del agente (escrito por usted)',
    noAgentPrompt: 'Este Agent no tiene aviso propio.',
    firstMessage: 'Primer mensaje',
    empty: 'Vacío',
    previewPlaceholders:
      'Las notas entre corchetes sobre el entorno de ejecución son completadas por el entorno de ejecución que lo ejecuta: sus directorios de trabajo y las indicaciones de inicialización de los directorios que acaba de preparar.',
    placeholders:
      'Los marcadores de posición {{runner.…}} son completados por el entorno de ejecución que lo ejecuta: sus directorios de trabajo y las indicaciones de inicialización de los directorios que acaba de preparar.',
    layers: {
      system: 'Reglas',
      task: 'Tarea',
      context: 'Contexto',
      agent: 'Mensaje del agente',
      turn: 'Primer turno',
    },
  },
  envVars: {
    title: 'Variables de entorno',
    description:
      'Pasado a la herramienta de codificación en cada ejecución y enmascarado en los registros de ejecución; Los valores no se muestran nuevamente después de guardarlos. Cualquiera que utilice un Agent compartido puede recibir estos valores en su propia computadora; marque los secretos de alto riesgo como "Solo entornos de ejecución de equipo".',
    add: 'Añadir variable',
    addTitle: 'Añadir variable de entorno',
    editTitle: 'Reemplazar {{name}}',
    writeOnly: 'El valor se almacena cifrado y reemplaza el valor anterior.',
    name: 'Nombre',
    nameHint: 'Letras mayúsculas, dígitos y guiones bajos.',
    value: 'Valor',
    valueTooLong: 'El valor es mayor que 8 KB.',
    keepValueHint: 'Déjelo vacío para mantener el valor actual.',
    teamRunnersOnly: 'Solo entornos de ejecución en equipo',
    teamRunnersOnlyHint:
      'Sin él, una ejecución envía el valor al entorno de ejecución que lo toma, incluido el entorno de ejecución personal de cualquiera que pueda usar el Agent. Con él, solo el entorno de ejecución del equipo realiza ejecuciones que obtienen esta variable.',
    teamRunnersOnlyBadge: 'Solo entornos de ejecución en equipo',
    fromRunner: 'Tomar del entorno de ejecución',
    fromRunnerHint:
      'Aquí no se guarda ningún valor: el entorno de ejecución que realiza una ejecución lo proporciona desde su propia máquina, configurado allí con {{command}} o pasado con `--pass-env`. Un entorno de ejecución que no lo proporciona falla en la ejecución antes de comenzar.',
    fromRunnerBadge: 'Desde el entorno de ejecución',
    valueRequired:
      'Ingrese un valor o continúe tomándolo del entorno de ejecución.',
    empty: 'Sin variables de entorno.',
    scope: 'Ámbito',
    updated: 'Actualizado',
    actionsHead: 'Acciones',
    edit: 'Reemplazar valor',
    actions: 'Acciones para {{name}}',
    accessLog: 'Registro de acceso',
    accessLogAll: 'Ver el registro de acceso completo',
    accessLogOf: 'Registro de acceso de {{name}}',
    accessLogDescription:
      'Quién vio, configuró o eliminó las variables y cuándo, y qué ejecuciones las recibieron.',
    delete: 'Eliminar',
    deleteTitle: '¿Eliminar {{name}}?',
    deleteDescription:
      'Las ejecuciones posteriores a esto ya no reciben la variable.',
    deleteConfirm: 'Eliminar',
    deleted: 'Eliminado {{name}}.',
    saved: 'Guardado {{name}}.',
    updatedBy: '{{name}} · {{time}}',
    reveal: 'Revelar valores',
    revealTitle: '¿Revelar los valores?',
    revealAudit:
      'La revelación queda registrada en el registro de acceso con su nombre y la hora.',
    revealedTitle: 'Valores variables',
    revealedNote:
      'Esta revelación quedó registrada. Ciérralo cuando hayas terminado.',
    runner: 'Tiempo de ejecución {{id}}',
    auditsEmpty: 'Aún no se ha registrado nada.',
    auditAction: {
      reveal: 'revelado',
      set: 'establecido',
      delete: 'eliminado',
      deliver: 'recibido para una ejecución',
    },
    nameProblems: {
      required: 'Ingrese un nombre.',
      pattern:
        'Utilice únicamente letras mayúsculas, dígitos y guiones bajos, sin comenzar con un dígito.',
      reserved: 'Este nombre está reservado.',
      duplicate: 'Existe una variable con este nombre; edítelo en su lugar.',
    },
  },
  scopeVariables: {
    title: 'Variables y secretos',
    description:
      'Entregado a todos los Agents que trabajan aquí. Las variables más específicas (las del directorio de trabajo y luego las del Agent) las superan.',
  },
  scopes: {
    workdir: 'Directorio de trabajo',
  },
  subjects: {
    conversation: 'Conversación',
    consultation: 'Consulta',
  },
  usage: {
    otherUse: {
      title: 'Otro uso del modelo',
      description:
        'Llamadas a modelos fuera de las ejecuciones del Agent, como indexación y búsqueda en la base de conocimientos.',
      purpose: 'Uso',
      source: 'Preguntado por',
      model: 'Modelo',
      calls: 'Llamadas',
      units: 'Artículos',
      purposes: {
        embedding: 'Incrustaciones',
        rerank: 'Reclasificación',
        text: 'Texto de utilidad',
      },
    },
    title: 'Uso',
    description:
      'Qué Agents se utilizan y cuánto cuestan a los precios del modelo actual.',
    loadFailed: 'No se pudo cargar el uso',
    groupBy: 'Agrupar por',
    groupByValue: 'Grupo por {{group}}',
    empty: 'No se han realizado ejecuciones en este período.',
    total: 'Total',
    noGroup: 'Ninguno',
    unknown: 'Desconocido',
    onlineTool: 'En línea (servicios de modelo)',
    setPrices: 'Configurar precios',
    chart: {
      title: 'Tendencia diaria',
      metric: 'Mostrar',
      cost: 'Costo',
      tokens: 'Fichas',
      total: 'Total',
      other: 'Otro',
    },
    pricedNote:
      'El costo cubre {{priced}} de las ejecuciones {{total}}; Estos modelos aún no tienen precio: {{models}}.',
    filters: {
      allGroups: 'Todos: {{group}}',
      agent: 'Agente',
      allAgents: 'Todos los Agents',
      person: 'Despertado por',
      allPeople: 'Todos',
      range: 'Rango de fechas',
      presets: 'Rangos rápidos',
    },
    presets: {
      last7: 'Últimos 7 días',
      last30: 'Últimos 30 días',
      thisMonth: 'Este mes',
      lastMonth: 'El mes pasado',
      last90: 'Últimos 90 días',
    },
    groups: {
      agent: 'Agente',
      person: 'Despertado por',
      group: 'Grupo',
      subject: 'Asunto',
      day: 'Día',
      model: 'Modelo',
      tool: 'Herramienta de codificación',
      type: 'Tipo de agente',
    },
    columns: {
      runs: 'Ejecuciones',
      duration: 'Duración',
      input: 'Entrada',
      output: 'Salida',
      cacheRead: 'Lectura de caché',
      cacheWrite: 'Escritura en caché',
      cost: 'Costo estimado',
    },
  },
  defaultSkills: {
    title: 'Habilidades predeterminadas',
    description:
      'Todos los Agents que trabajan aquí también adquieren estas habilidades.',
    save: 'Guardar habilidades',
    saved: 'Habilidades predeterminadas guardadas.',
  },
  runs: {
    title: 'Registro de ejecución',
    empty: 'Aún no hay ejecuciones.',
    loadFailed: 'No se puede cargar el registro de ejecución',
    unknownAgent: 'Agente',
    attempt: 'intento {{attempt}} de {{max}}',
    viewTranscript: 'Ver transcripción',
    transcriptTitle: 'Transcripción de la ejecución',
    viewAll: 'Ver todo {{count}}',
    allTitle: 'Todas las ejecuciones ({{count}})',
    filters: {
      agent: 'Agente',
      status: 'Estado',
      allAgents: 'Todos los Agents',
      allStatuses: 'Todos los estados',
    },
    noMatch: 'Ninguna ejecución coincide con estos filtros.',
    cancel: 'Detener',
    stopping: 'Deteniendo…',
    cancelTitle: '¿Detener esta ejecución?',
    cancelDescription: 'Se detendrá {{name}}. Lo que ya cambió se queda.',
    cancelRequested: 'Parada solicitada',
    retry: 'Reintentar',
    retried: 'Ejecución puesta de nuevo en cola',
    viewBrief: 'Ver aviso completo',
    briefTitle: 'Mensaje completo',
    briefDescription:
      'Lo que se le dijo al Agent la última vez que se reclamó esta ejecución.',
    briefOf: 'Intento {{attempt}}, reivindicado {{time}}',
    briefUnavailable:
      'No hay ningún mensaje completo disponible para esta ejecución.',
    processDataCleared:
      'Los datos del proceso de ejecución se borraron según la política de retención.',
    briefFailed: 'No se pudo cargar el mensaje completo',
    workspaceReset: {
      button: 'Limpiar directorio de trabajo',
      title: '¿Limpiar el directorio de trabajo?',
      description:
        'La siguiente ejecución comienza desde una nueva verificación y recibe nuevamente las indicaciones de inicialización. Los cambios que no se implementaron se pierden en ese entorno de ejecución. Un directorio utilizado en su lugar nunca se elimina.',
      confirm: 'Limpiar',
      done: 'La siguiente ejecución comienza desde una nueva compra.',
    },
    stateChanged:
      'La ejecución cambió de estado. El registro ha sido actualizado.',
    status: {
      queued: 'En cola',
      dispatched: 'Despachado',
      running: 'En ejecución',
      completed: 'Turno finalizado',
      failed: 'Falló',
      cancelled: 'Cancelado',
      cancelling: 'Deteniendo',
    },
    trigger: {
      retry: 'Reintentar',
      message: 'Mensaje',
      consultation: 'Consulta',
    },
    activity: {
      queued: '{{name}} estaba en cola',
      dispatched: '{{name}} está iniciando',
      running: '{{name}} comenzó a funcionar',
      completed: '{{name}} finalizó su turno',
      failed: 'Error en {{name}}',
      cancelled: '{{name}} fue detenido',
    },
    live: {
      working: '{{name}} está funcionando',
      workingFor: '{{name}} está funcionando · {{minutes}} mín.',
      queued: '{{name}} está en cola',
    },
  },
  transcript: {
    title: 'Transcripción de la ejecución',
    notFound: 'Esta ejecución no existe.',
    waiting: 'Esperando que el Agent inicie…',
    empty: 'Esta ejecución no registró eventos.',
    fetchFailed: 'No se pueden recuperar nuevos eventos. Reintentando…',
    expand: 'Mostrar todo',
    truncated:
      'Brevemente: el texto completo era demasiado largo para conservarlo.',
    summary_one: 'Creado {{created}} · Evento {{count}}',
    summary_other: 'Eventos {{created}} · {{count}} creados',
    took: 'tomó {{duration}}',
    pendingInputs_one: 'Comentario {{count}} esperando al Agent',
    pendingInputs_other: 'Comentarios de {{count}} esperando al Agent',
    inputDelivered_one: 'Entregado al Agent',
    inputDelivered_other: 'Entradas {{count}} entregadas al Agent',
    tokens: 'Tokens {{input}} adentro, {{output}} afuera',
    kinds: {
      text: 'Agente',
      thinking: 'Pensando',
      toolUse: 'Herramienta',
      toolResult: 'Resultado',
      allowed: 'Permitido',
      denied: 'Denegado',
      input: 'Entrada',
      checkout: 'Pagar',
      status: 'Estado',
      error: 'Error',
      usage: 'Uso',
    },
    summary_many: 'Eventos {{created}} · {{count}} creados',
    pendingInputs_many: 'Comentarios de {{count}} esperando al agente',
    inputDelivered_many: 'Entradas {{count}} entregadas al agente',
  },
  failures: {
    runnerUpgrade:
      'Interrumpido por actualización de la máquina de ejecución; la carrera continuará.',
    runnerDiskFull: 'La máquina de ejecución se quedó sin espacio en disco.',
    runnerOfflineBeforeStart:
      'El entorno de ejecución se desconectó antes de iniciar la ejecución.',
    runnerOffline: 'El entorno de ejecución se desconectó.',
    leaseExpired: 'El entorno de ejecución dejó de informar.',
    startTimeout: 'El entorno de ejecución no inició la ejecución a tiempo.',
    cancelled: 'Cancelado.',
    idleTimeout: 'El Agent dejó de avanzar.',
    setupFailed: 'No se pudo preparar la ejecución.',
    cliUnavailable:
      'El entorno de ejecución no pudo instalar la CLI de la aplicación.',
    workspaceBusy:
      'El directorio de trabajo está ocupado; esperando otro intento.',
    checkoutFailed: 'Falló la verificación del repositorio.',
    toolAuth:
      'La herramienta de codificación no está registrada en el entorno de ejecución.',
    toolQuota: 'La herramienta de codificación se quedó sin cuota.',
    sessionUnavailable:
      'No se pudo reanudar la sesión original de la herramienta de programación.',
    toolRateLimit:
      'La herramienta de codificación tenía una velocidad limitada.',
    toolNetwork: 'La herramienta de codificación no pudo alcanzar su servicio.',
    toolProcess: 'La herramienta de codificación se cerró inesperadamente.',
    contextOverflow: 'La conversación se hizo demasiado larga para la modelo.',
    delegatedQueueTimeout: 'Tiempo de espera de cola de delegación; retirado',
    queuedExpired: 'Ningún entorno de ejecución tomó la ejecución a tiempo.',
    modelUnavailable: 'El modelo del Agent no está disponible.',
    stepLimit:
      'El Agent llamó a las herramientas demasiadas veces sin responder.',
    policyRefused:
      'Ninguna política de entorno de ejecución le permite realizar este trabajo.',
    prepareNetwork:
      'El entorno de ejecución no pudo alcanzar el host del repositorio mientras preparaba la ejecución.',
    repoAccessUnavailable:
      'El acceso al repositorio no está disponible temporalmente.',
    repoAccessDenied:
      'La aplicación no emitirá una credencial para uno de los repositorios de la ejecución.',
    unknown: 'La ejecución falló.',
  },
  runtimes: {
    pathHint:
      'El runner busca las herramientas de programación con su propio PATH. En un terminal donde funcione which codex / which claude, vuelve a ejecutar nocobase-runner service install y reinicia el servicio (o vuelve a ejecutar nocobase-runner start) para que obtenga el PATH correcto.',
    quota: {
      ceilingReached: 'Umbral de cuota alcanzado',
      ceilingLabel: 'Pausar al',
      ceilingInput: 'Pausar nuevos trabajos de {{tool}} al porcentaje usado',
      ceilingSave: 'Aplicar',
      ceilingInvalid:
        'Introduce un porcentaje entero entre 1 y 100 o déjalo vacío.',
      ceilingPaused:
        'Una ventana alcanzó el límite; el nuevo trabajo afectado espera al reinicio o a un cambio del límite.',

      workspaceStatus: {
        active: 'El trabajo continúa',
        ended: 'Finalizado · limpieza permitida',
        checks: 'Finalizado · cheques pendientes',
        inUse: 'Retenido: en uso',
        changed: 'Retenido: reutilizado',
        trackedChanges: 'Retenido: archivos no confirmados',
        unpushed: 'Retenido: trabajo no enviado',
        missingEvidence: 'Retenido: se necesita verificación',
        gitFailed: 'Retenido: Falló la verificación de Git',
        runNotFound: 'Retenido: ejecución no encontrada',
        ownershipUnknown: 'Retenido: propietario no verificado',
        ambiguousSubject: 'Retenido: tarea ambigua',
        bindingUnavailable: 'Retenido: enlace no disponible',
        subjectUnknown: 'Retenido: tarea desconocida',
        unknown: 'Retenido: no verificado',
      },
      usageLimit: 'Límite de uso',
      shortReset: 'restablece {{time}}',
      shortUnknown: 'restablecer desconocido',
      automatic: 'Se borra solo durante el reinicio.',
      since: 'desde {{time}}',
      marks_one: 'Marca de cuota {{count}}',
      marks_other: 'Marcas de cuota {{count}}',
      queueHint:
        'Aún se puede seleccionar un Agent con cuota. El trabajo se pondrá en cola con la fecha límite de espera existente.',
      partial: 'Se ejecuta en {{available}} · {{blocked}} en cuota',
      workspaceSize: 'Tamaño del espacio de trabajo: {{value}}',
      providers_one: 'Proveedor {{count}} en cuota',
      providers_other: 'Proveedores {{count}} en cuota',
      models_one: '{{count}} modelo sin cuota',
      models_other: '{{count}} modelos sin cuota',
      models_many: '{{count}} modelos sin cuota',
      percent: '{{percent}}%',
      runColumns: {
        issue: 'Tarea / conversación',
        agent: 'Agente',
        status: 'Estado',
        started: 'Iniciado',
        duration: 'Duración',
      },
      filter: {
        all: 'Todo',
        active: 'Activo',
        retained: 'Retenido',
        ended: 'Finalizado',
      },
      columns: {
        directory: 'Directorio / tarea',
        type: 'Tipo',
        size: 'Tamaño',
        push: 'Estado de empuje',
        status: 'Estado',
        lastUsed: 'Último usado',
      },
      previous: 'Anterior',
      next: 'Siguiente',
      working: 'Trabajando',
      readOnly: 'Copia de solo lectura',
      clean: 'Limpiar',
      unpushed: 'Sin empujar',
      overview: 'Descripción general',
      workspaces: 'Espacios de trabajo',
      runs: 'Ejecuciones',
      title: 'Cuota',
      reached: 'Cuota alcanzada',
      unknown: 'Tiempo de reinicio desconocido',
      resets: 'Restablece {{time}}',
      near: 'Cerca del límite',
      clear: 'Borrar',
      clearMark: 'Borrar marca',
      confirmTitle: '¿Borrar la marca de cuota de {{target}}?',
      confirm:
        'Bórrela solo después de confirmar que la cuota se ha restablecido. {{target}} vuelve a recibir trabajo de inmediato; si la cuota sigue agotada, la siguiente ejecución la marca de nuevo.',
      observed: 'Último reportado {{time}}',
      usedPercent: '{{percent}}% usado',
      noUsage: 'Aún no hay datos de cuota',
      hint: 'Una marca se borra sola a la hora de reinicio conocida o cuando la herramienta vuelve a informar cuota disponible. Bórrela a mano solo después de confirmar que la cuota se ha restablecido. Sólo el propietario y los administradores del entorno de ejecución pueden borrar las marcas.',
      marks_many: 'Marcas de cuota {{count}}',
      providers_many: 'Proveedores {{count}} en cuota',
    },
    workspaces: {
      paused:
        'El nuevo trabajo se pausa hasta que se recupere espacio en el disco. Las carreras existentes continúan.',
      working: 'Tipo: Directorio de trabajo',
      readOnly: 'Tipo: Copia de sólo lectura',
      size: 'Tamaño: {{value}}',
      pushed: 'Estado de empuje: limpio, sin trabajo sin empujar',
      unpushed:
        'Estado de envío: Trabajo no confirmado, no enviado o no verificado',
      notApplicable: 'Estado de inserción: No aplicable',
      title: 'Diagnóstico del espacio de trabajo',
      low: 'Poco espacio en disco',
      previousLow: 'Último informe: poco espacio en disco',
      notReported:
        'Aún no se ha recibido ningún informe del espacio de trabajo',
      diskUnknown: 'No se pudo medir el espacio en disco',
      thresholdOff:
        'No se configuró ninguna advertencia de espacio libre mínimo',
      free: 'Espacio libre: {{value}}',
      threshold: 'Espacio libre mínimo: {{value}}',
      reportedAt: 'Último informe: {{time}}',
      stale:
        'Estas son lecturas anteriores; El espacio en disco actual no está confirmado.',
      empty: 'No hay directorios de trabajo en el último informe',
      ended: 'Finalizado',
      active: 'El trabajo continúa',
      unknown: 'No se puede confirmar si el trabajo finalizó',
      oldRunner:
        'Este entorno de ejecución no ha proporcionado razones de diagnóstico',
      noCleanup: 'No se ha recibido el resultado de la limpieza local',
      discardsUntracked: 'La limpieza descartará los archivos sin seguimiento',
      decision: {
        settled:
          'Trabajo finalizado; Se requieren controles de limpieza locales.',
        active: 'El trabajo continúa',
        runNotFound: 'No se puede confirmar: ejecución no encontrada',
        ownershipUnknown:
          'No se puede confirmar: no se pudo verificar la propiedad del entorno de ejecución',
        ambiguousSubject: 'No se puede confirmar: clave de asunto ambigua',
        bindingUnavailable:
          'No se puede confirmar: la aplicación no tiene enlace de espacio de trabajo',
        subjectUnknown:
          'No se puede confirmar: la aplicación no pudo resolver el tema',
      },
      cleanup: {
        allowed: 'Terminado; limpieza permitida',
        inUse: 'Retenido: el directorio está en uso',
        changed: 'Retenido: el directorio ha sido reutilizado',
        trackedChanges:
          'Retenido: los archivos rastreados tienen cambios no confirmados',
        unpushed:
          'Retenido: confirmaciones no enviadas u objetos de confirmación locales insuficientes',
        missingEvidence: 'Retenido: evidencia de confirmación insuficiente',
        gitFailed: 'Retenido: Falló la verificación de Git',
      },
    },
    title: 'Entornos de ejecución',
    description:
      'Los entornos de ejecución que ejecutan los Agents y las herramientas de codificación que cada uno reportó.',
    add: 'Añadir entorno de ejecución',
    loadFailed: 'No se pudieron cargar los entornos de ejecución',
    emptyTitle: 'Aún no hay entornos de ejecución conectados',
    emptyDescription:
      'Una vez que se conecta un entorno de ejecución, los Agents entornos de ejecución asumen el trabajo allí con sus herramientas de codificación.',
    noneConnected: 'No hay ningún entorno de ejecución conectado.',
    revokedList_one: '{{count}} revocó el entorno de ejecución',
    revokedList_other: '{{count}} revocó entornos de ejecución',
    lastSeen: 'Visto por última vez {{time}}',
    activity: {
      online: 'En línea {{active}}/{{slots}}',
      busy: 'Ocupado {{active}}/{{slots}}',
      low_disk: 'Poco espacio en disco {{active}}/{{slots}}',
      offline: 'Sin conexión · {{time}}',
      offlineNever: 'Sin conexión',
    },
    toolUsage: {
      label: 'Se ejecuta mediante herramienta de codificación',
      item: '{{tool}} {{used}}/{{limit}}',
    },
    toolSlots: {
      label: 'Límites por herramienta de codificación',
      hint: 'Cuántas ejecuciones de cada herramienta de codificación se necesitan a la vez, como menos para una herramienta cuya suscripción permite menos sesiones. Deje uno vacío para limitarlo únicamente a las ejecuciones simultáneas.',
      none: 'Sin límite',
      invalid: 'Ingrese números enteros del 1 al 64, o déjelos vacíos.',
      inputLabel: 'Ejecuciones de {{tool}} a la vez',
      overTotal:
        'El límite de {{tools}} está por encima del máximo de ejecuciones simultáneas ({{slots}}): como máximo, {{slots}} se ejecuta a la vez.',
      noneChecked:
        'Marque una herramienta de codificación arriba para limitarla.',
    },
    toolTable: {
      tool: 'Herramienta',
      enabled: 'En',
      state: 'Estado',
      limit: 'De inmediato',
      active: 'En ejecución',
    },
    policy: {
      title: 'Política local',
      description:
        'Lo que el propietario del entorno de ejecución le permite tomar, según informó. Se cambia en la máquina, no aquí.',
      none: 'No hay política local: acepta cualquier trabajo para el que esté registrado.',
      any: 'Cualquiera',
      nothing: 'Ninguno',
      agents: 'Agentes',
      subjects: 'Sujetos',
      repos: 'Repositorios',
    },
    variables: {
      title: 'Variables de esta máquina',
      description:
        'Las variables que proporciona a las ejecuciones que las toman del entorno de ejecución, por nombre; Los valores permanecen en la máquina. Configure uno allí con `nocobase-runner env set NAME` o páselo con `--pass-env NAME`.',
      none: 'Ninguno: una ejecución que toma una variable del entorno de ejecución falla aquí antes de comenzar.',
      unknown:
        'No informado: su entorno de ejecución es más antiguo que esta característica. Actualiza el entorno de ejecución para verlos.',
    },
    jobs: {
      allow: 'Permitir trabajos de construcción',
      hint: 'Compilaciones y otros pasos que configura esta aplicación, ejecutados sin un modelo. Este entorno de ejecución informa: {{kinds}}.',
      unsupported:
        'El entorno de ejecución de este entorno de ejecución no acepta trabajos. Actualice el entorno de ejecución para activar esto.',
    },
    noTools: 'No se encontró ninguna herramienta de codificación',
    actionsFor: 'Acciones para {{name}}',
    columns: {
      name: 'Nombre',
      status: 'Estado',
      tools: 'Herramientas',
      sharing: 'Compartir',
      version: 'Ejecutor',
      lastSeen: 'Visto por última vez',
      slots: 'Máximo de ejecuciones simultáneas',
    },
    detail: {
      general: 'Generales',
      tools: 'Herramientas',
      toolsDescription:
        'Las herramientas de codificación que informó. Aquí no se envía trabajo para una herramienta que está apagada, o cuya cuota está agotada. Los interruptores y límites se guardan con "Guardar".',
      version: 'Ejecutor {{version}}',
      runs: 'Ejecuciones recientes',
      runsEmpty: 'Aún no hay ejecuciones.',
      runsTotal: '{{count}} ejecuciones',
      runsPagination: 'Paginación del historial',
      runsPrevious: 'Anterior',
      runsNext: 'Siguiente',
      runsPage: 'Página {{page}} de {{pageCount}}',
      runsFailed: 'No se pudieron cargar sus ejecuciones.',
      readOnly: 'Sólo su propietario puede cambiarlo.',
      owner: 'Propietario {{name}}',
    },
    status: {
      updatePending: 'Ejecutor esperando actualización',
      pruning: 'Ejecutor limpiando tienda compartida',
      online: 'En línea',
      offline: 'Sin conexión',
      revoked: 'Revocado',
      upgrade_required: 'Actualización requerida',
    },
    upgradeRequired: {
      title: 'Este entorno de ejecución necesita una actualización',
      older:
        'Su entorno de ejecución {{version}} habla el protocolo de Agent {{protocol}}; esta aplicación necesita el protocolo {{required}}. Permanece conectado pero no ejecuta nada hasta que se actualiza.',
      newer:
        'Su entorno de ejecución {{version}} habla el protocolo de Agent {{protocol}}, más nuevo que esta aplicación (protocolo {{required}}). Permanece conectado pero no ejecuta nada hasta que ejecuta un entorno de ejecución al que sirve esta aplicación.',
      latest:
        'Esta aplicación sirve al entorno de ejecución {{latest}}. Ejecute esto en su host para actualizarlo:',
      noLatest:
        'Instale un entorno de ejecución que hable el protocolo {{required}} o ejecútelo en su host para actualizarlo:',
      reinstall:
        'Su entorno de ejecución no dice cómo fue instalado. Instálelo nuevamente en su host con el comando de Añadir entorno de ejecución.',
    },
    tool: {
      checking: 'Esperando detección',
      failed: 'Error de detección',
      redetect: 'Detectar de nuevo',
      notProvided: 'No proporcionado',
      signedIn: 'Iniciado sesión',
      signedOut: 'No iniciado sesión',
      notInstalled: 'No instalado',
      off: 'Desactivado',
      offHint:
        'Desactivado: el trabajo para esta herramienta no se envía a este entorno de ejecución.',
      enableLabel: 'Ejecute {{tool}} en {{name}}',
      version: 'Versión {{version}}',
    },
    trust: {
      isolationHint:
        'Tanto en entornos de ejecución personales como compartidos, ejecuta el runner en una máquina virtual o un entorno aislado: los Agents tienen acceso total y el runner no es un sandbox.',
      label: 'Para quién funciona',
      team: 'Equipo',
      teamHint:
        'Las ejecuciones son las que inicia cualquier miembro del equipo, con sus variables y secretos. Para servidores compartidos y máquinas virtuales.',
      ownerOnly: 'Personales',
      ownerOnlyHint:
        'Ejecuta sólo el trabajo que inicia. El valor predeterminado para un entorno de ejecución que añada.',
      personalOnly:
        'Este entorno de ejecución será personal: ejecuta sólo el trabajo que usted inicia. Puedes compartirlo con el equipo más tarde.',
    },
    share: {
      title: '¿Compartir {{name}} con el equipo?',
      description:
        'Las ejecuciones de otras personas se ejecutarán en este entorno de ejecución, con sus variables y secretos, y podrán leer lo que contiene. Compártelo sólo si te parece bien.',
      confirm: 'Compartir con el equipo',
    },
    edit: {
      button: 'Editar',
      title: 'Editar {{name}}',
      name: 'Nombre',
      nameRequired: 'Ingrese un nombre.',
      slotsHint: 'Cuántas ejecuciones toma el entorno de ejecución a la vez.',
      slotsInvalid: 'Ingrese un número entero del 1 al 64.',
      saved: 'Guardado {{name}}',
    },
    upgrade: {
      show: 'Versión {{version}}: hay un entorno de ejecución más nuevo disponible',
      available: 'Actualización disponible',
      badge: 'Actualizable',
      latest: 'Actual',
      installed: 'Versión {{version}}',
      title: 'Un entorno de ejecución más nuevo para {{name}}',
      description:
        'Instalado {{version}}, esta aplicación sirve para {{latest}}.',
      hint: 'Se actualiza solo una vez que no se está ejecutando ningún Agent. Para actualizarlo ahora, ejecútelo en su host.',
    },
    revoke: {
      title: '¿Revocar la credencial de {{name}}?',
      description:
        'Su entorno de ejecución se detiene en su siguiente solicitud y sus ejecuciones regresan a la cola. Para volver a conectarlo, añada nuevamente el entorno de ejecución.',
      confirm: 'Revocar',
      done: 'Revocada la credencial de {{name}}',
    },
    delete: {
      title: '¿Eliminar {{name}}?',
      description:
        'El entorno de ejecución revocado se elimina de la lista. Sus carreras pasadas permanecen.',
      confirm: 'Eliminar',
      done: 'Eliminado {{name}}',
    },
    revokedList_many: '{{count}} revocó entornos de ejecución',
  },
  connect: {
    manual: 'O instálalo tú mismo',
    promptTitle: 'Deja que un Agent lo configure',
    promptCopy: 'Copiar la instrucción para el Agent',
    promptShow: 'Ver la instrucción',
    promptHide: 'Ocultar la instrucción',
    promptHint:
      'Copia esta instrucción a un Agent (Claude Code, Codex y similares) en la máquina de destino y realizará por ti los pasos siguientes. Contiene una credencial de un solo uso: dásela solo a ese Agent.',
    windowsPowerShell:
      '1. Instala WSL: ejecútalo en PowerShell y reinicia Windows:',
    windowsUbuntu:
      '2. Abre Ubuntu y ejecuta el comando de Linux de abajo. Instala Node.js y las herramientas de programación dentro de WSL Ubuntu.',
    windowsNetwork:
      'Si WSL no puede acceder a internet, activa la red en modo espejo en WSL.',
    promptWindows:
      'PRIMERO, determina si te ejecutas dentro de WSL Ubuntu. Si NO estás en WSL Ubuntu, DETENTE: no ejecutes ningún comando de instalación ni de registro. Dile al usuario que ejecute wsl --install en PowerShell, reinicie Windows, abra el Agent dentro de WSL Ubuntu y vuelva a ejecutar esta instrucción. Continúa con los pasos siguientes SOLO dentro de WSL Ubuntu. Instala tanto Node.js como las herramientas de programación dentro de WSL. Si WSL no puede acceder a internet, activa la red en modo espejo.\n\n',
    promptBody:
      'Configura esta máquina como entorno de ejecución de NocoBase. Usa una máquina virtual o un entorno aislado: los Agents tienen acceso total y el runner no es un sandbox.\n\nComprueba que hay Node.js 24 o posterior y que estas herramientas de programación están instaladas y con sesión iniciada: {{tools}}. Usa sus métodos de instalación oficiales, no paquetes snap.\n\nEjecuta este comando de registro de un solo uso para instalar el runner y la CLI de la aplicación, registrarlo e instalar su servicio en segundo plano:\n{{command}}\n\nResuelve los problemas habituales de configuración: asegúrate de que el PATH del servicio contiene las herramientas de programación (comprueba which codex / which claude en el terminal de instalación y vuelve a ejecutar nocobase-runner service install y reinicia el servicio); configura el proxy necesario para las descargas y para el servicio; resuelve los permisos de instalación global de npm con un prefijo propiedad del usuario o un gestor de versiones de Node, sin sudo npm install.\n\nTermina con nocobase-runner status y confirma la conexión y las herramientas de programación. Indícame los pasos de inicio de sesión o de red que queden por hacer. Trata la credencial de registro como un secreto y no la incluyas en tu informe.',
    title: 'Añadir entorno de ejecución',
    description:
      'Ejecute el siguiente comando en un host que tenga una herramienta de codificación instalada: un servidor, una máquina virtual o su propio dispositivo. Los agentes se ejecutan allí con acceso completo, como el usuario que ejecuta el entorno de ejecución, y pueden leer y cambiar cualquier cosa que el usuario pueda, incluidas las claves SSH y otras credenciales. El entorno de ejecución no es un límite de seguridad: ejecútelo como un usuario dedicado, en un contenedor o en una VM.',
    createCredential: 'Generar comando de instalación',
    advanced: 'Avanzado: límites por herramienta de codificación',
    run: 'Ejecute esto en ese host. Descarga el entorno de ejecución (nocobase-runner) y la CLI de esta aplicación desde esta aplicación, registra el entorno de ejecución y lo inicia al iniciar sesión:',
    nodeRequired:
      'El host necesita Node.js 24 o posterior (verifique con node --version). El comando se detiene y dice cómo instalarlo cuando falta.',
    installed: '¿Ya tienes instalado nocobase-runner? Regístrelo en su lugar:',
    tokenOnce:
      'El comando lleva una credencial de un solo uso para un entorno de ejecución "{{trust}}". Funciona una vez, hasta {{time}}.',
    after:
      'En cuestión de segundos, el entorno de ejecución aparece en la lista, con cada herramienta de codificación que encontró...',
    tokenTools: 'Herramientas de codificación: {{tools}}.',
    tools: 'Herramientas de codificación',
    toolsHint:
      'Este entorno de ejecución se ofrece para funcionar solo para las herramientas marcadas. Puede cambiarlo en la página Runtimes en cualquier momento.',
    toolsRequired: 'Elija al menos una herramienta de codificación.',
    slots: 'Máximo de ejecuciones simultáneas',
    slotsHint:
      'Cuántas ejecuciones toma el entorno de ejecución a la vez. Puede cambiarlo en la página Runtimes en cualquier momento.',
    tokenSlots: 'Ejecuciones simultáneas máximas: {{slots}}.',
    tokenToolSlots: 'Por herramienta de codificación: {{limits}}.',
    connected: '{{name}} está conectado.',
    done: 'Hecho',
    system: {
      macos: 'macOS',
      linux: 'Linux',
      windows: 'Windows',
    },
  },
  chat: {
    // Keep new guidance available in English until this locale is translated.
    executionFailed:
      'La ejecución falló. Revisa la conversación guardada antes de reintentar.',
    fileInputFailures: {
      imageCapability:
        'Este modelo no tiene configurada la entrada de imágenes. Cambia a un modelo con soporte de imágenes verificado.',
      unsupportedFormat:
        'El modelo seleccionado no tiene configurada la entrada para este formato de adjunto y ningún extractor de texto local lo admite. Usa un formato de documento compatible o un modelo con soporte de archivos verificado.',
      formatMismatch:
        'El nombre del archivo adjunto y su tipo de contenido indican formatos de documento distintos. Comprueba el formato y vuelve a subirlo.',
      invalidInline:
        'Los datos del archivo adjunto no son válidos o son demasiado grandes. Vuelve a subirlo o usa un archivo más pequeño.',
      fileTooLarge:
        'Un adjunto supera su límite de tamaño. Usa un archivo más pequeño.',
      inputTooLarge:
        'Los adjuntos de la conversación superan el límite de entrada. Usa archivos más pequeños o empieza una conversación nueva.',
      documentTooLarge:
        'El adjunto supera el límite de texto extraído. Usa un archivo más pequeño.',
      contextTooLarge:
        'Los adjuntos de la conversación superan el límite de texto extraído. Usa archivos más pequeños o empieza una conversación nueva.',
      fileCount:
        'La conversación supera el límite de 100 archivos de entrada. Empieza una conversación nueva.',
      nativeFileCount:
        'La conversación supera el límite configurado de archivos nativos. Usa menos adjuntos o conviértelos a un documento de texto compatible.',
      unreadable:
        'El adjunto no contiene texto legible. Los documentos escaneados requieren OCR.',
      extractionFailed:
        'No se pudo extraer el texto del adjunto. Comprueba que el documento sea legible y vuelve a subirlo.',
      extractionTimeout:
        'Se agotó el tiempo de extracción del texto del adjunto. Usa un archivo más pequeño o inténtalo de nuevo.',
      preparationFailed:
        'No se pudo preparar el adjunto. Comprueba tu acceso y el formato del archivo e inténtalo de nuevo.',
    },
    untitled: 'Conversación sin título',
    renamed: 'Renombrado',
    archivedNamed: 'Archivado “{{title}}”',
    unarchived: 'Conversación restaurada',
    undo: 'Deshacer',
    sendFailed: 'El mensaje no fue enviado. Intentar otra vez.',
    availability: {
      online: 'En línea',
      agentMissing: 'Eliminado',
      agentArchived: 'No habilitado',
      forbidden: 'No disponible para ti',
      noModel: 'Configurar un modelo de chat primero',
      noRunner: 'Ningún entorno de ejecución en línea, no se puede elegir',
      othersPersonal:
        'Sólo los entornos de ejecución personales de otros lo tienen.',
      modelUnavailable: 'Modelo no disponible',
    },
    offline: {
      fallbackDone: 'Esta conversación ahora utiliza otro Agent',
      restoreDone: 'Regresado',
      newSession: 'El Agent inicia una nueva sesión y lee esta conversación.',
    },
    notice: {
      switchedToDefault:
        'Se cambió a {{name}}, el valor predeterminado del sistema, hasta que regrese {{own}}.',
      switchedToOnline:
        '{{own}} no tiene ningún entorno de ejecución para usted ahora, por lo que {{name}} responde hasta que {{own}} regrese.',
      onlineFallbackUnavailable:
        'El Agent de reserva en línea no puede responder ({{reason}}). Esta conversación permanece con {{own}} mientras espera un entorno de ejecución.',
      switchedAgent:
        'Se cambió a {{name}}, conservando el historial de esta conversación.',
      switchedBack: 'De vuelta con {{name}}.',
      runFailed: 'El Agent se detuvo antes de responder.',
      runFailedReason: 'El Agent se detuvo antes de responder: {{reason}}',
      runCancelled: 'Cancelación solicitada.',
    },
    consultation: {
      unavailableTitle: 'Agent consultado no disponible',
      snapshotTitle: 'Solicitado {{name}} en su momento',
      title: 'Consultado {{name}}',
    },
    steps: {
      thinking: 'Pensando…',
      reading: 'Mirando a {{subject}}',
      working: 'Trabajando en {{subject}}',
    },
    agents: {
      personalOnly: 'Solo entornos de ejecución personales',
      hint: 'Enumera los Agents habilitados y dice por qué uno no puede responderle ahora. Las respuestas se ejecutan en un entorno de ejecución: la primera respuesta espera a que uno la tome, generalmente unos segundos.',
      chooseFor: 'Elige un Agent',
      empty: 'Ningún Agent puedes elegir',
      none: 'Ningún Agent',
      unknown: 'Agent desconocido',
      placeholder: 'Elige un Agent',
      myDefault: 'Mi valor predeterminado',
      systemDefault: 'Valor predeterminado del sistema',
    },
  },
  chatProfile: {
    loadFailed: 'No se pudo cargar la configuración de su Agent',
    defaultAgent: 'My Agent de chat predeterminado',
    systemDefault: 'Valor predeterminado del sistema',
    systemDefaultNamed: 'Valor predeterminado del sistema ({{name}})',
    noDefault: 'No se establece ningún valor predeterminado del sistema.',
    saved: 'Agent de chat predeterminado guardado',
  },
  models: {
    title: 'Modelos',
    description:
      'Los modelos de servicios que llaman los Agents en línea, y los modelos que ofrece cada uno: modelos de chat para Agents, modelos de incrustación y rerank para búsqueda.',
  },
  defaultModel: {
    title: 'Modelo de chat predeterminado',
    description:
      'Los Agents en línea que no tienen modelos propios responden con ella, como un Agent nuevo o uno que viene con la aplicación.',
    none: 'Aún no hay ningún modelo de chat activado. Añada un servicio modelo y active un modelo de chat: el primero se convierte en el predeterminado.',
    saved: 'El modelo de chat predeterminado ahora es {{model}}.',
  },
  services: {
    list: 'Servicios modelo',
    columns: {
      name: 'Nombre',
      provider: 'Tipo de proveedor',
      status: 'Estado',
    },
    loadFailed: 'No se pudieron cargar los servicios del modelo.',
    empty: {
      title: 'Aún no hay servicio de modelo',
      description:
        'Una vez que agrega un servicio modelo, los Agents en línea pueden responder a través de él.',
      readOnly: 'Pídale a un administrador que añada un servicio modelo.',
    },
    add: {
      open: 'Añadir servicio',
      title: 'Añadir un servicio modelo',
      provider: 'Tipo de proveedor',
      created: 'Se agregó {{title}}.',
    },
    status: {
      on: 'En',
      off: 'Desactivado',
      noKey: 'Sin clave API',
      noModels: 'Ningún modelo en',
    },
    service: {
      edit: 'Editar {{title}}',
      defaultHost: 'Proveedor predeterminado',
      actions: 'Más acciones para {{title}}',
      turnOn: 'Activar',
      turnOff: 'Apagar',
      turnedOn: '{{title}} está activado.',
      turnedOff: '{{title}} está apagado.',
      name: 'Nombre',
      enabled: 'Habilitado',
      enabledHint:
        'Los Agents en línea pueden usar sus modelos solo mientras está activado.',
      saved: '{{title}} guardado.',
      delete: 'Eliminar',
      deleteTitle: '¿Eliminar {{title}}?',
      deleteDescription:
        'Los agentes que utilizan sus modelos dejan de responder hasta que se les proporciona otro y se eliminan los precios de sus modelos.',
      deleted: '{{title}} eliminado.',
    },
    connection: {
      apiKey: 'Tecla API',
      keyPlaceholder: 'Pegue la clave API',
      baseUrl: 'URL base',
      baseUrlHint:
        'Vacío utiliza el valor predeterminado del proveedor, {{url}}.',
      baseUrlRequired: 'La dirección del API del proveedor.',
      baseUrlInvalid: 'La base URL comienza con http:// o https://.',
      test: 'Conexión de prueba',
      testing: 'Probando…',
      testOk: 'Conectado: Respondió {{model}}.',
      testFailed: '{{model}} no respondió: {{message}}',
      testNeedsModel: 'Verifique un modelo para probar la conexión.',
      openCodeHint:
        'OpenCode envía x-opencode-session con cada solicitud (una identificación de sesión por conversación). Atiende a cada familia de modelos a través de su propio API: DeepSeek, GLM, Kimi y MiMo hasta DeepSeek o OpenAI-compatible, Claude, MiniMax y Qwen hasta Anthropic, GPT y Grok hasta OpenAI. Añade un servicio de cada tipo que necesites, todo con esta base URL.',
    },
    models: {
      title: 'Modelos',
      description:
        'Verifique los modelos que ofrece este servicio y diga para qué sirve cada uno: modelos de chat que responden a los Agents, incrustación de texto de índice de modelos para búsqueda, modelos de reclasificación para ordenar resultados de búsqueda. Un modelo de incrustación puede solicitar vectores de un tamaño.',
      fetching: 'Obteniendo los modelos del proveedor…',
      fetchFailed: 'El proveedor no lista sus modelos: {{message}}',
      fetch: 'Obtener modelos',
      search: 'Modelos de búsqueda',
      noMatch: 'Ningún modelo coincide.',
      empty:
        'Ningún modelo todavía. Consígalos del proveedor o añada uno por su ID.',
      add: 'Añadir modelo',
      addPlaceholder: 'Identificación del modelo',
      kind: 'Para qué sirve {{model}}',
      kinds: {
        chat: 'Charla',
        embedding: 'Incrustación',
        rerank: 'Reclasificación',
      },
      test: 'Prueba {{model}}',
      testOk: 'Respondido como {{kind}}.',
      testFailed: 'No respondió: {{message}}',
      notKind: {
        chat: 'Este modelo no parece un modelo de chat',
        embedding: 'Este modelo no parece un modelo incrustado',
        rerank: 'Este modelo no parece un modelo de reordenación',
      },
      looksLike: '{{notKind}}: responde como {{kind}}.',
      kindNouns: {
        chat: 'un modelo de chat',
        embedding: 'un modelo de incrustación',
        rerank: 'un modelo de reordenamiento',
      },
      dimensions: 'Tamaño del vector de {{model}}',
      dimensionsPlaceholder: 'Predeterminado',
      counts: {
        chat: 'charla {{count}}',
        embedding: 'Incrustación {{count}}',
        rerank: 'Reordenamiento {{count}}',
      },
    },
  },
  prices: {
    loadFailed: 'No se pudieron cargar los precios de los modelos.',
    section: {
      title: 'Precios de los modelos',
      description:
        'Por millón de tokens, entrada/salida. Los informes calculan los costes a partir de ellos.',
      online: 'En línea (servicios de modelo)',
      noOnline:
        'Aún no hay ningún modelo al que fijar el precio. Primero active un servicio modelo y sus modelos.',
      runner: 'Runner (herramientas de codificación)',
    },
    price: {
      model: 'Modelo',
      state: 'Fuente de precios y acciones',
      input: 'Entrada / 1M',
      output: 'Salida / 1M',
      inputOf: 'Precio de entrada de {{model}}, por millón de tokens',
      outputOf: 'Precio de salida de {{model}}, por millón de tokens',
      save: 'Guardar el precio de {{model}}',
      saved: 'Precio de {{model}} guardado.',
      remove: 'Eliminar el precio de {{model}}',
      removed: 'Precio de {{model}} eliminado.',
      unpriced: 'Sin precio',
      unpricedHint:
        'Su costo se lee “—” en los informes hasta que tenga precio.',
      via: 'por {{pattern}}',
      viaHint:
        'Precio según la regla {{pattern}}. Ahorrar aquí le da a este modelo su propio precio.',
      invalid: 'Los precios son números de 0 o más.',
      readOnly:
        'Sólo podrá modificarlos quien maneje los precios de los modelos.',
    },
    tool: {
      description:
        'Cuánto cuestan las ejecuciones de {{tool}}, con el precio según el modelo que informa cada ejecución.',
      subscription: 'Suscripción (no facturada)',
      subscriptionTag: 'Suscripción',
      subscriptionHint:
        'Pagado mediante un plan mensual: sus tiradas no cuestan nada en los informes.',
      subscribed: '{{tool}} se factura mediante suscripción.',
      unsubscribed: '{{tool}} se factura según sus precios.',
      seen: 'Modelos vistos en tiradas.',
      noneSeen:
        'Ninguna ejecución de {{tool}} ha informado de un modelo todavía.',
      rules: 'Reglas de precios ({{count}})',
      rulesHint:
        'Una regla es un ID de modelo o un patrón como claude-sonnet-4*; el partido más específico gana.',
      ruleModel: 'Modelo o patrón',
      addRule: 'Añadir precio',
      ruleAdded: 'Se agregó el precio de {{model}}.',
    },
  },
  skills: {
    attachments: 'Adjuntos',
    globalMount: 'Adjunto global',
    globalMountDescription:
      'Guarda inmediatamente. Todas las carreras futuras reciben esta habilidad.',
    mountSaved: 'Configuración de archivos adjuntos guardada.',
    mountRetry: 'No se pudieron cargar las configuraciones. Reintentar',
    unavailableTarget: 'Objetivo no disponible',
    noAttachments: 'No adjunto a ninguna parte.',
    title: 'Habilidades',
    description:
      'Instrucciones reutilizables con archivos de respaldo. Adjunte los valores predeterminados del equipo globalmente o a un proyecto o directorio de trabajo.',
    new: 'Nueva habilidad',
    newTitle: 'Nueva habilidad',
    newDescription:
      'Escribe SKILL.md: el texto inicial nombra y describe la habilidad. Añada archivos ahora o más tarde.',
    breadcrumb: 'Habilidad',
    loadFailed: 'No se pudieron cargar las habilidades',
    backToList: 'Volver a habilidades',
    emptyTitle: 'Aún no hay habilidades',
    emptyDescription:
      'Una vez que agrega una habilidad, los Agents leen su SKILL.md cada vez que una tarea lo requiere.',
    emptyReadOnly: 'Pídale a un administrador que añada una habilidad.',
    content: 'SKILL.md',
    contentHint:
      'El nombre de la portada es el nombre de la carpeta de la habilidad: cambiarlo cambia el nombre de la habilidad. La descripción les dice a los Agents cuándo leerla.',
    contentTooLarge: 'SKILL.md es más grande que {{max}}.',
    emptyContent: 'Esta habilidad aún no tiene contenido.',
    created: 'Habilidad creada "{{name}}"',
    saved: 'Guardado como versión {{version}}.',
    saveVersion: 'Guardar nueva versión',
    editing: 'Edición',
    note: 'Nota',
    notePlaceholder: 'Qué cambió en esta versión (opcional)',
    deleted: 'Habilidad eliminada "{{name}}".',
    edit: 'Editar',
    delete: 'Eliminar habilidad',
    deleteTitle: '¿Eliminar la habilidad "{{name}}"?',
    deleteDescription:
      'Cada Agent y cada lugar que utilice esta habilidad por defecto la pierde.',
    readOnly:
      'Solo el creador de la habilidad y los administradores del espacio de trabajo pueden cambiar esta habilidad.',
    conflict:
      'Alguien más acaba de cambiar esta habilidad. Se carga la última versión; intentar otra vez.',
    conflictTitle: 'Alguien más acaba de cambiar esta habilidad.',
    conflictDraft:
      'Alguien guardó una nueva versión después de que usted comenzó a editar, por lo que sus cambios no se guardaron. Copie lo que desea conservar, luego cargue la última versión y edítela nuevamente.',
    loadLatest: 'Cargar la última versión',
    mountedAgents: 'Agents adjuntos',
    noAgents: 'Aún no está vinculado a ningún Agent.',
    defaults: 'Habilidad predeterminada de: {{places}}.',
    defaultsSeparator: ', ',
    files: 'Archivos',
    usage: 'Archivos {{files}}/{{maxFiles}} · {{size}}/{{maxSize}}',
    uploadTooLarge: '{{name}} es más grande que {{max}}.',
    uploadInvalidName:
      '{{name}} no se puede añadir aquí; cámbiele el nombre primero.',
    skillTooLarge: 'Una habilidad tiene como máximo {{max}} en total.',
    tooManyFiles: 'Una habilidad tiene como máximo archivos {{max}}.',
    filesTooLarge: 'Mayor que {{max}}: {{paths}}.',
    binaryFile: 'Archivo binario, {{size}}. No se puede editar aquí.',
    executable: 'Ejecutable',
    scriptBadge: 'Guión',
    scriptsNote:
      'Tiene scripts: los Agents en línea pueden leerlos pero nunca ejecutarlos',
    compatibility: 'Compatibilidad: {{value}}',
    fileContent: 'Contenido de {{path}}',
    export: 'Exportar',
    exportVersion: 'Exportar versión {{version}} como zip',
    import: 'Importar',
    importVersion: 'Importar nueva versión',
    imported: 'Habilidad importada "{{name}}".',
    importInvalid: 'No se puede utilizar el SKILL.md del archivo: {{problem}}',
    tree: {
      label: 'Archivos de habilidades',
      newFile: 'Nuevo archivo',
      newFolder: 'Nueva carpeta',
      upload: 'Subir archivos',
      actionsFor: 'Acciones para {{name}}',
      rename: 'Cambiar nombre',
      delete: 'Eliminar',
      download: 'Descargar',
      replace: 'Reemplazar',
      markExecutable: 'Marcar como ejecutable',
      unmarkExecutable: 'Marcar como no ejecutable',
      dropHint: 'Suelte archivos en una carpeta para cargarlos allí.',
    },
    entry: {
      description: 'Los nombres se comparan con los archivos que ya existen.',
      folderHint:
        'Una carpeta vacía no se guarda: agréguele un archivo antes de guardarla.',
      location: 'Ubicación',
      root: 'Carpeta de habilidades (/)',
      name: 'Nombre',
      renameTitle: 'Cambiar el nombre de "{{name}}"',
      conventional: {
        scripts:
          'Los Agents de código pueden ejecutarse. Los Agents en línea solo lo leen.',
        references: 'Los Agents de documentación leen cuando la necesitan.',
        assets: 'Plantillas, imágenes y otros recursos.',
      },
      problems: {
        required: 'Ingrese un nombre.',
        invalid: 'Utilice un nombre sin "/", distinto de "." y "..".',
        taken: 'Ya existe un archivo o carpeta con este nombre.',
        reserved: 'SKILL.md es la habilidad en sí; elige otro nombre.',
      },
      deleteFileTitle: '¿Eliminar el archivo "{{name}}"?',
      deleteFolderTitle:
        '¿Eliminar la carpeta "{{name}}" y todo lo que contiene?',
      deleteDescription:
        'Se elimina de este proyecto; las versiones guardadas lo conservan.',
    },
    editor: {
      write: 'Escribir',
      preview: 'Vista previa',
      nothingToPreview: 'Aún no hay nada que ver.',
      noPreview: 'No hay vista previa para este tipo de archivo.',
    },
    frontMatter: {
      title: 'Arreglar la portada de SKILL.md',
      reasons: {
        missing:
          'Inicie SKILL.md con el texto inicial entre dos líneas "---", con nombre y descripción.',
        yaml: 'La portada no es YAML válida.',
        notMapping:
          'El texto inicial debe contener claves y valores, como "nombre: mi-habilidad".',
        required: 'Añadir {{field}}.',
        empty: '{{field}} no debe estar vacío.',
        type: '{{field}} tiene el tipo incorrecto.',
        tooLong: '{{field}} tiene más caracteres que {{max}}.',
        pattern:
          'utiliza letras minúsculas, dígitos y guiones simples, y no comienza ni termina con un guión.',
        mismatch:
          'nombre debe ser el nombre de la carpeta que contiene SKILL.md.',
        taken: 'Otra habilidad tiene este nombre; elige otro.',
      },
    },
    template: {
      description: 'Qué hace esta habilidad y cuándo un Agent debe usarla.',
      title: 'Nueva habilidad',
      whenToUse: 'Cuándo usar',
      whenToUseHint: 'Describa las tareas que requieren esta habilidad.',
      steps: 'Pasos',
      stepsHint: '1. Lo primero que hay que hacer.\n2. Lo siguiente.',
      examples: 'Ejemplos',
      examplesHint: 'Muestra una entrada y cómo se ve un buen resultado.',
    },
    columns: {
      name: 'Nombre',
      description: 'Descripción',
      files: 'Archivos',
      version: 'Versión',
      agents: 'Agentes',
      updated: 'Actualizado',
    },
    versions: {
      title: 'Versiones',
      description:
        'Cada guardado crea una nueva versión; los Agents siempre reciben la versión más reciente.',
      current: 'Actual',
      compare: 'Comparar',
      compareTitle: 'Versión {{version}} → versión {{current}}',
      compareDescription:
        'Líneas eliminadas desde entonces en rojo, añadidas en verde.',
      unchanged: 'sin cambios',
      restore: 'Restaurar',
      restoreTitle: '¿Restaurar versión {{version}}?',
      restoreDescription:
        'Se guarda nuevamente como la versión más nueva; los Agents lo obtienen en su próxima carrera. No se pierde nada: la versión actual permanece en el historial.',
      restored: 'Versión restaurada {{version}} como versión {{current}}.',
    },
  },
  runWait: {
    capacity:
      'Ranuras utilizadas aquí {{used}}/{{limit}}; {{detail}}; reportado gratis en todas las aplicaciones {{reportedFree}}',
    reasons: {
      updatePending:
        'Ejecutor esperando actualización; el nuevo trabajo está en pausa',
      pruning:
        'Ejecutor limpiando tienda compartida; el nuevo trabajo está en pausa',
      toolNotInstalled:
        'Ningún entorno de ejecución conectado tiene esta herramienta instalada',
      incompatible:
        'Los entornos de ejecución conectados no soportan esta carga de trabajo; actualización requerida',
      restricted:
        'Restricciones de políticas, directorios o variables del entorno de ejecución',
      unknown: 'La elegibilidad de la carga de trabajo no está establecida',
      agentArchived: 'El Agent está archivado',
      delayed: 'Programado para {{until}}',
      noRunnerOnline: 'Sin entorno de ejecución en línea',
      runnersOffline: 'Sus entornos de ejecución están fuera de línea',
      toolQuota: 'Cuota de la herramienta agotada; restablecimiento: {{until}}',
      toolUnavailable:
        'Herramienta no iniciada, deshabilitada o modelo solicitado no disponible ({{tool}})',
      noSharedRunner:
        'Sólo los entornos de ejecución personales de otras personas están en línea',
      missingFeatures: 'Ningún entorno de ejecución admite {{features}}',
      secretsNotAllowed:
        'Necesita un entorno de ejecución en equipo: {{variables}} es solo para entornos de ejecución en equipo',
      sameWorkActive: 'Después de la ejecución ya en él',
      concurrencyFull: 'Simultaneidad completa ({{active}}/{{limit}})',
      runnersBusy: 'Los entornos de ejecución compatibles están llenos',
      toolSlotsFull: 'Ranuras {{tool}} llenas ({{used}}/{{limit}})',
      setupRetrying: 'Falló su preparación; reintentando: {{detail}}',
      next: 'Siguiente para un entorno de ejecución gratuito',
    },
    unknown: 'En cola ({{reason}})',
    quotaResetUnknown: 'desconocido',
    unknownValue: '—',
  },
  access: {
    section: 'Equipo de agentes',
    businessSection: 'Equipo de agentes',
    businesses: {
      agents: {
        title: 'Agentes y habilidades',
        description: 'Los agentes del equipo y las habilidades que utilizan.',
        actions: {
          edit: {
            title: 'Agents de cambio y habilidades',
            description:
              'Cambiar la configuración, habilidades y variables de un Agent, archivarlo, restaurarlo y eliminarlo, y editar habilidades. Un Agent no tiene ninguna capacidad más allá de la del editor.',
            related:
              'Agents de cambio y habilidades (Agents que poseen y habilidades que crearon)',
            relatedLabel: 'Agentes que poseo y habilidades que creé',
            relatedHint:
              'Agentes de los que soy propietario y habilidades que creé',
            all: 'Agents de cambio y habilidades (todos)',
          },
        },
      },
    },
    settings: {
      agents: {
        agents: 'Agentes',
        runners: 'Entornos de ejecución',
        prices: 'Precios de los modelos',
        services: 'Servicios modelo',
      },
    },
    actions: {
      read: 'Ver',
      manage: 'Administrar',
    },
    keyScopes: {
      agents: {
        title: 'Agentes',
        description:
          'Ver Agents, habilidades y carreras; cambiar Agents y habilidades, cancelar y reintentar ejecuciones.',
      },
      runners: {
        title: 'Entornos de ejecución',
        description:
          'Ver entornos de ejecución y tokens de registro; gestionar entornos de ejecución.',
      },
      prices: {
        title: 'Precios de los modelos',
        description:
          'Véase el modelo a partir del cual se estiman los precios; cambiarlos.',
      },
      services: {
        title: 'Servicios modelo',
        description:
          'Ver los servicios modelo y los modelos que ofrecen, nunca sus claves.',
      },
    },
  },
};

export default esES;
