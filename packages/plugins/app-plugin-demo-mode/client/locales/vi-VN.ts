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
  status: {
    loading: 'Đang tải',
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
    busyHelp: 'Vui lòng đợi thao tác dữ liệu hiện tại hoàn tất.',
    disabled: {
      title: 'Ứng dụng này không phải bản demo',
      help: 'Chế độ demo đang tắt. Bản triển khai bật nó bằng NOCOBASE_DEMO_MODE=true.',
    },
    errors: {
      failed: 'Yêu cầu chưa hoàn tất. Hãy thử lại.',
      demoModeRequired: 'Chỉ thực hiện được khi chế độ demo đang bật.',
      signedOut: 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.',
      denied: 'Bạn không có quyền xem cài đặt demo.',
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
      absentSummary: 'Chưa có dữ liệu demo nào được tạo.',
      failed: 'Lần chạy trước chưa hoàn tất',
      unavailable: 'Không có dữ liệu demo',
      unavailableHelp: 'Ứng dụng này không đăng ký bộ dữ liệu demo.',
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
