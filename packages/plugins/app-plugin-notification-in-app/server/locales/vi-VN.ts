import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  channels: {
    inApp: 'Trong ứng dụng',
  },
  providers: {
    builtIn: 'Tích hợp',
  },
  errors: {
    authenticationRequired: 'Yêu cầu xác thực.',
    invalidPageToken:
      'pageToken không phải là mã thông báo mà danh sách này trả về.',
    notFound: 'Không tìm thấy tin nhắn thông báo.',
  },
};

export default viVN;
