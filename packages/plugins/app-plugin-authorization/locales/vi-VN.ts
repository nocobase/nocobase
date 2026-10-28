import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  sections: {
    pages: 'Quyền của trang',
    page: 'Trang',
    business: 'Quyền kinh doanh',
    administration: 'Hành chính',
    other: 'Khác',
  },
  options: {
    defaultAndSharing: 'Sử dụng phạm vi dữ liệu mặc định',
    actions: {
      assign: 'Quản lý bài tập',
      configure: 'Cấu hình',
      inspect: 'Kiểm tra quyền',
      read: 'Đọc',
      create: 'Tạo',
      update: 'Cập nhật',
      delete: 'Xóa',
      access: 'Truy cập',
    },
    settingsModules: {
      authorization: 'Phân quyền',
    },
    pages: {
      all: 'Tất cả các trang',
      allDescription:
        'Cho phép truy cập vào mọi trang, kể cả những trang được thêm sau.',
    },
    settings: {
      inspector: 'Thanh tra giấy phép',
      'permission-sets': 'Bộ quyền',
    },
    subjectTypes: {
      authenticated: 'Tất cả người dùng đã đăng nhập',
      authenticatedDescription:
        'Áp dụng cho mọi người dùng có phiên đăng nhập hợp lệ.',
      user: 'Người dùng',
    },
    recordAccessPolicies: {
      allRecords: 'Tất cả hồ sơ',
      recordsIOwn: 'Hồ sơ tôi sở hữu',
      recordsICreated: 'Bản ghi tôi đã tạo',
      customFilter: 'Bộ lọc tùy chỉnh',
      customFilterHint: 'Chọn bản ghi có điều kiện lọc tùy chỉnh.',
    },
  },
};

export default viVN;
