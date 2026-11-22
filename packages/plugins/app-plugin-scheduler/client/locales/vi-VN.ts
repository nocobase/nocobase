import type { SchedulerResource } from './en-US.js';

const viVN: SchedulerResource = {
  // Titles the server registers with the authorization catalog, which resolve in this plugin's namespace.
  authorization: { title: 'Tác vụ định kỳ', read: 'Xem', manage: 'Quản lý' },
  nav: { automation: 'Tự động hóa', schedules: 'Tác vụ định kỳ' },
  page: {
    title: 'Tác vụ định kỳ',
    description:
      'Các tác vụ do plugin và ứng dụng định nghĩa trong mã và chạy theo lịch. Xem khi nào chúng chạy và mỗi lần chạy kết thúc ra sao, đồng thời tạm dừng hoặc tiếp tục chúng. Quy tắc nằm trong mã; trang này không thể tạo hoặc thay đổi chúng.',
    loadFailed: 'Không thể tải các tác vụ định kỳ.',
    retry: 'Thử lại',
    close: 'Đóng',
    copy: 'Sao chép',
    copied: 'Đã sao chép',
    loadMore: 'Tải thêm',
    none: '—',
    tabs: { tasks: 'Tác vụ', runs: 'Lần chạy', config: 'Cấu hình' },
  },
  tasks: {
    attention: {
      title_one: '{{count}} mục cần chú ý',
      title_other: '{{count}} mục cần chú ý',
      target:
        'Đích {{target}} của “{{title}}” không khả dụng ({{state}}), nên mỗi lần kích hoạt đều được ghi là bỏ qua.',
      waiting:
        'Lần chạy của “{{title}}” bắt đầu {{time}} vẫn đang chờ kết quả.',
      failed:
        'Lần chạy gần nhất của “{{title}}” kết thúc với trạng thái {{status}}.',
    },
    stats: {
      total: 'Tác vụ định kỳ',
      running: 'Đang hoạt động',
      attention: 'Cần chú ý',
      next: 'Lần chạy tiếp theo',
      nextOf: 'Lần chạy tiếp theo · {{title}}',
    },
    filters: {
      all: 'Tất cả',
      running: 'Đang hoạt động',
      attention: 'Cần chú ý',
      paused: 'Đã tạm dừng',
      removed: 'Đã xóa khỏi mã',
      search: 'Tìm theo tên hoặc key',
    },
    columns: {
      task: 'Tác vụ',
      rule: 'Quy tắc',
      next: 'Lần chạy tiếp theo',
      last: 'Lần chạy gần nhất',
      totals: 'Tổng cộng',
      state: 'Trạng thái',
      enabled: 'Bật',
    },
    totals: 'Đã chạy {{runs}} · thành công {{succeeded}}',
    noMatch: 'Không có tác vụ định kỳ nào khớp với bộ lọc.',
    enable: 'Tiếp tục “{{title}}”',
    disable: 'Tạm dừng “{{title}}”',
    toggleFailed: 'Không thể thay đổi tác vụ định kỳ.',
    readOnly:
      'Bạn có thể xem các tác vụ định kỳ nhưng không thể tạm dừng hoặc tiếp tục chúng.',
    notes: {
      running:
        '“Đang hoạt động” chỉ có nghĩa là tác vụ đã được bật và đích của nó tồn tại; kết quả của mỗi lần chạy cho biết công việc có thành công hay không. Tổng cộng tính mọi lần kích hoạt, kể cả thất bại và bỏ qua.',
      pause:
        'Tạm dừng chỉ ảnh hưởng đến các lần chạy sau. Cập nhật mã và triển khai lại vẫn giữ nguyên công tắc.',
      removed:
        '“Đã xóa khỏi mã”: sau `scheduler sync --finalize`, các tác vụ không còn trong mã sẽ được đánh dấu như vậy; lịch sử được giữ lại và không thể tiếp tục chúng.',
      internal:
        'Các tác vụ nền nội bộ, như gửi lại thông báo, đồng bộ thư, lập chỉ mục tri thức và dọn dẹp lần chạy của agent, không được liệt kê ở đây; plugin của chúng quản lý chúng.',
    },
  },
  state: {
    running: 'Đang hoạt động',
    paused: 'Đã tạm dừng',
    unavailable: 'Đích không khả dụng',
    removed: 'Đã xóa khỏi mã',
  },
  targetState: {
    ready: 'Khả dụng',
    disabled: 'Đã tắt',
    missing: 'Không tồn tại',
    invalid: 'Cấu hình không hợp lệ',
  },
  pause: {
    title: 'Tạm dừng “{{title}}”?',
    description:
      'Tác vụ sẽ không chạy đúng giờ nữa cho đến khi có người tiếp tục nó.',
    running: 'Các lần chạy đã bắt đầu hoặc đang chờ kết quả sẽ không bị hủy.',
    missed:
      'Sau khi tiếp tục, tác vụ chạy từ thời điểm dự kiến tiếp theo; các lần chạy bị lỡ trong lúc tạm dừng sẽ không được bù.',
    redeploy: 'Triển khai lại không làm tác vụ tiếp tục.',
    limit:
      'Với tác vụ có giới hạn số lần chạy, các lần đã chạy vẫn tiếp tục được tính.',
    cancel: 'Hủy',
    confirm: 'Tạm dừng',
  },
  empty: {
    title: 'Chưa có tác vụ định kỳ nào',
    description:
      'Tác vụ định kỳ được plugin hoặc ứng dụng định nghĩa trong mã bằng `defineSchedule`. Cài đặt một plugin có định nghĩa tác vụ định kỳ, hoặc định nghĩa một tác vụ trong ứng dụng rồi khởi động lại, chúng sẽ xuất hiện ở đây.',
    internal:
      'Các tác vụ nền nội bộ, như gửi lại thông báo, đồng bộ thư và lập chỉ mục tri thức, không được liệt kê ở đây; chúng vẫn chạy theo quy tắc riêng.',
  },
  detail: {
    back: 'Tác vụ định kỳ',
    notFound: 'Tác vụ định kỳ này không tồn tại.',
    key: 'Key',
    rule: 'Quy tắc',
    upcoming: 'Các lần chạy tiếp theo',
    noUpcoming: 'Không có lịch',
    window: 'Thời hạn · giới hạn số lần chạy',
    unlimited: 'Không giới hạn',
    windowFrom: 'từ {{time}}',
    windowTo: 'đến {{time}}',
    limit_one: '{{count}} lần chạy',
    limit_other: '{{count}} lần chạy',
    target: 'Đích',
    totals: 'Tổng cộng',
    source: 'Định nghĩa tại',
    sourceCode:
      'Mã (`defineSchedule`). Để thay đổi quy tắc hoặc đích, hãy sửa mã và triển khai lại.',
    runs: 'Lần chạy',
    noRuns: 'Chưa có lần chạy nào.',
    runsNote:
      'Các lần chạy được liệt kê từ mới nhất. Cấu hình đích của một lần chạy không bao giờ được trả về hoặc hiển thị. Số lần thực thi lớn hơn 1 nghĩa là cùng một lần chạy đã được gửi lại; nó vẫn được tính là một lần chạy.',
  },
  runs: {
    allTasks: 'Tất cả tác vụ định kỳ',
    groups: {
      all: 'Tất cả',
      failed: 'Thất bại · hết thời gian',
      waiting: 'Đang chờ kết quả',
      skipped: 'Bỏ qua',
      succeeded: 'Thành công',
    },
    ranges: {
      day: '24 giờ qua',
      week: '7 ngày qua',
      month: '30 ngày qua',
      quarter: '90 ngày qua',
    },
    columns: {
      planned: 'Thời gian dự kiến',
      task: 'Tác vụ định kỳ',
      result: 'Kết quả',
      reason: 'Lý do · liên quan',
      executions: 'Số lần thực thi',
      duration: 'Thời lượng',
      summary: 'Tóm tắt kết quả',
    },
    noRuns: 'Không có lần chạy nào khớp với bộ lọc.',
    notes: {
      order:
        'Các lần chạy của mọi tác vụ định kỳ, mới nhất trước. Thất bại, hết thời gian và chờ lâu cũng hiển thị ở đầu tab Tác vụ.',
      removed: 'Các tác vụ đã xóa khỏi mã vẫn giữ lịch sử ở đây.',
    },
  },
  status: {
    pending: 'Đang xếp hàng',
    running: 'Đang chạy',
    waiting: 'Đang chờ kết quả',
    succeeded: 'Thành công',
    failed: 'Thất bại',
    skipped: 'Bỏ qua',
    cancelled: 'Đã hủy',
    timed_out: 'Hết thời gian',
    triggered: 'Đã kích hoạt (bản ghi cũ)',
  },
  reason: {
    'target-missing': 'Đích không tồn tại',
    'target-disabled': 'Đích đã bị tắt',
    'target-invalid': 'Cấu hình của đích không hợp lệ',
    'target-not-found': 'Loại đích chưa được đăng ký',
    'invalid-config': 'Cấu hình của đích không hợp lệ',
    'dispatch-failed': 'Thất bại khi khởi chạy; xem nhật ký máy chủ',
    'observer-failed': 'Kiểm tra kết quả của đích thất bại',
    'observer-unavailable': 'Đích không thể báo cáo kết quả',
  },
  run: {
    title: '{{title}} · {{time}}',
    timeline: 'Dòng thời gian',
    started: 'Bắt đầu',
    accepted: 'Đích đã tiếp nhận',
    finished: 'Hoàn tất',
    notYet: 'Chưa có kết quả',
    executions: 'Số lần thực thi',
    target: 'Đích',
    related: 'Liên quan',
    receipt: 'Biên nhận',
    summary: 'Tóm tắt kết quả',
    reason: 'Lý do',
    waitingNote:
      'Trong khi một lần chạy chờ kết quả, bộ lập lịch hỏi đích về trạng thái cho đến khi nó báo thành công, thất bại, hủy hoặc hết thời gian. Bộ lập lịch không tự đặt thời gian chờ; đích quyết định. Khi một lần chạy chờ lâu, hãy mở mục liên quan để xem tiến độ.',
  },
  config: {
    memory:
      'Tác vụ định kỳ chạy trong bộ nhớ của phiên bản này: chỉ phù hợp với một phiên bản duy nhất.',
    memoryHint:
      'Với một phiên bản thì không cần thay đổi gì; để chạy nhiều phiên bản, làm theo “Chuyển sang Redis” bên dưới.',
    shared:
      'Tác vụ định kỳ chạy trên {{adapter}}: nhiều phiên bản có thể chạy chúng.',
    columns: {
      setting: 'Thiết lập',
      value: 'Giá trị hiện tại',
      effect: 'Ảnh hưởng đến tác vụ định kỳ',
      source: 'Nguồn',
    },
    sources: {
      environment: 'Biến môi trường',
      config: 'config.yml',
      default: 'Mặc định',
      backend: 'Do backend đặt',
    },
    rows: {
      configuration: 'Cấu hình jobs',
      backend: 'Backend',
      multiInstance: 'Nhiều phiên bản',
      concurrency: 'Số lần chạy đồng thời',
      attempts: 'Số lần thử',
      connection: 'Kết nối',
    },
    builtIn: 'memory tích hợp',
    selectedByScheduler:
      'Được chọn bởi `scheduler.jobs` (`SCHEDULER_JOBS`) riêng cho tác vụ định kỳ.',
    selectedByDefault:
      '`scheduler.jobs` chưa được đặt, nên tác vụ định kỳ theo `jobs.default`.',
    selectedByBuiltIn:
      'Cả `scheduler.jobs` và `jobs.default` đều chưa được đặt, nên áp dụng mặc định tích hợp.',
    memoryBackend: 'memory (phiên bản này)',
    memoryEffect:
      'Quy tắc nằm trong bộ nhớ của tiến trình này và được ghi vào {{path}} khi tiến trình dừng bình thường.',
    sharedEffect:
      'Quy tắc nằm trong {{adapter}}, được mọi phiên bản dùng chung.',
    plugin: 'Đã đăng ký {{plugin}}',
    supported: 'Được hỗ trợ',
    unsupported: 'Không được hỗ trợ',
    multiSupported:
      'Mỗi lần kích hoạt chạy trên một phiên bản; khi một phiên bản gặp sự cố, đôi khi một lần chạy có thể được gửi lại.',
    multiUnsupported:
      'Mỗi phiên bản tự chạy từng tác vụ định kỳ, nên cùng một tác vụ chạy nhiều lần.',
    concurrencyEffect_one:
      'Mỗi lần chỉ một lần chạy; một lần chạy chậm khiến các lần khác đến hạn phải chờ.',
    concurrencyEffect_other:
      'Tối đa {{count}} lần chạy cùng lúc; các lần khác xếp hàng chờ.',
    attemptsOk: 'Đúng',
    attemptsWarn: 'Nên là 1',
    attemptsEffect:
      'Một lần chạy thất bại được ghi là thất bại và tác vụ chạy lại vào thời điểm tiếp theo; hãy giữ giá trị này là 1.',
    attemptsWarnEffect:
      'Một lần chạy thất bại đã được ghi lại, nên thử lại cùng lần chạy đó không có tác dụng; hãy đặt số lần thử là 1.',
    connectionValue: '{{connection}} · namespace {{namespace}}',
    namespaceOnly: 'namespace {{namespace}}',
    connectionEffect: 'Mật khẩu không bao giờ được hiển thị.',
    redis: {
      title: 'Chuyển sang Redis (cho nhiều phiên bản)',
      step1:
        'Cài đặt plugin thương mại `@nocobase/app-plugin-jobs-redis` và đăng ký nó trên mọi phiên bản.',
      step2:
        'Thêm một backend Redis vào `config.yml` và trỏ tác vụ định kỳ đến nó (đoạn mã bên dưới).',
      step3:
        'Triển khai lại mọi phiên bản, sau đó quay lại kiểm tra “Nhiều phiên bản” hiển thị Được hỗ trợ.',
      warning:
        'Nếu tên sai, plugin chưa được đăng ký hoặc không kết nối được Redis, ứng dụng sẽ không khởi động; nó không bao giờ quay về memory.',
    },
    removed: {
      title: 'Tác vụ định kỳ đã xóa khỏi mã',
      consistent: 'Nhất quán, không cần làm gì.',
      consistentHint:
        'Khi một tác vụ định kỳ bị xóa khỏi mã và được triển khai, nó sẽ được liệt kê ở đây kèm cách dọn dẹp.',
      warning_one:
        '{{count}} tác vụ định kỳ không còn trong mã của phiên bản này nhưng chưa được dọn dẹp.',
      warning_other:
        '{{count}} tác vụ định kỳ không còn trong mã của phiên bản này nhưng chưa được dọn dẹp.',
      warningHint:
        'Chúng không chạy khi đến hạn (nhật ký hiển thị “A schedule fired that this instance has no definition for”), nhưng danh sách tác vụ vẫn hiển thị chúng như bình thường.',
      columns: {
        task: 'Tác vụ định kỳ',
        last: 'Lần chạy gần nhất',
        after: 'Sau khi dọn dẹp',
      },
      after:
        'Được đánh dấu “Đã xóa khỏi mã”, không bao giờ kích hoạt lại, lịch sử được giữ lại.',
      neverRan: 'Chưa từng chạy',
      how: 'Cách dọn dẹp',
      howHint:
        'Khi mọi phiên bản đã chạy phiên bản mới, hãy chạy lệnh này một lần trên bất kỳ máy chủ nào:',
      why: 'Tại sao không tự động: trong quá trình triển khai cuốn chiếu, phiên bản cũ và mới chạy song song, và việc dọn dẹp tự động có thể xóa các tác vụ mà phiên bản cũ vẫn đang dùng.',
      full: 'Chỉ chạy trên bản dựng đầy đủ có tất cả plugin; nếu không, tác vụ của các plugin không được tải cũng sẽ bị đánh dấu là đã xóa.',
    },
    readOnly:
      'Trang này chỉ đọc: các thiết lập này nằm trong cấu hình của ứng dụng và có hiệu lực khi triển khai lại. Bộ nhớ đệm, hàng đợi và các dịch vụ khác được đề cập trong thiết lập cụm và phân tán.',
  },
  cron: {
    everyMinute: 'Mỗi phút',
    everyMinutes: 'Mỗi {{count}} phút',
    everyHour: 'Mỗi giờ vào phút {{minute}}',
    everyHours: 'Mỗi {{count}} giờ',
    daily: 'Hằng ngày lúc {{time}}',
    weekdays: 'Các ngày trong tuần lúc {{time}}',
    weekly: 'Mỗi {{day}} lúc {{time}}',
    monthly: 'Ngày {{day}} hằng tháng lúc {{time}}',
  },
};

export default viVN;
