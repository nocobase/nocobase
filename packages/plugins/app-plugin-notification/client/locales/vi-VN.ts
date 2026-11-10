import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  templates: {
    title: 'Mẫu thông báo',
    coverage:
      'Các thông báo hệ thống tự động gửi và nội dung của chúng. Thông báo do quy trình làm việc hoặc mã tùy chỉnh gửi có thể không được liệt kê. Trang này chỉ để xem.',
    filters: 'Lọc mẫu',
    search: 'Tìm kiếm mẫu',
    category: 'Danh mục',
    channel: 'Kênh',
    all: 'Tất cả',
    details: 'Chi tiết mẫu',
    close: 'Đóng',
    providedBy: 'Cung cấp bởi {{name}}',
    trigger: 'Khi nào được gửi',
    recipients: 'Ai nhận được',
    businessRule: 'Điều kiện gửi',
    languagePolicy: 'Ngôn ngữ',
    combined:
      'Một thông báo chứa tất cả ngôn ngữ ({{languages}}). Mọi người nhận đều nhận được cùng một nội dung.',
    singleLocale: 'Chỉ gửi bằng {{language}}.',
    status: 'Kênh gửi',
    statusHelp:
      'Cho biết mỗi kênh đã được thiết lập hay chưa. Không kiểm tra kết nối và không xác nhận rằng tin nhắn được gửi đến nơi.',
    configured: 'Đã thiết lập',
    unconfigured: 'Chưa thiết lập',
    enabled: 'Bật',
    disabled: 'Tắt',
    variables: 'Biến',
    variablesHelp:
      'Các chỗ trống sẽ được thay bằng giá trị thực khi gửi thông báo.',
    language: 'Ngôn ngữ',
    synthetic:
      'Dùng dữ liệu mẫu giả định. Xem trước không bao giờ gửi thông báo.',
    definition: 'Mẫu có biến',
    preview: 'Xem trước',
    html: 'Phiên bản HTML (hiển thị dưới dạng mã)',
    technical: 'Thông tin kỹ thuật',
    templateId: 'ID mẫu',
    package: 'Gói',
    channelNames: 'Tên kênh',
    channelTypes: {
      inApp: 'Tin nhắn trong ứng dụng',
      email: 'Email',
    },
    loading: 'Đang tải…',
    failed: 'Không thể tải các mẫu.',
    forbidden: 'Bạn không có quyền xem mẫu thông báo.',
    notFound: 'Mẫu này không còn tồn tại.',
    retry: 'Thử lại',
    empty: 'Chưa có mẫu thông báo nào.',
    noResults: 'Không có mẫu nào khớp với bộ lọc này.',
  },
  logs: {
    deliveryOperations: 'Hoạt động giao hàng',
    recipeDescription:
      'Theo dõi từng lần chuyển giao kênh và mọi nỗ lực của nhà cung cấp.',
    redacted:
      'Nội dung thư, người nhận và mã thông báo cho thuê được sắp xếp lại.',
    providerAttempts: 'Các nỗ lực của nhà cung cấp',
    eyebrow: 'Thông báo',
    title: 'Nhật ký thông báo',
    description:
      'Theo dõi việc gửi thông báo và mọi nỗ lực của nhà cung cấp. Nội dung thư, người nhận và mã thông báo cho thuê được sắp xếp lại.',
    refreshing: 'Sảng khoái…',
    refresh: 'Làm mới',
    deliveriesShown: 'Đã giao hàng',
    needAttention: 'Cần chú ý',
    unavailable: 'Nhật ký không có sẵn',
    recent: 'Thông báo gần đây',
    loading: 'Đang tải lịch sử giao hàng…',
    emptyTitle: 'Chưa có chuyến giao hàng nào',
    emptyDescription:
      'Hồ sơ giao hàng sẽ xuất hiện ở đây sau khi thông báo được gửi.',
    expand: 'Mở rộng thông báo',
    collapse: 'Thông báo thu gọn',
    noDeliveries: 'Không có chuyến giao hàng nào được ghi nhận.',
    noAttempts: 'Không có nỗ lực nào được ghi lại.',
    columns: {
      source: 'Nguồn',
      notificationId: 'ID thông báo',
      status: 'Trạng thái',
      deliveries: 'Giao hàng',
      created: 'Đã tạo',
      channel: 'Kênh',
      provider: 'Nhà cung cấp',
      attempts: 'Nỗ lực',
      updated: 'Đã cập nhật',
    },
  },
  status: {
    pending: 'đang chờ xử lý',
    processing: 'đang xử lý',
    completed: 'đã hoàn thành',
    partial: 'một phần',
    failed: 'thất bại',
    unknown: 'không rõ',
    preparing: 'chuẩn bị',
    submitting: 'gửi',
    retrying: 'đang thử lại',
    accepted: 'đã được chấp nhận',
  },
  errors: {
    requestFailed: 'Yêu cầu thông báo không thành công.',
    inAppRecipientNotFound:
      'Người nhận thông báo trong ứng dụng không tồn tại.',
  },
};

export default viVN;
