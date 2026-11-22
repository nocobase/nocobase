import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  // The shared list, form and overlay components (`components/`).
  actions: {
    close: 'Cerrar',
  },
  dataTable: {
    filters: 'Filtros',
    filtersApplied: 'Filtros · {{count}}',
    firstPage: 'Ir a la primera página',
    hideColumn: 'Ocultar',
    lastPage: 'Ir a la última página',
    nextPage: 'Ir a la página siguiente',
    pageOf: 'Página {{page}} de {{pageCount}}',
    previousPage: 'Ir a la página anterior',
    rowsPerPage: 'Filas por página',
    selectPage: 'Seleccionar todo en esta página',
    selectedCount: '{{selected}} de {{total}} fila(s) seleccionada(s).',
    sort: 'Ordenar',
    sortAscending: 'Asc',
    sortBy: 'Ordenar por',
    sortDescending: 'Desc',
    toggleColumns: 'Mostrar u ocultar columnas',
    view: 'Vista',
  },
  formFeedback: {
    denied:
      'No puedes enviar este formulario con tu acceso actual. Se han conservado tus datos.',
    failed:
      'No se pudo guardar. Se han conservado tus datos. Inténtalo de nuevo.',
    field: 'Este valor se ha rechazado. Revísalo e inténtalo de nuevo.',
    invalid: 'Revisa los campos resaltados e inténtalo de nuevo.',
    network:
      'No se puede conectar. Revisa tu conexión e inténtalo de nuevo. Se han conservado tus datos.',
  },
  listFeedback: {
    clear: 'Borrar filtros',
    loading: 'Cargando',
    refreshFailed: 'Error al actualizar; se muestran los datos anteriores',
    retry: 'Reintentar',
    retrying: 'Reintentando…',
    signIn: 'Iniciar sesión',
    empty: 'Aún no hay datos',
    noResults: 'Sin resultados',
    forbidden: 'Acceso denegado',
    unauthenticated: 'La sesión ha caducado',
    failed: 'No se pudo cargar la lista',
  },
  pendingFeedback: {
    longWait: 'Está tardando más de lo habitual. Puedes seguir esperando.',
    working: 'Procesando…',
  },
  routeOverlay: {
    close: 'Cerrar',
  },
  status: {
    loading: 'Cargando',
    refreshing: 'Actualizando',
  },
  management: {
    actions: 'Acciones',
    actionsFor: 'Acciones para {{name}}',
    all: 'Todos los estados',
    allRoles: 'Todos los roles',
    assignedRoles: 'Roles asignados',
    backToSource: 'Volver a la página anterior',
    cancel: 'Cancelar',
    clear: 'Borrar filtros',
    confirm: 'Confirmar',
    conflict:
      'La solicitud entra en conflicto con los datos actuales. Revisa el registro más reciente antes de volver a intentarlo.',
    create: 'Crear',
    created: 'Usuario "{{name}}" creado',
    denied: 'No tienes acceso. Ponte en contacto con un administrador.',
    disable: 'Desactivar',
    disableHint:
      'Este usuario no podrá iniciar sesión y sus sesiones activas finalizarán.',
    disableTitle: '¿Desactivar al usuario "{{name}}"?',
    disabled: 'Desactivado',
    discardHint: 'Se perderán los cambios no guardados.',
    discardTitle: '¿Descartar los cambios?',
    editUser: 'Editar usuario',
    email: 'Correo electrónico',
    enable: 'Activar',
    enableHint: 'Este usuario podrá volver a iniciar sesión.',
    enableTitle: '¿Activar al usuario "{{name}}"?',
    enabled: 'Activado',
    failed: 'No se pudo completar la solicitud. Inténtalo de nuevo.',
    identityConflict:
      'Este correo electrónico o nombre de usuario ya está en uso.',
    invalidEmail: 'Introduce un correo electrónico válido',
    invalidRequest:
      'Algunos valores no son válidos. Revisa los datos o los filtros e inténtalo de nuevo.',
    listChanged: 'La lista ha cambiado. Inténtalo de nuevo.',
    loading: 'Cargando',
    missing: 'Este registro no existe o se ha eliminado.',
    name: 'Nombre',
    newUser: 'Nuevo usuario',
    noAssignedRoles: 'Sin roles asignados',
    noRoleAccess:
      'Este usuario aún puede iniciar sesión y usar las funciones básicas de la cuenta. Los roles no le otorgan acceso a ningún negocio.',
    noRolesFound: 'No se encontraron roles.',
    password: 'Contraseña inicial',
    passwordPolicy:
      'La contraseña no cumple la política de contraseñas actual.',
    required: 'Rellena este campo',
    retry: 'Reintentar',
    revokeHint: 'Este usuario tendrá que volver a iniciar sesión.',
    revokeRoleHint: 'Se retirará el acceso otorgado por los roles indicados.',
    revokeRoleTitle: '¿Retirar roles a "{{name}}"?',
    revokeSessions: 'Revocar sesiones',
    revokeTitle: '¿Revocar las sesiones de "{{name}}"?',
    roleFilter: 'Filtrar por rol',
    roleFilterIncomplete:
      'Elige un ámbito de rol y un rol, o borra los filtros.',
    save: 'Guardar',
    saved: '"{{name}}" guardado',
    saving: 'Guardando…',
    searchRoles: 'Buscar roles',
    selectRoles: 'Seleccionar roles',
    sessionEnded: 'Tu sesión ha finalizado. Vuelve a iniciar sesión.',
    signInAgain: 'Volver a iniciar sesión',
    status: 'Estado',
    total_one: '{{count}} usuario',
    total_other: '{{count}} usuarios',
    userActionSaved: {
      disable: 'Usuario "{{name}}" desactivado',
      enable: 'Usuario "{{name}}" activado',
      revokeSessions: 'Sesiones activas de "{{name}}" revocadas',
    },
    userSearch: 'Buscar por nombre, usuario o correo electrónico',
    username: 'Nombre de usuario',
    users: 'Usuarios',
    usersDescription: 'Gestiona cuentas, accesos y sesiones activas.',
    total_many: '{{count}} de usuarios',
  },
  humanOnly: {
    manageAccounts:
      'Solo una persona gestiona cuentas: ninguna clave de API puede hacerlo.',
  },
  page: {
    loading: 'Cargando',
  },
  notificationTemplates: {
    invitation: {
      contributor: 'Usuarios',
      category: 'Cuentas',
      name: 'Invitación de usuario',
      trigger:
        'Un administrador invita a alguien, o reenvía una invitación, con el correo electrónico seleccionado.',
      recipients:
        'La persona invitada, en la dirección de correo introducida para ella.',
      businessRule:
        'Se envía cada vez que se crea o reenvía una invitación con el correo electrónico seleccionado. No hay un interruptor aparte para desactivarlo.',
      languagePolicy:
        'Se escribe en un solo idioma, elegido al invitar: el idioma de la interfaz de quien invita, salvo que se elija otro. Al reenviar se mantiene. Si ese idioma no tiene texto de correo, el correo usa el idioma predeterminado de la aplicación y el inglés.',
      channel: 'Remitente del correo de invitación',
      variables: {
        app: 'Nombre de la aplicación',
        inviter: 'Nombre de la persona que envió la invitación',
        items: 'Roles o accesos que concede la invitación',
        date: 'Cuándo caduca la invitación, en el idioma del correo y en UTC',
        url: 'Enlace para aceptar la invitación; la vista previa usa un enlace ficticio',
      },
    },
  },
  accept: {
    title: 'Acepta la invitación',
    language: 'Idioma',
    description: '{{inviter}} te invitó.',
    summary: 'También te unirás: {{items}}',
    loading: 'Cargando la invitación…',
    email: 'Correo electrónico',
    name: 'Nombre',
    username: 'Nombre de usuario (opcional)',
    usernameHint: 'Puedes usar este nombre de usuario para iniciar sesión.',
    password: 'Contraseña',
    nameRequired: 'Ingrese su nombre.',
    passwordTooShort: 'La contraseña necesita al menos caracteres {{min}}.',
    submit: 'Crear cuenta y unirse',
    join: 'Aceptar invitación',
    submitting: 'Uniéndose…',
    signedIn:
      'Ha iniciado sesión como {{name}}. Cierra sesión para aceptar esta invitación con una nueva cuenta.',
    signOut: 'Cerrar sesión',
    signOutFailed: 'No se pudo cerrar sesión.',
    existingAccount:
      'Esta dirección ya tiene una cuenta. Inicia sesión con él para continuar.',
    alreadyHaveAccount: '¿Ya tienes una cuenta? Inicia sesión',
    goToLogin: 'Ir a iniciar sesión',
    errors: {
      notFound: 'Este enlace de invitación no es válido.',
      expired: 'Esta invitación ha caducado. Pide uno nuevo.',
      accepted: 'Esta invitación ya ha sido aceptada.',
      revoked: 'Esta invitación ha sido revocada.',
      password: 'La contraseña no cumple con los requisitos.',
      usernameConflict:
        'Este nombre ya se usa como nombre de usuario o correo electrónico. Elige otro.',
      accountConflict: 'No se puede crear una cuenta con esta dirección.',
      failed: 'Algo salió mal. Por favor inténtalo de nuevo.',
    },
  },
};

export default esES;
