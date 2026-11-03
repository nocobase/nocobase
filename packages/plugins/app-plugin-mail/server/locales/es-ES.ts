import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  errors: {
    imapMoveLocationChanged:
      'La carpeta o copia seleccionada ha cambiado. Sincronice el buzón y vuelva a abrir la carpeta de origen.',
    imapMoveNotWritable:
      'La carpeta seleccionada no permite esta operación. Revise los permisos del buzón.',
    imapMoveSourceRequired:
      'Abra la carpeta de origen antes de mover o eliminar este mensaje.',
    imapMoveUnsupported:
      'Este servidor no puede mover mensajes de forma segura. Use su cliente de correo.',
    imapTrashNotFound:
      'Esta cuenta no tiene papelera. Use su cliente de correo.',
    imapMoveOutcomeUnknown:
      'El movimiento está incompleto o su resultado es desconocido. Compruebe el buzón antes de volver a intentarlo.',
    invalidRecipient:
      'Corrija las direcciones de correo electrónico y los nombres para mostrar de los destinatarios antes de enviar.',
    accessDenied: 'Se requiere acceso al correo.',
    idempotencyConflict:
      'La clave de idempotencia ya está asociada con otra solicitud.',
    invalidRequest: 'La ​​solicitud de correo no es válida.',
    accountCredentialsInvalid:
      'Error en la autenticación del buzón. Verifique su nombre de inicio de sesión y contraseña o código de autorización, y confirme que IMAP/SMTP esté habilitado. Gmail y otros servicios pueden requerir una contraseña de aplicación.',
    requestFailed: 'No se pudo completar la solicitud de correo.',
    providerRateLimited:
      'El servicio de correo está recibiendo demasiadas solicitudes. Vuelve a intentarlo más tarde.',
    providerUnavailable:
      'No se pudo comunicar con el servicio de correo. Vuelve a intentarlo más tarde.',
    reauthorizationRequired:
      'Esta cuenta de correo debe volver a conectarse antes de poder usarse.',
    syncRunNotFound: 'No se encontró la ejecución de sincronización de correo.',
    messageNotFound: 'No se encontró el mensaje de correo.',
    authorizationStateRequired: 'Se requiere estado de autorización de correo.',
  },
};

export default esES;
