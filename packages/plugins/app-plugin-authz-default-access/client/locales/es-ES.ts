import auditLabels from '../../locales/es-ES.js';
import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  ...auditLabels,
  resourceTitle: 'Alcance de datos predeterminado',
};

export default esES;
