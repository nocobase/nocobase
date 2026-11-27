import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ruRU: LocaleResource<typeof enUS> = {
  audit: {
    operations: {
      createPermissionSet: 'Создать набор разрешений',
      assignPermissionSet: 'Назначить набор разрешений',
      unassignPermissionSet: 'Отменить назначение набора разрешений',
      updatePermissionSet: 'Изменить набор разрешений',
      deletePermissionSet: 'Удалить набор разрешений',
    },
  },
  sections: {
    pages: 'Доступ к страницам',
    page: 'Страницы',
    business: 'Бизнес-операции',
    administration: 'Система и инструменты',
    other: 'Прочее',
  },
  options: {
    defaultAndSharing: 'Использовать область данных по умолчанию',
    actions: {
      assign: 'Управлять назначениями',
      configure: 'Настроить',
      read: 'Чтение',
      create: 'Создание',
      update: 'Изменение',
      delete: 'Удаление',
      access: 'Доступ',
    },
    settingsModules: {
      authorization: 'Авторизация',
    },
    pages: {
      all: 'Все страницы',
      allDescription:
        'Разрешить доступ ко всем страницам, включая добавленные позже.',
    },
    settings: {
      'permission-sets': 'Наборы прав',
      'authentication-settings': 'Вход и аутентификация',
    },
    subjectTypes: {
      authenticated: 'Все вошедшие пользователи',
      authenticatedDescription:
        'Применяется ко всем пользователям с действующим сеансом входа.',
      user: 'Пользователи',
    },
    recordAccessPolicies: {
      allRecords: 'Все записи',
      recordsIOwn: 'Мои записи',
      recordsICreated: 'Созданные мной записи',
      customFilter: 'Пользовательский фильтр',
      customFilterHint: 'Выберите записи по пользовательскому условию фильтра.',
    },
  },
};

export default ruRU;
