import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  inbox: {
    eyebrow: 'Hộp thư cá nhân',
    title: 'Trung tâm nhắn tin',
    unreadCount: '{{count}} chưa đọc',
    description: 'Cập nhật từ các ứng dụng và quy trình công việc bạn sử dụng.',
    markAllRead: 'Đánh dấu đã đọc hết',
    messagesTitle: 'Tin nhắn',
    messagesDescription:
      'Tin nhắn trong ứng dụng giữ trạng thái đọc độc lập cho người dùng hiện tại.',
    unreadFilter: 'Chưa đọc',
    unavailable: 'Hộp thư đến không khả dụng',
    retry: 'Thử lại',
    loading: 'Đang tải thông báo…',
    emptyTitle: 'Bạn đã bắt kịp rồi',
    emptyDescription: 'Thông báo mới sẽ xuất hiện ở đây.',
    loadingMore: 'Đang tải…',
    loadMore: 'Tải thêm',
    scrollMore: 'Kéo xuống để tải thêm',
    noMore: 'Không còn tin nhắn nào nữa',
    expand: 'Hiển thị thêm',
    collapse: 'Hiển thị ít hơn',
    channel: 'Trong ứng dụng',
    open: 'Mở',
    markUnread: 'Đánh dấu là chưa đọc',
    markRead: 'Đánh dấu đã đọc',
    delete: 'Xóa thông báo',
    errors: {
      update: 'Cập nhật hộp thư đến không thành công.',
      loadMore: 'Không thể tải thêm thông báo.',
      markAllRead: 'Không thể đánh dấu thông báo là đã đọc.',
    },
  },
};

export default viVN;
