import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  authorization: {
    title: 'Lịch trình ví dụ công việc',
    update: 'Quy tắc bắt đầu và dừng',
  },
  navigation: {
    group: 'Ví dụ về công việc',
    jobs: 'Việc làm một lần',
    schedules: 'Lịch trình',
  },
  jobs: {
    title: 'Công việc nền',
    description:
      'Mỗi công việc chờ trong hàng đợi, sau đó hoạt động trong 10 giây và báo cáo 10% tiến độ mỗi giây. Tiến trình đến trên WebSocket khi trang này được mở.',
    create: 'Tạo việc làm',
    creating: 'Tạo ra…',
    listTitle: 'Công việc của bạn',
    count: 'Việc làm {{count}}',
    empty: 'Chưa có việc làm. Tạo một cái để xem tiến trình của nó.',
    loading: 'Đang tải…',
    job: 'Việc làm {{id}}',
    createdAt: 'Đã tạo {{time}}',
    attempt: 'Thử {{attempt}}',
    progress: 'Tiến độ',
    live: 'Trực tiếp',
    offline: 'Đang kết nối lại',
  },
  schedules: {
    title: 'Lịch trình',
    description:
      'Quy tắc định kỳ trên ScheduleExecutor. Mọi quy tắc mà trang này có thể bắt đầu đều được xác định bằng mã, do đó trình xử lý của nó được đăng ký trước khi trình thực thi bắt đầu — một quy tắc được bắt đầu trước khi khởi động lại sẽ tiếp tục chạy sau quy tắc đó. Các thay đổi sẽ đến trên WebSocket khi trang này được mở.',
    listTitle: 'Quy tắc',
    loading: 'Đang tải…',
    start: 'Bắt đầu',
    stop: 'Dừng',
    builtIn: 'Được xây dựng trong',
    every: 'Mọi {{seconds}}',
    cron: 'Cron {{cron}} (UTC)',
    limit: 'nhiều nhất là {{limit}} lần',
    nextRun: 'Lần chạy tiếp theo trong {{seconds}}',
    nextRunDue: 'Đã đến hạn chạy tiếp theo',
    noNextRun: 'Không còn chạy nữa',
    firings: '{{count}} chạy trên phiên bản này',
    delay: 'khởi động {{ms}} muộn một mili giây',
    noRuns: 'Chưa có lượt chạy nào.',
    live: 'Trực tiếp',
    offline: 'Đang kết nối lại',
    rule: {
      heartbeat: 'Nhịp tim',
      interval: 'Khoảng thời gian',
      limited: 'Giới hạn',
      cron: 'Cron',
    },
    ruleDescription: {
      heartbeat:
        'Plugin viết quy tắc này mỗi lần bắt đầu và không bao giờ dừng nó.',
      interval:
        'Chuyển khoảng thời gian trong khi nó chạy; lần chạy tiếp theo được lên kế hoạch từ lần chạy mới.',
      limited: 'Tự kết thúc sau năm lần chạy. Bắt đầu lại trong năm năm nữa.',
      cron: 'Chạy vào đầu mỗi phút.',
    },
    state: {
      active: 'Đang hoạt động',
      ended: 'Đã kết thúc',
      stopped: 'Đã dừng',
    },
    outcome: {
      running: 'Đang chạy',
      succeeded: 'Đã thành công',
      failed: 'Thất bại',
    },
  },
  status: {
    queued: 'Đã xếp hàng',
    running: 'Đang chạy',
    completed: 'Đã hoàn thành',
    failed: 'Thất bại',
  },
};

export default viVN;
