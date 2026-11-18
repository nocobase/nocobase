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
  menu: {
    label: 'Демо-режим',
    switchAccount: 'Сменить аккаунт',
    title: 'Это демо-среда',
    description:
      'Данные автоматически сбрасываются каждый день. Изменения не сохраняются.',
    accountsDescription:
      'Переключитесь на один из аккаунтов ниже, чтобы увидеть, что доступно каждой роли.',
    loading: 'Загрузка аккаунтов…',
  },
  accounts: {
    title: 'Аккаунты',
    description:
      'Войдите в демо под любым из этих аккаунтов, чтобы увидеть то, что видит каждый из них.',
    enter: 'Войти',
    current: 'Текущий',
    entering: 'Вход…',
    failed: 'Не удалось войти под этим аккаунтом.',
    unavailable: 'Сейчас нет аккаунтов для входа.',
    password: 'Войти с паролем',
  },
  refused: {
    title: 'Это демо-версия. Изменения не сохраняются.',
    description: 'Всё остальное работает как обычно.',
  },
  settings: {
    title: 'Демо-среда',
    refresh: 'Обновить',
    retry: 'Повторить',
    busy: 'Демо-данные создаются или очищаются',
    busyHelp: 'Дождитесь завершения текущей операции с данными.',
    disabled: {
      title: 'Это приложение не является демо',
      help: 'Демо-режим выключен. Развёртывание включает его с помощью NOCOBASE_DEMO_MODE=true.',
    },
    errors: {
      failed: 'Запрос не выполнен. Повторите попытку.',
      demoModeRequired: 'Это работает только при включённом демо-режиме.',
      signedOut: 'Сеанс завершён. Войдите снова.',
      denied: 'У вас нет прав на просмотр настроек демо-режима.',
    },
    data: {
      title: 'Демо-данные',
      state: {
        importing: 'Создаются',
        clearing: 'Очищаются',
        resetting: 'Сбрасываются',
        failed: 'Ошибка',
        ready: 'Готово',
        none: 'Не созданы',
      },
      presentSummary: 'Созданы на языке {{language}} · {{time}}',
      resettingSummary:
        'Текущие данные очищаются, затем будут созданы заново на языке {{language}}.',
      phase: {
        clearing: 'Очистка',
        generating: 'Повторное создание',
      },
      absentSummary: 'Демо-данные ещё не созданы.',
      failed: 'Последний запуск не завершился',
      unavailable: 'Нет демо-данных',
      unavailableHelp: 'Это приложение не регистрирует набор демо-данных.',
    },
    visitors: {
      unavailable: 'Сейчас нет аккаунтов для входа.',
      title: 'Аккаунты',
      username: 'Имя пользователя {{username}}',
      copyLink: 'Копировать ссылку',
      copyLinkFor: 'Копировать ссылку для входа для {{name}}',
      openFor: 'Открыть демо как {{name}}',
      copied: 'Скопировано',
      copyFailed:
        'Не удалось скопировать. Скопируйте ссылку из адресной строки.',
    },
    schedule: {
      title: 'Ежедневный сброс',
      description:
        'Демо-данные автоматически сбрасываются каждый день. Расписание задаётся переменными окружения.',
      time: 'Время',
      language: 'Язык',
      timezone: 'Часовой пояс',
      next: 'Следующий сброс: {{time}}',
    },
  },
};

export default ruRU;
