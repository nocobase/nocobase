import auditLabels from '../../locales/fr-FR.js';
import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  ...auditLabels,
  resourceTitle: 'Règles de partage',
};

export default frFR;
