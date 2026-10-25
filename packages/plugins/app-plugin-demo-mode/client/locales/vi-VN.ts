import type { DemoModeResource } from './en-US.js';
const resource: DemoModeResource = {
  authorization: {
    title: 'Dữ liệu demo',
    read: 'Xem',
    manage: 'Tạo và xóa',
    configuration: 'Cấu hình demo',
    configure: 'Cấu hình',
  },
  menu: {
    label: 'Chế độ dùng thử',
    switchAccount: 'Chuyển tài khoản',
    title: 'Đây là môi trường dùng thử',
    description:
      'Dữ liệu tự động được đặt lại hằng ngày. Các thay đổi sẽ không được lưu.',
    accountsDescription:
      'Chuyển sang một tài khoản bên dưới để xem nội dung mà từng vai trò có thể truy cập.',
    loading: 'Đang tải tài khoản…',
  },
  accounts: {
    title: 'Tài khoản',
    description:
      'Vào bản demo bằng bất kỳ tài khoản nào dưới đây để xem mỗi vai trò thấy gì.',
    enter: 'Vào',
    current: 'Hiện tại',
    entering: 'Đang vào…',
    failed: 'Không thể đăng nhập vào tài khoản này.',
    unavailable: 'Hiện không có tài khoản nào để đăng nhập.',
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
    busyHelp:
      'Hãy đợi thao tác dữ liệu hiện tại hoàn tất trước khi bắt đầu thao tác khác.',
    disabled: {
      title: 'Ứng dụng này không phải bản demo',
      help: 'Chế độ demo đang tắt. Bản triển khai bật nó bằng NOCOBASE_DEMO_MODE=true.',
    },
    cancel: 'Hủy',
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
      unavailable: 'Hiện không có tài khoản nào để đăng nhập.',
      title: 'Tài khoản',
      username: 'Tên đăng nhập {{username}}',
      copyLink: 'Sao chép liên kết',
      copyLinkFor: 'Sao chép liên kết vào của {{name}}',
      openFor: 'Mở demo dưới tên {{name}}',
      copied: 'Đã sao chép',
      copyFailed:
        'Không sao chép được. Hãy sao chép liên kết từ thanh địa chỉ.',
    },
    schedule: {
      title: 'Đặt lại hằng ngày',
      description:
        'Dữ liệu demo được đặt lại tự động mỗi ngày. Lịch đặt lại được cấu hình qua biến môi trường.',
      time: 'Thời gian',
      language: 'Ngôn ngữ',
      timezone: 'Múi giờ',
      next: 'Lần đặt lại tiếp theo: {{time}}',
    },
  },
};
export default resource;
