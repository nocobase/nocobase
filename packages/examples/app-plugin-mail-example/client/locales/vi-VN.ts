import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  navigation: {
    mailExample: 'Ví dụ về thư',
    workspace: 'Hộp thư đến và soạn thư',
    accounts: 'Tài khoản',
    allMail: 'Tất cả thư',
    activity: 'Gửi hoạt động',
    syncLogs: 'Nhật ký đồng bộ hóa',
  },
  workspace: {
    title: 'Hộp thư đến và soạn thư',
    description:
      'Đọc tin nhắn mẫu, kiểm tra tệp đính kèm, trả lời hoặc soạn tin nhắn mới. Nhà cung cấp mô phỏng chấp nhận gửi mà không cần liên hệ với dịch vụ thư bên ngoài.',
  },
  activity: {
    title: 'Gửi hoạt động',
    description:
      'Xem lại bản ghi gửi được tạo bởi luồng gửi thông thường của Thư. Nhà cung cấp mô phỏng mô phỏng sự chấp nhận và Thư lưu trữ thư trong thư mục Đã gửi cục bộ.',
    subject: 'Chủ đề',
    recipients: 'Người nhận',
    account: 'Gửi tài khoản',
    status: 'Trạng thái',
    created: 'Đã gửi',
    noSubject: '(không có chủ đề)',
    loadFailed: 'Không thể tải hoạt động gửi.',
    emptyTitle: 'Chưa có hoạt động gửi nào',
    emptyDescription:
      'Gửi tin nhắn mẫu từ không gian làm việc để xem kết quả gửi mô phỏng của nó tại đây.',
    statuses: {
      pending: 'Đang chờ',
      submitting: 'Đang gửi',
      accepted: 'Đã chấp nhận (mô phỏng)',
      failed: 'Thất bại',
      unknown: 'Không rõ',
      cancelled: 'Đã hủy',
    },
  },
  providers: {
    demo: 'Gmail (mô phỏng)',
    'demo-microsoft': 'Microsoft 365 (mô phỏng)',
    'demo-imap-smtp': 'IMAP/SMTP (giả)',
  },
  accounts: {
    title: 'Tài khoản hộp thư',
    description: 'Chuẩn bị hộp thư mẫu và tin nhắn của chúng.',
  },
  allMail: {
    title: 'Tất cả thư',
    description:
      'Duyệt thư được nhập từ hộp thư giả, tìm kiếm theo từ khóa và kiểm tra tài khoản, trạng thái đọc, dấu sao và siêu dữ liệu đính kèm của từng thư.',
    listTitle: 'Danh sách tin nhắn',
    resultCount: 'Tin nhắn {{count}}',
    pageCount: 'Trang {{page}} của {{pages}}',
    searchLabel: 'Tìm kiếm thư',
    searchPlaceholder: 'Tìm kiếm chủ đề, người gửi hoặc nội dung tin nhắn',
    search: 'Tìm kiếm',
    account: 'Tài khoản',
    from: 'Từ',
    subject: 'Chủ đề và xem trước',
    flags: 'Trạng thái tin nhắn',
    date: 'Đã nhận được',
    unread: 'Chưa đọc',
    starred: 'Được gắn dấu sao',
    attachment: 'Tệp đính kèm',
    previous: 'Trước',
    next: 'Tiếp theo',
    emptyTitle: 'Không tìm thấy tin nhắn',
    emptyDescription:
      'Hãy thử từ khóa khác hoặc xóa tìm kiếm để xem tất cả các tin nhắn mô phỏng.',
    loadFailed: 'Không thể tải tất cả thư.',
  },
  syncLogs: {
    title: 'Nhật ký đồng bộ hóa',
    description:
      'Xem lại lịch sử và quá trình đồng bộ hóa gia tăng cho ba hộp thư mô phỏng, bao gồm trạng thái, pha, số lượng được xử lý và lỗi.',
    account: 'Tài khoản hộp thư',
    mode: 'Chế độ đồng bộ',
    status: 'Trạng thái',
    phase: 'Giai đoạn',
    progress: 'Tiến độ',
    started: 'Đã bắt đầu',
    completed: 'Đã hoàn thành',
    error: 'Lỗi',
    unknownAccount: 'Tài khoản không xác định',
    empty:
      'Chưa có đồng bộ hóa nào chạy. Bắt đầu đồng bộ hóa từ trang tài khoản.',
    loadFailed: 'Không thể tải nhật ký đồng bộ hóa.',
    pageCount: 'Trang {{page}} của {{pages}} · {{total}} chạy',
    messages: 'Đã xử lý tin nhắn {{count}}',
    batches: 'Lô {{count}}',
    modes: {
      initial: 'Đồng bộ hóa ban đầu',
      incremental: 'Đồng bộ hóa gia tăng',
    },
    statuses: {
      pending: 'Đang chờ',
      running: 'Đang chạy',
      completed: 'Đã hoàn thành',
      partial: 'Một phần',
      failed: 'Thất bại',
      cancelled: 'Đã hủy',
    },
    phases: {
      preparing: 'Đang chuẩn bị',
      history: 'Lịch sử tin nhắn',
      catchUp: 'Bắt kịp',
      incremental: 'Cập nhật gia tăng',
      completed: 'Đã hoàn thành',
    },
  },
  demo: {
    noPreview: 'Không có bản xem trước.',
    preparing: 'Đang chuẩn bị dữ liệu hộp thư demo…',
    retry: 'Thử lại thiết lập',
    openWorkspace: 'Mở không gian làm việc của thư',
    refresh: 'Làm mới',
    loading: 'Đang tải…',
  },
};

export default viVN;
