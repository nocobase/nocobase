import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  business: {
    scenarios: 'Kịch bản thời gian thực',
    tabs: {
      tasks: 'Tác vụ',
      inbox: 'Hộp thư đến',
      exports: 'Xuất khẩu',
      lab: 'Phòng thí nghiệm năng lực',
    },
    assignee: 'Người được giao',
    creator: 'Tạo bởi',
    updated: 'Cập nhật lần cuối',
    statusLabel: 'Trạng thái',
    detail: 'Chi tiết nhiệm vụ',
    saving: 'Tiết kiệm…',
    saved: 'Đã cập nhật trạng thái nhiệm vụ',
    updating: 'Đang cập nhật…',
    previous: 'Trước',
    next: 'Tiếp theo',
    close: 'Đóng',
    cancel: 'Hủy',
    create: 'Tạo',
    created: 'Đã tạo nhiệm vụ "{{title}}"',
    status: {
      open: 'Để làm',
      'in-progress': 'Đang thực hiện',
      done: 'Hoàn thành',
    },
    actions: {
      'in-progress': 'Bắt đầu',
      done: 'Hoàn thành',
      open: 'Mở lại',
    },
    form: {
      help: 'Mô tả công việc và chọn người sẽ xử lý nó.',
      title: 'Tiêu đề',
      description: 'Mô tả',
      choose: 'Chọn người được giao',
      titleRequired: 'Nhập tiêu đề từ 1–200 ký tự.',
      descriptionRequired: 'Mô tả những việc cần làm.',
      assigneeRequired: 'Chọn người được chuyển nhượng tích cực.',
    },
    errors: {
      session: 'Phiên của bạn đã kết thúc. Đăng nhập lại.',
      forbidden:
        'Bạn không còn quyền truy cập vào tác vụ này nữa. Đóng nó lại và kiểm tra với người tạo ra nó.',
      missing:
        'Bản ghi này không còn tồn tại. Đóng nó lại hoặc quay lại danh sách hiện tại.',
      failed: 'Yêu cầu không thành công. Vui lòng thử lại.',
      active: 'Quá trình xuất vẫn đang diễn ra. Đợi nó kết thúc.',
    },
    read: 'Đọc',
    unread: 'Chưa đọc',
    markRead: 'Đánh dấu đã đọc',
    markUnread: 'Đánh dấu là chưa đọc',
    markedRead: 'Thông báo được đánh dấu đã đọc',
    markedUnread: 'Thông báo được đánh dấu là chưa đọc',
    loadMore: 'Tải thêm',
    jobs: {
      queued: 'Đã xếp hàng',
      running: 'Xuất khẩu',
      completed: 'Sẵn sàng để tải xuống',
      failed: 'Thất bại',
    },
    tasks: {
      title: 'Hợp tác nhiệm vụ',
      description:
        'Phân công công việc và cùng nhau theo dõi tiến độ công việc theo thời gian thực.',
      try: 'Thử hai cửa sổ: tạo một tác vụ ở đây, sau đó xem nó xuất hiện và thay đổi trạng thái trong cửa sổ còn lại. Chỉ những nhiệm vụ bạn đã tạo hoặc được giao mới hiển thị.',
      create: 'Nhiệm vụ mới',
      empty: 'Chưa có nhiệm vụ',
      emptyHelp:
        'Tạo một nhiệm vụ thực tế, giao cho chính bạn hoặc đồng nghiệp và thực hiện tại đây.',
      stageEmpty: 'Không có nhiệm vụ nào trong giai đoạn này trên trang này',
      page: 'Trang {{page}} · Tổng số nhiệm vụ {{count}}. Các cột hiển thị tối đa 30 nhiệm vụ trên trang này.',
    },
    inbox: {
      title: 'Hộp thư cá nhân',
      description:
        'Nhận nhiệm vụ và cập nhật nhiệm vụ, đồng thời giữ trạng thái đọc được đồng bộ hóa trên các cửa sổ.',
      try: 'Giao nhiệm vụ cho chính bạn để nhận thông báo. Để cộng tác, hãy sử dụng tài khoản khác: các cập nhật sẽ thông báo cho những người tham gia khác. Hộp thư đến này bao gồm tất cả các thông báo ứng dụng của bạn.',
      empty: 'Chưa có thông báo nào',
      emptyHelp:
        'Tạo nhiệm vụ được giao cho chính bạn trong Nhiệm vụ, sau đó quay lại đây.',
    },
    exports: {
      missing:
        'Tệp xuất này không còn có sẵn. Tạo một bản xuất mới để tải xuống các tác vụ hiện tại của bạn.',
      title: 'Xuất nhiệm vụ',
      description:
        'Xuất các tác vụ hiển thị của bạn ở chế độ nền và tải xuống CSV kết quả.',
      try: 'Bắt đầu xuất, chuyển trang rồi quay lại để tải xuống. Một cửa sổ khác cũng thực hiện công việc tương tự. Tiến trình đếm các hàng thực; một đợt xuất khẩu nhỏ có thể kết thúc ngay lập tức.',
      create: 'Nhiệm vụ xuất khẩu',
      empty: 'Chưa xuất khẩu',
      emptyHelp:
        'Tạo ảnh chụp nhanh CSV về nhiệm vụ của bạn, bao gồm mô tả, trạng thái và người được giao.',
      accepted: 'Bắt đầu xuất khẩu',
      active: 'Đang xuất khẩu. Bạn có thể rời khỏi trang này và quay lại sau.',
      file: 'Nhiệm vụ CSV',
      rows: 'Đã xử lý các hàng {{processed}} / {{total}}',
      progress: 'Tiến độ xuất khẩu',
      limit:
        'Việc xuất vượt quá 5.000 nhiệm vụ. Ví dụ này hỗ trợ tối đa 5.000 hàng cho mỗi lần xuất.',
      failed:
        'Việc xuất không thành công. Sử dụng tác vụ Xuất để bắt đầu lần thử mới.',
      download: 'Tải xuống',
      downloaded: 'Đã bắt đầu tải xuống CSV',
      retention:
        '20 lần xuất mới nhất của bạn được giữ lại. Mỗi tệp là ảnh chụp nhanh các tác vụ bạn có thể truy cập khi nó được tạo.',
    },
  },
  routeOverlay: {
    close: 'Đóng',
  },
  title: 'Ví dụ thời gian thực',
  description:
    'Khám phá các gói đăng ký, kiểm soát quyền truy cập và khôi phục bằng các sự kiện trực tiếp và ảnh chụp nhanh có thể quan sát được.',
  scope:
    'Các giá trị demo thuộc về tài khoản của bạn, chỉ tồn tại trong quá trình này và được đặt lại sau một giờ không hoạt động hoặc khởi động lại máy chủ.',
  account: 'Tài khoản vãng lai',
  loading: 'Đang tải',
  working: 'Đang làm việc…',
  retry: 'Thử lại',
  reload: 'Trình diễn tải lại',
  signIn: 'Đăng nhập lại',
  cancel: 'Hủy',
  connection: 'Kết nối',
  subscription: 'Đăng ký',
  events: 'Sự kiện nhận được',
  ready: 'Lời cảm ơn',
  snapshot: 'Ảnh chụp nhanh được quan sát',
  reads: 'Đã hoàn thành việc đọc ảnh chụp nhanh',
  readAt: 'Lần đọc thành công cuối cùng',
  waiting: 'Đang chờ sự kiện đầu tiên…',
  none: 'Chưa có sẵn',
  topic: 'Chủ đề',
  receipt: 'Biên nhận xuất bản lần cuối',
  pause: 'Tạm dừng đăng ký',
  resume: 'Tiếp tục đăng ký',
  reconnect: 'Kết nối lại',
  states: {
    idle: 'Nhàn rỗi',
    connecting: 'Đang kết nối',
    open: 'Mở',
    reconnecting: 'Đang kết nối lại',
    closed: 'Đã đóng',
    pending: 'Đang chờ',
    subscribing: 'Đăng ký',
    subscribed: 'Đã đăng ký',
    error: 'Lỗi',
  },
  clock: {
    title: '1. Chủ đề công khai và React hook',
    description:
      'useRealtimeTopic đăng ký đồng hồ công cộng. Việc tạm dừng sẽ giải phóng đồng hồ của thẻ này.',
    latest: 'Giờ máy chủ mới nhất',
    paused: 'Thẻ này bị tạm dừng. Tiếp tục nhận bọ ve mới.',
    initial:
      'Đồng hồ bắt đầu xuất bản khi người đăng ký đầu tiên được xác nhận.',
  },
  personal: {
    title: '2. Sự kiện cá nhân',
    description:
      'PublishFor nhắm mục tiêu tài khoản của bạn. Một tab khác của tài khoản này nhận được sự kiện; tài khoản khác thì không.',
    send: 'Gửi tới tài khoản của tôi',
    empty: 'Chưa có sự kiện cá nhân nào. Gửi một để quan sát việc giao hàng.',
    recovery:
      'onReady đọc ảnh chụp nhanh cá nhân mới nhất sau mỗi lần xác nhận.',
  },
  room: {
    title: '3. Phân quyền tài nguyên động',
    description:
      'Phòng này sử dụng cùng chính sách quyền sở hữu và quyền truy cập đối với hoạt động đọc HTTP và phân phối theo thời gian thực.',
    allowed: 'Đã cấp quyền truy cập',
    denied: 'Truy cập bị từ chối',
    grant: 'Cấp quyền truy cập',
    revoke: 'Thu hồi quyền truy cập',
    retry: 'Thử lại đăng ký',
    send: 'Thay đổi phòng xuất bản',
    grantHint: 'Cấp quyền truy cập, sau đó thử lại đăng ký bị từ chối.',
    retryHint: 'Quyền truy cập được cấp. Hãy thử lại để có được xác nhận mới.',
    revokeTitle: 'Thu hồi quyền truy cập vào phòng demo của bạn?',
    revokeDescription:
      'Các đăng ký hiện tại sẽ mất quyền truy cập và xóa ảnh chụp nhanh phòng. Bạn có thể cấp lại quyền truy cập.',
    blocked: 'Ảnh chụp nhanh phòng bị ẩn trong khi quyền truy cập bị từ chối.',
    success: 'Đã cập nhật quyền truy cập vào phòng',
  },
  counter: {
    title: '4. Tổng hợp làm mới và bắt kịp',
    description:
      'Năm sự vô hiệu cập nhật một bộ đếm. useRealtimeRefresh kết hợp các lần đọc; số lượng so sánh tăng sau khi sẵn sàng ban đầu.',
    burst: 'Xuất bản 5 thay đổi',
    pause: 'Tạm dừng làm mới trực tiếp',
    resume: 'Tiếp tục làm mới trực tiếp',
    paused:
      'Làm mới ảnh chụp nhanh bị tạm dừng; người quan sát sự kiện vẫn hoạt động. Xuất bản lại, sau đó tiếp tục để bắt kịp.',
    running:
      'Làm mới ảnh chụp nhanh đang hoạt động. Các tab ẩn được làm mới khi hiển thị lại.',
    refreshing: 'Đang làm mới ảnh chụp nhanh…',
    note: 'Giá trị này chỉ đến từ API đã đọc, không bao giờ đến từ phản hồi xuất bản.',
  },
  unknown: {
    title: '5. Lỗi đăng ký',
    description:
      'Một chủ đề không được khai báo sẽ bị từ chối mà không dừng các chủ đề được phép.',
    try: 'Thử chủ đề chưa biết',
    explanation:
      'TOPIC_NOT_FOUND được mong đợi ở đây. Máy chủ phải khai báo một chủ đề trước khi nó có thể được đăng ký.',
    initial: 'Bắt đầu thử quan sát lỗi giao thức thực.',
  },
  recovery: {
    title: '6. Khôi phục kết nối',
    description:
      'Ngắt kết nối ổ cắm cục bộ của tài khoản này, bao gồm cả các tab khác. Máy khách tự động kết nối lại và onReady tải lại những thay đổi bị bỏ lỡ.',
    disconnect: 'Mô phỏng ngắt kết nối',
    history: 'Trạng thái kết nối gần đây',
    note: 'Kết nối lại ở trên cùng sẽ mở lại kết nối ứng dụng được chia sẻ. Các sự kiện mang tính nhất thời: ảnh chụp nhanh khôi phục trạng thái mà không cần phát lại.',
    instruction:
      'Xuất bản các thay đổi từ tab khác. Tiếp tục quá trình làm mới đã tạm dừng để bắt kịp; kết nối lại tải lại ảnh chụp nhanh trong khi làm mới đang hoạt động.',
    disconnected: 'Ổ cắm thời gian thực bị ngắt kết nối',
  },
  published: 'Đã chấp nhận xuất bản',
  errors: {
    request: 'Yêu cầu không thành công. Hãy thử lại.',
    session: 'Phiên của bạn đã kết thúc. Đăng nhập lại.',
    forbidden: 'Quyền truy cập bị từ chối. Kiểm tra quyền hiện tại của bạn.',
    expired: 'Cuộc biểu tình đã hết hạn. Tải lại nó để tạo một phòng mới.',
    capacity: 'Cuộc biểu tình đang bận rộn. Hãy thử lại sau.',
    subscription:
      'Việc đăng ký không thành công. Kết nối lại hoặc thử lại sau khi khôi phục quyền truy cập.',
  },
};

export default viVN;
