import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  errors: {
    imapMoveLocationChanged:
      'Thư mục hoặc bản sao đã chọn đã thay đổi. Đồng bộ hộp thư và mở lại thư mục nguồn.',
    imapMoveNotWritable:
      'Thư mục đã chọn không cho phép thao tác này. Kiểm tra quyền của hộp thư.',
    imapMoveSourceRequired:
      'Mở thư mục nguồn trước khi di chuyển hoặc xóa thư này.',
    imapMoveUnsupported:
      'Máy chủ này không thể di chuyển thư an toàn. Hãy dùng ứng dụng email của bạn.',
    imapTrashNotFound:
      'Tài khoản này không có thư mục Thùng rác. Hãy dùng ứng dụng email của bạn.',
    imapMoveOutcomeUnknown:
      'Thao tác di chuyển chưa hoàn tất hoặc chưa rõ kết quả. Kiểm tra hộp thư trước khi thử lại.',
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
