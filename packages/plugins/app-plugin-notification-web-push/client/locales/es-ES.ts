import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  'push.deviceCount': 'Registrados: {{total}} · Activos: {{active}}',
  'push.active': 'Enabled',
  'push.paused': 'Paused',
  'push.pause': 'Pause',
  'push.resume': 'Resume',
  'push.title': 'Notificaciones push',
  'push.description':
    'Reciba recordatorios en cada dispositivo, incluso cuando la aplicación esté cerrada.',
  'push.subscribe': 'Suscríbete a este dispositivo',
  'push.name': 'Nombre del dispositivo',
  'push.empty': 'No hay dispositivos suscritos',
  'push.emptyHint':
    'Suscríbase a este dispositivo para recibir recordatorios cuando la aplicación esté cerrada.',
  'push.ios':
    'En iOS o iPadOS 16.4 o posterior, abra el menú Compartir de Safari, elija Añadir a la pantalla de inicio y luego abra la aplicación desde su ícono para suscribirse.',
  'push.unsupported':
    'Push necesita HTTPS y un navegador con soporte Web Push.',
  'push.unavailable':
    'La inserción no está configurada. Pídale a un administrador que configure VAPID y la clave secreta.',
  'push.denied':
    'Las notificaciones están bloqueadas. Permítalos en la configuración del sitio de su navegador y luego inténtelo de nuevo.',
  'push.current': 'Este dispositivo',
  'push.more': 'Acciones del dispositivo',
  'push.test': 'Enviar notificación de prueba',
  'push.remove': 'Quitar',
  'push.removeTitle': '¿Quitar el dispositivo “{{name}}”?',
  'push.removeHint':
    'Este dispositivo dejará de recibir notificaciones automáticas. Puedes suscribirte nuevamente desde ese dispositivo.',
  'push.cancel': 'Cancelar',
  'push.saved': 'Configuración del dispositivo guardada',
  'push.saving': 'Guardar configuración del dispositivo',
  'push.testSent': 'El servicio push ha aceptado la notificación de prueba.',
  'push.invalid':
    'El navegador ha devuelto datos de suscripción no válidos. Vuelva a suscribirse.',
  'push.endpoint': 'El servidor no admite el servicio push de este navegador.',
  'push.owned':
    'La suscripción del navegador pertenece a otra cuenta. Elimínela de esa cuenta antes de volver a suscribirse.',
  'push.browserFailed':
    'El navegador no ha podido crear la suscripción push. Revise la configuración de notificaciones y la conexión.',
  'push.expired':
    'La suscripción del dispositivo ha caducado o se ha eliminado. Vuelva a suscribirse desde ese dispositivo.',
  'push.testPaused':
    'Reanude las notificaciones push de este dispositivo antes de enviar una prueba.',
  'push.testLimited': 'Espere 30 segundos entre notificaciones de prueba.',
  'push.testNetwork':
    'El servidor no ha podido conectar con el servicio push. Pida a un administrador que revise la red y el proxy de Web Push.',
  'push.testGatewayAuth':
    'El servicio push ha rechazado las credenciales del servidor. Pida a un administrador que revise la clave VAPID.',
  'push.testGatewayLimited':
    'El servicio push está limitando las solicitudes. Inténtelo más tarde.',
  'push.testGateway':
    'El servicio push no ha podido aceptar la notificación de prueba. Inténtelo más tarde.',
  'push.failed':
    'No se pueden actualizar las notificaciones automáticas. Por favor inténtalo de nuevo.',
  'push.loadingFailed':
    'No se pueden cargar dispositivos. Por favor inténtalo de nuevo.',
  'push.retry': 'Reintentar',
  'channelType.title': 'Push del navegador',
  'channelType.testHint':
    'Envía una notificación de prueba a los navegadores en los que activó las notificaciones push. Actívelas primero en Ajustes personales › Notificaciones.',
};

export default esES;
