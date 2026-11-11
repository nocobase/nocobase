import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  page: {
    loading: 'Đang tải',
  },
  notificationTemplates: {
    invitation: {
      contributor: 'Người dùng',
      category: 'Tài khoản',
      name: 'Lời mời người dùng',
      trigger:
        'Quản trị viên mời ai đó, hoặc gửi lại lời mời, với tùy chọn email được chọn.',
      recipients: 'Người được mời, tại địa chỉ email đã nhập cho họ.',
      businessRule:
        'Được gửi mỗi khi tạo hoặc gửi lại lời mời với tùy chọn email được chọn. Không có công tắc riêng để tắt.',
      languagePolicy:
        'Được viết bằng một ngôn ngữ, chọn khi mời: mặc định là ngôn ngữ giao diện của người mời, trừ khi chọn ngôn ngữ khác. Gửi lại vẫn giữ ngôn ngữ đó. Nếu ngôn ngữ đó chưa có nội dung email, email dùng ngôn ngữ mặc định của ứng dụng và tiếng Anh.',
      channel: 'Người gửi email mời',
      variables: {
        app: 'Tên ứng dụng',
        inviter: 'Tên người đã gửi lời mời',
        items: 'Vai trò hoặc quyền truy cập mà lời mời cấp',
        date: 'Thời điểm lời mời hết hạn, theo ngôn ngữ của email và theo giờ UTC',
        url: 'Liên kết để chấp nhận lời mời; bản xem trước dùng liên kết giả',
      },
    },
  },
  accept: {
    title: 'Chấp nhận lời mời',
    language: 'Ngôn ngữ',
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
