import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  indexing: {
    failedDocumentCount: 'Documentos fallidos: {{count}}',
    enabled: 'Activar indexación',
    enabledHint:
      'Desactive para usar solo búsqueda de texto. Los cambios se aplican al guardar.',
    chooseInstance: 'Seleccione una instancia de índice',
    documentProgress: 'Documentos indexados',
    pendingDocuments: 'Documentos pendientes',
    failedDocuments: 'Documentos fallidos',
    preparedChunks: 'Fragmentos preparados',
    committedChunks: 'Fragmentos confirmados',
    agentPrompt:
      'Ayúdame a configurar el índice de la base de conocimiento de esta aplicación NocoBase 3.\n\nLee AGENTS.md y comprueba los tipos de índice (type) realmente disponibles. Hay dos opciones de base de datos vectorial: SQLite con sqlite-vec (type sqlite-vec, archivo local) y PostgreSQL con pgvector (type pgvector, requiere la extensión vector). Explica las opciones y sus requisitos para este despliegue y deja que elija antes de continuar.\n\nDespués de elegir, pide la ruta del archivo para SQLite o la conexión y el estado de la extensión vector para PostgreSQL. No muestres contraseñas ni claves API.\n\nMuestra la configuración propuesta y espera mi confirmación antes de escribirla en knowledge.indexing dentro de config.yaml. Conserva los otros ajustes. Si la aplicación ya usa config.yml, edita ese archivo sin crear otro.\n\nValida la configuración de forma segura y explica cómo reiniciar la aplicación. Pide permiso antes de reiniciar o instalar dependencias. Después guíame para volver a los ajustes, activar el índice, elegir la instancia y un modelo de embeddings y guardar. Las llamadas a modelos de pago y la reconstrucción del índice también requieren mi confirmación.',
    databases: {
      sqlite: {
        name: 'Base de datos vectorial SQLite',
        description:
          'Usa la extensión vectorial sqlite-vec para guardar el índice en un archivo SQLite local del servidor de la aplicación. No necesita un servicio de base de datos aparte; adecuada para un solo servidor.',
      },
      pgvector: {
        name: 'Base de datos vectorial PostgreSQL',
        description:
          'Usa pgvector para guardar y buscar vectores en PostgreSQL. Necesita una conexión a la base de datos y la extensión vector habilitada. Adecuada para servicios PostgreSQL existentes o índices compartidos entre servidores.',
      },
    },
    setupTitle: 'Pasos de configuración',
    setup: {
      instance:
        'Abre config.yaml y añade una instancia en knowledge.indexing con nombre, tipo y ruta del archivo local o datos de conexión.',
      restart:
        'Guarda el archivo y reinicia la aplicación para cargar la configuración.',
      enable:
        'Vuelve a abrir los ajustes del índice, actívalo, selecciona la nueva instancia y un modelo de embeddings y guarda.',
    },
    agentHandoff:
      'Si no conoces los archivos de configuración, copia las instrucciones siguientes para un Agent de desarrollo.',
    global: 'Todos los espacios de conocimiento',
    back: 'Volver al conocimiento',
    configuration: 'Configuración del índice',
    typeHint:
      'Las instancias se agrupan por type. Cada tipo define su formulario y si necesita un modelo Embedding.',
    typeForm: 'Formulario dinámico de este tipo',
    openPage: 'Abrir página de configuración',
    emptyTitle: 'Configura primero una base de datos vectorial',
    emptyDescription:
      'El índice necesita una base de datos vectorial para guardar y buscar vectores de documentos. Elige una de estas opciones y añádela al config.yaml de la aplicación:',
    agentTitle: 'Instrucciones de configuración',
    copyPrompt: 'Copiar instrucciones',
    promptCopied:
      'Instrucciones copiadas. No se ha ejecutado ninguna operación.',
    promptCopyFallback:
      'No se puede copiar automáticamente. El texto está seleccionado para copiarlo manualmente.',
    promptLabel: 'Instrucciones para su Agent de desarrollo',
    rebuildHint: 'Los cambios requieren reconstruir el índice',
    editHint: 'Modifique la configuración para guardar',
    confirmRetryEmbedding:
      'Reintentar solo documentos fallidos de todos los espacios. No se repite el trabajo completado; puede haber costes de Embedding.',
    confirmRetry:
      'Reintentar solo documentos fallidos de todos los espacios. No se repite el trabajo completado, pero se utilizan recursos del servicio.',
    confirmResources:
      'Se reconstruirán los índices de todos los espacios. Este tipo no llama a Embedding, pero consume almacenamiento y recursos. El índice publicado sigue disponible hasta que el nuevo esté listo.',
    deploymentPg:
      'La conexión, el esquema y el prefijo de tabla se gestionan en la configuración del despliegue.',
    deploymentFile:
      'La ruta del archivo del índice se gestiona en la configuración del despliegue.',
    errors: {
      configurationChanged:
        'Cambió la configuración del índice o del modelo. La generación anterior no puede reintentarse con la nueva configuración. Revísela y reconstruya todos los espacios si es necesario (puede generar costes de Embedding).',
      modelAuth:
        'Falló la autenticación de Embedding. Revise la clave API, los permisos y la región del endpoint.',
      modelQuota:
        'Se agotó la cuota o el saldo de Embedding. Revise la cuenta antes de reintentar.',
      modelRateLimit:
        'El servicio de Embedding limita las solicitudes. Espere antes de reintentar.',
      modelConfig:
        'El modelo de Embedding guardado no está disponible, cambió o no es compatible. Revise el servicio y el modelo.',
      modelInput:
        'La entrada de Embedding es demasiado larga. Revise el tamaño de los fragmentos.',
      modelPolicy:
        'El servicio de Embedding rechazó la entrada por su política de contenido. Revise el contenido afectado.',
      modelResponse:
        'El servicio de Embedding devolvió vectores no válidos. Revise la compatibilidad y las dimensiones.',
      modelUnavailable:
        'No se puede acceder al servicio de Embedding o no está disponible temporalmente. Revise el endpoint y la red.',
      storageAuth:
        'Falló la autenticación del almacenamiento del índice. Revise el usuario, la contraseña y la conexión.',
      storagePermission:
        'El almacenamiento del índice denegó la operación o es de solo lectura. Revise los permisos del esquema y las tablas.',
      storageSchema:
        'La base de datos, el esquema o una tabla requerida del índice no están disponibles. Revise el despliegue y el esquema.',
      storageUnavailable:
        'No se puede acceder al almacenamiento del índice o se interrumpió la conexión. Revise la dirección, el puerto y la red.',
      storageBusy:
        'El almacenamiento del índice está ocupado o hubo un conflicto de transacción. Espere la política de reintentos del host.',
      timeout:
        'La operación de indexación agotó el tiempo de espera. Revise el almacenamiento y el servicio del modelo.',
      vectorExtension:
        'Falta la extensión vector de PostgreSQL. Solicite su instalación al administrador.',
      ownership:
        'La propiedad o estructura del destino del índice no coincide. Revise la instancia; no elimine tablas ajenas.',
      dependencies:
        'No está disponible una instancia, extensión o configuración de jobs del host. Revise el despliegue y reinicie si es necesario.',
    },
    invalidValue: 'Revise este valor.',
    title: 'Configuración del índice de conocimiento',
    description:
      'Configure la indexación de búsqueda para todos los espacios de conocimiento.',
    progress: 'Progreso de indexación',
    instance: 'Instancia de indexación',
    off: 'Desactivado — solo búsqueda de texto',
    missingForm:
      'El formulario de esta instancia no está disponible. Se conservan las opciones guardadas.',
    statusFailed: 'No se pudo actualizar el estado del índice.',
    loadFailed:
      'No se pudo cargar la configuración. Compruebe sus permisos e inténtelo de nuevo.',
    saveFailed: 'La solicitud no fue aceptada. Se conservó el borrador.',
    conflict:
      'La configuración cambió en otra sesión. Recargue la última revisión sin descartar su borrador, revíselo y vuelva a guardar.',
    saved: 'Solicitud aceptada. La indexación continúa en segundo plano.',
    workFailed:
      'Fallaron algunas tareas. Revise la instancia y el servicio del modelo y vuelva a intentarlo.',
    rebuild: 'Reconstruir todos los espacios',
    retry: 'Reintentar tareas fallidas',
    confirmTitle: 'Confirmar cambio global del índice',
    confirmRebuild:
      'Afecta a todos los espacios y puede volver a generar los vectores de todos los documentos, generar costes del modelo y necesitar más almacenamiento. El índice actual sigue disponible hasta que el nuevo esté listo.',
    confirmDisable:
      'Desactiva la búsqueda por índice en todos los espacios. La búsqueda de texto sigue disponible. La limpieza se ejecuta en segundo plano.',
    discardTitle: '¿Descartar cambios sin guardar?',
    discardDescription:
      'Se perderá la configuración del índice que no haya guardado.',
    discard: 'Descartar cambios',
    confirm: 'Confirmar',
    documents:
      'Documentos: {{done}} / {{total}} · Pendientes: {{pending}} · Fallidos: {{failed}}',
    chunks: 'Fragmentos preparados: {{prepared}} · Confirmados: {{committed}}',
    availability: {
      disabled: 'Desactivado — solo búsqueda de texto',
      unavailable:
        'Índice no disponible — la búsqueda de texto sigue disponible',
      building: 'Creando índice',
      ready: 'Índice listo',
      degraded: 'Índice degradado — la búsqueda de texto sigue disponible',
    },
    table: 'Nombre de tabla',
    modelService: 'Servicio de modelos',
    model: 'Modelo de embeddings',
    chooseService: 'Elegir un servicio de modelos',
    chooseModel: 'Selecciona o escribe el nombre del modelo',
    loadingModels: 'Cargando modelos de embeddings…',
    modelsUnavailable:
      'Los modelos de embeddings no están disponibles. Comprueba el servicio y vuelve a intentarlo.',
  },
  access: {
    businessSection: 'Conocimiento',
    businesses: {
      knowledge: {
        title: 'Conocimiento',
        description: 'Los documentos de cada espacio de conocimiento.',
        actions: {
          read: {
            title: 'Leer conocimiento',
            description:
              'Leer el conocimiento del sistema y el de los espacios relacionados con ellos',
            related: 'Leer conocimientos (espacios relacionados con ellos)',
            relatedLabel: 'Espacios relacionados conmigo',
            relatedHint:
              'La aplicación decide qué espacios se relacionan con quién',
            all: 'Leer conocimientos (todos)',
          },
          propose: {
            title: 'Proponer conocimiento',
            description:
              'Proponer un cambio para que alguien que pueda editar decida; qué agentes se pueden administrar',
            related: 'Proponer conocimientos (espacios relacionados con ellos)',
            relatedLabel: 'Espacios relacionados conmigo',
            relatedHint:
              'La aplicación decide qué espacios se relacionan con quién',
            all: 'Proponer conocimientos (todos)',
          },
          edit: {
            title: 'Editar conocimiento',
            description:
              'Editar, archivar y marcar como verificadas y decidir las propuestas; el conocimiento del sistema necesita todo',
            related: 'Editar conocimientos (espacios relacionados con ellos)',
            relatedLabel: 'Espacios relacionados conmigo',
            relatedHint:
              'La aplicación decide qué espacios se relacionan con quién',
            all: 'Editar conocimientos (todos)',
          },
          manage: {
            title: 'Gestionar el acceso al conocimiento',
            description:
              'Cambiar quién puede acceder a cada carpeta y artículo, y mantener el acceso a todos ellos; el conocimiento del sistema necesita todo',
            related:
              'Gestionar el acceso al conocimiento (espacios relacionados con los mismos)',
            relatedLabel: 'Espacios relacionados conmigo',
            relatedHint:
              'La aplicación decide qué espacios se relacionan con quién',
            all: 'Administrar el acceso al conocimiento (todos)',
          },
        },
      },
    },
  },
  knowledge: {
    directory: {
      title: 'Conocimiento',
      system: 'Conocimiento del sistema',
      count_one: 'Documento {{count}}',
      count_other: 'Documentos {{count}}',
      archivedCount_one: 'Documento archivado {{count}}',
      archivedCount_other: '{{count}} documentos archivados',
      selectTarget: 'Abrir {{title}}',
      target: 'Crear en {{title}}',
      chooseTarget:
        'Elija un proyecto o conocimiento del sistema para crear en',
      expandAll: 'Expandir todo',
      collapseAll: 'Contraer todo',
      retry: 'Reintentar',
      allProposals: 'Todas las propuestas',
      reviewPage: 'Página {{page}} de {{pages}} · {{total}} total',
      previous: 'Anterior',
      next: 'Siguiente',
      empty: 'No hay espacios de conocimiento accesibles',
      emptyAccessHint:
        'Solicite a un administrador acceso al conocimiento del proyecto o del sistema.',
      noAccess: 'Este conocimiento no está disponible o ya no tienes acceso.',
      emptyHint:
        'Abra este espacio para crear un documento o solicite a un editor que añada uno.',
      createFailed:
        'No se pudo crear esta entrada. Comprueba el objetivo y vuelve a intentarlo.',
      showResults: 'Mostrar los mejores resultados para “{{q}}”',
      topResults:
        'Secciones mejor clasificadas en todos los proyectos y conocimientos del sistema.',
      welcome:
        'Amplíe un proyecto o conocimiento compartido del sistema para explorar documentos. Seleccione un espacio para crear allí o busque en todos los conocimientos autorizados.',
      count_many: 'Documentos {{count}}',
      archivedCount_many: '{{count}} documentos archivados',
    },
    title: 'Conocimiento',
    someone: 'Alguien',
    loading: 'Cargando',
    index: {
      states: {
        pending: 'Esperando',
        done: 'Indexado',
        failed: 'Falló',
      },
      done: 'Indexado',
      pending: 'Indexación {{indexed}}/{{total}}',
      failed: 'Falló la indexación',
      failedHint:
        'Algunas secciones no se pudieron insertar después de cada intento.',
      reason: 'Motivo: {{reason}}',
      retry: 'Índice nuevamente',
      refreshFailed: 'No se puede actualizar el estado de indexación',
      retryRefresh: 'Reintentar actualización',
      queued: 'En cola para indexación nuevamente',
    },
    chunks: {
      open: 'Ver secciones',
      title: 'Secciones',
      description:
        'Las secciones {{count}} están cortadas en la versión actual de "{{title}}"; la búsqueda y las citas funcionan sección por sección. Elija uno para encontrarlo en el documento.',
      lead: '(Antes del primer título)',
      lines: 'Líneas {{start}}–{{end}}',
      chars_one: 'Carácter {{count}}',
      chars_other: 'Caracteres {{count}}',
      empty: 'Este documento aún no tiene secciones.',
      showing: 'Resaltado de líneas {{start}}–{{end}}.',
      clear: 'Borrar resaltado',
      chars_many: 'Caracteres {{count}}',
    },
    chunking: {
      title: 'Configuración de sección',
      description:
        'Los artículos y archivos (su texto extraído) en {{space}} se cortan en secciones en sus encabezados para búsqueda y citas: Word mantiene sus propios encabezados, cada PDF o página de diapositivas y cada hoja es un encabezado de nivel 2, y el texto sin encabezados se corta por longitud. Este espacio se puede cortar de forma diferente al predeterminado.',
      own: 'Configurado para este espacio',
      defaults:
        'Predeterminado: rumbos hacia abajo al nivel {{depth}}, apuntando a personajes {{target}}, como máximo {{max}}.',
      depth: 'Cortar en los encabezados',
      depths: {
        '1': 'Nivel 1 solamente (#)',
        '2': 'Bajar al nivel 2 (##)',
        '3': 'Bajar al nivel 3 (###)',
      },
      depthHint:
        'Los títulos más profundos permanecen dentro de su sección. Sólo en el nivel 1, los archivos no se cortan por página u hoja.',
      target: 'Longitud objetivo (caracteres)',
      max: 'Límite (caracteres)',
      sizesHint:
        'Una sección más larga que el límite se corta entre párrafos en pedazos cerca del objetivo; Los bloques de código y las tablas nunca se cortan.',
      invalid:
        'Las longitudes son de {{min}} a {{max}}, y el objetivo es como máximo el límite.',
      effect:
        'Al guardar se cortan los documentos nuevamente en segundo plano y se vuelven a indexar sus secciones cuando la búsqueda semántica está activada.',
      rechunking: 'Cortando los documentos nuevamente en segundo plano…',
      save: 'Guardar',
      saved: 'Configuración de sección guardada',
    },
    loadFailed: 'No se puede cargar el conocimiento',
    kinds: {
      folder: 'Carpeta',
      article: 'Artículo',
      file: 'Archivo',
    },
    folder: {
      empty: 'Esta carpeta está vacía.',
    },
    new: {
      label: 'Nuevo',
      article: 'Nuevo artículo',
      folder: 'Nueva carpeta',
      childArticle: 'Nuevo artículo en el interior.',
      childFolder: 'Nueva carpeta dentro',
    },
    files: {
      upload: 'Subir archivos',
      uploadHere: 'Subir archivos aquí',
      dropHint: 'Suelte los archivos aquí, o en una carpeta, para cargarlos.',
      uploaded_one: 'Archivo {{count}} cargado; se está extrayendo su texto.',
      uploaded_other:
        'Archivos {{count}} cargados; se está extrayendo su texto.',
      download: 'Descargar',
      version: 'Versión {{version}}',
      statusHint: {
        parsing:
          'El texto está siendo extraído; La búsqueda encuentra el archivo una vez que está listo.',
        ready:
          'Su texto se extrae, por lo que la búsqueda y los agentes lo leen.',
        failed: 'No se pudo extraer el texto.',
        unsupported:
          'El texto no se extrae de archivos de este tipo; se almacena tal cual.',
      },
      replace: 'Reemplazar',
      replaced: 'Reemplazado: versión {{version}}.',
      reparse: 'Extraer de nuevo',
      file: 'Archivo',
      propose: 'Proponer',
      proposeNew: 'Proponer un archivo',
      proposeNewHint:
        'Alguien que pueda editar este conocimiento decide; al aceptarlo se agrega el archivo.',
      proposeReplace: 'Proponer un reemplazo',
      proposeReplaceHint:
        'Alguien que pueda editar este conocimiento decide; aceptarlo convierte a su archivo en la próxima versión de {{title}}.',
      proposeReasonHint: 'Por qué pertenece aquí, para quien lo decida.',
      proposed: 'Propuesto; alguien que pueda editar decide.',
      preview: 'Vista previa',
      text: 'Texto extraído',
      failed: 'No se pudo extraer el texto: {{reason}}',
      status: {
        parsing: 'Extrayendo texto',
        ready: 'Texto extraído',
        failed: 'La extracción falló',
        unsupported: 'Sólo almacenado',
      },
      noText: {
        parsing: 'El texto está siendo extraído; aparece aquí una vez listo.',
        ready: 'El archivo no contiene texto.',
        failed: 'No se pudo extraer el texto.',
        unsupported:
          'El texto no se extrae de archivos de este tipo; el archivo se almacena tal cual.',
      },
      uploaded_many:
        'Archivos {{count}} cargados; se está extrayendo su texto.',
    },
    spaces: {
      actions: 'Acciones espaciales',
      access: 'Acceso al espacio',
      proposeOnly: 'Proponer sólo',
      inherited: 'Heredado',
      inheritedHint: 'Heredado de otro espacio; sólo lectura aquí.',
      default: 'Conocimiento',
      readOnly: 'Sólo lectura',
      empty: 'Aún no hay documentos.',
    },
    tree: {
      actions: 'Acciones',
      expand: 'Ampliar',
      collapse: 'Colapso',
      label: 'Documentos',
      newDoc: 'Nuevo documento',
      archived: 'Mostrar archivado',
      archivedBadge: 'Archivado',
      pending: '{{count}} esperando',
      back: 'Todos los documentos',
      restricted:
        'Restringido: sólo las personas enumeradas podrán acceder a él',
    },
    doc: {
      permissions: 'Permisos',
      restricted: 'Restringido · {{count}}',
      restrictedHint:
        'Sólo podrán acceder al mismo las personas enumeradas y quien administre el espacio.',
      verifiedLabel: 'Verificado',
      versionBy: 'v{{version}} · {{name}}',
      proposeChanges: 'Proponer cambios',
      more: 'Más acciones',
      pending_one: '{{count}} pendiente',
      pending_other: '{{count}} pendiente',
      updatedAgo: 'Actualizado {{time}}',
      updatedDetail: '{{name}}·v{{version}}',
      renameTitle: 'Cambiar nombre a “{{title}}”',
      renamedToast: 'Renombrado.',
      notFound: 'Este documento ya no existe o es posible que no lo veas.',
      notVerified: 'Aún no verificado',
      contents: 'Contenido',
      edit: 'Editar',
      rename: 'Cambiar nombre',
      history: 'Historia',
      verify: 'Marca verificada',
      verifiedToast: 'Marcado verificado.',
      archive: 'Archivar',
      archiveTitle: '¿Archivar “{{title}}”?',
      archiveDescription:
        'Desaparece del árbol y de los agentes. Puedes restaurarlo más tarde; sus versiones se mantienen.',
      archivedToast: 'Archivado.',
      restore: 'Restaurar',
      restoredToast: 'Restaurado.',
      move: 'Mover',
      moveTitle: 'Mover “{{title}}”',
      moveTo: 'Bajo',
      root: 'En el nivel superior',
      movedToast: 'Movido.',
      archivedNotice: 'Este documento está archivado y es de sólo lectura.',
      oldVersion: 'Estás leyendo la versión {{version}}.',
      backToCurrent: 'Volver a la versión actual',
      proposals: 'Propuestas en espera',
      empty: 'Este documento está vacío.',
      pending_many: '{{count}} pendiente',
    },
    editor: {
      editing: 'Edición',
      proposing: 'Proponer cambios',
      properties: 'Propiedades',
      propertiesHint: 'Qué leen los agentes y enlaces sobre este documento.',
      nothingToPreview: 'Aún no hay nada que ver.',
      reasonPlaceholder: 'Por qué esto debería cambiar, para quien decida',
      submitProposal: 'Enviar propuesta',
      proposed: 'Propuesto; alguien que pueda editar decide.',
      title: 'Título',
      slug: 'Babosa',
      slugHint:
        'Letras minúsculas, dígitos y guiones; cómo lo nombran los agentes y enlaces. Si se deja vacío, se elabora a partir del título.',
      summary: 'Resumen',
      summaryHint: 'Agentes de una línea leen en el índice.',
      content: 'Contenido',
      contentPlaceholder: 'Markdown',
      write: 'Escribir',
      preview: 'Vista previa',
      note: 'Nota de cambio',
      notePlaceholder: 'Qué cambió, para el historial (opcional)',
      parent: 'Padre',
      save: 'Guardar',
      saved: 'Guardado como versión {{version}}.',
      unchanged: 'Nada cambió.',
      create: 'Crear',
      created: 'Documento creado.',
      cancel: 'Cancelar',
      conflict:
        'Alguien guardó la versión {{version}} mientras editabas. Copie su texto, vuelva a cargarlo y aplique el cambio nuevamente.',
      reload: 'Recargar',
    },
    history: {
      by: 'por {{name}}',
      title: 'Historia',
      current: 'Actual',
      fromProposal: 'De una propuesta',
      compare: 'Comparar',
      with: 'con',
      previous: 'la versión anterior',
      noChanges: 'Sin diferencias.',
      view: 'Ver',
      unchangedLines: '{{count}} líneas sin cambios',
      approvedBy: 'aprobado por {{name}}',
    },
    search: {
      description:
        'Buscar los documentos de este espacio y los espacios que hereda.',
      hint: 'Escriba para buscar títulos y texto.',
      emptyHint: 'Pruebe con otras palabras, o con menos.',
      all: 'Mostrar todos los resultados para “{{q}}”',
      resultsFor: 'Resultados para “{{q}}”',
      placeholder: 'Buscar conocimiento',
      label: 'Buscar conocimiento',
      empty: 'No se encontró nada para “{{q}}”.',
      results: 'Resultados',
      inherited: 'Heredado',
    },
    home: {
      emptyTitle: 'Aún no hay documentos en {{space}}',
      emptyEdit: 'Escriba el primer artículo o cargue archivos para comenzar.',
      emptyPropose:
        'Proponga un archivo y alguien que pueda editarlo decide si se agrega.',
      emptyRead: 'Aquí todavía no se ha escrito nada.',
      count_one: 'Documento {{count}}',
      count_other: 'Documentos {{count}}',
      pending_one: 'Esperando revisión ({{count}})',
      pending_other: 'Esperando revisión ({{count}})',
      all: 'Ver todo',
      recent: 'Actualizado recientemente',
      updated: '{{time}} · {{name}}',
      unindexed: 'No completamente indexado',
      unindexedFailed: '{{failed}} falló · {{pending}} esperando',
      unindexedPending_one: 'Sección {{count}} en espera',
      unindexedPending_other: 'Secciones {{count}} en espera',
      unverified: 'No verificado últimamente',
      verifiedAgo: 'Verificado {{time}}',
      count_many: 'Documentos {{count}}',
      pending_many: 'Esperando revisión ({{count}})',
      unindexedPending_many: 'Secciones {{count}} en espera',
    },
    diff: {
      changes_one: 'Cambio {{count}}',
      changes_other: 'Cambios en {{count}}',
      previous: 'Cambio anterior',
      next: 'Próximo cambio',
      layout: 'Diseño de diferencias',
      inline: 'En línea',
      split: 'Dividir',
      changes_many: 'Cambios en {{count}}',
    },
    access: {
      you: {
        manage: 'Puedes gestionar',
        edit: 'Puedes editar',
        propose: 'Puedes proponer',
        read: 'Puedes leer',
        none: 'Sin acceso',
      },
      title: 'Acceso al espacio',
      description: 'Quién puede acceder a {{space}}.',
      yours: 'Tu acceso',
      actions: {
        read: 'Leer los documentos y buscarlos',
        propose: 'Proponer cambios para que alguien que pueda editar decida',
        edit: 'Editar, organizar y verificar documentos',
        manage: 'Cambiar quién puede acceder a cada carpeta y artículo',
      },
      allowed: 'Permitido',
      notAllowed: 'No permitido',
      matrix: 'Por rol',
      role: 'Rol',
      columns: {
        read: 'Leer',
        propose: 'Proponer',
        edit: 'Editar',
        manage: 'Administrar',
      },
      from: 'Fuente: {{source}}',
      source: {
        space: 'tu acceso a {{space}}',
        manager: 'manejas {{space}}',
        entry: '{{subject}}, configurado en “{{title}}”',
      },
      restrictedAt:
        'Restringido en “{{title}}”: sólo podrán acceder a él las personas allí indicadas.',
      viewOnly:
        'Sólo quien lo administra puede cambiar quién puede acceder a él.',
      mine: '(tuyo)',
      howTitle: 'Cómo funciona el acceso aquí',
      agents:
        'Los agentes que actúan por cuenta de alguien leen y proponen como máximo; nunca editan ni deciden.',
      manage: 'Cambio de roles',
    },
    permissions: {
      title: 'Permisos de “{{title}}”',
      description: {
        folder:
          'Quién puede leer, proponer, editar y administrar esta carpeta y lo que contiene.',
        article:
          'Quien podrá leer, proponer, editar y gestionar este artículo.',
        file: 'Quien podrá leer, proponer, editar y administrar este expediente.',
      },
      modeLabel: 'Acceso',
      modes: {
        inherit: 'Heredar de su padre',
        custom: 'Sólo las personas enumeradas',
      },
      inheritHint:
        'Quien pueda acceder a su padre también podrá acceder a él, y las personas agregadas a continuación obtienen al menos su nivel.',
      customHint:
        'Sólo las personas enumeradas a continuación podrán acceder a él, cualquiera que sea su padre lo permita; lo que está debajo de él sigue a menos que él mismo se restrinja.',
      inherited: 'Heredado',
      fromSpace: 'Todas las personas con acceso a {{space}}, según sus roles',
      fromDoc: 'De “{{title}}”',
      fromRestricted:
        'De “{{title}}”, al que sólo podrán acceder las personas indicadas',
      added: 'También tiene acceso',
      listed: 'Personas enumeradas',
      add: 'Añadir personas',
      addPlaceholder: 'Añadir personas, roles…',
      noMatches: 'Sin coincidencias.',
      noneAdded: 'Nadie más allá de lo heredado.',
      noneListed:
        'Nadie en la lista: sólo podrá acceder a él quien administre el espacio.',
      managers:
        'Quien administra el espacio siempre mantiene el acceso. Los agentes leen y proponen como máximo, y sólo lo que ellos y su persona pueden.',
      levelOf: 'Nivel de {{subject}}',
      levels: {
        read: 'Sabe leer',
        propose: 'Puede proponer',
        edit: 'Puede editar',
        manage: 'Puede gestionar',
      },
      remove: 'Quitar',
      removedSubject: 'Eliminado ({{id}})',
      save: 'Guardar',
      close: 'Cerrar',
      saved: 'Permisos guardados.',
      loadFailed: 'No se pueden cargar los permisos.',
    },
    searchTest: {
      title: 'Prueba de búsqueda',
      description:
        'Ejecuta una búsqueda como lo haría usted y muestra cómo se clasificó cada resultado: su relevancia, su clasificación por palabras clave y por significado, la puntuación de reclasificación y dónde se encuentra en su documento.',
      keyword: 'Palabras clave',
      semantic: 'Significado',
      relevance: 'Relevancia {{score}}',
      rank: '{{name}} #{{rank}} · {{score}}',
      unranked: '{{name}}: no encontrado',
      lines: 'Líneas {{start}}–{{end}}',
      notExplained:
        'Los detalles de clasificación se muestran solo a las personas que administran el espacio o la configuración de búsqueda.',
      query: 'Palabras para buscar',
      run: 'Buscar',
      fused: '{{score}} fusionado',
      provider: '{{name}} #{{rank}} · {{score}}',
      reranked: '{{score}} reclasificado',
      notReranked: 'No reclasificado',
    },
    proposals: {
      listTitle: 'Propuestas',
      statuses: {
        pending: 'Pendiente',
        accepted: 'Aceptado',
        rejected: 'Rechazado',
        withdrawn: 'Retirado',
      },
      none: {
        pending: 'No hay nada pendiente de revisión.',
        accepted: 'Aún no se han aceptado propuestas.',
        rejected: 'Ninguna propuesta rechazada.',
      },
      about: 'En “{{title}}”',
      clearAbout: 'Mostrar todas las propuestas',
      onBehalf: '{{proposer}} en nombre de {{person}}',
      overview: 'Descripción general',
      changes: 'Cambios',
      staleTitle: 'El documento cambió desde',
      decision: 'Decisión',
      commentLabel: 'Comentario',
      pendingEntry: 'Pendiente de revisión · {{count}}',
      kinds: {
        update: 'Cambiar',
        create: 'Nuevo documento',
        verify: 'Aún se mantiene',
      },
      by: '{{proposer}} para {{person}}',
      from: 'De {{source}}',
      reason: 'Razón',
      summary: 'Resumen',
      stale:
        'El documento cambió desde que se escribió (v{{base}} → v{{current}}). Al aceptar se reemplaza la versión actual con la propuesta completa.',
      diffProposed: 'Cambio propuesto (v{{base}} → propuesta)',
      diffCurrent: 'Contra la versión actual (v{{current}} → propuesta)',
      newContent: 'Contenido propuesto',
      newFile: 'Archivo propuesto',
      replacementFile: 'Reemplazo para la versión {{base}}',
      fileNote: 'Su texto se extrae una vez aceptado.',
      verifyNote:
        'Nada en el documento cambia; está marcado como verificado hoy.',
      accept: 'Aceptar',
      acceptAnyway: 'Aceptar de todos modos',
      reject: 'Rechazar',
      comment: 'Comentario (opcional)',
      accepted: 'Aceptado.',
      rejected: 'Rechazado.',
      decided: '{{outcome}} por {{name}}',
      open: 'Abrir',
      readOnly: 'Alguien que pueda editar este conocimiento lo decide.',
    },
  },
  errors: {
    KNOWLEDGE_PROPOSAL_PENDING:
      'Su propuesta anterior para este documento aún está esperando; primero hay que decidirlo.',
    KNOWLEDGE_PROPOSAL_REJECTED:
      'El mismo cambio fue rechazado anteriormente; proponer algo diferente.',
    EMPTY_CONTENT: 'El contenido propuesto está vacío.',
    INVALID_REASON:
      'Diga por qué debería cambiar (como máximo 500 caracteres).',
    KNOWLEDGE_VERSION_CONFLICT:
      'Mientras tanto, alguien guardó una versión más nueva; recarga y aplica tu cambio nuevamente.',
    KNOWLEDGE_SLUG_TAKEN: 'Otro documento en este espacio tiene esa nota.',
    KNOWLEDGE_HAS_CHILDREN: 'Archivar o mover sus subdocumentos primero.',
    KNOWLEDGE_ARCHIVED:
      'El documento se encuentra archivado; restaurarlo primero.',
    KNOWLEDGE_DEPTH_EXCEEDED:
      'Los documentos se anidan como máximo en cuatro niveles de profundidad.',
    KNOWLEDGE_INVALID_MOVE:
      'Un documento no puede ir debajo de sí mismo ni de uno de los suyos.',
    KNOWLEDGE_PROPOSAL_STALE:
      'El documento cambió desde que se redactó la propuesta.',
    KNOWLEDGE_PROPOSAL_DECIDED: 'Esta propuesta ya ha sido decidida.',
    INVALID_SLUG: 'El slug toma letras minúsculas, dígitos y guiones.',
    INVALID_TITLE: 'Se requiere un título (máximo 200 caracteres).',
    FILE_TOO_LARGE: 'El archivo es demasiado grande.',
    FILES_UNAVAILABLE: 'Esta aplicación no almacena archivos.',
    INVALID_FILE: 'Enviar un archivo.',
    INVALID_PARENT: 'No hay nada que se guarde en un expediente.',
    KNOWLEDGE_NOT_FAILED:
      'Sólo se vuelve a extraer un archivo cuyo texto no se pudo extraer.',
  },
  ui: {
    nav: {
      knowledge: 'Conocimiento',
    },
  },
  common: {
    forbidden: 'No tiene permiso para hacer esto.',
    requestFailed: 'La solicitud falló. Por favor inténtalo de nuevo.',
  },
};

export default esES;
