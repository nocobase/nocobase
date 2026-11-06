import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  page: {
    loading: 'Đang tải',
  },
  accept: {
    title: 'Chấp nhận lời mời',
    description: '{{inviter}} đã mời bạn.',
    summary: 'Bạn cũng sẽ tham gia: {{items}}',
    loading: 'Đang tải lời mời…',
    email: 'Email',
    name: 'Tên',
    username: 'Tên người dùng (không bắt buộc)',
    usernameHint: 'Bạn có thể dùng tên người dùng này để đăng nhập.',
    password: 'Mật khẩu',
    nameRequired: 'Nhập tên của bạn.',
    passwordTooShort: 'Mật khẩu cần ít nhất ký tự {{min}}.',
    submit: 'Tạo tài khoản và tham gia',
    join: 'Chấp nhận lời mời',
    submitting: 'Tham gia…',
    signedIn:
      'Bạn đã đăng nhập với tên {{name}}. Đăng xuất để chấp nhận lời mời này bằng tài khoản mới.',
    signOut: 'Đăng xuất',
    signOutFailed: 'Không thể đăng xuất.',
    existingAccount:
      'Địa chỉ này đã có tài khoản. Đăng nhập bằng nó để tiếp tục.',
    alreadyHaveAccount: 'Đã có tài khoản? Đăng nhập',
    goToLogin: 'Vào đăng nhập',
    errors: {
      notFound: 'Liên kết lời mời này không hợp lệ.',
      expired: 'Lời mời này đã hết hạn. Yêu cầu một cái mới.',
      accepted: 'Lời mời này đã được chấp nhận.',
      revoked: 'Lời mời này đã bị thu hồi.',
      password: 'Mật khẩu không đáp ứng yêu cầu.',
      usernameConflict:
        'Tên này đã được dùng làm tên người dùng hoặc email. Hãy chọn tên khác.',
      accountConflict: 'Không thể tạo tài khoản có địa chỉ này.',
      failed: 'Đã xảy ra lỗi. Vui lòng thử lại.',
    },
  },
};

export default viVN;
