import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  errors: {
    logsForbidden: 'Se requiere acceso a los registros de notificaciones.',
    logNotFound: 'No se encontró el registro de notificaciones.',
    testHeaderRequired:
      'Se requiere el encabezado de solicitud de prueba de notificación.',
    testForbidden: 'Se requiere permiso de envío de prueba de notificación.',
    testInvalidRequest:
      'El cuerpo de la solicitud debe contener un objetivo de prueba y valores de campo.',
    testTargetUnavailable:
      'El objetivo de prueba de notificación no está disponible.',
    testUnknownField: 'Campo de prueba de notificación desconocido "{{name}}".',
    testRequiredField:
      'Se requiere el campo de prueba de notificación "{{name}}".',
    testFieldTooLong:
      'El campo de prueba de notificación "{{name}}" debe tener como máximo caracteres {{maxLength}}.',
    testFailed: 'La prueba de notificación falló.',
    testNotFound: 'No se encontró la prueba de notificación.',
  },
};

export default esES;
