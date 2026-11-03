import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  'push.title': 'Thông báo đẩy',
  'push.description':
    'Nhận lời nhắc trên từng thiết bị, ngay cả khi đóng ứng dụng.',
  'push.subscribe': 'Đăng ký thiết bị này',
  'push.name': 'Tên thiết bị',
  'push.empty': 'Không có thiết bị đăng ký',
  'push.emptyHint': 'Đăng ký thiết bị này để nhận lời nhắc khi đóng ứng dụng.',
  'push.ios':
    'Trên iOS hoặc iPadOS 16.4 trở lên, hãy mở menu Chia sẻ của Safari, chọn Thêm vào Màn hình chính, sau đó mở ứng dụng từ biểu tượng của ứng dụng để đăng ký.',
  'push.unsupported': 'Push cần HTTPS và trình duyệt có hỗ trợ Web Push.',
  'push.unavailable':
    'Tính năng đẩy không được định cấu hình. Yêu cầu quản trị viên định cấu hình VAPID và khóa bí mật.',
  'push.denied':
    'Thông báo bị chặn. Cho phép chúng trong cài đặt trang web của trình duyệt của bạn, sau đó thử lại.',
  'push.current': 'Thiết bị này',
  'push.more': 'Hành động của thiết bị',
  'push.test': 'Gửi thông báo kiểm tra',
  'push.remove': 'Loại bỏ',
  'push.removeTitle': 'Xóa thiết bị “{{name}}”?',
  'push.removeHint':
    'Thiết bị này sẽ ngừng nhận thông báo đẩy. Bạn có thể đăng ký lại từ thiết bị đó.',
  'push.cancel': 'Hủy',
  'push.saved': 'Đã lưu cài đặt thiết bị',
  'push.saving': 'Lưu cài đặt thiết bị',
  'push.testSent': 'Đã xếp hàng đợi thông báo kiểm tra',
  'push.failed': 'Không thể cập nhật thông báo đẩy. Vui lòng thử lại.',
  'push.loadingFailed': 'Không thể tải thiết bị. Vui lòng thử lại.',
  'push.retry': 'Thử lại',
};

export default viVN;
