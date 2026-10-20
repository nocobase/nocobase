import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  navigation: {
    parameters: 'Parámetros de tiempo de ejecución',
    group: 'Flujo de trabajo',
    tickets: 'Mesa de ayuda',
    expenses: 'Informes de gastos',
    invoices: 'Facturación electrónica',
    orders: 'Pago del pedido',
    exports: 'Exportaciones de datos',
    purchases: 'Venta flash',
    fulfilments: 'Envío',
    subscriptions: 'Suscripciones',
  },
  parameters: {
    fields: {
      paymentWindowMinutes: {
        title: 'Tiempo de espera de pago (minutos)',
        description:
          'Cancelar un pedido impago después de esta espera. Los cambios se aplican a los temporizadores de pago recientemente programados; Los temporizadores existentes mantienen su tiempo debido.',
      },
      escalateAfterMinutes: {
        title: 'Tiempo de espera de revisión del administrador (minutos)',
        description:
          'Escalar una revisión pendiente del administrador después de esta espera. Los cambios se aplican a los temporizadores de revisión recientemente programados; Los temporizadores existentes mantienen su tiempo debido.',
      },
      waitMinutes: {
        title: 'Tiempo de espera de respuesta del cliente (minutos)',
        description:
          'Cerrar un ticket si el cliente no responde dentro de esta espera. Los cambios se aplican a los temporizadores programados recientemente; Los temporizadores existentes mantienen su tiempo debido.',
      },
      querySeconds: {
        title: 'Retraso en consulta de estado de factura (segundos)',
        description:
          'Consulta al proveedor de facturas si no llega ninguna devolución de llamada dentro de esta espera. Los cambios se aplican a consultas recientemente programadas; las consultas existentes mantienen su debido tiempo.',
      },
      pollSeconds: {
        title:
          'Intervalo de verificación del progreso de la exportación (segundos)',
        description:
          'Espere tanto tiempo antes de verificar una exportación en progreso. Los cambios se aplican a las comprobaciones programadas recientemente; los controles existentes mantienen su debido tiempo.',
      },
      maxMinutes: {
        title: 'Tiempo de espera de finalización de exportación (minutos)',
        description:
          'Establece la fecha límite de finalización cuando comienza un trabajo de exportación. Un trabajo inacabado caduca en esa fecha límite. Los cambios no modifican los plazos de los trabajos existentes.',
      },
      periodMinutes: {
        title: 'Periodo de renovación de suscripción (minutos)',
        description:
          'Utilice esta duración para calcular el final del nuevo período después de un cargo exitoso. Los cambios se aplican después del siguiente cargo exitoso; el final del período actual permanece fijo.',
      },
      dunningMinutes: {
        title: 'Intervalo de reintento de pago de renovación fallido (minutos)',
        description:
          'Espere tanto tiempo antes de volver a intentar un pago de renovación fallido. Los cambios se aplican a los reintentos recién programados; los reintentos existentes mantienen su debido tiempo.',
      },
      maxDunning: {
        title: 'Límite de fallas de pago de renovación',
        description:
          'Cancele la suscripción en el siguiente reintento automático si su recuento de pagos fallidos ha alcanzado este límite. Los cambios se aplican en la siguiente decisión de reintento.',
      },
      reopenDays: {
        title: 'Fecha límite de reapertura de tickets (días)',
        description:
          'Permitir la reapertura dentro de estos días después del cierre de un ticket; de lo contrario, se requerirá un boleto nuevo. Cada solicitud de reapertura utiliza la configuración más reciente.',
      },
    },
    loading: 'Cargando parámetros…',
    title: 'Parámetros de tiempo de ejecución',
    description:
      'Cambie sólo los valores declarados por código. La estructura del flujo de trabajo, las decisiones y los tiempos de espera permanecen en el código.',
    ruleExplanation:
      'Todas las condiciones de un grupo deben coincidir. Los grupos separados se suman. Coloque a los usuarios alternativos en grupos separados.',
    allConditions: 'Cumple todas estas condiciones',
    alsoInclude: 'Inclúyase también',
    selectionType: 'Tipo de selección',
    searchReference: 'Buscar por nombre',
    noMatches: 'No hay referencias coincidentes.',
    previousPage: 'Página anterior',
    nextPage: 'Página siguiente',
    reference: 'Referencia',
    remove: 'Quitar',
    addCondition: 'Añadir condición',
    addGroup: 'Incluir también otro grupo',
    revision: 'Revisión {{revision}}',
    codeDefaults: 'Código predeterminado',
    databaseVersion: 'Configuración guardada',
    snapshotEffect:
      'Instantánea: corregida en el primer envío; retenido después de la devolución o retiro',
    liveEffect:
      'Las lecturas futuras de parámetros utilizan la configuración más reciente; Los cronómetros y plazos existentes permanecen fijos.',
    yes: 'Sí',
    no: 'No',
    invalidObject: 'Ingrese un objeto JSON válido.',
    saved: 'Configuración guardada.',
    conflict:
      'La revisión cambió. Sus aportaciones se han conservado; revise los valores actuales antes de volver a intentarlo.',
    currentRevision: 'Revisión guardada actual: {{revision}}',
    keepDraft: 'Conserve mis aportes y utilice esta revisión',
    save: 'Guardar valores',
    readOnly: 'Puede leer estos valores pero no cambiarlos.',
    preview: 'Vista previa de candidatos para Lin',
    candidates: 'Candidatos',
    noCandidates:
      'No hay candidatos elegibles; la presentación será rechazada.',
    editCurrent: 'Editar configuración actual',
    historyBoundary:
      'Esto edita la configuración actual. Los hechos históricos y los candidatos asignados existentes permanecen sin cambios.',
    history: 'Uso real de parámetros',
    effectivePreview: 'Valores efectivos para este registro ahora',
    firstSnapshot: 'Instantánea del primer envío',
    notRecorded: 'No registrado',
    diagramEntry: 'Entrada de diagrama opcional',
    diagramHint:
      'Haga clic en un nodo enlazado o una transición para abrir el editor compartido. Las entradas no encuadernadas muestran sus detalles originales. Al hacer clic nunca se ejecuta una transición.',
    workflow: 'Flujo de trabajo',
    types: {
      department: 'Departamento',
      role: 'Rol',
      user: 'Persona',
    },
  },
  invoices: {
    title: 'Facturación electrónica',
    list: 'Facturas',
    new: 'Nueva factura',
    empty: 'Aquí no hay facturas.',
    pick: 'Elija una factura para seguir su emisión.',
    description:
      'Facturar un pedido de sandbox completado. Espere el webhook de la plataforma; consulta después de {{seconds}} segundos sin uno. El envío se intenta hasta 3 veces.',
    shows:
      'El envío, las devoluciones de llamada, las consultas de tiempo de espera y los reintentos comparten una solicitud de proveedor. Las notificaciones repetidas se aplican una vez y los reintentos nunca emiten una segunda factura.',
    orderSummary: 'Orden #{{order}} · {{amount}}',
    fields: {
      order: 'Orden completada',
      customer: 'Cliente',
      amount: 'Cantidad',
      taxNumber: 'Número de impuesto',
      request: 'Solicitud de proveedor',
      number: 'Número de factura',
      queries: 'Consultas',
    },
    actions: {
      submit: 'Solicitar factura',
      retryInvoice: 'Reintentar factura',
    },
    form: {
      title: 'Solicitar factura electrónica',
      ordersHint:
        'Elija una orden de demostración completada. Cada pedido puede tener sólo una factura.',
      order: 'Orden #{{order}} · {{customer}} · {{amount}} · Completado',
      invoiceTitle: 'Título de la factura',
      failSubmissions: 'Envíos que fallan a propósito',
      failHint:
        'Configure 1 o 2 para ver los reintentos automáticos; Fallaron 3 paradas en cuestión. Vuelva a intentar la factura y luego se recupera.',
      submit: 'Crear',
    },
    banner: {
      draft: 'Aún no solicitado.',
      submitting: 'Presentando la solicitud; los fallos se reintentan...',
      awaiting:
        'Esperando el webhook de la plataforma; consultando en {{time}}.',
      querying: 'Consultando la plataforma de facturación…',
      issued: 'Factura emitida. El PDF de demostración está listo.',
      failed: 'Problema fallido: {{error}} Puede volver a intentar la factura.',
    },
    outside: {
      title: 'Plataforma de facturación (sandbox)',
      description:
        'Simular la plataforma externa completando una solicitud y enviando su webhook. No hay ningún sistema fiscal real conectado.',
      result: 'Resultado de la plataforma',
      hint: 'Mantenga el webhook y emita correctamente: la factura aún espera, luego consulta el resultado después de 30 segundos. Si entrega el evento anterior posteriormente no podrá volver a emitirlo.',
      issue: 'Emisión exitosa',
      fail: 'Rechazar factura',
      download: 'Descargar PDF de muestra',
      pdfHint:
        'El archivo dice FACTURA SANDBOX y no es una factura de impuestos válida.',
    },
  },
  identity: {
    label: 'Inicia sesión como',
  },
  roles: {
    agent: 'Agentes de apoyo',
    customer: 'Clientes',
    applicant: 'Empleados',
    manager: 'Gerentes',
    director: 'Ejecutivos',
    finance: 'Finanzas',
  },
  common: {
    signedInUser: 'Usuario registrado',
    system: 'Sistema',
    unassigned: 'Sin asignar',
    loading: 'Cargando…',
    cancel: 'Cancelar',
    close: 'Cerrar',
    demoOptions: 'Opciones de demostración',
  },
  tickets: {
    title: 'Mesa de ayuda',
    agentDescription:
      'Tomar nuevos tickets, responder a los clientes y resolverlos. Un ticket que espera al cliente se cierra solo cuando este permanece en silencio, y una respuesta del cliente lo devuelve a su asignado.',
    customerDescription:
      'Pide ayuda al equipo de soporte y sigue la conversación. Un ticket cerrado se puede reabrir por días {{days}}.',
    queue: 'Cola de tickets',
    mine: 'Mis billetes',
    newTicket: 'Nuevo billete',
    empty: 'Aquí no hay entradas.',
    pick: 'Elija un ticket para leer la conversación.',
    filters: {
      all: 'Todo',
      new: 'Nuevo',
      open: 'Abierto',
      awaitingCustomer: 'Esperando',
      closed: 'Cerrado',
    },
    form: {
      title: 'Contactar con soporte',
      subject: 'Asunto',
      subjectPlaceholder: 'Resume el problema en una frase.',
      category: 'Categoría',
      priority: 'Prioridad',
      description: 'Descripción',
      descriptionPlaceholder:
        'Qué pasó, qué esperabas y los pasos para reproducirlo',
      failNotifications: 'Envíos de correo electrónico que fallan a propósito',
      failHint:
        'Cada respuesta a este ticket le envía un correo electrónico. Haz que los primeros intentos fallen para ver el efecto y vuelve a intentarlo.',
      submit: 'Enviar ticket',
    },
    categories: {
      account: 'Cuenta e inicio de sesión',
      billing: 'Facturación',
      howto: '¿Cómo puedo…?',
      incident: 'Algo está roto',
    },
    priorities: {
      low: 'Bajo',
      normal: 'Normal',
      high: 'Alto',
      urgent: 'Urgente',
    },
    meta: {
      customer: 'Cliente',
      category: 'Categoría',
      priority: 'Prioridad',
      assignee: 'Persona asignada',
      created: 'Creado',
    },
    banner: {
      new: 'Esperando que un agente lo tome.',
      open: '{{assignee}} está trabajando en ello.',
      awaiting:
        'Esperando al cliente. Se cierra automáticamente en {{time}} sin respuesta.',
      overdue: 'La espera ha terminado; el siguiente barrido lo cierra.',
      resolved: 'Resuelto por soporte.',
      timeout: 'Cerrado automáticamente: el cliente no respondió a tiempo.',
      reopenUntil: 'Puede volver a abrirlo hasta {{date}}.',
      reopenExpired: 'Ya no se puede reabrir; por favor abra un nuevo ticket.',
    },
    thread: {
      wrote: '{{name}} · {{time}}',
      accept: '{{actor}} tomó el boleto',
      resolve: '{{actor}} lo marcó resuelto',
      autoClose:
        'Cerrado automáticamente después de esperar minutos {{minutes}}',
      reopen: '{{actor}} reabrió el ticket',
      delivery: {
        queued: 'Correo electrónico al cliente en cola',
        running: 'Enviando correo electrónico al cliente…',
        succeeded: 'Enviado por correo electrónico al cliente',
        failed:
          'El correo electrónico falló después de intentos de {{attempts}}: {{error}}',
        retrying:
          'Falló el intento de correo electrónico {{attempts}}, reintentando: {{error}}',
      },
    },
    composer: {
      agentPlaceholder: 'Responder al cliente…',
      customerPlaceholder: 'Añadir una respuesta…',
      reopenPlaceholder: 'Díganos qué sigue mal…',
      reply: 'Enviar respuesta',
      accept: 'Tomar boleto',
      resolve: 'Marcos resuelto',
      customerReply: 'Enviar',
      reopen: 'Reabrir',
      nothing: 'No hay nada que puedas hacer con este ticket en este momento.',
    },
  },
  expenses: {
    title: 'Informes de gastos',
    applicantDescription:
      'Reclamación de gastos comerciales. Hasta {{auto}} se aprueba automáticamente; arriba lo aprueba su gerente, y arriba {{finance}} el director financiero también.',
    approverDescription:
      'Informes en espera de su aprobación. Un informe que usted deja por minutos {{minutes}} pasa a su propio gerente.',
    finalApproverDescription: 'Informes en espera de su aprobación.',
    mine: 'Mis informes',
    approvals: 'Esperándome',
    newReport: 'Nuevo informe',
    empty: 'No hay informes aquí.',
    emptyApprovals: 'Nada espera su aprobación.',
    pick: 'Elija un informe para verlo.',
    number: 'Informe {{id}}',
    editor: {
      title: 'Propósito',
      titlePlaceholder: 'Por ejemplo: feria comercial de Shanghai, octubre',
      purpose: 'Detalles',
      purposePlaceholder:
        'Quién fue, por qué y todo lo que un aprobador debe saber',
      items: 'Gastos',
      date: 'Fecha',
      category: 'Categoría',
      description: 'Descripción',
      amount: 'Monto (¥)',
      addItem: 'Añadir gasto',
      removeItem: 'Quitar',
      total: 'Total',
      failPayments: 'Intentos de pago que fallan a propósito',
      failHint:
        'Un informe aprobado se paga por un efecto. Haz los primeros intentos y falla para verlo volver a intentarlo.',
      save: 'Guardar borrador',
      saved: 'Guardado.',
      submit: 'Enviar para aprobación',
      resubmit: 'Volver a enviar',
    },
    categories: {
      transport: 'Transporte',
      lodging: 'Alojamiento',
      meals: 'Comidas',
      office: 'Material de oficina',
      entertainment: 'Entretenimiento para clientes',
      other: 'Otro',
    },
    steps: {
      submit: 'Enviado',
      manager: 'Gerente',
      finance: 'Finanzas',
      payment: 'Pagado',
    },
    meta: {
      applicant: 'Solicitante',
      approver: 'Esperando',
      created: 'Creado',
      paymentRef: 'Referencia de pago',
      total: 'Total',
    },
    banner: {
      draft: 'Proyecto. Sólo usted puede verlo hasta que lo envíe.',
      awaiting:
        'Esperando a {{approver}}. Pasa a su manager en {{time}} sin decisión.',
      awaitingFinal: 'Esperando a {{approver}}.',
      overdue: 'La espera ha terminado; el siguiente barrido lo transmite.',
      needsInfo: '{{actor}} lo devolvió: {{reason}}',
      rejected: '{{actor}} lo rechazó: {{reason}}',
      approved: 'Aprobado. El pago está en camino.',
      paymentRetrying:
        'El intento de pago {{attempts}} falló, reintentando: {{error}}',
      paymentFailed:
        'Pago fallido después de intentos de {{attempts}}: {{error}}. Las finanzas harán un seguimiento.',
      paid: 'Pagado. Referencia {{ref}}.',
    },
    timeline: {
      title: 'Historial de aprobación',
      empty: 'Aún no presentado.',
      autoApproved: 'Dentro de {{limit}}: aprobado automáticamente',
      escalated: 'Ninguna decisión a tiempo; pasó al siguiente gerente',
      paid: 'Pago completado',
    },
    decision: {
      title: 'Tu decisión',
      placeholder: 'Comentario (requerido para devolver o rechazar)',
      approve: 'Aprobar',
      requestInfo: 'Enviar de vuelta',
      reject: 'Rechazar',
    },
    withdraw: 'Retirar',
  },
  flowDiagram: {
    overview: 'Descripción general del diagrama',
    actualSize: 'Tamaño real',
    states: 'Estados',
    transitions: 'Transiciones',
    configurable: 'Parámetros',
    current: 'Actual',
    visited: 'Visitado',
    initial: 'Inicial',
    final: 'Final',
    state: 'Estado',
    zoomOut: 'Alejar',
    zoomIn: 'Acercar',
    fit: 'Ajustar a la vista',
    empty: 'No hay estados para mostrar.',
    loading: 'Trazado del diagrama…',
    failed: 'No se puede diseñar este diagrama.',
    nodeHelp: 'Presione Entrar o Espacio para seleccionar un estado.',
    edgeHelp: 'Presione Entrar o Espacio para seleccionar una transición.',
  },
  diagramStatus: {
    traversed: 'Atravesado',
    end: 'Fin',
    current: 'Actual',
    visited: 'Visitado',
    available: 'Disponible',
    pending: 'No atravesado',
  },
  flows: {
    customer: 'Cliente',
    final: 'Ésta está terminada; Ya nada lo mueve.',
    process: 'Proceso',
    legend:
      'El estado actual tiene un relleno más fuerte; Los estados visitados y las transiciones reales atravesadas comparten un color de acento. La leyenda identifica las transiciones disponibles y las partes no atravesadas. Los estados iniciales tienen fronteras de píldoras, los estados finales tienen fronteras dobles. Seleccione un estado o transición para obtener más detalles. ⚙ solo servidor, ⏱ activador, ✓/✗ continuación del efecto.',
    nothing:
      'No hay nada que puedas hacer aquí ahora mismo; espera el exterior.',
  },
  webhooks: {
    title: 'Webhooks',
    hint: 'Qué envió, retuvo o entregó el sandbox y cómo se respondió a cada entrega. Entregue uno nuevamente para ver una repetición, o los retenidos en otro orden.',
    empty: 'Aún no hay webhooks.',
    hold: 'Mantenga presionado el webhook',
    deliver: 'Entregar',
    deliverAgain: 'Entregar de nuevo',
    deliveries_one: 'tiempo de entrega {{count}}',
    deliveries_other: 'entregado {{count}} veces',
    occurred: 'Sucedió {{time}}',
    outcomes: {
      applied: 'Aplicado',
      replayed: 'Reproducido',
      ignored: 'Ignorado',
      retry: 'Lo volveré a intentar',
      held: 'Retenido',
    },
    deliveries_many: 'entregado {{count}} veces',
  },
  orders: {
    title: 'Pago del pedido',
    list: 'Pedidos',
    new: 'Nuevo orden',
    empty: 'Aquí no hay pedidos.',
    pick: 'Elija una orden para ver dónde se encuentra su pago.',
    shows:
      'El pago es confirmado por el webhook del proveedor, no por la página: el pedido espera como un estado, y el webhook (por muy tarde, temprano o frecuente que llegue) lo mueve exactamente una vez. Se reembolsa un pago que llega después de la cancelación del pedido.',
    description:
      'Los clientes pagan en el proceso de pago alojado del proveedor de pagos; el pedido continúa cuando llega el webhook del proveedor. Un pedido impago se cierra después de los minutos {{minutes}}.',
    nothing: 'No tienes nada que hacer: el pedido espera al proveedor de pago.',
    actions: {
      checkout: 'Pagar',
      cancel: 'Cancelar orden',
      ship: 'Barco',
      refundOrder: 'Reembolso',
      retryRefund: 'Reintentar reembolso',
    },
    form: {
      title: 'Realizar un pedido',
      item: 'Artículo',
      amount: 'Monto (¥)',
      failCheckouts: 'Intentos de pago que fallan a propósito',
      failRefunds: 'Intentos de reembolso que fallan a propósito',
      failHint:
        'La apertura del proceso de pago y el reembolso son efectos con reintentos; hacer que no vean los reintentos y dónde se detiene el pedido.',
      submit: 'Realizar pedido',
    },
    fields: {
      customer: 'Cliente',
      amount: 'Cantidad',
      attempt: 'Ronda de pago',
      session: 'Sesión de pago',
      paymentRef: 'Pago',
      refundRef: 'Reembolso',
    },
    banner: {
      draft: 'Aún no pagado.',
      creatingCheckout: 'Abriendo la caja del proveedor…',
      awaitingPayment:
        'Esperando al proveedor de pagos. Cierra en {{time}} si no paga.',
      overdue: 'La ventana ha terminado; el siguiente barrido lo cierra.',
      paymentFailed: '{{error}} Vuelve a pagar, o cierra en {{time}}.',
      paid: 'Pagado, listo para enviar.',
      cancelled: {
        customer: 'Cancelado por el cliente.',
        timeout: 'Cerrado: no pagado a tiempo.',
        refundRequested: 'Reembolsado a petición del cliente.',
      },
      refunding: 'Reembolso…',
      refundNeedsAttention:
        'El reembolso falló: {{error}} Espera a que alguien lo reintente.',
      refunded: 'Reembolsado.',
      fulfilled: 'Pagado y enviado.',
    },
    sessionStatus: {
      open: 'abierto',
      paid: 'pagado',
      declined: 'rechazó',
      expired: 'expiró',
    },
    outside: {
      title: 'Proveedor de pagos (zona de pruebas)',
      description:
        'Reproduce al cliente en el proceso de pago del proveedor y el proveedor envía su webhook. Mantenga un webhook para entregarlo tarde, dos veces o después de cancelarlo.',
      checkout: 'Pago alojado',
      session: 'Sesión {{id}}: {{status}}.',
      noSession: 'No hay ninguna caja abierta; el cliente paga primero.',
      pay: 'Pagar',
      decline: 'Rechazar la tarjeta',
      tryThis:
        'Intente: retener el webhook, pagar, cancelar el pedido y luego entregar el webhook retenido; el dinero llega después de la cancelación y se reembolsa.',
    },
  },
  exports: {
    title: 'Exportaciones de datos',
    list: 'Exportaciones',
    new: 'Nueva exportación',
    empty: 'Aquí no hay exportaciones.',
    pick: 'Elija una exportación para ver cómo se sondea.',
    shows:
      'El proveedor no tiene webhook, por lo que el ciclo de vida pregunta: un disparador activa una autotransición cada pocos segundos y, al ingresar al estado, se sondea nuevamente al proveedor. Un plazo fijado en el acta pone fin a la espera.',
    description:
      'El proveedor procesa las exportaciones lentamente y no devuelve la llamada a nadie, por lo que cada exportación la sondea cada {{seconds}} segundos y se da por vencida después de {{minutes}} minutos.',
    nothing:
      'No tienes nada que hacer: la exportación está sondeando al proveedor.',
    actions: {
      submit: 'Iniciar exportación',
      retry: 'Exportar nuevamente',
      cancel: 'Cancelar',
    },
    outcomes: {
      success: 'tiene éxito',
      failure: 'falla',
      stuck: 'se queda atascado en el 60%',
    },
    jobStatus: {
      running: 'corriendo',
      succeeded: 'hecho',
      failed: 'falló',
      cancelled: 'cancelado',
    },
    form: {
      title: 'Solicitar una exportación',
      name: 'Nombre',
      duration: 'El vendedor tarda (segundos)',
      outcome: 'El trabajo del vendedor',
      hint: 'Un trabajo atascado nunca termina: la exportación expira en su fecha límite y detiene el trabajo.',
      submit: 'Crear',
    },
    fields: {
      vendor: 'Vendedor',
      vendorValue: '{{seconds}} s, {{outcome}}',
      job: 'Trabajo de proveedor',
      polls: 'Encuestas',
      deadline: 'Fecha límite',
    },
    banner: {
      draft: 'No iniciado.',
      starting: 'Enviando el trabajo al proveedor…',
      processing: 'El proveedor está trabajando en ello. Se rinde en {{time}}.',
      done: 'Listo: {{url}}',
      failed: 'Error: {{error}}',
      timedOut:
        'El vendedor no terminó antes del plazo; su trabajo fue detenido.',
      cancelled: 'Cancelado.',
    },
    outside: {
      title: 'Proveedor (zona de pruebas)',
      description:
        'Lo que la exportación sabe sobre el trabajo del proveedor: sólo lo que vio su última encuesta. El proveedor no envía ningún webhook, por lo que nada más puede hacerlo.',
      lifecycleSide: 'Lo que sabe la exportación',
      lifecycleHint:
        'Trabajo {{id}}, como lo vio la última encuesta; la próxima encuesta lo actualiza.',
      lastPoll:
        'La última encuesta vio {{status}}, {{progress}}% (encuestas {{count}}).',
      noPoll: 'Aún no encuestado.',
      nextPoll: 'Próxima encuesta sobre {{time}}.',
      pollDue: 'El siguiente barrido lo sondea.',
      noJob: 'Aún no hay trabajo en el vendedor.',
    },
  },
  purchases: {
    title: 'Venta flash',
    list: 'Compras',
    new: 'Nueva compra',
    empty: 'No hay compras aquí.',
    pick: 'Elige una compra para seguir sus pasos.',
    shows:
      'Una compra abarca dos sistemas que una reversión de la base de datos no puede deshacer. Cada paso es un estado con un efecto, y cuando se rechaza el cargo, la reserva se deshace mediante un paso propio, de modo que lo que todavía se debe es siempre el estado del registro.',
    description:
      'El almacén guarda las unidades, luego el proveedor de pagos toma el dinero. Cuando se rechaza la tarjeta, las unidades se devuelven mediante un paso de compensación; una compensación que sigue fallando se detiene y espera a una persona.',
    nothing: 'No tienes que hacer nada: la compra sigue sus trámites.',
    actions: {
      submit: 'Realizar pedido',
      abandon: 'Descartar',
      retryRelease: 'Reintentar la liberación',
    },
    items: {
      headphones: 'Auriculares',
      keyboard: 'Teclado mecánico',
      lamp: 'Lámpara de escritorio',
    },
    form: {
      title: 'Compra en la venta flash',
      item: 'Artículo',
      quantity: 'Cantidad',
      total: 'Total {{total}}',
      declineCharge: 'La tarjeta es rechazada',
      failReleases: 'Lanzamientos de acciones que fallan a propósito',
      failHint:
        'Rechazar la tarjeta para velar por la compensación; haga que el lanzamiento falle 3 veces o más para verlo detenerse y esperar a una persona.',
      submit: 'Crear',
    },
    fields: {
      customer: 'Cliente',
      amount: 'Cantidad',
      reservation: 'Reserva',
      paymentRef: 'Pago',
    },
    banner: {
      draft: 'Aún no colocado.',
      reserving: 'Reservando las unidades…',
      charging: 'Unidades retenidas; cargando la tarjeta...',
      releasing: 'La carga falló ({{error}}); devolviendo las unidades...',
      compensationNeedsAttention:
        'No se pudieron devolver las unidades: {{error}} Espera a que alguien reintente la liberación.',
      confirmed: 'Confirmado: unidades reservadas y pagadas.',
      cancelled: {
        customer: 'Descartado.',
        outOfStock: 'Cancelado: {{error}}',
        paymentDeclined:
          'Cancelada: la tarjeta fue rechazada y las unidades fueron devueltas.',
      },
    },
    outside: {
      title: 'Proveedor de almacén y pagos (sandbox)',
      description:
        'Cada paso es un efecto en un sistema fuera de la aplicación; Deshacer también es un paso.',
      steps: 'Pasos',
      stepsHint: 'La última ejecución del efecto de cada paso.',
      reserve: 'Existencias de reserva',
      charge: 'Cargar la tarjeta',
      release: 'Liberar stock (compensación)',
      notYet: 'No ejecutado',
      stock: 'Stock de almacén',
      stockHint: 'Observe cómo las unidades salen y regresan.',
      item: 'Artículo',
      available: 'Disponible',
      reserved: 'Reservado',
    },
  },
  fulfilments: {
    title: 'Envío',
    list: 'Envíos',
    new: 'Nuevo envío',
    empty: 'Aquí no se realizan envíos.',
    pick: 'Elija un envío para reproducir su pago, almacén y transportista.',
    shows:
      'Un envío espera dos señales de dos sistemas en cualquier orden en que lleguen, luego sigue los eventos del transportista, aplicados según el momento en que sucedieron, no cuando llegaron.',
    description:
      'Un envío sale una vez que se captura el pago y el almacén lo ha recogido, en cualquier orden. Los webhooks del transportista llegan tarde y desordenados; sólo un evento más reciente lo mueve.',
    nothing: 'No tienes nada que hacer: el envío espera el exterior.',
    actions: {
      ship: 'Mano al transportista',
      cancel: 'Cancelar envío',
    },
    signals: {
      payment: 'pago capturado',
      pick: 'almacén elegido',
    },
    and: 'y',
    carrier: {
      booked: 'Reservado',
      pickedUp: 'Recogido',
      inTransit: 'En tránsito',
      outForDelivery: 'Fuera de entrega',
      delivered: 'Entregado',
      exception: 'Excepción',
    },
    form: {
      title: 'Abrir un envío',
      name: 'Nombre',
      customer: 'Cliente',
      submit: 'Crear',
    },
    fields: {
      customer: 'Cliente',
      paid: 'Pago capturado',
      picked: 'Elegido',
      tracking: 'Número de seguimiento',
      carrier: 'El transportista dice',
      carrierAt: 'A partir de',
    },
    banner: {
      preparing: 'Esperando: {{waiting}}.',
      readyToShip: 'Pagado y recogido: listo para entregar al transportista.',
      booking: 'Reservando el transportista…',
      shipped: 'En camino.',
      exception:
        'El transportista informó un problema; un evento más reciente lo borra.',
      delivered: 'Entregado.',
      cancelled: 'Cancelado.',
    },
    outside: {
      title: 'Proveedor de pagos, almacén y transportista (sandbox)',
      description:
        'Enviar el webhook de cada sistema, ahora o en espera. Entregue los retenidos en otro orden para ver cuál corresponde.',
      signals: 'Dos señales',
      signalsHint:
        'Cualquiera de los dos puede venir primero; el segundo hace avanzar el envío.',
      capture: 'Pago capturado',
      pick: 'Almacén elegido',
      carrierTitle: 'Transportista',
      carrierHint:
        'Eventos sobre el paquete, cada uno con la hora en que ocurrió.',
      status: 'Estado',
      location: 'Ubicación',
      offset: 'Dentro de unos minutos',
      send: 'Enviar',
      offsetHint:
        'El último campo cambia cuando se realizó el escaneo: un número negativo informa un escaneo más antiguo.',
      scramble: 'Mantenga tres escaneos para entregar en cualquier orden',
    },
  },
  subscriptions: {
    title: 'Suscripciones',
    list: 'Suscripciones',
    new: 'Suscríbete',
    empty: 'Aquí no hay suscripciones.',
    pick: 'Elija una suscripción para seguir su facturación.',
    shows:
      'Una suscripción se mueve activa → cobrando → activa una vez por período, mientras esté vigente. La renovación vence al final del propio período de suscripción, como lo determina el barrido; una tarjeta rechazada se vuelve a intentar mediante un disparador hasta que se rinde.',
    description:
      'Se cobra cada minuto {{period}}. Un cargo rechazado se reintenta cada minuto(s) de {{dunning}}; después de que {{tries}} lo intenta, la suscripción se cancela.',
    nothing: 'No tienes que hacer nada: la facturación se ejecuta sola.',
    actions: {
      updateCard: 'Tarjeta de actualización',
      cancel: 'Darse de baja',
    },
    plans: {
      basic: 'Básico',
      pro: 'Profesional',
    },
    periodN_one: 'Período {{count}}',
    periodN_other: 'Periodos {{count}}',
    form: {
      title: 'Suscríbete',
      plan: 'Plano',
      charge: '{{price}} se cobra ahora y al inicio de cada período.',
      cardDeclines: 'Cobros la tarjeta rechaza',
      failHint:
        'Los rechazos son respuestas, no interrupciones: el cargo no se reintenta de inmediato sino mediante el activador de reclamación, bajo una nueva clave.',
      submit: 'Suscríbete',
    },
    fields: {
      customer: 'Cliente',
      periods: 'Períodos pagados',
      periodEnd: 'Fin del periodo',
      dunning: 'Intentos fallidos',
      lastCharge: 'Último cargo',
      card: 'Tarjeta',
      cardWorks: 'Obras',
      cardValue_one: 'rechaza el siguiente cargo',
      cardValue_other: 'rechaza los próximos cargos {{count}}',
      cardValue_many: 'rechaza los próximos cargos {{count}}',
    },
    banner: {
      renewing: 'Cargando la tarjeta…',
      active: 'Activo. Renueva en {{time}}.',
      due: 'El plazo ha concluido; el siguiente barrido lo renueva.',
      pastDue:
        '{{error}} Pruebe {{tries}} de {{max}}; próximo intento en {{time}}.',
      cancelled: {
        customer: 'Cancelación de suscripción.',
        unpaid: 'Cancelada: la tarjeta continuó siendo rechazada.',
      },
    },
    outside: {
      title: 'Facturación (zona de pruebas)',
      description:
        'Cada carga es una ejecución del efecto de carga, determinada por el período y el intento.',
      charges: 'Cobros',
      chargesHint: 'Los más antiguos primero.',
      noCharges: 'Aún no hay cargos.',
      sweep: 'Barrido de renovación',
      sweepHint:
        'Las renovaciones se encuentran por barrido al final del período de cada suscripción; se ejecuta cada 10 segundos, o ahora.',
    },
    periodN_many: 'Periodos {{count}}',
  },
  guide: {
    title: 'Acerca de este ejemplo',
    show: 'Mostrar',
    hide: 'Ocultar',
    purpose: 'Lo que muestra',
    howTo: 'Cómo probarlo',
    samples:
      'Los registros de muestra se cargan cuando la aplicación se instala con datos de muestra (APP_SAMPLE_DATA=true). En una base de datos instalada sin ellos, ejecute "pnpm nocobase db sample".',
    invoices: {
      purpose:
        'Utilice una solicitud de proveedor para demostrar devoluciones de llamadas, consultas de tiempo de espera y reintentos, con un PDF de muestra descargable.',
      step1:
        'Abra la muestra para el pedido n.º 1024, solicítela y luego haga clic en Emitir correctamente en el entorno de pruebas. Después del webhook, descargue el PDF de muestra.',
      step2:
        'Entregar nuevamente la misma notificación: se reproduce y no se emite una segunda factura.',
      step3:
        'En el pedido n.° 1026, mantenga presionado el webhook y emita correctamente. Después de 30 segundos la consulta se completa. Una entrega posterior no podrá emitirlo nuevamente.',
      step4:
        'La muestra 晨光书course falla el envío 3 veces. El reintento de factura se recupera de la emisión fallida y mantiene la misma solicitud del proveedor.',
    },
    tickets: {
      purpose:
        'Un ticket se mantiene donde está en su propio campo de estado, y cada cambio (aceptar, responder, resolver, reabrir) es una transición declarada en la fuente. La conversación es el registro de transición: cada mensaje es la entrada de la transición que provocó. Los correos electrónicos se ejecutan como efectos después de que se confirma la transición, con reintentos, y un ticket que se deja esperando a su cliente se cierra mediante un disparador.',
      step1:
        'Utilice “Iniciado sesión como” en la parte superior derecha para alternar entre los agentes de soporte y los clientes. Los agentes ven toda la cola; un cliente solo ve sus propios boletos.',
      step2:
        'Como agente, abra el nuevo ticket “无法登录管理后台” y responda. Ahora atiende al cliente y se cierra tras un par de minutos de silencio; los gatillos se barren cada 10 segundos.',
      step3:
        'Cambie a 王女士 y responda a un ticket que la espera: vuelve a su agente. El cliente puede reabrir un ticket cerrado durante 7 días; pruébelo como 李先生 en “如何导出本月的订单报表？”.',
      step4:
        'Presente un ticket como cliente con "Entregas de correo electrónico que fallan a propósito" configuradas en Opciones de demostración, luego responda como agente: "Debajo del capó" muestra el efecto del correo electrónico que falla y se vuelve a intentar.',
    },
    expenses: {
      purpose:
        'Un informe de gastos se envía según su importe: hasta ¥5.000 se aprueba automáticamente, por encima de esa cantidad el gerente del solicitante lo aprueba, y por encima de ¥50.000 también lo aprueba el director de finanzas. Los aprobadores aprueban, devuelven o rechazan con un motivo, un disparador pasa por alto a un administrador inactivo y un informe aprobado se paga mediante un efecto que luego lo marca como pagado.',
      step1:
        'Utilice “Iniciado sesión como” para interpretar a los empleados 林晓 y 何东, sus gerentes, el ejecutivo y el director financiero. Un empleado ve sus propios informes; un aprobador ve lo que le espera.',
      step2:
        'Como 林晓, presente el borrador “杭州客户拜访” (¥872): se aprueba automáticamente y se paga un momento después. "Debajo del capó" muestra el efecto de pago y la transición "paga" que generó.',
      step3:
        'Cambie a 赵静, el director de finanzas, y apruebe “法兰克福展会参展”, que 陈明 ya aprobó: por encima de ¥50.000 necesita ambos.',
      step4:
        'Como 何东, vuelva a enviar “北京客户现场支持”, que se envió de vuelta para obtener más información, luego apruébelo como 孙磊. Un informe dejado con un gerente durante 3 minutos se escala al gerente del gerente.',
      step5:
        'En “Bajo el capó”, “Qué puede hacer la identidad actual” se proporciona el motivo de cada acción que la persona actual no puede realizar. Abre un informe de espera en dos ventanas y actúa en ambas: la segunda es rechazada porque la versión que vio está obsoleta.',
    },
    orders: {
      purpose:
        'Un pedido se marca como pagado únicamente por el webhook del proveedor de pagos, nunca por la página. Mientras espera, es solo un estado en el registro (sin temporizador, sin solicitud abierta) y un webhook que llega tarde, temprano o dos veces aún lo mueve exactamente una vez. Se reembolsa el dinero que llegue después de la cancelación del pedido.',
      step1:
        'Abra el pedido de muestra “降噪耳机 × 1” y haga clic en “Pagar”: un efecto abre el proceso de pago alojado del proveedor y el pedido espera el pago.',
      step2:
        'En la tarjeta discontinua “Proveedor de pago (sandbox)”, pague o rechace la tarjeta. El webhook que envía el proveedor es lo que mueve el pedido; Se repite “entregar de nuevo”',
      step3:
        'Marque “Retener el webhook”, pague, haga clic en “Cancelar pedido”, luego entregue el webhook retenido: el pago llega después de la cancelación y se reembolsa.',
      step4:
        'La ​​muestra “机械键盘 × 1” falla en su primera verificación a propósito, para mostrar el efecto al volver a intentarlo. Un pedido no pagado caduca después de 3 minutos.',
    },
    exports: {
      purpose:
        'El proveedor no envía ningún webhook, por lo que la exportación lo sondea: un activador activa la "encuesta" de transición automática, al volver a ingresar "procesamiento" se ejecuta la verificación y la fecha límite escrita en el registro decide cuándo darse por vencido.',
      step1:
        'Abra “9 月订单明细” y haga clic en “Iniciar exportación”. El vendedor tarda 30 segundos; Observe cómo “Lo que sabe el proveedor” se adelanta a lo que sabe el exportador hasta la próxima encuesta.',
      step2:
        'Inicie “全年客户名单”, cuyo trabajo de proveedor se atasca: en la fecha límite, la exportación se agota y detiene el trabajo del proveedor. “Exportar de nuevo” inicia una nueva ronda.',
      step3:
        'En "Bajo el capó", cada encuesta es una transición en el registro y cada verificación es una ejecución de efecto.',
    },
    purchases: {
      purpose:
        'Una compra de venta flash abarca dos sistemas: el almacén reserva el stock y luego el proveedor de pago carga la tarjeta. Cuando se rechaza el cargo, la reserva se deshace mediante un paso compensatorio propio; una compensación que sigue fallando se detiene en un estado en el que una persona vuelve a intentarlo.',
      step1:
        'Abre la compra de muestra de dos lámparas y haz clic en “Realizar pedido”: se reservan las unidades, se carga la tarjeta y se completa la compra.',
      step2:
        'Realice la compra de teclado de muestra, cuya tarjeta es rechazada, y observe cómo la unidad sale del “Stock de almacén” y regresa.',
      step3:
        'Cree una compra con la tarjeta rechazada y “Liberaciones de stock que fallan a propósito” configuradas en 3: la liberación se detiene y espera “Reintentar la liberación”.',
    },
    fulfilments: {
      purpose:
        'Un envío espera dos señales de dos sistemas (el pago capturado y la selección del almacén) en cualquier orden en que lleguen, luego sigue al transportista. Los eventos de operador se aplican según el momento en que sucedieron, no cuando llegaron, y uno más antiguo se rechaza por considerarlo obsoleto.',
      step1:
        'Abra el envío de muestra y envíe “Almacén recogido” y “Pago capturado” en cualquier orden: el segundo lo mueve a listo para enviar.',
      step2:
        'Haga clic en “Entregar al transportista” y luego envíe los escaneos del transportista, cada uno con un estado y una ubicación.',
      step3:
        'Marque “Retener tres escaneos para entregar en cualquier orden” y entregue primero el último escaneo: los anteriores se ignoran como obsoletos.',
      step4:
        'Un “Dentro de minutos” negativo informa un escaneo que ocurrió antes, que es lo que parece un evento tardío.',
    },
    subscriptions: {
      purpose:
        'Una suscripción se cobra al comienzo de cada período mientras dure su vigencia. El barrido del complemento renueva cada uno al final de su propio período, y el activador de reclamación vuelve a intentar un cargo rechazado, bajo una nueva clave, hasta que se recupera o se cancela la suscripción.',
      step1:
        'Haga clic en “Suscribirse” y elija un plan: el primer cargo se ejecuta de inmediato. No existe una suscripción de muestra, porque al crearla se carga la tarjeta.',
      step2:
        'Suscríbete con “Cobros la tarjeta rechaza” establecido en 1: se atrasa, se reintenta un minuto después y se recupera. La “tarjeta de actualización” la recupera de inmediato.',
      step3:
        'Un período dura 3 minutos; "Ejecutar activadores ahora" en "Barrido de renovación" renueva lo que vence sin esperar al siguiente barrido.',
    },
  },
  blockers: {
    invoiceRequestMismatch:
      'El resultado pertenece a otra solicitud de factura.',
    agentOnly: 'Sólo un agente de soporte puede trabajar en tickets.',
    requesterOnly: 'Sólo el cliente que presentó el ticket puede hacer esto.',
    systemOnly:
      'El sistema hace esto por sí solo una vez que ha pasado la espera.',
    reopenExpired:
      'Cerrado hace demasiado tiempo para reabrir; en su lugar, presente una nueva multa.',
    applicantOnly: 'Sólo el solicitante puede hacer esto con su informe.',
    approverOnly: 'Sólo el aprobador actual puede decidir sobre este informe.',
    topApprover: 'El aprobador actual ya es el nivel más alto.',
    customersOnly: 'Sólo un cliente puede presentar un ticket por sí mismo.',
    applicantsOnly:
      'Sólo un empleado puede presentar un informe de gastos, por sí mismo.',
    alreadyPaid: 'El pago ya ha sido confirmado.',
    alreadyPicked: 'El almacén ya lo recogió.',
    staleCarrierEvent: 'Ya se ha aplicado un nuevo evento de transportista.',
    periodNotOver: 'El período actual aún no ha finalizado.',
  },
  problems: {
    orderRef: 'Elija un pedido de zona de pruebas completado.',
    taxNumber: 'Ingrese un número fiscal de 15 a 20 letras o dígitos.',
    message: 'Escribe un mensaje.',
    reason: 'Dé una razón.',
    subject: 'Dale un tema al billete.',
    description: 'Describa el problema.',
    category: 'Elija una categoría.',
    priority: 'Elija una prioridad.',
    title: 'Ponle un nombre.',
    amountCents: 'El monto debe ser mayor que 0.',
    durationSeconds: 'El vendedor tarda entre 5 y 600 segundos.',
    vendorOutcome: 'Elija cómo termina el trabajo.',
    sku: 'Elija un elemento.',
    quantity: 'Compra entre 1 y 5.',
    plan: 'Elige un plan.',
    customerId: 'Elija el cliente.',
  },
  errors: {
    EXPENSE_NOT_FOUND: 'El informe de gastos no existe.',
    OWN_EXPENSE_ONLY: 'Sólo el solicitante puede editar este informe.',
    EXPENSE_LOCKED:
      'Un informe bajo revisión no se puede editar; retirarlo primero.',
    EXPENSE_CHANGED:
      'El informe cambió mientras lo editaba; recargalo y vuelve a intentarlo.',
    SANDBOX_SESSION_CLOSED: 'La caja ya no está abierta.',
    SANDBOX_NOT_FOUND: 'La zona de pruebas no tiene tal objeto.',
    UNKNOWN_WEBHOOK_EVENT: 'El sandbox no envía ese evento.',
    WEBHOOK_EVENT_NOT_FOUND: 'No existe tal evento de webhook.',
  },
  lifecycle: {
    title: 'Debajo del capó',
    hint: 'Cuál es el ciclo de vida registrado para este registro. Una aplicación real no mostraría esto a sus usuarios.',
    available: 'Qué puede hacer la identidad actual',
    final: 'Ninguna transición sale de este estado.',
    diagram: 'Diagrama interactivo',
    diagramHint:
      'toMermaid(describe()) dibuja el ciclo de vida como un diagrama de estado; pégalo en cualquier renderizador de sirena.',
    retry: 'Reintentar',
    cancel: 'Cancelar',
    continue: 'Continuar',
    continuationWaits: '{{transition}} espera: {{error}}',
    continuationAbandoned:
      '{{transition}} se dio por vencido después de que {{attempts}} lo intentara, hasta que continúe a mano: {{error}}',
    states: 'Estados',
    parameters: 'Parámetros',
    transitions: 'Registro de transición',
    effects: 'Ejecuciones de efectos',
    noTransitions: 'Aún no hay transiciones.',
    noEffects: 'Aún no hay efectos.',
    attempts: '{{attempts}}/{{max}}',
    runTriggers: 'Ejecutar activadores ahora',
    sweepNote:
      'Los activadores se barren cada 10 segundos de todos modos; esto ejecuta el barrido inmediatamente.',
    swept_one: 'El barrido disparó la transición {{count}}.',
    swept_other: 'El barrido disparó transiciones {{count}}.',
    columns: {
      time: 'Hora',
      transition: 'Transición',
      change: 'Cambiar',
      actor: 'Por',
      input: 'Entrada',
      effect: 'Efecto',
      status: 'Estado',
      attempts: 'Intentos',
      error: 'Último error',
    },
    swept_many: 'El barrido disparó transiciones {{count}}.',
  },
  states: {
    review: 'En revisión',
    submitting: 'Presentando',
    awaitingIssue: 'En espera de emisión',
    querying: 'Consultando',
    issued: 'Emitido',
    issueFailed: 'Problema fallido',
    new: 'Nuevo',
    open: 'Abierto',
    awaitingCustomer: 'Esperando al cliente',
    closed: 'Cerrado',
    draft: 'Borrador',
    awaitingManager: 'Esperando gerente',
    awaitingFinance: 'En espera de financiación',
    needsInfo: 'Devuelto',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    paid: 'Pagado',
    creatingCheckout: 'Apertura de caja',
    awaitingPayment: 'En espera de pago',
    paymentFailed: 'Pago fallido',
    cancelled: 'Cancelado',
    refunding: 'Reembolso',
    refundNeedsAttention: 'El reembolso necesita atención',
    refunded: 'Reembolsado',
    fulfilled: 'Enviado',
    starting: 'Iniciando',
    processing: 'Procesamiento',
    done: 'Hecho',
    failed: 'Falló',
    timedOut: 'Tiempo de espera agotado',
    reserving: 'Reserva de existencias',
    charging: 'Cobrando',
    releasing: 'Liberando stock',
    compensationNeedsAttention: 'Compensación atascada',
    confirmed: 'Confirmado',
    preparing: 'Preparando',
    readyToShip: 'Listo para enviar',
    booking: 'Compañía de reserva',
    shipped: 'En tránsito',
    exception: 'Excepción del transportista',
    delivered: 'Entregado',
    renewing: 'Cobrando',
    active: 'Activo',
    pastDue: 'Vencidos',
  },
  transitions: {
    retry: 'Reintentar',
    jobStarted: 'Trabajo enviado',
    startFailed: 'Envío fallido',
    poll: 'Resultado de la encuesta',
    jobDone: 'Exportación completada',
    jobFailed: 'Exportación fallida',
    cancel: 'Cancelar',
    paymentCaptured: 'Pago capturado',
    picked: 'Almacén elegido',
    ship: 'Barco',
    booked: 'Transportista reservado',
    trackingUpdated: 'Seguimiento actualizado',
    checkout: 'Abrir caja',
    checkoutCreated: 'Caja abierta',
    checkoutFailed: 'Error en el pago',
    paymentSucceeded: 'Pago exitoso',
    paymentDeclined: 'Pago rechazado',
    paidAfterCancel: 'Pago después de la cancelación',
    expire: 'Cerrar después del tiempo de espera',
    refundOrder: 'Reembolso',
    refunded: 'Reembolso completado',
    refundFailed: 'Reembolso fallido',
    retryRefund: 'Reintentar reembolso',
    charged: 'Cargo exitoso',
    chargeFailed: 'Cargo fallido',
    renew: 'Renovar cuando corresponda',
    retryCharge: 'Cargo de reintento',
    updateCard: 'Tarjeta de actualización',
    abandon: 'Abandonar',
    stockReserved: 'Stock reservado',
    stockUnavailable: 'Existencias no disponibles',
    stockReleased: 'Stock liberado',
    releaseFailed: 'Error en la liberación de existencias',
    retryRelease: 'Reintentar liberación de existencias',
    retryInvoice: 'Reintentar factura',
    submitted: 'Solicitud enviada',
    submissionFailed: 'Envío fallido',
    query: 'Consultar factura',
    stillPending: 'Aún pendiente',
    issued: 'Factura emitida',
    issueFailed: 'Problema fallido',
    queryFailed: 'Consulta fallida',
    create: 'Creado',
    accept: 'Tomar',
    reply: 'Responder',
    customerReply: 'Respuesta del cliente',
    resolve: 'Resolver',
    autoClose: 'Cerrar automáticamente',
    reopen: 'Reabrir',
    submit: 'Enviar',
    approve: 'Aprobar',
    reject: 'Rechazar',
    requestInfo: 'Enviar de vuelta',
    resubmit: 'Volver a enviar',
    withdraw: 'Retirar',
    escalate: 'Escalar',
    paid: 'Marco pagado',
  },
  runs: {
    queued: 'En cola',
    running: 'En ejecución',
    succeeded: 'Tuvo éxito',
    failed: 'Falló',
    dead: 'Se rindió',
    cancelled: 'Cancelado',
  },
};

export default esES;
