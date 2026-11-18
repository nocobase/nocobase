import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ruRU: LocaleResource<typeof enUS> = {
  errors: {
    logsForbidden: 'Требуется доступ к журналам уведомлений.',
    logNotFound: 'Запись журнала уведомлений не найдена.',
  },
};

export default ruRU;
