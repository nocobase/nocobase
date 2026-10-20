import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  errors: {
    authenticationRequired: 'Yêu cầu xác thực.',
    invalidPageToken:
      'pageToken không phải là mã thông báo mà danh sách này trả về.',
    notFound: 'Không tìm thấy tin nhắn thông báo.',
  },
  test: {
    channels: {
      inApp: 'Trong ứng dụng',
    },
    providers: {
      builtIn: 'Tích hợp',
    },
    fields: {
      route: 'Tuyến nội bộ (không có tiền tố triển khai)',
      url: 'HTTP(S) URL đầy đủ',
      recipientUserId: 'ID người dùng người nhận',
      title: 'Tiêu đề',
      message: 'Tin nhắn',
    },
    placeholders: {
      currentUser: 'ID người dùng ứng dụng',
    },
    defaults: {
      title: 'Kiểm tra thông báo NocoBase',
      body: 'Đây là thông báo thử nghiệm từ NocoBase.',
    },
  },
};

export default viVN;
