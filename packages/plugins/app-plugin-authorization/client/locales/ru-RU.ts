import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';
import components from './components-en-US.js';
import settings from './settings-en-US.js';

const ruRU: LocaleResource<typeof enUS> = {
  // The Roles and permissions pages are not translated into this language yet and show in English.
  ...components,
  settings: {
    ...settings,
    unsavedCount_few: settings.unsavedCount_other,
    unsavedCount_many: settings.unsavedCount_other,
    unsavedCountRisky_few: settings.unsavedCountRisky_other,
    unsavedCountRisky_many: settings.unsavedCountRisky_other,
    review: {
      ...settings.review,
      description_few: settings.review.description_other,
      description_many: settings.review.description_other,
      highRisk_few: settings.review.highRisk_other,
      highRisk_many: settings.review.highRisk_other,
    },
    members: {
      ...settings.members,
      description_few: settings.members.description_other,
      description_many: settings.members.description_other,
    },
    permissionEditor: {
      ...settings.permissionEditor,
      attention_few: settings.permissionEditor.attention_other,
      attention_many: settings.permissionEditor.attention_other,
      confirmDisable_few: settings.permissionEditor.confirmDisable_other,
      confirmDisable_many: settings.permissionEditor.confirmDisable_other,
      noticeScopeReset_few: settings.permissionEditor.noticeScopeReset_other,
      noticeScopeReset_many: settings.permissionEditor.noticeScopeReset_other,
      noticeTurnOnFirst_few: settings.permissionEditor.noticeTurnOnFirst_other,
      noticeTurnOnFirst_many: settings.permissionEditor.noticeTurnOnFirst_other,
      noticeManagedRequirement_few:
        settings.permissionEditor.noticeManagedRequirement_other,
      noticeManagedRequirement_many:
        settings.permissionEditor.noticeManagedRequirement_other,
      noticeManagedDependent_few:
        settings.permissionEditor.noticeManagedDependent_other,
      noticeManagedDependent_many:
        settings.permissionEditor.noticeManagedDependent_other,
      tabChanges_few: settings.permissionEditor.tabChanges_other,
      tabChanges_many: settings.permissionEditor.tabChanges_other,
    },
  },
  permissionSets: {
    builtIn: {
      root: 'Системный администратор',
      member: 'Участник',
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
