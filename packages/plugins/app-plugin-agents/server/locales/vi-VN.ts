import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  access: {
    section: 'Nhóm tác nhân',
    businessSection: 'Nhóm tác nhân',
    businesses: {
      agents: {
        title: 'Đại lý và kỹ năng',
        description: 'Các đặc vụ của đội và kỹ năng họ sử dụng.',
        actions: {
          edit: {
            title: 'Thay đổi tác nhân và kỹ năng',
            description:
              'Thay đổi cài đặt, kỹ năng và biến của tác nhân, lưu trữ, khôi phục và xóa nó cũng như chỉnh sửa kỹ năng. Một đại diện không được cấp khả năng nào ngoài khả năng của người biên tập',
            related:
              'Thay đổi tác nhân và kỹ năng (tác nhân họ sở hữu và kỹ năng họ tạo ra)',
            relatedLabel: 'Đại lý tôi sở hữu và kỹ năng tôi tạo',
            relatedHint:
              'Đại lý mà tôi là chủ sở hữu và các kỹ năng tôi đã tạo',
            all: 'Thay đổi tác nhân và kỹ năng (tất cả)',
          },
        },
      },
    },
    settings: {
      agents: {
        agents: 'Tác nhân',
        runners: 'Môi trường chạy',
        prices: 'Giá mẫu',
        services: 'Dịch vụ kiểu mẫu',
      },
    },
    actions: {
      read: 'Xem',
      manage: 'Quản lý',
    },
    keyScopes: {
      agents: {
        title: 'Tác nhân',
        description:
          'Xem các đại lý, kỹ năng và cách chạy; thay đổi tác nhân và kỹ năng, hủy và thử lại.',
      },
      runners: {
        title: 'Môi trường chạy',
        description:
          'Xem trình chạy và mã thông báo đăng ký; quản lý trình chạy.',
      },
      prices: {
        title: 'Giá mẫu',
        description:
          'Xem mô hình giá chi phí được ước tính từ; thay đổi chúng.',
      },
      services: {
        title: 'Dịch vụ kiểu mẫu',
        description:
          'Xem các dịch vụ mẫu và các mẫu họ cung cấp, không bao giờ xem chìa khóa của họ.',
      },
    },
  },
};

export default viVN;
