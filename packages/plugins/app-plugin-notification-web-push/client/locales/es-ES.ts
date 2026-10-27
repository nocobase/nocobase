import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
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
  'push.testSent': 'Notificación de prueba en cola',
  'push.failed':
    'No se pueden actualizar las notificaciones automáticas. Por favor inténtalo de nuevo.',
  'push.loadingFailed':
    'No se pueden cargar dispositivos. Por favor inténtalo de nuevo.',
  'push.retry': 'Reintentar',
};

export default esES;
