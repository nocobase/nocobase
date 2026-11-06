import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  errors: {
    generic: 'Đã xảy ra lỗi. Vui lòng thử lại.',
    network:
      'Không thể truy cập máy chủ. Hãy kiểm tra kết nối của bạn và thử lại.',
    rateLimited: 'Quá nhiều lần thử. Vui lòng đợi một lát và thử lại.',
    INVALID_EMAIL_OR_PASSWORD: 'Email hoặc mật khẩu không chính xác.',
    INVALID_USERNAME_OR_PASSWORD:
      'Tên người dùng hoặc mật khẩu không chính xác.',
    INVALID_PASSWORD: 'Mật khẩu không chính xác.',
    INVALID_EMAIL: 'Nhập địa chỉ email hợp lệ.',
    INVALID_USERNAME:
      'Tên người dùng chỉ có thể chứa các chữ cái, chữ số, dấu gạch dưới và dấu chấm.',
    USERNAME_TOO_SHORT: 'Tên người dùng này quá ngắn.',
    USERNAME_TOO_LONG: 'Tên người dùng này quá dài.',
    USERNAME_IS_ALREADY_TAKEN: 'Tên người dùng này đã được sử dụng.',
    USER_ALREADY_EXISTS: 'Tài khoản có email này đã tồn tại.',
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
      'Tài khoản có email này đã tồn tại. Sử dụng một email khác.',
    PASSWORD_TOO_SHORT: 'Mật khẩu này quá ngắn.',
    RESET_PASSWORD_DISABLED:
      'Đặt lại mật khẩu tự phục vụ không được bật. Liên hệ với quản trị viên để đặt lại mật khẩu của bạn.',
    PASSWORD_TOO_LONG: 'Mật khẩu này quá dài.',
    EMAIL_NOT_VERIFIED: 'Xác minh địa chỉ email của bạn trước khi đăng nhập.',
    INVALID_TOKEN: 'Liên kết này không hợp lệ hoặc đã hết hạn.',
    TOKEN_EXPIRED: 'Liên kết này đã hết hạn.',
    ACCOUNT_DISABLED:
      'Tài khoản này bị vô hiệu hóa. Liên hệ với quản trị viên của bạn.',
    SERVICE_ACCOUNT_NO_LOGIN:
      'Tài khoản dịch vụ không thể đăng nhập; nó chỉ hoạt động thông qua các phím API.',
    invalidOriginWithAddress:
      'Nguồn gốc này không đáng tin cậy. Đặt app.publicOrigin trong config.yml thành {{origin}}, khởi động lại ứng dụng và thử lại.',
    INVALID_ORIGIN:
      'Nguồn gốc này không đáng tin cậy. Kiểm tra app.publicOrigin trong config.yml, khởi động lại ứng dụng và thử lại.',
    INVALID_CSRF_ORIGIN:
      'Yêu cầu này đến từ một trang web khác và đã bị từ chối. Tải lại trang và thử lại.',
  },
};

export default viVN;
