import auditLabels from '../../locales/ru-RU.js';
import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ruRU: LocaleResource<typeof enUS> = {
  ...auditLabels,
  resourceTitle: 'Область данных по умолчанию',
};

export default ruRU;
