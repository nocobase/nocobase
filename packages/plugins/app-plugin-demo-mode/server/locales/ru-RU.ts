import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ruRU: LocaleResource<typeof enUS> = {
  authorization: {
    title: 'Демо-данные',
    read: 'Просмотр',
    manage: 'Создание и очистка',
    configuration: 'Настройки демо-режима',
    configure: 'Настроить',
  },
  errors: {
    readOnly: 'Это демо-версия. Изменения не сохраняются.',
  },
};

export default ruRU;
