import type { SchedulerResource } from './en-US.js';

const esES: SchedulerResource = {
  // Titles the server registers with the authorization catalog, which resolve in this plugin's namespace.
  authorization: {
    title: 'Tareas programadas',
    read: 'Ver',
    manage: 'Gestionar',
  },
  nav: { automation: 'Automatización', schedules: 'Tareas programadas' },
  page: {
    title: 'Tareas programadas',
    description:
      'Tareas que los plugins y la aplicación definen en código y que se ejecutan según un calendario. Consulta cuándo se ejecutan y cómo terminó cada ejecución, y pausa o reanuda cada una. Sus reglas están en el código; esta página no puede crearlas ni modificarlas.',
    loadFailed: 'No se pudieron cargar las tareas programadas.',
    retry: 'Reintentar',
    close: 'Cerrar',
    copy: 'Copiar',
    copied: 'Copiado',
    loadMore: 'Cargar más',
    none: '—',
    tabs: { tasks: 'Tareas', runs: 'Ejecuciones', config: 'Configuración' },
  },
  tasks: {
    attention: {
      title_one: '{{count}} elemento requiere atención',
      title_many: '{{count}} elementos requieren atención',
      title_other: '{{count}} elementos requieren atención',
      target:
        'El destino {{target}} de «{{title}}» no está disponible ({{state}}), por lo que cada activación se registra como omitida.',
      waiting:
        'La ejecución de «{{title}}» iniciada {{time}} sigue esperando su resultado.',
      failed: 'La última ejecución de «{{title}}» terminó como {{status}}.',
    },
    stats: {
      total: 'Tareas programadas',
      running: 'En marcha',
      attention: 'Requieren atención',
      next: 'Próxima ejecución',
      nextOf: 'Próxima ejecución · {{title}}',
    },
    filters: {
      all: 'Todas',
      running: 'En marcha',
      attention: 'Requieren atención',
      paused: 'En pausa',
      removed: 'Eliminadas del código',
      search: 'Buscar por nombre o key',
    },
    columns: {
      task: 'Tarea',
      rule: 'Regla',
      next: 'Próxima ejecución',
      last: 'Última ejecución',
      totals: 'Totales',
      state: 'Estado',
      enabled: 'Activada',
    },
    totals: '{{runs}} ejecuciones · {{succeeded}} correctas',
    noMatch: 'Ninguna tarea programada coincide con estos filtros.',
    enable: 'Reanudar «{{title}}»',
    disable: 'Pausar «{{title}}»',
    toggleFailed: 'No se pudo cambiar la tarea programada.',
    readOnly:
      'Puedes ver las tareas programadas, pero no pausarlas ni reanudarlas.',
    notes: {
      running:
        '«En marcha» solo significa que la tarea está activada y su destino existe; el resultado de cada ejecución indica si el trabajo tuvo éxito. Los totales cuentan cada activación, incluidos fallos y omisiones.',
      pause:
        'Pausar solo afecta a las ejecuciones posteriores. Las actualizaciones de código y los redespliegues mantienen el interruptor como está.',
      removed:
        '«Eliminadas del código»: tras `scheduler sync --finalize`, las tareas que ya no están en el código se marcan así; su historial se conserva y no se pueden reanudar.',
      internal:
        'Los trabajos internos en segundo plano, como los reintentos de notificaciones, la sincronización de correo, la indexación de conocimiento y la limpieza de ejecuciones de agentes, no aparecen aquí; los gestionan sus plugins.',
    },
  },
  state: {
    running: 'En marcha',
    paused: 'En pausa',
    unavailable: 'Destino no disponible',
    removed: 'Eliminada del código',
  },
  targetState: {
    ready: 'Disponible',
    disabled: 'Desactivado',
    missing: 'No existe',
    invalid: 'Configuración no válida',
  },
  pause: {
    title: '¿Pausar «{{title}}»?',
    description: 'Dejará de ejecutarse a su hora hasta que alguien la reanude.',
    running:
      'Las ejecuciones ya iniciadas o a la espera de resultado no se cancelan.',
    missed:
      'Al reanudarla continúa desde la siguiente hora prevista; las ejecuciones perdidas durante la pausa no se recuperan.',
    redeploy: 'Un redespliegue no la reanuda.',
    limit:
      'En una tarea con límite de ejecuciones, las realizadas hasta ahora siguen contando.',
    cancel: 'Cancelar',
    confirm: 'Pausar',
  },
  empty: {
    title: 'Aún no hay tareas programadas',
    description:
      'Las tareas programadas las definen en código los plugins o la aplicación con `defineSchedule`. Instala un plugin que defina tareas programadas, o define una en la aplicación y reinicia, y aparecerán aquí.',
    internal:
      'Los trabajos internos en segundo plano, como los reintentos de notificaciones, la sincronización de correo y la indexación de conocimiento, no aparecen aquí; siguen ejecutándose con sus propias reglas.',
  },
  detail: {
    back: 'Tareas programadas',
    notFound: 'Esta tarea programada no existe.',
    key: 'Key',
    rule: 'Regla',
    upcoming: 'Próximas ejecuciones',
    noUpcoming: 'Ninguna prevista',
    window: 'Periodo · límite de ejecuciones',
    unlimited: 'Sin límite',
    windowFrom: 'desde {{time}}',
    windowTo: 'hasta {{time}}',
    limit_one: '{{count}} ejecución',
    limit_many: '{{count}} ejecuciones',
    limit_other: '{{count}} ejecuciones',
    target: 'Destino',
    totals: 'Totales',
    source: 'Definida en',
    sourceCode:
      'Código (`defineSchedule`). Para cambiar la regla o el destino, modifica el código y vuelve a desplegar.',
    runs: 'Ejecuciones',
    noRuns: 'Aún no hay ejecuciones.',
    runsNote:
      'Las ejecuciones se muestran de la más reciente a la más antigua. La configuración del destino de una ejecución nunca se devuelve ni se muestra. Un número de intentos mayor que 1 significa que la misma ejecución se entregó de nuevo; sigue contando como una sola ejecución.',
  },
  runs: {
    allTasks: 'Todas las tareas programadas',
    groups: {
      all: 'Todas',
      failed: 'Fallidas · tiempo agotado',
      waiting: 'Esperando resultado',
      skipped: 'Omitidas',
      succeeded: 'Correctas',
    },
    ranges: {
      day: 'Últimas 24 horas',
      week: 'Últimos 7 días',
      month: 'Últimos 30 días',
      quarter: 'Últimos 90 días',
    },
    columns: {
      planned: 'Hora prevista',
      task: 'Tarea programada',
      result: 'Resultado',
      reason: 'Motivo · relacionado',
      executions: 'Intentos',
      duration: 'Duración',
      summary: 'Resumen del resultado',
    },
    noRuns: 'Ninguna ejecución coincide con estos filtros.',
    notes: {
      order:
        'Ejecuciones de todas las tareas programadas, de la más reciente a la más antigua. Los fallos, los tiempos agotados y las esperas largas también aparecen en la parte superior de la pestaña Tareas.',
      removed: 'Las tareas eliminadas del código conservan aquí su historial.',
    },
  },
  status: {
    pending: 'En cola',
    running: 'En ejecución',
    waiting: 'Esperando resultado',
    succeeded: 'Correcta',
    failed: 'Fallida',
    skipped: 'Omitida',
    cancelled: 'Cancelada',
    timed_out: 'Tiempo agotado',
    triggered: 'Activada (registro antiguo)',
  },
  reason: {
    'target-missing': 'El destino no existe',
    'target-disabled': 'El destino está desactivado',
    'target-invalid': 'La configuración del destino no es válida',
    'target-not-found': 'El tipo de destino no está registrado',
    'invalid-config': 'La configuración del destino no es válida',
    'dispatch-failed': 'Falló al iniciarse; consulta el registro del servidor',
    'observer-failed': 'Falló la comprobación del resultado del destino',
    'observer-unavailable': 'El destino no puede informar de su resultado',
  },
  run: {
    title: '{{title}} · {{time}}',
    timeline: 'Cronología',
    started: 'Iniciada',
    accepted: 'Aceptada por el destino',
    finished: 'Finalizada',
    notYet: 'Aún sin resultado',
    executions: 'Intentos',
    target: 'Destino',
    related: 'Relacionado',
    receipt: 'Acuse',
    summary: 'Resumen del resultado',
    reason: 'Motivo',
    waitingNote:
      'Mientras una ejecución espera su resultado, el programador consulta el estado al destino hasta que informa de éxito, fallo, cancelación o tiempo agotado. El programador no fija ningún tiempo límite; lo decide el destino. Si una ejecución espera mucho, abre el elemento relacionado para ver su progreso.',
  },
  config: {
    memory:
      'Las tareas programadas se ejecutan en la memoria de esta instancia: solo es adecuado para una única instancia.',
    memoryHint:
      'Con una sola instancia no hay nada que cambiar; para ejecutar varias, sigue «Cambiar a Redis» más abajo.',
    shared:
      'Las tareas programadas se ejecutan en {{adapter}}: varias instancias pueden ejecutarlas.',
    columns: {
      setting: 'Ajuste',
      value: 'Valor actual',
      effect: 'Efecto en las tareas programadas',
      source: 'Origen',
    },
    sources: {
      environment: 'Variable de entorno',
      config: 'config.yml',
      default: 'Predeterminado',
      backend: 'Definido por el backend',
    },
    rows: {
      configuration: 'Configuración de jobs',
      backend: 'Backend',
      multiInstance: 'Varias instancias',
      concurrency: 'Concurrencia',
      attempts: 'Intentos',
      connection: 'Conexión',
    },
    builtIn: 'memory integrada',
    selectedByScheduler:
      'Elegido por `scheduler.jobs` (`SCHEDULER_JOBS`) solo para las tareas programadas.',
    selectedByDefault:
      '`scheduler.jobs` no está definido, así que las tareas programadas siguen `jobs.default`.',
    selectedByBuiltIn:
      'Ni `scheduler.jobs` ni `jobs.default` están definidos, así que se aplica el valor predeterminado integrado.',
    memoryBackend: 'memory (esta instancia)',
    memoryEffect:
      'Las reglas están en la memoria de este proceso y se escriben en {{path}} cuando se detiene normalmente.',
    sharedEffect:
      'Las reglas están en {{adapter}}, compartidas por todas las instancias.',
    plugin: '{{plugin}} registrado',
    supported: 'Compatible',
    unsupported: 'No compatible',
    multiSupported:
      'Cada activación se ejecuta en una sola instancia; si una instancia falla, ocasionalmente una ejecución puede entregarse de nuevo.',
    multiUnsupported:
      'Cada instancia ejecuta cada tarea programada por su cuenta, por lo que la misma tarea se ejecuta varias veces.',
    concurrencyEffect_one:
      'Una ejecución a la vez; una ejecución lenta hace esperar a las demás que vencen.',
    concurrencyEffect_many:
      'Hasta {{count}} ejecuciones a la vez; las demás esperan en cola.',
    concurrencyEffect_other:
      'Hasta {{count}} ejecuciones a la vez; las demás esperan en cola.',
    attemptsOk: 'Correcto',
    attemptsWarn: 'Debería ser 1',
    attemptsEffect:
      'Una ejecución fallida se registra como fallida y la tarea vuelve a ejecutarse en su siguiente hora; mantén este valor en 1.',
    attemptsWarnEffect:
      'Una ejecución fallida ya queda registrada, así que reintentar la misma ejecución no hace nada; establece los intentos en 1.',
    connectionValue: '{{connection}} · namespace {{namespace}}',
    namespaceOnly: 'namespace {{namespace}}',
    connectionEffect: 'La contraseña nunca se muestra.',
    redis: {
      title: 'Cambiar a Redis (para varias instancias)',
      step1:
        'Instala el plugin comercial `@nocobase/app-plugin-jobs-redis` y regístralo en todas las instancias.',
      step2:
        'Añade un backend de Redis a `config.yml` y haz que las tareas programadas lo usen (fragmento abajo).',
      step3:
        'Vuelve a desplegar todas las instancias y regresa para comprobar que «Varias instancias» indica Compatible.',
      warning:
        'Si el nombre es incorrecto, el plugin no está registrado o no se puede acceder a Redis, la aplicación no se inicia; nunca vuelve a memory.',
    },
    removed: {
      title: 'Tareas programadas eliminadas del código',
      consistent: 'Coherente, no hay nada que hacer.',
      consistentHint:
        'Cuando se elimina una tarea programada del código y se despliega, aparece aquí con instrucciones para limpiarla.',
      warning_one:
        '{{count}} tarea programada ya no está en el código de esta versión, pero no se ha limpiado.',
      warning_many:
        '{{count}} tareas programadas ya no están en el código de esta versión, pero no se han limpiado.',
      warning_other:
        '{{count}} tareas programadas ya no están en el código de esta versión, pero no se han limpiado.',
      warningHint:
        'No se ejecutan cuando les toca (el registro muestra “A schedule fired that this instance has no definition for”), pero la lista de tareas las muestra como de costumbre.',
      columns: {
        task: 'Tarea programada',
        last: 'Última ejecución',
        after: 'Tras la limpieza',
      },
      after:
        'Se marca como «Eliminada del código», no vuelve a activarse y conserva su historial.',
      neverRan: 'Nunca se ejecutó',
      how: 'Cómo limpiar',
      howHint:
        'Cuando todas las instancias ejecuten la nueva versión, ejecuta esto una vez en cualquier servidor:',
      why: 'Por qué no es automático: durante un despliegue gradual conviven versiones antiguas y nuevas, y una limpieza automática podría eliminar tareas que la versión antigua aún usa.',
      full: 'Ejecútalo solo en una compilación completa que incluya todos los plugins; de lo contrario, las tareas de los plugins que no cargó también se marcan como eliminadas.',
    },
    readOnly:
      'Esta página es de solo lectura: estos ajustes están en la configuración de la aplicación y se aplican al volver a desplegar. Las cachés, colas y otros servicios se tratan en los ajustes de clúster y distribución.',
  },
  cron: {
    everyMinute: 'Cada minuto',
    everyMinutes: 'Cada {{count}} minutos',
    everyHour: 'Cada hora en el minuto {{minute}}',
    everyHours: 'Cada {{count}} horas',
    daily: 'Todos los días a las {{time}}',
    weekdays: 'De lunes a viernes a las {{time}}',
    weekly: 'Cada {{day}} a las {{time}}',
    monthly: 'El día {{day}} de cada mes a las {{time}}',
  },
};

export default esES;
