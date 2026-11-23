import type { NotificationServerResource } from './en-US.js';

const viVN: NotificationServerResource = {
  errors: {
    logNotFound: 'Không tìm thấy nhật ký thông báo.',
    kindNotFound: 'Không tìm thấy loại thông báo.',
    channelNotFound: 'Không có kênh thông báo đang bật nào tên "{{name}}".',
    channelTestUnsupported: 'Kênh "{{name}}" không thể gửi tin nhắn thử.',
    channelNoRecipient:
      'Kênh "{{name}}" không có địa chỉ hoặc thiết bị của bạn.',
    deliveryNotFound: 'Không tìm thấy lượt gửi.',
    deliveryNotRetryable:
      'Không thể thử lại lượt gửi này: chỉ lượt gửi thất bại có kênh không đổi mới thử lại được.',
    retryReasonRequired: 'Hãy nhập lý do thử lại.',
    preferenceUnknown: 'Thông báo này không có kênh đó.',
    preferenceRequired:
      'Thông báo này luôn được gửi qua kênh này; không thể tắt.',
  },
  test: {
    title: 'Thông báo thử',
    body: 'Đây là thông báo thử từ Cài đặt › Thông báo cho kênh "{{channel}}".',
  },
  authorization: {
    section: 'Tin nhắn',
    title: 'Thông báo',
    read: 'Xem',
    manage: 'Quản lý',
  },
};

export default viVN;
