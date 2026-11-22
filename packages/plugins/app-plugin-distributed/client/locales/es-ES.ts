import type { DistributedResource } from './en-US.js';

const esES: DistributedResource = {
  view: {
    deployment: 'Modo de despliegue',
    multi: 'Varias instancias',
    configuration: 'Configuración actual',
    checks: 'Comprobación entre instancias',
    backends: 'Backends de servicios',
    readiness: 'Comprobaciones antes de escalar',
    pending: 'Pendientes',
    all: 'Todas',
    empty: 'No hay comprobaciones pendientes.',
    blockers: 'Correcciones necesarias · {{count}}',
    scope:
      'Configuración de esta instancia. Vuelve a desplegar la aplicación después de modificarla.',
  },
  nav: {
    title: 'Clúster y distribución',
    description:
      'Qué backends usa esta instancia y si la aplicación puede ejecutarse en varias instancias.',
  },
  page: {
    description:
      'Para ejecutarse en varios servidores o procesos, la caché, los bloqueos, las tareas en segundo plano, las colas, los mensajes en tiempo real y la generación de ID deben usar backends compartidos. Esta página muestra los backends que esta instancia ha seleccionado realmente y de dónde viene cada ajuste, y comprueba si la aplicación puede ejecutarse de forma segura en varias instancias. Los ajustes están en la configuración de la aplicación; vuelve a desplegar después de cambiarlos.',
    loading: 'Cargando…',
    loadFailed: 'No se pudo cargar el estado.',
    retry: 'Reintentar',
  },
  summary: {
    single: 'Instancia única',
    singleCaption: 'La configuración actual sirve para una instancia',
    singleBlockedCaption:
      'Hay elementos que corregir incluso con una instancia',
    shared: '{{shared}} / {{total}}',
    sharedCaption: 'servicios compartidos',
    requiredCaption: 'por corregir',
    recommendedCaption: 'recomendados',
  },
  sections: {
    scale: '¿Puede ejecutarse en varias instancias?',
    services: 'Servicios compartidos',
    idGeneration: 'Generación de ID',
    checklist: 'Antes de pasar a producción',
    notes: 'Notas',
  },
  level: {
    required: 'Obligatorio',
    recommended: 'Recomendado',
    ok: 'Correcto',
  },
  singleBlocked:
    'Incluso con una sola instancia, los elementos marcados como «Corregir» deben resolverse.',
  singleHint:
    'Para ejecutar una sola instancia no hace falta cambiar nada. Para escalar: prepara Redis y una base de datos PostgreSQL o MySQL compartida → instala los plugins de Redis que necesites → cambia la configuración → verifica con dos instancias.',
  fix: 'Cómo corregirlo',
  table: {
    service: 'Servicio',
    backend: 'Backend seleccionado',
    sharing: 'Alcance',
    plugin: 'Plugin de Redis',
    source: 'Origen',
    adapter: 'Adaptador',
  },
  services: {
    caching: {
      name: 'Caché',
      usage: 'Estado de sesión, permisos, caché de configuración',
    },
    concurrency: {
      name: 'Bloqueos de concurrencia',
      usage: 'Migraciones, numeración, idempotencia',
    },
    jobs: {
      name: 'Tareas en segundo plano',
      usage: 'Tareas programadas, indexación de conocimiento',
    },
    queue: { name: 'Cola', usage: 'Envío de notificaciones' },
    realtime: {
      name: 'Mensajes en tiempo real',
      usage: 'Bandeja de entrada, presencia',
    },
  },
  sharing: {
    shared: 'Compartido entre instancias',
    local: 'Solo esta instancia',
    unknown: 'No declarado',
  },
  source: { configured: 'Configurado', default: 'Predeterminado' },
  notSet: '(sin definir)',
  unavailable: 'No lo usa esta aplicación',
  unregistered: 'Adaptador no registrado',
  selections: 'Elegidos por nombre',
  selection: '{{consumer}} → {{backend}}',
  howToChange: 'Cómo cambiarlo',
  howToChangeIntro:
    'Instala el plugin de Redis de cada servicio, registra su plugin de servidor y luego selecciónalo en la configuración:',
  idGeneration: {
    mode: 'Modo',
    modeHint:
      'Con varias instancias, asigna los worker ID automáticamente para que cada instancia obtenga el suyo.',
    auto: 'Automático · un worker ID por instancia',
    manual: 'Manual · workerId {{workerId}}',
  },
  checklist: {
    intro:
      'La página no puede comprobar esto por sí misma. Confírmalo actuando sobre dos instancias:',
    files:
      'Un archivo subido en la instancia A se puede descargar desde la instancia B',
    realtime:
      'Un mensaje generado en A llega en tiempo real a un usuario conectado a B, y no se pierde nada al reconectar',
    queue:
      'Una tarea encolada en A puede procesarla B, y los reintentos no repiten efectos secundarios',
    secrets:
      'Todas las instancias usan las mismas secrets.keys y la sesión funciona entre instancias',
    websocket:
      'El balanceador de carga reenvía las conexiones WebSocket y coincide con la ruta y el dominio de la aplicación',
  },
  notes: {
    current:
      'Esta página solo muestra la instancia a la que estás conectado. No puede saber si las demás instancias están configuradas igual; despliégalas desde una misma configuración.',
    noTest:
      'No hay «Probar conexión»: los plugins de Redis se conectan al iniciar la aplicación, y la aplicación no se inicia si no pueden. Los errores de conexión durante la ejecución aparecen en los registros.',
    instances:
      'La lista de instancias en ejecución solo aparece con worker ID automáticos, que proporciona un plugin comercial.',
  },
  checks: {
    database: {
      sqlite: {
        title: 'Base de datos',
        detail:
          'SQLite solo sirve a una instancia. Varias instancias necesitan PostgreSQL o MySQL.',
        fix: 'Traslada los datos a PostgreSQL o MySQL y apunta a ella la conexión principal de la base de datos.',
      },
      shared: {
        title: 'Base de datos',
        detail:
          '{{dialect}} puede compartirse entre varias instancias. Antes de publicar, confirme que todas las instancias se conectan a la misma base de datos.',
      },
    },
    service: {
      unregistered: {
        title: '{{service}}',
        detail:
          '{{configPath}} selecciona el adaptador «{{adapter}}», que no proporciona ningún plugin registrado. El servicio fallará la primera vez que se use.',
        fix: 'Instala y registra el plugin que proporciona «{{adapter}}», o selecciona otro backend.',
      },
      local: {
        title: '{{service}} sigue siendo local a esta instancia',
        detail:
          'Cada instancia guarda su propio estado. Instala {{plugin}} y configura {{configPath}} con un backend de Redis.',
        fix: 'Instala {{plugin}}, registra su plugin de servidor y selecciónalo:',
      },
      undeclared: {
        title: '{{service}}',
        detail:
          'El adaptador «{{adapter}}» no declara si se comparte entre instancias. Confírmalo con el plugin que lo proporciona.',
      },
      selectionUndeclared: {
        title: '{{service}}',
        detail:
          '{{consumer}} usa explícitamente el backend «{{backend}}», cuyo adaptador no declara si se comparte entre instancias. Confírmelo con el plugin que lo proporciona.',
      },
      selectionLocal: {
        title: '{{service}}',
        detail:
          '{{consumer}} usa explícitamente el backend «{{backend}}», que es local a esta instancia.',
      },
    },
    services: {
      local: {
        title:
          'Caché, bloqueos, tareas en segundo plano, cola, mensajes en tiempo real',
        detail: 'Todo local a esta instancia: {{services}}.',
      },
    },
    files: {
      local: {
        title: 'Almacenamiento de archivos',
        detail:
          'Los archivos de {{collections}} están en el disco de este host; las demás instancias no pueden leerlos.',
        fix: 'Usa un almacenamiento compartido, como S3, para estas colecciones de archivos y traslada allí sus archivos existentes.',
      },
      defaultLocal: {
        title: 'Almacenamiento de archivos',
        detail:
          'El almacenamiento predeterminado guarda los archivos en el disco de este host; las demás instancias no pueden leerlos.',
        fix: 'Define como predeterminado un almacenamiento compartido, como S3.',
      },
      shared: {
        title: 'Almacenamiento de archivos',
        detail:
          'Ninguna colección de archivos guarda archivos en el disco de este host.',
      },
      unchecked: {
        title: 'Almacenamiento de archivos',
        detail:
          'No se pudieron leer las colecciones de archivos de las conexiones {{connections}}, así que no se sabe si guardan archivos en el disco de este servidor.',
      },
    },
    idGeneration: {
      auto: {
        title: 'Generación de ID',
        detail:
          'Asignación automática: cada instancia obtiene su propio worker ID.',
      },
      manual: {
        title: 'Generación de ID',
        detail:
          'Worker ID manual {{workerId}}. Dos instancias con el mismo worker ID pueden generar los mismos ID.',
        fix: 'Asigna a cada instancia su propio SNOWFLAKE_WORKER_ID, o instala un plugin que asigne los worker ID automáticamente.',
      },
    },
    secrets: {
      set: {
        title: 'Secretos',
        detail:
          'secrets.keys está definido. Asegúrate de que todas las instancias usan las mismas claves.',
      },
      missing: {
        title: 'Secretos',
        detail:
          'secrets.keys no está definido. Todas las instancias necesitan las mismas claves para leer lo que cifran las demás.',
        fix: 'Genera una clave con openssl rand -hex 32 y configúrala en todas las instancias.',
      },
    },
    publicOrigin: {
      invalid: {
        title: 'Dirección pública',
        detail:
          'app.publicOrigin está definido pero no es una dirección http o https.',
        fix: 'Defina app.publicOrigin con la dirección que abren los usuarios, por ejemplo https://apps.example.com.',
      },
      set: {
        title: 'Dirección pública',
        detail: 'app.publicOrigin = {{origin}}',
      },
      missing: {
        title: 'Dirección pública',
        detail:
          'app.publicOrigin no está definido. Detrás de un balanceador de carga, los enlaces y las devoluciones de llamada necesitan la dirección pública.',
        fix: 'Define app.publicOrigin con la dirección que abren los usuarios.',
      },
    },
    checkFailed: {
      title: 'No se pudo ejecutar una comprobación',
      detail: 'La comprobación «{{check}}» falló; consulta los registros.',
    },
  },
};

export default esES;
