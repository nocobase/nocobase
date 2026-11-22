import type { NotificationServerResource } from './en-US.js';

const esES: NotificationServerResource = {
  errors: {
    logNotFound: 'No se encontró el registro de notificación.',
    kindNotFound: 'No se encontró el tipo de notificación.',
    channelNotFound:
      'No hay ningún canal de notificación habilitado llamado "{{name}}".',
    channelTestUnsupported:
      'El canal "{{name}}" no puede enviar un mensaje de prueba.',
    channelNoRecipient:
      'El canal "{{name}}" no tiene una dirección ni un dispositivo tuyo.',
    deliveryNotFound: 'No se encontró la entrega.',
    deliveryNotRetryable:
      'Esta entrega no se puede reintentar: solo se puede reintentar una entrega fallida cuyo canal no haya cambiado.',
    retryReasonRequired: 'Indica el motivo del reintento.',
    preferenceUnknown: 'Esta notificación no tiene ese canal.',
    preferenceRequired:
      'Esta notificación siempre se envía por este canal; no se puede desactivar.',
  },
  test: {
    title: 'Notificación de prueba',
    body: 'Esto es una prueba desde Configuración › Notificaciones para el canal "{{channel}}".',
  },
  authorization: {
    section: 'Mensajes',
    title: 'Notificaciones',
    read: 'Ver',
    manage: 'Administrar',
  },
};

export default esES;
