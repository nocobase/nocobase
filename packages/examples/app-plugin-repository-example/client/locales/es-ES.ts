import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  closeDialog: 'Cerrar',
  sortTitle: 'Ordenar ejemplos',
  sortIntro:
    'Ejecute ejemplos de clasificación de solo lectura utilizando el cliente del repositorio HTTP. Los fragmentos del constructor acompañan a las solicitudes serializadas reales; Las tablas conservan el orden de respuesta del servidor. Las consultas devuelven como máximo 10 raíces y reutilizan el CRM y las semillas de relaciones existentes.',
  sortLimits:
    'Utilice nombres de campos lógicos. Muchos caminos requieren agregados; to-one incluye no acepta clasificación local. El cursor requiere ejes escalares directos que no aceptan valores NULL y un desempate único; distinto sólo acepta clasificación escalar directa con un desempate único. El texto y JSON no se pueden ordenar.',
  sortRequest: 'Solicitud real · JSON AST',
  sortResultHint:
    'Las filas conservan el orden del servidor. Los valores de relación se seleccionan explícitamente; las vistas previas de registros pueden ser más cortas que los recuentos agregados.',
  sortExpectedError: 'Error de validación esperado',
  sortUnexpectedSuccess: 'Esta consulta no válida tuvo éxito inesperadamente.',
  sort_default_title: 'Orden de clave primaria predeterminado',
  sort_default_description:
    'Omitir clasificación: los clientes se devuelven mediante clave primaria ascendente.',
  sort_asc_title: 'Precio del producto ascendente',
  sort_asc_description:
    'Devuelve una única expresión ascendente para UnitPriceCents; los precios son centavos enteros.',
  sort_desc_title: 'Precio del producto descendente',
  sort_desc_description:
    'Devuelve una única expresión descendente para UnitPriceCents; los precios son centavos enteros.',
  sort_multi_title: 'Múltiples campos y desempates automáticos',
  sort_multi_description:
    'Cantidad descendente, luego precio instantáneo ascendente. Los pares iguales utilizan el orden ascendente de ID adjunto; demo-item-3 y demo-item-7 demuestran el empate.',
  'sort_nulls-first_title': 'Valores NULOS primero',
  'sort_nulls-first_description':
    'AssigneeId anulable ascendente con NULL primero. Las tareas no asignadas permanecen visibles y la identificación rompe los vínculos.',
  'sort_nulls-last_title': 'Últimos valores NULL',
  'sort_nulls-last_description':
    'AssigneeId anulable ascendente con NULL al final. La ubicación explícita evita los valores predeterminados NULL específicos de la base de datos.',
  'sort_to-one_title': 'Ordenar a través de una relación a uno',
  'sort_to-one_description':
    'Nombre del cesionario descendente, faltan los últimos cesionarios. Una inclusión separada devuelve el nombre utilizado para ordenar.',
  sort_count_title: 'Recuento de relaciones y selección filtrada',
  sort_count_description:
    'Clasificar por todos los pedidos, incluido el recuento 0.paidCount selecciona pedidos pagados únicamente; su filtro no afecta la clasificación de raíz.',
  sort_include_title: 'Orden de inclusión independiente',
  sort_include_description:
    'Los clientes ascienden por ID mientras que los pedidos de cada cliente descienden por número. Se aplica el límite de dos registros por cliente.',
  sort_duplicate_title: 'Rechazado: objetivo de clasificación duplicado',
  sort_duplicate_description:
    'El mismo campo no puede aparecer dos veces, incluso con direcciones diferentes. Ejecute para inspeccionar INVALID_SORT.',
  'sort_to-many_title': 'Rechazado: ruta de campo directa a muchos',
  'sort_to-many_description':
    'items.quantity tiene varios valores por producto. Use una agregación explícita de la relación.',
  sort_sum_title: 'Clasificación SUM de relación',
  sort_sum_description:
    'Clasificar los productos por SUMA de la cantidad de artículos, descendiendo primero con NULL. Las relaciones vacías se clasifican como 0, aunque la SUM seleccionada es NULL. Las métricas y las filas de elementos se seleccionan explícitamente.',
  sort_avg_title: 'Clasificación AVG de relación',
  sort_avg_description:
    'Clasifique los productos por AVG de la cantidad de artículos, descendiendo primero con NULL. Las relaciones vacías se ordenan como NULL. Las métricas y las filas de elementos se seleccionan explícitamente.',
  sort_min_title: 'Clasificación MIN de relación',
  sort_min_description:
    'Clasificar los productos por cantidad MIN de artículo, descendiendo primero con NULL. Las relaciones vacías se ordenan como NULL. Las métricas y las filas de elementos se seleccionan explícitamente.',
  sort_max_title: 'Clasificación MAX de relación',
  sort_max_description:
    'Clasificar los productos según la cantidad MÁXIMA de artículos, descendiendo primero con NULL. Las relaciones vacías se ordenan como NULL. Las métricas y las filas de elementos se seleccionan explícitamente.',
  selectCombineTitle: 'Seleccionar combinar',
  selectCombineIntro:
    'Devuelve listas de registros con nombre y agregados escalares de la misma relación con select.combine. Cada ejemplo ejecuta una solicitud findMany del repositorio de solo lectura.',
  combineScopeHint:
    'Muestra los primeros 10 registros raíz por ID. Se aplican límites de relación por matriz y por sucursal. Ejecute las migraciones y semillas de la aplicación si no existen registros de ejemplo.',
  combineRequest: 'Solicitud · seleccione AST',
  combineTable: 'Tabla de datos',
  combineJson: 'JSON sin procesar',
  combineNoRelated: 'No hay registros relacionados',
  combineTableHint:
    'Las columnas utilizan rutas de campo de respuesta. Las ramas de registros aparecen como tablas anidadas; NULL se diferencia de cero y listas vacías.',
  combineRun: 'Ejecutar consulta',
  combineResult: 'Resultado de la consulta',
  combineResultHint:
    'Respuesta real: las ramas con nombre viven dentro de cada objeto de relación.',
  combineEmpty:
    'No hay registros raíz. Ejecute las migraciones y semillas de la aplicación, o cree registros de ejemplo.',
  combine_preview_title: 'Vista previa de pedidos y sucursales independientes',
  combine_preview_description:
    'Un pedido en vista previa, el recuento completo de pedidos, el recuento pagado y los registros cancelados. El límite de vista previa no limita las ramas hermanas. Los clientes sin pedidos mantienen listas vacías y conteos cero.',
  combine_statistics_title: 'Registros de artículos y agregados múltiples',
  combine_statistics_description:
    'Dos filas de artículos junto a COUNT, cantidad SUM y precios unitarios instantáneos AVG/MIN/MAX en centavos. AVG no está ponderado; una relación vacía devuelve el recuento 0 y nulo para los demás agregados.',
  combine_nested_title: 'Órdenes, artículos y productos anidados',
  combine_nested_description:
    'Cada cliente obtiene una vista previa y un recuento del pedido. Cada pedido con vista previa combina una vista previa del artículo, un recuento y una suma de cantidad; Los registros de artículos también incluyen el nombre del producto.',
  combine_scoped_title: 'Filtro compartido y filtros locales de sucursal',
  combine_scoped_description:
    'El filtro de tarea borrador se aplica a todas las sucursales. COUNT(assigneeId) cuenta a los cesionarios no nulos; no asignado agrega asignadoeeId = null. La vista previa de una fila no cambia ninguno de los recuentos.',
  combine_tags_title: 'Combinaciones de etiquetas de muchos a muchos',
  combine_tags_description:
    'Devuelve las etiquetas vinculadas de cada proyecto, el recuento total y el recuento de documentación. Los filtros de rama permanecen dentro de la relación de ese proyecto; Se excluyen las etiquetas no vinculadas.',
  apiExamples: 'Ejemplos de repositorio',
  labIntro:
    'Explore una operación de relación a la vez. Elija una relación, prepare un ejemplo independiente y luego use su forma y tabla. Cada tarjeta posee su proyecto y sus objetivos; cargar esta página no escribe nada.',
  labOperations: 'Operaciones de relación',
  labBoth: 'a uno / a muchos',
  labManyOnly: 'solo a muchos',
  labRelation: 'Tipo de relación',
  labPrepare: 'Preparar ejemplo',
  labPrepareAgain: 'Prepare un nuevo ejemplo',
  labRefresh: 'Actualizar tabla',
  labPrepareHint:
    'La preparación crea un proyecto y cuatro objetivos privados. La nueva preparación conserva ejemplos anteriores. La preparación utiliza múltiples solicitudes; cada escritura individual es transaccional.',
  labProject: 'Proyecto de ejemplo',
  labDefaultContent: 'Ejemplo de {{operation}} {{id}}',
  labSummary: 'Resumen del perfil',
  labLabel: 'Etiqueta de etiqueta',
  labTitle: 'Título de la tarea',
  labPoints: 'Puntos',
  labTarget: 'Registro de destino',
  labChoose: 'Elija un registro',
  labNewTarget: 'Crea un nuevo objetivo en la primera ejecución',
  labNoEligible:
    'Ningún objetivo elegible. Prepare un nuevo ejemplo para volver a intentarlo.',
  labSetTargets: 'Mantenga estos objetivos vinculados',
  labSetEmpty:
    'Desmarque todo para enviar conjunto: []. Los objetivos eliminados permanecen en la tabla de objetivos.',
  labThroughRole: 'Rol en este enlace (a través de.role)',
  labCurrentProfile: 'Perfil actual',
  labNoProfile: 'Actualmente no hay ningún perfil vinculado.',
  labDeleteHint:
    'Esto elimina el registro de destino de ejemplo seleccionado. No es una desconexión; la fila siguiente permanecerá como resultado de la eliminación.',
  labUpsertHint:
    'La primera ejecución puede crear un objetivo; Las ejecuciones posteriores con ese mismo objetivo lo actualizan. Los objetivos fuera de esta relación no son elegibles.',
  labExecute: 'Ejecutar {{operation}}',
  labRequest: 'Vista previa de la solicitud de esta operación',
  labSaved: 'La escritura de {{operation}} fue exitosa.',
  labRefreshFailed:
    'La escritura se realizó correctamente, pero no se pudo actualizar la tabla. Utilice Actualizar tabla antes de otra escritura.',
  labTargets: 'Objetivos y estado de relación',
  labTableHint:
    'Cada objetivo se lee de forma independiente: desconectar/establecer objetivos de mantenimiento, mientras que eliminarlos los elimina. Sólo se enumeran los objetivos de esta carta.',
  labRecord: 'Registro',
  labLinked: 'Vinculado a este proyecto',
  labExists: 'El objetivo existe',
  labDeleted: 'Objetivo eliminado',
  labYes: 'Sí',
  labNo: 'No',
  labLastCall: 'Última solicitud y respuesta ejecutadas',
  lab_create_title: 'Crear y vincular',
  lab_create_description:
    'Crear un objetivo a través de la relación. El repositorio llena las claves de relación. Una creación hasOne requiere una relación vacía en este ejemplo.',
  lab_connect_title: 'Vincular un objetivo existente',
  lab_connect_description:
    'Elige un objetivo no vinculado preparado para esta carta. Connect no crea ningún objetivo. Debe haber un objetivo hasOne disponible.',
  lab_disconnect_title: 'Desvincular y mantener el objetivo',
  lab_disconnect_description:
    'Borre un vínculo hasOne que acepte valores NULL, separe un destino HasMany o elimine un vínculo de unión a tabla. El objetivo permanece.',
  lab_set_title: 'Reemplazar el conjunto de relaciones',
  lab_set_description:
    'Mantener exactamente los objetivos existentes seleccionados. Sólo se establecen soporte de relaciones entre muchos; Tiene muchas claves anulables que permiten la eliminación.',
  lab_update_title: 'Editar un objetivo vinculado',
  lab_update_description:
    'Editar un objetivo dentro de la relación actual. Una actualización to-one utiliza su objetivo actual sin un selector.',
  lab_upsert_title: 'Actualizar o crear en el alcance de la relación',
  lab_upsert_description:
    'Crear cuando no hay ningún objetivo coincidente vinculado; de lo contrario, actualícelo. To-many utiliza una identificación única estable tanto para la búsqueda como para la creación.',
  lab_delete_title: 'Eliminar el registro de destino',
  lab_delete_description:
    'Eliminar un objetivo vinculado, sujeto a restricciones. Utilice únicamente los objetivos dedicados preparados para esta tarjeta; Los objetivos compartidos pueden afectar otras relaciones.',
  relationMutationsTitle: 'Escrituras de relación',
  relationMutationsIntro:
    'Ejecutar un flujo de trabajo de relación completo del Repositorio HTTP entre pertenece a, tiene uno, hasMany y pertenece a Many. Cada botón usa api.repository(nombre); no está implicado ningún criterio de valoración de mutación específico del ejemplo.',
  relationBaselineTitle: 'Línea base de relación inicial',
  relationBaselineDescription:
    'Los registros deterministas reflejan la documentación de escritura de relaciones del Repositorio mientras usan nombres de colección con prefijo de complemento.',
  relationSeedHint:
    'Ejecute las migraciones y semillas de la aplicación para crear los registros de ejemplo de relación.',
  relationRunTitle: 'Tutorial completo sobre mutaciones',
  relationRunDescription:
    'Crea un gráfico de proyecto aislado, aplica operaciones de relación incrementales y luego reemplaza su conjunto de etiquetas. Cada mutación raíz es transaccional.',
  relationRunButton: 'Ejecutar escritura de relación completa',
  relationRunIsolation:
    'Cada ejecución utiliza nuevos ID, por lo que los ejemplos anteriores permanecen disponibles para su inspección.',
  relationResultTitle: 'Estado final de la relación',
  relationResultDescription:
    'Se actualizaron el propietario y el perfil, se aplicaron operaciones de tareas en el alcance de la relación y el conjunto retuvo solo las etiquetas seleccionadas.',
  relationLifetimeTitle: 'Verificaciones de vida útil del objetivo',
  relationLifetimeDescription:
    'desconecte y establezca enlaces para eliminar pero mantenga los objetivos; eliminar elimina el registro de destino.',
  relationTraceHint:
    'Nombres reales de los repositorios, cargas útiles de createOne/updateOne y respuestas emitidas por esta ejecución.',
  relationOwnerLabel: 'pertenece a · propietario',
  relationProfileLabel: 'hasOne · perfil',
  relationTasksLabel: 'tiene muchas tareas',
  relationTagsLabel: 'pertenece a muchos · etiquetas',
  relationTasks: 'Tareas relacionadas',
  relationPoints: 'Puntos',
  relationAssignee: 'Persona asignada',
  relationDisconnectCheck:
    'desconexión: la tarea existe={{exists}}, projectId={{projectId}}',
  relationDeleteCheck: 'eliminar: la tarea existe={{exists}}',
  relationSetCheck: 'conjunto: la etiqueta eliminada existe={{exists}}',
  findManyTitle: 'findMany: matriz y secuencia',
  findManyIntro:
    'Ejecute la misma consulta del Repositorio en dos modos de consumo. Await se resuelve una vez con la matriz completa; La iteración asíncrona lee los registros NDJSON enmarcados a medida que llegan. La consulta, los filtros, la clasificación y los límites de la base de datos siguen siendo los mismos.',
  findManyArrayTitle: 'Espera una matriz',
  findManyArrayDescription:
    'En espera de findMany se envía una solicitud JSON normal y se resuelve con todos los registros coincidentes.',
  findManyStreamTitle: 'Iterar una secuencia',
  findManyStreamDescription:
    'El uso de for await envía una solicitud NDJSON y agrega cada registro decodificado a la tabla de resultados.',
  findManyProtocol: 'Respuesta HTTP',
  findManyRunArray: 'Ejecutar consulta de matriz',
  findManyRunStream: 'Ejecutar consulta de flujo',
  findManyReceived: 'Registros recibidos',
  findManyReceivedCount: 'Registros {{count}} recibidos',
  findManyResults: 'Resultados',
  findManyRecordTitle: 'Título',
  findManyCategory: 'Categoría',
  findManyDescription: 'Descripción',
  findManyEmpty:
    'Ejecute esta consulta para cargar los registros de ejemplo inicializados.',
  atomicTitle: 'Actualizaciones numéricas atómicas',
  atomicIntro:
    'Actualizar números directamente en la base de datos con incremento, decremento y multiplicación. Las solicitudes envían la operación, nunca un valor calculado a partir de una instantánea del navegador potencialmente obsoleta. Todos los usuarios que han iniciado sesión comparten estos contadores de ejemplo.',
  atomicStock: 'Stock de almacén',
  atomicStockHint:
    'Recibir o deducir unidades. La deducción verifica el stock disponible en la misma actualización, evitando el inventario negativo.',
  atomicWallet: 'Saldo de cuenta (centavos)',
  atomicWalletHint:
    'Recarga o gasta céntimos enteros. La condición de saldo y la resta se evalúan juntas en la base de datos.',
  atomicPoints: 'Puntos de recompensa',
  atomicPointsHint:
    'Sume puntos o duplique los puntos actuales usando multiplicar: 2. La duplicación usa el valor actual de la base de datos.',
  atomicVisits: 'Contador de visitas',
  atomicVisitsHint:
    'Incrementar una vez, o enviar 10 incrementos simultáneos: 1 solicitudes. Otros usuarios también podrán cambiar este contador compartido.',
  atomicAmount: 'Cantidad',
  atomic_increment: 'Aumento',
  atomic_decrement: 'Disminución (guardado)',
  atomic_multiply: 'Doble ×2',
  atomic_concurrent: '10 concurrentes +1',
  atomicSeedHint:
    'Ejecute las migraciones y semillas de la aplicación para crear este contador de ejemplo.',
  atomicInsufficient:
    'El contador fue eliminado o su valor actual es insuficiente. No se dedujo nada.',
  atomicUpdated: 'La base de datos devolvió el nuevo valor: {{value}}.',
  atomicConcurrentResult:
    '{{count}} de 10 incrementos simultáneos fue exitoso. El valor mostrado se vuelve a leer de la base de datos.',
  atomicPartial:
    'Algunos incrementos fallaron. Las solicitudes exitosas siguen comprometidas; Inspeccione los resultados antes de volver a intentarlo.',
  atomicTraceHint:
    'Entradas y respuestas reales de updateOne, incluidas las actualizaciones rechazadas. No se realizan reintentos automáticos.',
  groupByExamples: 'Más ejemplos de grupoPor',
  groupByMinimumCount: 'Mínimo de filas por grupo (nuevos ejemplos)',
  groupByEmpty:
    'Ningún grupo coincide con estos filtros. Reduzca el recuento mínimo o cambie el estado.',
  groupBy_customerRanking: 'Clasificación de pedidos de clientes',
  groupBy_customerRankingHint:
    'GRUPO POR ID de cliente · COUNT (*) · TENER recuento ≥ mínimo · recuento DESC, ID de cliente ASC. Los clientes sin pedidos coincidentes no forman un grupo.',
  groupBy_customerStatus: 'Cliente × estado del pedido',
  groupBy_customerStatusHint:
    'GRUPO POR ID de cliente, estado. Un mismo cliente puede aparecer en varios grupos de estados. TENER se aplica a cada combinación, no al total del cliente. Los grupos de enumeración conservan valores exactos; La clasificación utiliza recuento y ID de cliente.',
  groupBy_productPrice: 'Producto × precio unitario del artículo',
  groupBy_productPriceHint:
    'GROUP BY productId, unitPriceCents · COUNT(*) y SUM(cantidad). Los precios instantáneos de diferentes artículos permanecen separados incluso para el mismo producto. Ordenar por cantidad DESC, ID de producto ASC, precio ASC. Los precios son centavos; COUNT mide filas de artículos, no unidades.',
  aggregateApply: 'Aplicar',
  aggregateTitle: 'Consultas agregadas',
  aggregateIntro:
    'Estadísticas del lado de la base de datos sobre los pedidos y artículos existentes: agregado, groupBy con HAVING y recuentos de relaciones por cliente. Los filtros de estado se aplican a todos los paneles; la cantidad mínima se aplica sólo a grupos de productos. El recuento mínimo de filas se aplica a los tres ejemplos adicionales de groupB.',
  aggregateAll: 'Todos los estados',
  aggregateHaving: 'Cantidad mínima agrupada (TENIENDO)',
  aggregateMetrics: 'Agregados de artículos',
  aggregate_count: 'CONTAR · filas de elementos',
  aggregate_quantity: 'SUMA · cantidad',
  aggregate_averagePrice: 'AVG · precio unitario (centavos)',
  aggregate_minimumPrice: 'MIN · precio unitario (céntimos)',
  aggregate_maximumPrice: 'MAX · precio unitario (céntimos)',
  aggregateSemantics:
    'El precio medio es el promedio no ponderado de los precios unitarios de los artículos, no un total de pedido ni un precio ponderado por cantidad. Los conjuntos vacíos devuelven el recuento 0 y NULL para SUM/AVG/MIN/MAX. Los paneles ejecutan consultas independientes y pueden observar ediciones simultáneas.',
  aggregateStatuses: 'Órdenes agrupadas por estado · groupBy',
  aggregateCustomers: 'Agregados de relación con el cliente',
  aggregateCustomerHint:
    'Primeros clientes {{count}} por ID, incluidos los clientes sin pedidos coincidentes. Los recuentos utilizan el estado seleccionado.',
  aggregateProducts: 'Artículos agrupados por producto',
  aggregateTraceHint:
    'Llama a las acciones agregadas/groupBy del Repositorio configurado HTTP con AST JSON; Los recuentos de clientes utilizan selecciones de relaciones FindMany. Amplíe las solicitudes para inspeccionar las expresiones reales.',
  crm: 'Ejemplo de CRM',
  ordersTitle: 'Ejemplo de órdenes',
  subtitle:
    'Clientes, relaciones y pedidos, impulsados ​​por las API del repositorio.',
  customer: 'Cliente',
  contact: 'Contacto',
  product: 'Producto',
  order: 'Pedido',
  orderItem: 'Artículo de pedido',
  customers: 'Clientes',
  contacts: 'Contactos',
  products: 'Productos',
  orders: 'Pedidos',
  items: 'Ordenar artículos',
  name: 'Nombre',
  company: 'Compañía',
  email: 'Correo electrónico',
  phone: 'Teléfono',
  status: 'Estado',
  sku: 'SKU',
  unitPriceCents: 'Precio unitario (centavos)',
  number: 'Número de pedido',
  customerId: 'Cliente',
  orderId: 'Pedido',
  productId: 'Producto',
  quantity: 'Cantidad',
  lead: 'Cliente potencial',
  active: 'Activo',
  inactive: 'Inactivo',
  draft: 'Borrador',
  confirmed: 'Confirmado',
  paid: 'Pagado',
  cancelled: 'Cancelado',
  new: 'Nuevo registro',
  edit: 'Editar',
  view: 'Ver detalles',
  delete: 'Eliminar',
  save: 'Guardar',
  cancel: 'Cancelar',
  search: 'Buscar por nombre/número/ID',
  apply: 'Buscar',
  refresh: 'Actualizar',
  previous: 'Anterior',
  next: 'Siguiente',
  page: 'Página {{page}}',
  count: 'Registros {{count}}',
  empty: 'Aún no hay registros. Cree el primer registro para comenzar.',
  loading: 'Cargando…',
  listFeedback: {
    loading: 'Cargando',
    empty: 'Aún no hay datos',
    noResults: 'No hay resultados',
    forbidden: 'Acceso denegado',
    unauthenticated: 'La sesión ha caducado',
    failed: 'No se pudo cargar la lista',
    refreshFailed: 'No se pudo actualizar; se muestran los datos anteriores',
    retry: 'Reintentar',
    retrying: 'Reintentando…',
    clear: 'Borrar filtros',
    signIn: 'Iniciar sesión',
  },
  select: 'Seleccionar un registro',
  createTitle: 'Crear {{entity}}',
  editTitle: 'Editar {{entity}}',
  details: 'Detalles del registro',
  relations: 'Registros relacionados',
  none: 'Ninguno',
  lookup: 'Buscar por ID',
  check: 'Comprobar y abrir',
  notFound: 'No hay registro con esta identificación.',
  found: 'El registro existe.',
  saved: 'Registro guardado.',
  deleted: 'Registro eliminado.',
  confirmDelete:
    '¿Eliminar este registro? También se eliminarán los contactos relacionados o los artículos de pedido. Los clientes con pedidos y productos utilizados por artículos de pedido no se pueden eliminar.',
  confirm: 'Confirmar eliminación',
  trace: 'Llamadas al repositorio',
  traceHint:
    'La última solicitud y el resultado muestran el API utilizado en esta pantalla.',
  error: 'La operación falló.',
  loadError:
    'No se pueden cargar registros. Vuelva a intentarlo con Actualizar.',
  conflict:
    'Esta orden cambió desde que la abrió. Actualízalo y vuelve a abrirlo antes de editarlo.',
  choicesHint:
    'Cree primero clientes y productos, luego pedidos y sus artículos.',
  moneyHint:
    'Los precios son centavos enteros. Total de línea = cantidad × precio unitario; sin matemáticas de moneda de punto flotante.',
  version: 'Versión',
  addItem: 'Añadir elemento',
  removeItem: 'Eliminar elemento',
  orderTotal: 'Total del pedido (centavos)',
  noItems: 'Sin artículos de pedido.',
  itemRow: 'Artículo {{number}}',
  lineTotal: 'Total de línea (centavos)',
  id: 'identificación',
  back: 'Volver a la lista',
  close: 'Cerrar detalles',
  request: 'Solicitud',
  response: 'Respuesta',
  loadingChoices: 'Cargando registros relacionados…',
};

export default esES;
