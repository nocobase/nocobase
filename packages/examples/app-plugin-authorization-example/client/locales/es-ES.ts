import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  practice: {
    intro:
      'Utilice las cuentas siguientes en lugar de un administrador. Los administradores evitan las restricciones. Estos son ejercicios de colaboración de ventas independientes, no un flujo de trabajo completo de aprobación de cotización a pedido. Cada ejercicio comienza desde el estado de registro inicial.',
    read: {
      title: 'Un asistente consulta información del proyecto.',
      steps:
        'Inicie sesión como sales_assistant: Proyectos muestra project-1, project-2 y project-3, pero no hay acciones de edición. Las cotizaciones y pedidos permanecen limitados al proyecto propio.',
      reason:
        'Compartir proyectos otorga registros para visualización únicamente; no otorga edición ni registros relacionados. El confidencial project-4 queda excluido.',
    },
    scopes: {
      title: 'Un ingeniero prepara y presenta una cotización',
      steps:
        'Inicie sesión como sales_engineer: edite y envíe su quote-2. Puede consultar quote-5, pero no puede cambiar ni enviar la cotización de un colega. Puede continuar preparando quote-6, pero no puede enviarlo para un proyecto fuera de su región.',
      reason:
        'Las citas no confidenciales son material de referencia interna en todas las regiones. El preparador es propietario del contenido; la responsabilidad regional rige la sumisión. La visualización no permite la edición. Los pedidos existentes hacen referencia a cotizaciones aceptadas por separado; enviar una cotización de práctica no crea un pedido.',
    },
    handover: {
      title: 'Un ingeniero delegado se hace cargo de un presupuesto',
      steps:
        'El propietario de un proyecto de la región sur entrega quote-7 a sales_proposal, un ingeniero de la región norte. Inicie sesión como sales_proposal, edite la cotización y envíela. Como administrador, restablezca los registros y elimine sales_proposal de la regla de intercambio de transferencia de cotización de propuesta. Inicie sesión nuevamente: la cuenta ya no puede editar ni enviar esta cotización.',
      reason:
        'La ​​entrega permite editar y enviar esta cotización más el acceso al proyecto necesario para la presentación; no delega toda la región Sur. El rol de ingeniero otorga operaciones, mientras que compartir identifica los registros. Como ejercicio avanzado, retire el proyecto o el alcance de la cotización: la presentación requiere ambos.',
    },
    delivery: {
      title: 'Un repartidor cumple un pedido.',
      steps:
        'Inicie sesión como sales_delivery. Abra order-2, asigne un transportista, mantenga los controles e ingrese una referencia de entrega. Una vez confirmada la entrega, no se podrán volver a modificar ni sus relaciones ni su estado de entrega. Restablezca los registros antes de repetir el ejercicio.',
      reason:
        'El personal de entrega ingresa órdenes únicamente; Los enlaces a cotizaciones y proyectos no otorgan acceso a esas páginas.',
    },
  },
  reset: {
    action: 'Restablecer registros de práctica',
    cancel: 'Cancelar',
    confirm:
      '¿Restaurar los proyectos, cotizaciones y pedidos inicializados para cada cuenta de demostración? Los cambios realizados en esos registros se sobrescribirán.',
    description:
      'Un administrador puede restablecer los registros comerciales aquí antes de repetir un ejercicio. Se conservan las cuentas y la configuración de permisos; restaurar cualquier cambio de autorización manualmente.',
    done: 'Registros de práctica restaurados. Actualiza cualquier lista de registros abiertos.',
  },
  access: {
    title: 'Tus roles',
    direct: 'Asignación directa',
    coverage:
      'Cada cuenta de ejemplo mantiene sus responsabilidades laborales a través de una asignación directa.',
  },
  rules: {
    public: 'Excluir proyectos confidenciales',
    delivery: 'Pedidos regionales para entrega',
    handover: 'Entrega de cotización de propuesta',
    projects: 'Proyectos de ejemplo compartidos',
  },
  accountMenus: {
    assistant: 'Proyectos, cotizaciones y pedidos (solo lectura)',
    engineer:
      'Consultar cotizaciones no confidenciales; editar sus propias cotizaciones y enviarlas dentro de la región asignada',
    manager:
      'Gestionar proyectos propios; cotizaciones y pedidos son de solo lectura',
    delivery: 'Órdenes únicamente; confirmar entregas regionales',
    proposal: 'Editar y enviar el quote-7 entregado',
    coordinator: 'Administrar project-8, fuera de la región de origen',
  },
  relations: {
    access: {
      notGranted: 'Sólo lectura: no se otorga coordinación de entrega.',
      outsideScope:
        'Sólo lectura: este pedido está fuera del ámbito de entrega.',
      notReady: 'Las órdenes entregadas no se pueden cambiar.',
    },
    title: 'Relaciones de orden',
    description:
      'Asignar un transportista activo, mantener controles y gestionar transportistas colaboradores. Pruebe una cuenta de entrega y una cuenta de solo lectura para comparar el acceso.',
    order: 'Pedido',
    carrier: 'Transportista',
    unassigned: 'Ninguno asignado',
    assign: 'Asignar operador',
    disconnect: 'Eliminar asignación',
    checks: 'Cheques de entrega',
    done: 'Hecho',
    pending: 'Pendiente',
    toggle: 'Alternar finalización',
    delete: 'Eliminar comprobación',
    checkTitle: 'Comprobar título',
    add: 'Añadir cheque',
    collaborators: 'Transportistas colaboradores',
    note: 'Nota de colaboración',
    addProposal: 'Añadir operador seleccionado',
    replace: 'Reemplazar con el operador seleccionado',
    clear: 'Eliminar todos los colaboradores',
    unavailable: 'Estas relaciones no son accesibles.',
    loading: 'Cargando relaciones…',
  },
  sales: {
    manageRelations: 'Organizar la entrega del pedido',
    saveFirst: 'Guarde los cambios antes de enviarlos.',
    states: {
      draft: 'Borrador',
      submitted: 'Enviado',
      accepted: 'Aceptado',
      ready: 'Listo',
      delivered: 'Entregado',
    },
    errors: {
      session: 'La sesión expiró. Inicia sesión nuevamente.',
      input: 'Verifique el monto y los campos requeridos.',
      conflict:
        'El estado del registro cambió. Actualice antes de volver a intentarlo.',
      request:
        'La solicitud falló. Comprueba tu conexión y vuelve a intentarlo.',
    },
    operation: {
      outsideScope: 'Fuera del alcance de operación permitido',
      notReady: 'Solo se pueden entregar pedidos listos',
      allowed: 'Dentro del alcance del envío',
      notGranted: 'Sólo lectura — operación no concedida',
      quoteScope: 'Fuera del alcance de cotización permitido',
      projectScope: 'Proyecto fuera del alcance permitido',
      notDraft: 'Sólo se pueden enviar borradores',
      invalidAmount: 'El importe debe ser positivo',
    },
    preparedBy: 'Preparado por',
    parentProject: 'Proyecto',
    sourceQuote: 'Cita fuente',
    relationships: 'Registros relacionados',
    relatedQuotes: 'Cotizaciones de proyectos',
    relatedOrders: 'Órdenes de proyecto',
    filtered: 'Filtrado por',
    clearFilter: 'Limpiar filtro',
    noPageAccess: 'Sin acceso a la página',
    descriptions: {
      projects:
        'Abrir cotizaciones y pedidos relacionados de un proyecto. Las listas relacionadas muestran solo los registros a los que puede acceder esta cuenta.',
      quotes:
        'Un proyecto puede tener varios presupuestos. La presentación verifica el alcance del proyecto y el preparador de cotizaciones de forma independiente, luego valida el estado y el monto del borrador.',
      orders:
        'Cada pedido hace referencia a su cotización fuente y proyecto. Las cuentas de entrega sólo ingresan Órdenes; Las referencias no otorgan acceso a otras páginas o registros.',
    },
    delivery: 'Entrega',
    orders: 'Pedidos',
    editProject: 'Editar información del proyecto',
    editQuote: 'Editar precios',
    submit: 'Enviar cotización',
    submitScopes: {
      projects: 'Proyectos vinculados a las cotizaciones',
      quotes: 'Cotizaciones permitidas para envío',
    },
    deliver: 'Confirmar entrega',
    amount: 'Cantidad',
    status: 'Estado',
    deliveryReference: 'Referencia de entrega',
    group: 'Colaboración de ventas',
    title: 'Ejemplo de permisos de ventas',
    projects: 'Proyectos',
    quotes: 'Presupuestos',
    view: 'Ver',
    edit: 'Editar notas',
    intro:
      'Explore los límites de acceso de los asistentes que consultan registros, los ingenieros que preparan cotizaciones, los delegados de entrega de cotizaciones y el personal de entrega que cumple con los pedidos.',
    record: 'Registro',
    notes: 'Notas',
    save: 'Guardar',
    refresh: 'Actualizar',
    loading: 'Cargando…',
    empty: 'No hay registros accesibles',
    readOnly: 'Sólo lectura',
    saved: 'Guardado',
    scope: {
      prepared: 'Citas preparadas por mí',
      title: 'Alcance de los datos de ventas',
      unrestricted: 'Sin restricciones',
      region: 'Mi región',
      own: 'Proyecto principal de mi propiedad',
      public: 'Proyectos no confidenciales',
    },
  },
  title: 'Ejemplo de permisos de ventas',
  overview: 'Guía',
  actions: 'Acciones',
  testAccounts: 'Ejemplos de cuentas',
  account: 'Cuenta',
  permissionSet: 'Conjunto de permisos',
  password: 'Ejemplo de contraseña: AuthzExample123!',
  tryTitle: 'Configurar y verificar',
  roles: {
    assistant: 'Asistente de ventas',
    engineer: 'Ingeniero de ventas',
    manager: 'Gerente de proyecto',
    delivery: 'Especialista en entregas',
  },
  forbidden: 'No tiene permiso para esta operación.',
  error: 'Error al cargar. Por favor inténtalo de nuevo.',
};

export default esES;
