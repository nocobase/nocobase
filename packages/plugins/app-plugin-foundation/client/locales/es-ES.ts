import type { FoundationResource } from './en-US.js';

const esES: FoundationResource = {
  nav: {
    settings: 'Configuración del sistema',
    foundation: 'Base de la aplicación',
  },
  page: {
    counted: 'Contabilizado: {{value}}',
    partial: 'Algunos datos están pendientes de actualizar',
    title: 'Base de la aplicación',
    description:
      'Tu aplicación se centra en el negocio. NocoBase Core respalda los datos, permisos y flujos con capacidades comunes que NocoBase desarrolla, prueba y mantiene, y actualiza con sus versiones oficiales.',
    bandTitle: 'NocoBase Core',
    bandDescription:
      'Selecciona una capacidad para ver cómo apoya esta aplicación.',
    score: '{{active}} / {{total}}',
    scoreCaption: 'capacidades sustentan la aplicación',
    refresh: 'Actualizar',
    refreshing: 'Recopilando…',
    updatedAt: 'Última comprobación {{time}}',
    loading: 'Recopilando capacidades…',
    refreshFailed:
      'La actualización falló. Se muestra el último resultado recopilado correctamente.',
    loadFailed: 'Información pendiente de actualizar',
    forbidden:
      'Solo los administradores con acceso ilimitado pueden consultar esta página.',
    retry: 'Reintentar',
    undetermined_one: 'Información pendiente de actualizar ({{count}})',
    undetermined_many: 'Información pendiente de actualizar ({{count}})',
    undetermined_other: 'Información pendiente de actualizar ({{count}})',
    highlightsLabel: 'Cifras clave',
    unavailable: 'Información pendiente de actualizar',
    lowerBound: 'Valor mínimo: no se ha podido leer una parte.',
  },
  matrix: {
    apiPath: 'Solicitud API: {{method}} {{path}}',
    successPath: 'Solicitud API correcta: {{method}} {{path}}',
    conditions: {
      databaseAvailable: 'Base de datos disponible',
      authenticated: 'Autenticación aceptada',
      bodyWithinLimit: 'El cuerpo de la solicitud respeta el límite de tamaño',
      validInput: 'Validación de entrada correcta',
    },
    collections: 'Colecciones de datos: {{names}}',
    title: 'Módulos de negocio y capacidades base',
    description:
      'Consulta qué capacidades respaldan cada módulo. Selecciona una marca para ver la relación y qué tendrías que implementar por tu cuenta.',
    modules: 'Módulos de negocio',
    summary: '{{count}} capacidades · {{pages}} páginas',
    inspect: 'Ver {{module}} × {{capability}}',
    unknown: 'Sin identificar',
    empty:
      'Aún no se han encontrado módulos. Aparecerán automáticamente al añadir páginas y navegación.',
    legend:
      '✓ Integración identificada; · relación sin identificar. Las referencias de código describen dependencias, no ejecuciones.',
    partial:
      'No se pudieron determinar algunas dependencias de las páginas; solo se muestran las conexiones confirmadas.',
    evidence: {
      page: 'Página registrada en la aplicación',
      authentication: 'La página requiere iniciar sesión',
      authorization: 'Acceso a la página controlado por permisos',
      provider: 'Página aportada por este proveedor',
      source: 'Proveedor referenciado por el código de la página',
      apiSource: 'Proveedor referenciado por el controlador de la API asociada',
    },
  },
  inventory: {
    recognitionNotes: 'Notas de identificación',
    title: 'Capacidades y proveedores',
    description:
      'Las capacidades reflejan el núcleo, los plugins oficiales y Pro y las extensiones conectadas a esta aplicación.',
    discovered: 'paquetes proveedores detectados',
    mapped: 'paquetes proveedores clasificados',
    unmapped: 'pendientes de clasificación',
    partial: 'Detección incompleta. No se ha podido leer: {{sources}}.',
    selectedCategory: 'Proveedores de {{category}}',
    usageBoundary:
      'El estado corresponde a la categoría, no demuestra que todos estos paquetes estén habilitados, configurados o en uso.',
    noCategoryProviders:
      'El catálogo actual no ha identificado proveedores de esta categoría.',
    extensionsTitle: 'Proveedores adicionales · pendientes de identificar',
    extensionsDescription:
      'Los proveedores sin categoría siguen visibles. No se consideran automáticamente integraciones ni se marcan como no utilizados.',
    noExtensions:
      'No se han encontrado proveedores adicionales en el ámbito examinado.',
    discoveryBoundary:
      'Ámbito: dependencias directas, proveedores conocidos y aportaciones públicas de base de datos, API reenviadas y cliente observadas en el navegador. No enumera todas las aportaciones, extensiones indirectas ni módulos locales. El origen y la edición Pro requieren un catálogo fiable; el nombre y la licencia no bastan.',
    versionUnknown: 'Versión no disponible',
    origin: 'Origen',
    officialCatalog: 'Catálogo de NocoBase',
    unverifiedOrigin: 'Origen sin verificar',
    installation: 'Instalación',
    installed: 'Manifiesto encontrado',
    manifestUnavailable: 'Manifiesto no disponible',
    registration: 'Registro',
    observed: 'Aportación actual en ejecución observada',
    registrationUnknown: 'Sin confirmar · no significa deshabilitado',
    evidence: 'Evidencia',
    noEvidence: 'Ninguna confirmada',
    categories: 'Categorías',
    awaitingRecognition: 'Pendiente de clasificación',
    evidenceLabels: {
      manifest: 'Manifiesto del paquete instalado',
      databaseContribution: 'Aportación de tareas de base de datos',
      apiContribution: 'Aportación de API reenviada',
      foundationRuntime: 'Servicio de base en ejecución',
      clientContribution: 'Aportación del cliente observada en el navegador',
      serverRegistration: 'Registro del plugin de servidor',
    },
  },
  status: {
    active: 'En uso',
    needsSetup: 'Disponible, requiere configuración',
    unused: 'Sin utilizar',
    undetermined: 'Información pendiente de actualizar',
    legendActive: 'En uso {{count}}',
    legendNeedsSetup: 'Requiere configuración {{count}}',
    legendUnused: 'Sin utilizar {{count}}',
  },
  detail: {
    retainedAt: 'Última confirmación {{time}}',
    readNotes: 'Detalles de lectura',
    collectionCount: '{{count}} tablas',
    collectionPreview: 'Vista previa de tablas',
    collectionsTitle: 'Tablas',
    noCollectionMatches: 'No se encontraron tablas',
    noCollectionMatchesHint: 'Prueba otro nombre o borra la búsqueda.',
    collectionRange: '{{from}}–{{to}} de {{total}}',
    closeCollections: 'Cerrar tablas',
    viewCollections: 'Ver todas las colecciones',
    searchCollections: 'Buscar colecciones',
    collectionResults: '{{count}} colecciones coincidentes',
    previousPage: 'Anterior',
    nextPage: 'Siguiente',
    countRecords: 'Contar registros de negocio',
    recordsOnDemand:
      'Los registros de negocio se cuentan bajo demanda. Las bases de datos grandes pueden tardar más.',
    recordsCountedAt: 'Registros contados {{time}}',

    businessModules: 'Módulos de negocio relacionados',
    inThisApp: 'En esta aplicación',
    withoutFoundation: 'Sin la base',
    onceInUse: 'Al utilizarla',
    whyNot: 'Motivo por el que no se utiliza',
    liveData: 'Estadísticas',
    parts: 'Componentes',
    packages: 'Paquetes de NocoBase que la proporcionan',
    noPackages: 'No hay paquetes instalados para esta capacidad.',
    noFacts: 'Todavía no hay hechos confirmados.',
    partial: 'Algunos datos están pendientes de actualizar.',
    failed: 'Información pendiente de actualizar.',
    unreadable: 'No se ha podido leer: {{sources}}',
    timeout: 'Se ha agotado el tiempo de examen.',
  },
  capabilities: {
    dataModeling: {
      name: 'Modelado de datos',
      tagline: 'Colecciones, campos, relaciones y migraciones',
      without:
        'Habría que programar cambios de esquema, consultas, filtros, paginación, protección contra inyecciones y compatibilidad entre bases de datos.',
      onceInUse:
        'Las migraciones definen las colecciones y una interfaz común consulta las bases compatibles.',
    },
    files: {
      name: 'Gestión de archivos',
      tagline: 'Subidas, almacenamiento y adjuntos',
      without:
        'Habría que crear subidas, adaptadores, validación de tamaño y tipo y enlaces de descarga.',
      onceInUse:
        'Un contrato común de colección y almacenamiento gestiona los adjuntos.',
    },
    usersAndOrganizations: {
      name: 'Usuarios y organizaciones',
      tagline: 'Cuentas, inicio de sesión e invitaciones',
      without:
        'Habría que crear registro, sesiones, recuperación de contraseñas y administración segura de cuentas.',
      onceInUse:
        'Las cuentas, los inicios de sesión y las invitaciones se gestionan en un lugar.',
    },
    permissions: {
      name: 'Permisos',
      tagline: 'Conjuntos de permisos y reglas de acceso',
      without:
        'Habría que comprobar permisos manualmente en cada API, sin gestión central.',
      onceInUse:
        'Los conjuntos autorizan páginas, datos y acciones, con controles en cada solicitud al servidor.',
    },
    workflows: {
      name: 'Flujos y aprobaciones',
      tagline: 'Ciclos de vida, transiciones y programaciones',
      without:
        'Habría que programar estados, transiciones, historial, reintentos y tiempos de espera.',
      onceInUse:
        'Los ciclos de vida ofrecen transiciones controladas, historial y efectos con reintentos.',
    },
    aiAgents: {
      name: 'IA y agentes',
      tagline: 'Servicios de modelos, agentes y ejecutores',
      without:
        'Habría que integrar modelos, proteger claves, registrar consumo y ejecutar agentes de forma segura.',
      onceInUse:
        'Habilita servicios de modelos para OnlineAgent y la pasarela de modelos, o registra ejecutores para ejecutar agentes.',
    },
    knowledge: {
      name: 'Base de conocimiento',
      tagline: 'Espacios, documentos y búsqueda',
      without:
        'Habría que construir almacenamiento, versiones, permisos y búsqueda documental.',
      onceInUse:
        'Los espacios gestionan documentos, versiones y acceso para personas y agentes.',
    },
    mail: {
      name: 'Correo',
      tagline: 'Buzones, sincronización y envío',
      without:
        'Habría que conectar proveedores, sincronizar carpetas y gestionar autorización y reintentos.',
      onceInUse:
        'Conecta buzones para leer, sincronizar y enviar correo desde la aplicación.',
    },
    notifications: {
      name: 'Notificaciones',
      tagline: 'Canales, entregas y mensajes internos',
      without:
        'Habría que programar envíos, reintentos, eliminación de duplicados e historial por canal.',
      onceInUse:
        'Los canales configurados ofrecen envíos con reintentos, deduplicación e historial.',
    },
    integrations: {
      name: 'Integraciones',
      tagline: 'Claves API y acceso externo',
      without:
        'Habría que emitir y validar credenciales para cada sistema externo.',
      onceInUse:
        'Los sistemas externos utilizan claves API con los permisos de su propietario.',
    },
    interface: {
      name: 'Interfaz y configuración',
      tagline: 'Páginas, navegación, idiomas y temas',
      without:
        'Habría que construir rutas, menús, traducciones y temas antes de las páginas de negocio.',
      onceInUse:
        'El cliente NocoBase proporciona páginas, menús, idiomas y temas.',
    },
    audit: {
      name: 'Auditoría',
      tagline: 'Registro de operaciones sensibles',
      without:
        'Habría que registrar manualmente quién realiza cada cambio importante.',
      onceInUse:
        'Un registro central conserva las operaciones sensibles de la aplicación.',
    },
    operations: {
      name: 'Operaciones',
      tagline: 'Migraciones, tareas, colas y secretos',
      without:
        'Habría que gestionar actualizaciones, tareas en segundo plano, colas y secretos con código propio.',
      onceInUse:
        'El servidor ofrece migraciones registradas, tareas, colas y gestión de secretos.',
    },
  },
  reasons: {
    installedNotUsed:
      'Instalado, pero no se ha identificado evidencia de habilitación o uso actual.',
    noRecognizedAudit:
      'El catálogo actual no reconoce proveedores de auditoría; otras extensiones podrían aportarla.',
    noDatabase: 'La aplicación no utiliza una base de datos.',
    notRegistered: 'El plugin proveedor no está registrado en la aplicación.',
    notProvided: 'NocoBase Core aún no la proporciona.',
    noFileCollection: 'Ninguna colección almacena archivos.',
    noDrive:
      'Hay colecciones de archivos, pero falta configurar el almacenamiento.',
    noAccounts: 'La aplicación no tiene cuentas.',
    onlyUnrestrictedAccess:
      'Solo los administradores tienen acceso ilimitado; aún no se han concedido permisos a otros usuarios.',
    noWorkflows:
      'No hay ciclos de vida persistidos ni programaciones habilitadas.',
    noSchedules: 'No hay programaciones habilitadas.',
    noModelOrRunner:
      'No hay servicios de modelos habilitados ni ejecutores registrados.',
    noModelService: 'No hay servicios de modelos habilitados.',
    noAgent: 'No se ha definido ningún agente.',
    noDocuments: 'No hay documentos en los espacios de conocimiento.',
    noConnectedMailbox: 'No hay buzones conectados.',
    noChannel: 'No hay canales de notificación configurados.',
    noApiKey: 'No hay claves API.',
    noUsedApiKey: 'Hay claves API, pero no se han utilizado.',
    noClient: 'La aplicación no ofrece un cliente NocoBase.',
    notConfigured: 'Sin configurar.',
  },
  facts: {
    fileCollectionsPartial:
      'Colecciones de archivos contabilizadas: {{count}}: {{names}}.',
    collectionOwnershipUnknown:
      'Se ha detectado una extensión en ejecución sin clasificar. No se conoce la propiedad de las colecciones; se omiten las cifras de negocio.',
    noApplicationCollections:
      'La capa de datos funciona, pero la aplicación aún no tiene colecciones propias.',
    applicationCollectionsPreview:
      'Esta aplicación tiene {{count}} colecciones, entre ellas {{names}}.',
    applicationCollections: '{{count}} colecciones propias: {{names}}.',
    relations: '{{count}} relaciones las conectan.',
    fileCollections: '{{count}} colecciones de archivos: {{names}}.',
    accounts:
      '{{count}} cuentas acceden mediante la autenticación de NocoBase.',
    permissionSets:
      '{{count}} conjuntos de permisos además del ilimitado: {{names}}.',
    accessRules:
      '{{count}} reglas de acceso compartido, restringido o predeterminado.',
    lifecyclesWithoutTransitions:
      'El almacén de ciclos de vida está listo; aún no hay transiciones.',
    lifecycles:
      '{{count}} ciclos de vida con {{transitions}} transiciones: {{names}}.',
    schedules: '{{count}} programaciones habilitadas.',
    modelServices:
      '{{count}} servicios de modelos habilitados respaldan OnlineAgent y las llamadas a la pasarela de modelos.',
    runners: '{{count}} ejecutores registrados permiten ejecutar agentes.',
    agents: '{{count}} agentes, {{runs}} ejecuciones.',
    documents: '{{count}} documentos de conocimiento.',
    mailboxes: '{{count}} buzones conectados.',
    mailboxesNeedAttention:
      '{{count}} buzones requieren intervención para sincronizar.',
    channels: '{{count}} canales de notificación: {{names}}.',
    usedApiKeys: '{{count}} claves API utilizadas para llamar a la aplicación.',
    locales: '{{count}} idiomas: {{names}}.',
    migrations:
      '{{count}} migraciones ejecutadas, {{own}} propias de la aplicación.',
    latestMigration: 'Última ejecución: {{at}}.',
    registeredExtension: 'La extensión está registrada en esta aplicación.',
  },
  parts: {
    accounts: 'Cuentas',
    organizations: 'Organizaciones',
    permissionSets: 'Conjuntos de permisos',
    sharingRules: 'Reglas de uso compartido',
    restrictionRules: 'Reglas de restricción',
    defaultAccess: 'Acceso predeterminado',
    lifecycles: 'Ciclos de vida',
    schedules: 'Programaciones',
    modelServices: 'Servicios de modelos',
    agents: 'Agentes',
    runners: 'Ejecutores',
    migrations: 'Migraciones',
    jobs: 'Tareas',
    queue: 'Cola',
    secrets: 'Secretos',
    caching: 'Caché',
  },
  metrics: {
    businessRecords: 'registros de negocio',
    businessCollections: 'colecciones de negocio',
    views: 'vistas',
    fields: 'campos',
    relations: 'relaciones',
    systemCollections: 'colecciones de sistema de NocoBase',
    files: 'archivos',
    storedBytes: 'almacenado según registro',
    fileCollections: 'colecciones de archivos',
    accounts: 'cuentas',
    disabledAccounts: 'cuentas deshabilitadas',
    invitations: 'invitaciones',
    grants: 'autorizaciones',
    permissionSets: 'conjuntos de permisos',
    assignments: 'asignaciones',
    sharingRules: 'reglas de uso compartido',
    restrictionRules: 'reglas de restricción',
    defaultAccess: 'reglas de acceso predeterminado',
    transitions: 'transiciones de estado',
    lifecycles: 'ciclos de vida con transiciones',
    effectsSucceeded: 'efectos completados',
    effectsFailed: 'efectos fallidos',
    effectsPending: 'efectos pendientes',
    schedules: 'programaciones habilitadas',
    scheduleOccurrences: 'activaciones de programación',
    agents: 'agentes',
    modelServices: 'servicios de modelos habilitados',
    runners: 'ejecutores',
    runs: 'ejecuciones',
    modelCalls: 'llamadas al modelo fuera de ejecuciones',
    tokens: 'tokens',
    documents: 'documentos',
    spaces: 'espacios de conocimiento',
    chunks: 'fragmentos',
    connectedMailboxes: 'buzones conectados',
    mailboxesNeedAttention: 'buzones que requieren atención',
    messages: 'mensajes',
    submissions: 'mensajes enviados para su envío',
    failedSubmissions: 'envíos fallidos',
    acceptedDeliveries: 'entregas aceptadas por proveedores',
    notifications: 'notificaciones',
    deliveries: 'entregas',
    failedDeliveries: 'entregas fallidas',
    pendingDeliveries: 'entregas en curso',
    deliveryAttempts: 'intentos de entrega',
    inAppMessages: 'mensajes internos',
    inAppMessagesRead: 'mensajes internos leídos',
    channels: 'canales',
    usedApiKeys: 'claves API utilizadas',
    apiKeys: 'claves API habilitadas',
    locales: 'idiomas',
    migrations: 'migraciones ejecutadas',
    applicationMigrations: 'migraciones propias de la aplicación',
    seeds: 'semillas ejecutadas',
  },
  dynamic: {
    pending: 'Pendiente de identificar',
    pendingDescription:
      'El plugin está registrado; su configuración y uso real aún no se han determinado.',
  },
};

export default esES;
