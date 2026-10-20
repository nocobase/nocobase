import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  page: {
    loading: 'Cargando',
  },
  accept: {
    title: 'Acepta la invitación',
    description: '{{inviter}} te invitó.',
    summary: 'También te unirás: {{items}}',
    loading: 'Cargando la invitación…',
    email: 'Correo electrónico',
    name: 'Nombre',
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
    goToLogin: 'Ir a iniciar sesión',
    errors: {
      notFound: 'Este enlace de invitación no es válido.',
      expired: 'Esta invitación ha caducado. Pide uno nuevo.',
      accepted: 'Esta invitación ya ha sido aceptada.',
      revoked: 'Esta invitación ha sido revocada.',
      password: 'La contraseña no cumple con los requisitos.',
      accountConflict: 'No se puede crear una cuenta con esta dirección.',
      failed: 'Algo salió mal. Por favor inténtalo de nuevo.',
    },
  },
};

export default esES;
