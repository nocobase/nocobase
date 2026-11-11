import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
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
        'El cuerpo del correo incluye todos los idiomas, uno tras otro. El asunto está en inglés.',
      channel: 'Remitente del correo de invitación',
      variables: {
        app: 'Nombre de la aplicación',
        inviter: 'Nombre de la persona que envió la invitación',
        items: 'Roles o accesos que concede la invitación',
        date: 'Cuándo caduca la invitación',
        url: 'Enlace para aceptar la invitación; la vista previa usa un enlace ficticio',
      },
    },
  },
  accept: {
    title: 'Acepta la invitación',
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
