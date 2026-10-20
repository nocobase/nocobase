import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  providerDescription:
    'Esta página utiliza un proveedor aportado por el mismo complemento del cliente.',
  loadError: 'No se puede cargar la ruta del servidor.',
  clientExample: 'Ejemplo de ruta del cliente',
  title: 'Ejemplo de rutas',
  pageDescription:
    'Se cargó de forma diferida y lee una respuesta de la ruta del servidor del mismo complemento.',
  loading: 'Cargando datos del servidor…',
  retry: 'Solicitud de reintento',
  plugin: 'Complemento',
  scope: 'Ámbito',
  message: 'Mensaje',
};

export default esES;
