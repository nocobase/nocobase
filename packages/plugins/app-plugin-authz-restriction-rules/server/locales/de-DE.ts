import auditLabels from '../../locales/de-DE.js';
import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  ...auditLabels,
  resourceTitle: 'Beschränkungsregeln',
};

export default deDE;
