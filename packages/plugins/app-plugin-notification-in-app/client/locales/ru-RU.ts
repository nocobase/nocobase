import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ruRU: LocaleResource<typeof enUS> = {
  inbox: {
    eyebrow: 'Личные входящие',
    title: 'Центр сообщений',
    unreadCount: 'Непрочитанных: {{count}}',
    description: 'Новости из приложений и процессов, которыми вы пользуетесь.',
    markAllRead: 'Прочитать все',
    messagesTitle: 'Сообщения',
    messagesDescription:
      'Сообщения в приложении хранят отдельный статус прочтения для текущего пользователя.',
    unreadFilter: 'Непрочитанные',
    unavailable: 'Входящие недоступны',
    retry: 'Повторить',
    loading: 'Загрузка уведомлений…',
    emptyTitle: 'Всё прочитано',
    emptyDescription: 'Новые уведомления появятся здесь.',
    loadingMore: 'Загрузка…',
    loadMore: 'Загрузить ещё',
    scrollMore: 'Прокрутите вниз, чтобы загрузить ещё',
    noMore: 'Больше сообщений нет',
    expand: 'Показать больше',
    collapse: 'Свернуть',
    channel: 'В приложении',
    open: 'Открыть',
    markUnread: 'Отметить как непрочитанное',
    markRead: 'Отметить как прочитанное',
    delete: 'Удалить уведомление',
    errors: {
      update: 'Не удалось обновить входящие.',
      loadMore: 'Не удалось загрузить больше уведомлений.',
      markAllRead: 'Не удалось отметить уведомления как прочитанные.',
    },
  },
};

export default ruRU;
