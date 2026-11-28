import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  'push.deviceCount': 'Đã đăng ký: {{total}} · Đang bật: {{active}}',
  'push.active': 'Enabled',
  'push.paused': 'Paused',
  'push.pause': 'Pause',
  'push.resume': 'Resume',
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
  'push.testSent': 'Dịch vụ push đã chấp nhận thông báo thử.',
  'push.invalid':
    'Trình duyệt trả về thông tin đăng ký không hợp lệ. Hãy thử đăng ký lại.',
  'push.endpoint': 'Máy chủ không hỗ trợ dịch vụ push của trình duyệt này.',
  'push.owned':
    'Đăng ký của trình duyệt này thuộc một tài khoản khác. Hãy xóa đăng ký ở tài khoản đó trước khi đăng ký lại.',
  'push.browserFailed':
    'Trình duyệt không thể tạo đăng ký push. Hãy kiểm tra cài đặt thông báo và kết nối của trình duyệt.',
  'push.expired':
    'Đăng ký của thiết bị đã hết hạn hoặc đã bị xóa. Hãy đăng ký lại trên thiết bị đó.',
  'push.testPaused':
    'Hãy bật lại push trên thiết bị này trước khi gửi thông báo thử.',
  'push.testLimited': 'Chờ 30 giây giữa các lần gửi thông báo thử.',
  'push.testNetwork':
    'Máy chủ không thể kết nối với dịch vụ push. Hãy nhờ quản trị viên kiểm tra mạng và proxy Web Push.',
  'push.testGatewayAuth':
    'Dịch vụ push đã từ chối thông tin xác thực của máy chủ. Hãy nhờ quản trị viên kiểm tra khóa VAPID.',
  'push.testGatewayLimited':
    'Dịch vụ push đang giới hạn yêu cầu. Hãy thử lại sau.',
  'push.testGateway':
    'Dịch vụ push không thể chấp nhận thông báo thử. Hãy thử lại sau.',
  'push.failed': 'Không thể cập nhật thông báo đẩy. Vui lòng thử lại.',
  'push.loadingFailed': 'Không thể tải thiết bị. Vui lòng thử lại.',
  'push.retry': 'Thử lại',
  'channelType.title': 'Thông báo đẩy trình duyệt',
  'channelType.testHint':
    'Gửi thông báo thử đến các trình duyệt bạn đã bật thông báo đẩy. Hãy bật trước trong Cài đặt cá nhân › Thông báo.',
};

export default viVN;
