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
};
export default resource;
