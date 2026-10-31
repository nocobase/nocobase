import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  errors: {
    invalidRecipient:
      'Sửa địa chỉ email và tên hiển thị của người nhận trước khi gửi.',
    accessDenied: 'Cần có quyền truy cập thư.',
    idempotencyConflict:
      'Khóa bình thường đã được liên kết với một yêu cầu khác.',
    invalidRequest: 'Yêu cầu thư không hợp lệ.',
    accountCredentialsInvalid:
      'Xác thực hộp thư không thành công. Kiểm tra tên đăng nhập và mật khẩu hoặc mã ủy quyền của bạn và xác nhận rằng IMAP/SMTP đã được bật. Gmail và các dịch vụ khác có thể yêu cầu mật khẩu ứng dụng.',
    requestFailed: 'Không thể hoàn thành yêu cầu thư.',
    providerRateLimited:
      'Dịch vụ thư đang nhận được quá nhiều yêu cầu. Hãy thử lại sau.',
    providerUnavailable: 'Không thể truy cập dịch vụ thư. Hãy thử lại sau.',
    reauthorizationRequired:
      'Tài khoản thư này phải được kết nối lại trước khi có thể sử dụng.',
    syncRunNotFound: 'Không tìm thấy hoạt động đồng bộ hóa thư.',
    messageNotFound: 'Không tìm thấy thư.',
    authorizationStateRequired: 'Trạng thái ủy quyền thư là bắt buộc.',
  },
};

export default viVN;
