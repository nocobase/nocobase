import type { DemoModeResource } from './en-US.js';
const resource: DemoModeResource = {
  authorization: {
    title: 'Dữ liệu demo',
    read: 'Xem',
    manage: 'Tạo và xóa',
    configuration: 'Cấu hình demo',
    configure: 'Cấu hình',
  },
  accounts: {
    menu: 'Tài khoản demo: {{name}}',
    title: 'Tài khoản demo',
    description:
      'Vào bản demo bằng bất kỳ tài khoản nào dưới đây để xem mỗi vai trò thấy gì.',
    enter: 'Vào',
    signedInAs: 'Đang dùng {{name}} · Chuyển',
    current: 'Hiện tại',
    entering: 'Đang vào…',
    failed: 'Không thể vào tài khoản demo này.',
    unavailable: 'Hiện chưa có tài khoản demo nào để vào.',
    password: 'Đăng nhập bằng mật khẩu',
  },
  refused: {
    title: 'Đây là bản demo. Không thể lưu thay đổi.',
    description: 'Các chức năng khác hoạt động bình thường.',
  },
  settings: {
    title: 'Môi trường demo',
    refresh: 'Làm mới',
    retry: 'Thử lại',
    busy: 'Đang tạo hoặc xóa dữ liệu demo',
    busyHelp: 'Có thể lưu cài đặt lại khi hoàn tất.',
    disabled: {
      title: 'Ứng dụng này không phải bản demo',
      help: 'Chế độ demo đang tắt. Bản triển khai bật nó bằng NOCOBASE_DEMO_MODE=true.',
    },
    cancel: 'Hủy',
    save: 'Lưu',
    apply: 'Áp dụng thay đổi',
    unsaved: 'Có thay đổi chưa lưu',
    discardAndReload: 'Bỏ thay đổi của tôi và tải lại',
    tabs: {
      overview: 'Tổng quan',
      schedule: 'Đặt lại hằng ngày',
    },
    leave: {
      title: 'Rời đi mà không lưu?',
      description: 'Các thay đổi chưa lưu trên trang này sẽ mất.',
      stay: 'Tiếp tục chỉnh sửa',
      discard: 'Bỏ thay đổi',
    },
    errors: {
      failed: 'Yêu cầu chưa hoàn tất. Hãy thử lại.',
      conflict: 'Một quản trị viên khác đã lưu cài đặt này trước.',
      busy: 'Đang tạo hoặc xóa dữ liệu demo. Hãy thử lại khi hoàn tất.',
      exists: 'Dữ liệu demo đã được tạo. Hãy đặt lại thay vì tạo mới.',
      demoModeRequired: 'Chỉ thực hiện được khi chế độ demo đang bật.',
      accountConflict:
        'Một tên người dùng demo thuộc về tài khoản không do demo sở hữu.',
      unavailable: 'Ứng dụng này không cung cấp dữ liệu demo.',
      signedOut: 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.',
      denied: 'Bạn không có quyền quản lý bản demo.',
    },
    data: {
      title: 'Dữ liệu demo',
      state: {
        importing: 'Đang tạo',
        clearing: 'Đang xóa',
        resetting: 'Đang đặt lại',
        failed: 'Thất bại',
        ready: 'Sẵn sàng',
        none: 'Chưa tạo',
      },
      presentSummary: 'Tạo bằng {{language}} · {{time}}',
      resettingSummary:
        'Đang xóa dữ liệu hiện tại rồi tạo lại bằng {{language}}.',
      phase: {
        clearing: 'Đang xóa',
        generating: 'Đang tạo lại',
      },
      absentSummary:
        'Tạo dữ liệu demo để khách khám phá ứng dụng qua một câu chuyện hoàn chỉnh.',
      language: 'Ngôn ngữ',
      clear: 'Xóa',
      reset: 'Đặt lại',
      generate: 'Tạo',
      failed: 'Lần chạy trước chưa hoàn tất',
      readOnly:
        'Bạn có thể xem dữ liệu demo; tạo, đặt lại và xóa cần quyền quản lý.',
      unavailable: 'Không có dữ liệu demo',
      unavailableHelp: 'Ứng dụng này không đăng ký bộ dữ liệu demo.',
      cleared: 'Đã xóa dữ liệu demo',
      resetStarted: 'Đang đặt lại dữ liệu demo',
      importStarted: 'Đang tạo dữ liệu demo',
      confirm: {
        import: {
          title: 'Tạo dữ liệu demo?',
          description:
            'Dữ liệu demo được tạo bằng {{language}} và các tài khoản demo của nó được bật.',
        },
        reset: {
          title: 'Đặt lại dữ liệu demo?',
          description:
            'Mọi dữ liệu nghiệp vụ trong phiên bản này bị xóa, kể cả nội dung khách đã thêm, rồi được tạo lại bằng {{language}}.',
        },
        clear: {
          title: 'Xóa dữ liệu demo?',
          description:
            'Mọi dữ liệu nghiệp vụ trong phiên bản này bị xóa, kể cả nội dung khách đã thêm, và các tài khoản demo bị tắt. Cài đặt và quản trị viên được giữ lại.',
        },
      },
    },
    visitors: {
      title: 'Tài khoản demo',
      off: 'Đăng nhập nhanh đang tắt trong bản triển khai này.',
      pending: 'Các tài khoản sẽ hiện ở đây khi dữ liệu demo sẵn sàng.',
      noData: 'Hãy tạo dữ liệu demo trước; các tài khoản sẽ hiện ở đây.',
      credentials: 'Tên người dùng {{username}} · mật khẩu {{password}}',
      copyLink: 'Sao chép liên kết',
      copyLinkFor: 'Sao chép liên kết vào của {{name}}',
      openFor: 'Mở demo dưới tên {{name}}',
      copied: 'Đã sao chép',
      copyFailed:
        'Không sao chép được. Hãy sao chép liên kết từ thanh địa chỉ.',
    },
    schedule: {
      confirmTitle: 'Lưu đặt lại hằng ngày?',
      confirmDescription:
        'Vào giờ dưới đây, mọi dữ liệu nghiệp vụ trong phiên bản này bị xóa và tạo lại.',
      summary: 'Mỗi ngày lúc {{time}} ({{timezone}}), bằng {{language}}',
      off: 'Chưa lên lịch',
      enabled: 'Đặt lại mỗi ngày',
      enabledHelp: 'Dùng quản trị viên đã tạo dữ liệu demo gần nhất.',
      time: 'Thời gian',
      hour: 'Giờ',
      minute: 'Phút',
      language: 'Ngôn ngữ',
      timezone: 'Múi giờ',
      noTimezone: 'Không có múi giờ phù hợp',
      invalidTimezone: 'Hãy chọn một múi giờ trong danh sách.',
      next: 'Lần đặt lại tiếp theo: {{time}}',
    },
  },
};
export default resource;
