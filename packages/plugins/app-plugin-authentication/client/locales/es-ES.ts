import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  errors: {
    generic: 'Algo salió mal. Por favor inténtalo de nuevo.',
    network:
      'No se pudo comunicar con el servidor. Comprueba tu conexión y vuelve a intentarlo.',
    rateLimited: 'Demasiados intentos. Espere un momento e inténtelo de nuevo.',
    INVALID_EMAIL_OR_PASSWORD: 'Correo electrónico o contraseña incorrectos.',
    INVALID_USERNAME_OR_PASSWORD: 'Nombre de usuario o contraseña incorrectos.',
    INVALID_PASSWORD: 'Contraseña incorrecta.',
    INVALID_EMAIL: 'Ingrese una dirección de correo electrónico válida.',
    INVALID_USERNAME:
      'Los nombres de usuario pueden contener solo letras, dígitos, guiones bajos y puntos.',
    USERNAME_TOO_SHORT: 'Este nombre de usuario es demasiado corto.',
    USERNAME_TOO_LONG: 'Este nombre de usuario es demasiado largo.',
    USERNAME_IS_ALREADY_TAKEN: 'Este nombre de usuario ya está en uso.',
    USER_ALREADY_EXISTS: 'Ya existe una cuenta con este correo electrónico.',
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
      'Ya existe una cuenta con este correo electrónico. Utilice otro correo electrónico.',
    PASSWORD_TOO_SHORT: 'Esta contraseña es demasiado corta.',
    RESET_PASSWORD_DISABLED:
      'El restablecimiento de contraseña de autoservicio no está habilitado. Póngase en contacto con un administrador para restablecer su contraseña.',
    PASSWORD_TOO_LONG: 'Esta contraseña es demasiado larga.',
    EMAIL_NOT_VERIFIED:
      'Verifique su dirección de correo electrónico antes de iniciar sesión.',
    INVALID_TOKEN: 'Este enlace no es válido o ha caducado.',
    TOKEN_EXPIRED: 'Este enlace ha caducado.',
    ACCOUNT_DISABLED:
      'Esta cuenta está deshabilitada. Póngase en contacto con su administrador.',
    SERVICE_ACCOUNT_NO_LOGIN:
      'Una cuenta de servicio no puede iniciar sesión; actúa únicamente a través de claves API.',
    invalidOriginWithAddress:
      'No se confía en este origen. Configure app.publicOrigin en config.yml en {{origin}}, reinicie la aplicación y vuelva a intentarlo.',
    INVALID_ORIGIN:
      'No se confía en este origen. Verifique app.publicOrigin en config.yml, reinicie la aplicación e inténtelo nuevamente.',
    INVALID_CSRF_ORIGIN:
      'Esta solicitud provino de otro sitio y fue rechazada. Vuelve a cargar la página e inténtalo de nuevo.',
  },
};

export default esES;
