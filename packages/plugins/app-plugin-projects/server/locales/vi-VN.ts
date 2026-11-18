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
      issues: 'Nhiệm vụ',
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
        title: 'Nhiệm vụ',
        description:
          'Nhiệm vụ và bình luận của chúng, trong dự án hoặc độc lập.',
        actions: {
          view: {
            title: 'Xem nhiệm vụ',
            description: 'Xem nhiệm vụ trong danh sách, bảng và chi tiết',
            related: 'Xem nhiệm vụ (những nhiệm vụ họ xem được)',
            relatedLabel: 'Trong các dự án tôi có thể thấy',
            relatedHint:
              'Nhiệm vụ không thuộc dự án và nhiệm vụ trong các dự án tôi xem được',
            all: 'Xem nhiệm vụ (tất cả)',
          },
          create: {
            title: 'Tạo nhiệm vụ',
            description: 'Tạo nhiệm vụ trong dự án hoặc độc lập',
            related: 'Tạo nhiệm vụ (trong các dự án họ xem được)',
            relatedLabel: 'Trong các dự án tôi có thể thấy',
            relatedHint:
              'Nhiệm vụ không thuộc dự án hoặc trong các dự án tôi xem được',
            all: 'Tạo nhiệm vụ (tất cả)',
          },
          edit: {
            title: 'Sửa nhiệm vụ',
            description:
              'Tiêu đề, mô tả, mức ưu tiên, ngày, nhãn, người thực hiện và các trạng thái mở',
            related: 'Sửa nhiệm vụ (những nhiệm vụ họ xem được)',
            relatedLabel: 'Trong các dự án tôi có thể thấy',
            relatedHint:
              'Nhiệm vụ không thuộc dự án và nhiệm vụ trong các dự án tôi xem được',
            all: 'Sửa nhiệm vụ (tất cả)',
          },
          comment: {
            title: 'Bình luận nhiệm vụ',
            description:
              'Bình luận, trả lời và giải quyết chủ đề; chỉnh sửa và xóa bình luận của riêng họ',
            related: 'Bình luận nhiệm vụ (những nhiệm vụ họ xem được)',
            relatedLabel: 'Trong các dự án tôi có thể thấy',
            relatedHint:
              'Nhiệm vụ không thuộc dự án và nhiệm vụ trong các dự án tôi xem được',
            all: 'Bình luận nhiệm vụ (tất cả)',
          },
          moderateComments: {
            title: 'Bình luận vừa phải',
            description: 'Xóa bình luận của người khác',
            related:
              'Kiểm duyệt bình luận (ở nhiệm vụ họ phụ trách hoặc dự án họ dẫn dắt)',
            relatedLabel: 'Ở nhiệm vụ tôi phụ trách hoặc dự án tôi dẫn dắt',
            relatedHint:
              'Bình luận ở nhiệm vụ tôi phụ trách và ở nhiệm vụ trong dự án tôi dẫn dắt',
            all: 'Bình luận vừa phải (tất cả)',
          },
          close: {
            title: 'Đóng nhiệm vụ',
            description: 'Đánh dấu nhiệm vụ là xong hoặc đã hủy',
            related: 'Đóng nhiệm vụ (họ phụ trách hoặc trong dự án họ dẫn dắt)',
            relatedLabel:
              'Những người tôi sở hữu hoặc trong các dự án tôi lãnh đạo',
            relatedHint:
              'Nhiệm vụ tôi phụ trách và nhiệm vụ trong dự án tôi dẫn dắt',
            all: 'Đóng nhiệm vụ (tất cả)',
          },
          changeOwner: {
            title: 'Thay đổi chủ sở hữu',
            description: 'Giao nhiệm vụ cho người khác chịu trách nhiệm',
            related:
              'Thay đổi chủ sở hữu (người họ sở hữu hoặc người đứng đầu dự án)',
            relatedLabel:
              'Những người tôi sở hữu hoặc trong các dự án tôi lãnh đạo',
            relatedHint:
              'Nhiệm vụ tôi phụ trách và nhiệm vụ trong dự án tôi dẫn dắt',
            all: 'Đổi chủ (tất cả)',
          },
          delete: {
            title: 'Xóa và khôi phục nhiệm vụ',
            description: 'Xóa nhiệm vụ và khôi phục nhiệm vụ đã xóa',
            all: 'Xóa và khôi phục nhiệm vụ',
          },
        },
      },
      attachments: {
        title: 'Tệp đính kèm',
        description: 'Tệp đính kèm vào nhiệm vụ và bình luận.',
        actions: {
          upload: {
            title: 'Tải lên tệp đính kèm',
            description:
              'Đính kèm tệp vào nhiệm vụ họ sửa được và vào bình luận của họ',
            related: 'Tải lên tệp đính kèm (ở nhiệm vụ họ xem được)',
            relatedLabel: 'Ở nhiệm vụ trong các dự án tôi xem được',
            relatedHint:
              'Tệp ở nhiệm vụ không thuộc dự án và ở nhiệm vụ trong các dự án tôi xem được',
            all: 'Tải lên file đính kèm (tất cả)',
          },
        },
      },
    },
    collections: {
      pmProjects: 'Dự án',
      pmIssues: 'Nhiệm vụ',
    },
    recordAccess: {
      visible: 'Dự án và nhiệm vụ họ xem được',
      managed: 'Dự án họ dẫn dắt và nhiệm vụ họ phụ trách',
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
        title: 'Nhiệm vụ',
        description:
          'Xem nhiệm vụ; tạo, sửa, bình luận, đóng và giao lại; kiểm duyệt bình luận và xóa nhiệm vụ.',
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
    batchDone: 'Mọi nhiệm vụ con của {{identifier}} đã xong',
    batchDoneStage:
      'Giai đoạn {{stage}} của các nhiệm vụ con của {{identifier}} đã xong',
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
