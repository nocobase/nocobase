import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  access: {
    section: 'Bản phát hành',
    pages: {
      'rel-apps': 'Ứng dụng',
    },
    businessSection: 'Bản phát hành',
    businesses: {
      apps: {
        title: 'Ứng dụng',
        description:
          'Ứng dụng, bản phát hành, quá trình triển khai và thời gian chạy của chúng.',
        actions: {
          view: {
            title: 'Xem ứng dụng',
            description:
              'Xem Ứng dụng, bản phát hành, hoạt động triển khai và trạng thái thời gian chạy của chúng',
            related: 'Xem ứng dụng (những ứng dụng liên quan đến chúng)',
            relatedLabel: 'Những cái tôi đã tạo ra',
            relatedHint:
              'Ứng dụng tôi đã tạo và mọi ứng dụng liên quan đến tôi',
            all: 'Xem ứng dụng (tất cả)',
          },
          readLogs: {
            title: 'Đọc nhật ký',
            description: 'Đọc nhật ký ứng dụng và triển khai',
            related: 'Đọc nhật ký (những nhật ký liên quan đến chúng)',
            relatedLabel: 'Những cái tôi đã tạo ra',
            relatedHint:
              'Ứng dụng tôi đã tạo và mọi ứng dụng liên quan đến tôi',
            all: 'Đọc nhật ký (tất cả)',
          },
          create: {
            title: 'Tạo ứng dụng',
            description: 'Tạo ứng dụng trong môi trường',
            all: 'Tạo ứng dụng',
          },
          configure: {
            title: 'Cấu hình ứng dụng',
            description:
              'Đọc và thay đổi cấu hình của Ứng dụng, có thể chứa bí mật',
            related: 'Cấu hình ứng dụng (những ứng dụng liên quan đến chúng)',
            relatedLabel: 'Những cái tôi đã tạo ra',
            relatedHint:
              'Ứng dụng tôi đã tạo và mọi ứng dụng liên quan đến tôi',
            all: 'Cấu hình ứng dụng (tất cả)',
          },
          upload: {
            title: 'Tải lên bản phát hành',
            description: 'Tải lên và quảng bá các bản phát hành',
            related:
              'Tải lên các bản phát hành (những bản liên quan đến chúng)',
            relatedLabel: 'Những cái tôi đã tạo ra',
            relatedHint:
              'Ứng dụng tôi đã tạo và mọi ứng dụng liên quan đến tôi',
            all: 'Tải lên bản phát hành (tất cả)',
          },
          deploy: {
            title: 'Triển khai',
            description:
              'Triển khai và khôi phục trên môi trường không được bảo vệ, yêu cầu triển khai cho môi trường được bảo vệ',
            related: 'Triển khai (những cái liên quan đến chúng)',
            relatedLabel: 'Những cái tôi đã tạo ra',
            relatedHint:
              'Ứng dụng tôi đã tạo và mọi ứng dụng liên quan đến tôi',
            all: 'Triển khai (tất cả)',
          },
          deployProtected: {
            title: 'Phê duyệt triển khai được bảo vệ',
            description:
              'Phê duyệt việc triển khai vào các môi trường được bảo vệ mà không có người phê duyệt; chỉ có người',
            related:
              'Phê duyệt các triển khai được bảo vệ (những triển khai liên quan đến chúng)',
            relatedLabel: 'Những cái tôi đã tạo ra',
            relatedHint:
              'Ứng dụng tôi đã tạo và mọi ứng dụng liên quan đến tôi',
            all: 'Phê duyệt triển khai được bảo vệ (tất cả)',
          },
          operate: {
            title: 'Bắt đầu và dừng',
            description: 'Bắt đầu, dừng và khởi động lại Ứng dụng',
            related: 'Bắt đầu và dừng (những cái liên quan đến chúng)',
            relatedLabel: 'Những cái tôi đã tạo ra',
            relatedHint:
              'Ứng dụng tôi đã tạo và mọi ứng dụng liên quan đến tôi',
            all: 'Bắt đầu và dừng (tất cả)',
          },
          delete: {
            title: 'Xóa ứng dụng',
            description: 'Xóa ứng dụng cùng với dữ liệu của nó',
            related: 'Xóa ứng dụng (những ứng dụng liên quan đến chúng)',
            relatedLabel: 'Những cái tôi đã tạo ra',
            relatedHint:
              'Ứng dụng tôi đã tạo và mọi ứng dụng liên quan đến tôi',
            all: 'Xóa ứng dụng (tất cả)',
          },
        },
      },
    },
    recordAccess: {
      owned: 'Ứng dụng họ đã tạo',
    },
    settings: {
      rel: {
        environments: 'Triển khai môi trường',
      },
    },
    keyScopes: {
      apps: {
        title: 'Ứng dụng và triển khai',
        description:
          'Đọc: xem ứng dụng, bản phát hành, triển khai và nhật ký. Đọc và viết: cũng tải lên các bản phát hành. Quản trị viên: cũng triển khai và khởi động hoặc dừng ứng dụng.',
        objects: 'Ứng dụng',
      },
      environments: {
        title: 'Triển khai môi trường',
        description: 'Đọc: liệt kê các môi trường. Đọc và viết: quản lý chúng.',
      },
      presets: {
        ciDeploy: {
          title: 'Triển khai CI',
          description:
            'Tải bản phát hành lên các ứng dụng đã chọn và triển khai chúng trong 90 ngày.',
        },
        ciUpload: {
          title: 'Tải lên CI',
          description:
            'Tải bản phát hành lên ứng dụng đã chọn mà không cần triển khai chúng trong 90 ngày.',
        },
      },
    },
    actions: {
      read: 'Xem',
      manage: 'Quản lý',
      view: 'Xem',
      'read-logs': 'Đọc nhật ký',
      create: 'Tạo',
      configure: 'Cấu hình',
      upload: 'Tải lên bản phát hành',
      deploy: 'Triển khai',
      'deploy-protected': 'Phê duyệt triển khai được bảo vệ',
      operate: 'Bắt đầu và dừng',
      delete: 'Xóa',
    },
  },
  drivers: {
    host: 'Máy chủ này',
  },
};

export default viVN;
