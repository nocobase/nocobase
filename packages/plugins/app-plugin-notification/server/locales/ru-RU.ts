import type { NotificationServerResource } from './en-US.js';

const ruRU: NotificationServerResource = {
  errors: {
    logNotFound: 'Журнал уведомления не найден.',
    kindNotFound: 'Тип уведомления не найден.',
    channelNotFound: 'Нет включённого канала уведомлений с именем «{{name}}».',
    channelTestUnsupported:
      'Канал «{{name}}» не может отправить тестовое сообщение.',
    channelNoRecipient: 'У канала «{{name}}» нет вашего адреса или устройства.',
    deliveryNotFound: 'Доставка не найдена.',
    deliveryNotRetryable:
      'Эту доставку нельзя повторить: повторить можно только неудачную доставку, канал которой не менялся.',
    retryReasonRequired: 'Укажите причину повтора.',
    preferenceUnknown: 'У этого уведомления нет такого канала.',
    preferenceRequired:
      'Это уведомление всегда отправляется по этому каналу; его нельзя отключить.',
  },
  test: {
    title: 'Тестовое уведомление',
    body: 'Это тест из раздела «Настройки › Уведомления» для канала «{{channel}}».',
  },
  authorization: {
    section: 'Сообщения',
    title: 'Уведомления',
    read: 'Просмотр',
    manage: 'Управление',
  },
};

export default ruRU;
