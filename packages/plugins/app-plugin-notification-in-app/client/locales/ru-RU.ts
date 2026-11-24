import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ruRU: LocaleResource<typeof enUS> = {
  inbox: {
    title: 'Входящие',
    views: {
      all: 'Все',
      unread: 'Непрочитанные',
      todo: 'Ожидают',
    },
    categories: 'Категории',
    readAll: 'Отметить все как прочитанные',
    open: 'Открыть',
    actions: {
      read: 'Отметить как прочитанное',
      unread: 'Отметить как непрочитанное',
      delete: 'Удалить',
    },
    tabs: {
      today: 'Сегодня',
      info: 'Ранее',
      decision: 'Ожидают',
    },
    actionsFor: 'Действия для {{title}}',
    allRead: 'Всё отмечено как прочитанное.',
    back: 'Назад к списку',
    cancel: 'Отмена',
    clearFilter: 'Сбросить фильтр',
    count: '×{{count}}',
    deleted: 'Удалено.',
    description: 'Уведомления и запросы, адресованные вам.',
    empty: {
      decision: 'Нет решений, ожидающих вас',
      info: 'Нет уведомлений',
      todo: 'Ничего не ждёт вас',
      unread: 'Всё просмотрено',
    },
    emptyAll: 'Здесь пусто',
    emptyDescription:
      'Здесь появляются отправленные вам уведомления и запросы.',
    filters: 'Фильтры входящих',
    forbidden: 'Вам нельзя это делать.',
    keyMove: 'Переместить',
    keyOpen: 'Открытые',
    kinds: {
      all: 'Все типы',
      decision: 'Решения',
      info: 'Ранее',
      label: 'Тип',
      today: 'Сегодня',
    },
    detailsUnavailable: 'Не удалось загрузить некоторые сведения о входящих.',
    loadFailed: 'Не удалось загрузить входящие',
    loadFailedDescription: 'Проверьте подключение и повторите попытку.',
    loadMore: 'Загрузить ещё',
    loading: 'Загрузка',
    noMatchDescription: 'Сбросьте фильтр, чтобы увидеть все типы.',
    nothingSelected: 'Выберите элемент, чтобы посмотреть его',
    notification: 'Уведомление',
    outcomes: {
      approved: 'Одобрено',
      rejected: 'Отклонено',
      withdrawn: 'Отозвано',
    },
    pendingDecisions: 'Ожидают: {{count}}',
    request: {
      approve: 'Одобрить',
      commentFor: '{{action}}: {{title}}',
      commentPlaceholder: 'Напишите что-нибудь…',
      newLine: 'новая строка',
      quickSend: 'отправить',
      reject: 'Отклонить',
    },
    requestFailed: 'Запрос не выполнен. Попробуйте ещё раз.',
    resolved: 'Обработано',
    retry: 'Повторить',
    unread: 'Непрочитанные',
    unreadCount: 'Непрочитанных: {{count}}',
  },
  inboxButton: {
    title: 'Входящие',
    viewAll: 'Открыть входящие',
    empty: 'Сообщений пока нет',
    pending: 'Входящие, ожидают: {{count}}',
    recent: 'Последние сообщения',
    unread: 'Входящие, непрочитанных: {{count}}',
  },
  nav: {
    inbox: 'Входящие',
  },
  common: { loading: 'Загрузка' },
};

export default ruRU;
