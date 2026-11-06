import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  roles: {
    owner: 'Người phụ trách',
    admin: 'Quản trị viên',
    member: 'Thành viên',
  },
  access: {
    sections: {
      projects: 'Dự án',
      issues: 'Vấn đề',
      settings: 'Cài đặt dự án',
      members: 'Thành viên và vai trò',
    },
    businesses: {
      projects: {
        title: 'Dự án',
        description:
          'Các dự án, thành viên, kho lưu trữ và tiến trình của chúng.',
        actions: {
          view: {
            title: 'Xem dự án',
            description: 'Xem các dự án, tổng quan và tiến độ của chúng',
            related: 'Xem dự án (những dự án họ có thể thấy)',
            relatedLabel: 'Những người tôi có thể nhìn thấy',
            relatedHint: 'Các dự án công và tư do tôi lãnh đạo hoặc tham gia',
            all: 'Xem dự án (tất cả)',
          },
          create: {
            title: 'Tạo dự án',
            description: 'Bắt đầu một dự án mới và dẫn dắt nó',
            all: 'Tạo dự án',
          },
          manage: {
            title: 'Quản lý dự án',
            description:
              'Đổi tên, thay đổi trạng thái, ngày tháng và lãnh đạo, quản lý thành viên và kho lưu trữ',
            related: 'Quản lý dự án (những dự án do họ lãnh đạo)',
            relatedLabel: 'Người tôi dẫn dắt',
            relatedHint: 'Những dự án tôi phụ trách',
            all: 'Quản lý dự án (tất cả)',
          },
          delete: {
            title: 'Xóa dự án',
            description: 'Xóa dự án và khôi phục dự án đã xóa',
            all: 'Xóa dự án',
          },
        },
      },
      issues: {
        title: 'Vấn đề',
        description:
          'Các vấn đề và nhận xét của họ, trong một dự án hoặc của chính họ.',
        actions: {
          view: {
            title: 'Xem vấn đề',
            description:
              'Xem các vấn đề trong danh sách, bảng và chi tiết của chúng',
            related: 'Xem vấn đề (những vấn đề họ có thể thấy)',
            relatedLabel: 'Trong các dự án tôi có thể thấy',
            relatedHint:
              'Các vấn đề không có dự án và các vấn đề trong dự án tôi có thể thấy',
            all: 'Xem vấn đề (tất cả)',
          },
          create: {
            title: 'Tạo vấn đề',
            description: 'Tạo vấn đề, trong một dự án hoặc tự mình',
            related: 'Tạo vấn đề (trong các dự án họ có thể nhìn thấy)',
            relatedLabel: 'Trong các dự án tôi có thể thấy',
            relatedHint:
              'Các vấn đề không có dự án, hoặc trong dự án tôi có thể thấy',
            all: 'Tạo vấn đề (tất cả)',
          },
          edit: {
            title: 'Vấn đề chỉnh sửa',
            description:
              'Tiêu đề, mô tả, mức độ ưu tiên, ngày tháng, nhãn, người thực thi và trạng thái mở',
            related: 'Chỉnh sửa vấn đề (những vấn đề họ có thể thấy)',
            relatedLabel: 'Trong các dự án tôi có thể thấy',
            relatedHint:
              'Các vấn đề không có dự án và các vấn đề trong dự án tôi có thể thấy',
            all: 'Chỉnh sửa vấn đề (tất cả)',
          },
          comment: {
            title: 'Bình luận về vấn đề',
            description:
              'Bình luận, trả lời và giải quyết chủ đề; chỉnh sửa và xóa bình luận của riêng họ',
            related:
              'Bình luận về các vấn đề (những vấn đề họ có thể nhìn thấy)',
            relatedLabel: 'Trong các dự án tôi có thể thấy',
            relatedHint:
              'Các vấn đề không có dự án và các vấn đề trong dự án tôi có thể thấy',
            all: 'Bình luận về vấn đề (tất cả)',
          },
          moderateComments: {
            title: 'Bình luận vừa phải',
            description: 'Xóa bình luận của người khác',
            related:
              'Bình luận vừa phải (về các vấn đề họ sở hữu hoặc dự án mà họ lãnh đạo)',
            relatedLabel:
              'Về những vấn đề tôi sở hữu hoặc trong những dự án tôi lãnh đạo',
            relatedHint:
              'Nhận xét về các vấn đề tôi sở hữu và về các vấn đề trong dự án tôi lãnh đạo',
            all: 'Bình luận vừa phải (tất cả)',
          },
          close: {
            title: 'Đóng vấn đề',
            description: 'Đánh dấu một vấn đề đã được thực hiện hoặc đã hủy',
            related:
              'Đóng các vấn đề (những vấn đề họ sở hữu hoặc dự án mà họ lãnh đạo)',
            relatedLabel:
              'Những người tôi sở hữu hoặc trong các dự án tôi lãnh đạo',
            relatedHint:
              'Những vấn đề tôi sở hữu, và những vấn đề trong dự án tôi lãnh đạo',
            all: 'Đóng các vấn đề (tất cả)',
          },
          changeOwner: {
            title: 'Thay đổi chủ sở hữu',
            description: 'Đưa vấn đề ra cho người khác chịu trách nhiệm',
            related:
              'Thay đổi chủ sở hữu (người họ sở hữu hoặc người đứng đầu dự án)',
            relatedLabel:
              'Những người tôi sở hữu hoặc trong các dự án tôi lãnh đạo',
            relatedHint:
              'Những vấn đề tôi sở hữu, và những vấn đề trong dự án tôi lãnh đạo',
            all: 'Đổi chủ (tất cả)',
          },
          delete: {
            title: 'Vấn đề xóa và khôi phục',
            description: 'Xóa các vấn đề và khôi phục những vấn đề đã xóa',
            all: 'Vấn đề xóa và khôi phục',
          },
        },
      },
      attachments: {
        title: 'Tệp đính kèm',
        description: 'Các tập tin đính kèm các vấn đề và bình luận.',
        actions: {
          upload: {
            title: 'Tải lên tệp đính kèm',
            description:
              'Đính kèm tập tin vào các vấn đề họ có thể chỉnh sửa và vào nhận xét của họ',
            related: 'Tải lên tệp đính kèm (về các vấn đề họ có thể thấy)',
            relatedLabel: 'Về các vấn đề trong dự án tôi có thể thấy',
            relatedHint:
              'Tệp về các vấn đề không có dự án và về các vấn đề trong dự án tôi có thể xem',
            all: 'Tải lên file đính kèm (tất cả)',
          },
        },
      },
    },
    collections: {
      pmProjects: 'Dự án',
      pmIssues: 'Vấn đề',
    },
    recordAccess: {
      visible: 'Các dự án và vấn đề họ có thể thấy',
      managed: 'Các dự án họ lãnh đạo và các vấn đề họ sở hữu',
    },
    settings: {
      pm: {
        general: 'Đại tướng',
        labels: 'Nhãn',
        members: 'Thành viên',
      },
    },
    keyScopes: {
      projects: {
        title: 'Dự án',
        description: 'Xem dự án; quản lý chúng; tạo và xóa chúng.',
        objects: 'Dự án',
      },
      issues: {
        title: 'Vấn đề',
        description:
          'Xem vấn đề; tạo, chỉnh sửa, nhận xét, đóng và gán lại chúng; kiểm duyệt bình luận và xóa các vấn đề.',
      },
      settings: {
        title: 'Cài đặt dự án',
        description: 'Cài đặt chung và nhãn.',
      },
    },
    actions: {
      view: 'Xem',
      create: 'Tạo',
      manage: 'Quản lý',
      edit: 'Chỉnh sửa',
      close: 'Đóng',
      comment: 'Bình luận',
      moderateComments: 'Bình luận vừa phải',
      changeOwner: 'Đổi chủ',
      delete: 'Xóa',
      upload: 'Tải lên',
      read: 'Xem',
      update: 'Chỉnh sửa',
      invite: 'Mời',
      assign: 'Phân công vai trò',
      'define-roles': 'Xác định vai trò',
    },
  },
  notifications: {
    batchDone: 'Tất cả các vấn đề phụ của {{identifier}} đã hoàn thành',
    batchDoneStage:
      'Giai đoạn {{stage}} của các vấn đề phụ của {{identifier}} đã kết thúc',
    commented: '{{actor}} đã nhận xét về {{identifier}}',
    dependencyReleased:
      '{{releasedBy}} đã hoàn thành nên {{identifier}} có thể bắt đầu',
    executorAssigned: '{{actor}} đã giao {{identifier}} cho bạn',
    mentioned: {
      comment: '{{actor}} đã đề cập đến bạn trên {{identifier}}',
      description: '{{actor}} đã đề cập đến bạn trong {{identifier}}',
    },
    ownerAssigned: '{{actor}} đã biến bạn thành chủ sở hữu của {{identifier}}',
    someone: 'Ai đó',
    statusChanged: '{{identifier}} đã chuyển sang {{status}}',
    ownerNotified: '{{identifier}} giờ là {{status}}',
  },
  status: {
    backlog: 'Tồn đọng',
    blocked: 'Bị chặn',
    cancelled: 'Đã hủy',
    done: 'Hoàn thành',
    in_progress: 'Đang thực hiện',
    in_review: 'Đang xét duyệt',
  },
};

export default viVN;
