import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  providerDescription:
    'Trang này sử dụng nhà cung cấp được đóng góp bởi cùng một plugin máy khách.',
  loadError: 'Không thể tải tuyến máy chủ.',
  clientExample: 'Ví dụ về lộ trình khách hàng',
  title: 'Ví dụ về tuyến đường',
  pageDescription:
    'Nó được tải từng phần và đọc phản hồi từ tuyến máy chủ của cùng một plugin.',
  loading: 'Đang tải dữ liệu máy chủ…',
  retry: 'Yêu cầu thử lại',
  plugin: 'Trình cắm',
  scope: 'Phạm vi',
  message: 'Tin nhắn',
};

export default viVN;
