import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
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
