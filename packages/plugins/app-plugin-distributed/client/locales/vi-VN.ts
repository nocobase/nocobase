import type { DistributedResource } from './en-US.js';

const viVN: DistributedResource = {
  nav: {
    title: 'Cụm và phân tán',
    description:
      'Phiên bản này dùng những backend nào và ứng dụng có thể chạy trên nhiều phiên bản hay không.',
  },
  page: {
    description:
      'Để chạy trên nhiều máy chủ hoặc tiến trình, bộ nhớ đệm, khóa, tác vụ nền, hàng đợi, tin nhắn thời gian thực và việc tạo ID phải dùng backend dùng chung. Trang này hiển thị các backend mà phiên bản này thực sự đã chọn và nguồn của từng thiết lập, đồng thời kiểm tra xem ứng dụng có thể chạy an toàn trên nhiều phiên bản hay không. Các thiết lập nằm trong cấu hình ứng dụng; hãy triển khai lại sau khi thay đổi.',
    loading: 'Đang tải…',
    loadFailed: 'Không thể tải trạng thái.',
    retry: 'Thử lại',
  },
  summary: {
    single: 'Một phiên bản',
    singleCaption: 'Cấu hình hiện tại phù hợp với một phiên bản',
    shared: '{{shared}} / {{total}}',
    sharedCaption: 'dịch vụ được dùng chung',
    requiredCaption: 'cần khắc phục',
    recommendedCaption: 'khuyến nghị',
  },
  sections: {
    scale: 'Có thể chạy trên nhiều phiên bản không',
    services: 'Dịch vụ dùng chung',
    idGeneration: 'Tạo ID',
    checklist: 'Trước khi đưa vào hoạt động',
    notes: 'Ghi chú',
  },
  level: {
    required: 'Bắt buộc',
    recommended: 'Khuyến nghị',
    ok: 'Ổn',
  },
  singleHint:
    'Chạy một phiên bản thì không cần thay đổi gì. Để mở rộng: chuẩn bị Redis và một cơ sở dữ liệu PostgreSQL hoặc MySQL dùng chung → cài các plugin Redis cần thiết → thay đổi cấu hình → kiểm chứng với hai phiên bản.',
  fix: 'Cách khắc phục',
  table: {
    service: 'Dịch vụ',
    backend: 'Backend đã chọn',
    sharing: 'Phạm vi',
    plugin: 'Plugin Redis',
    source: 'Nguồn',
    adapter: 'Bộ điều hợp',
  },
  services: {
    caching: {
      name: 'Bộ nhớ đệm',
      usage: 'Trạng thái đăng nhập, quyền, bộ nhớ đệm cấu hình',
    },
    concurrency: {
      name: 'Khóa đồng thời',
      usage: 'Di chuyển dữ liệu, đánh số, tính lũy đẳng',
    },
    jobs: {
      name: 'Tác vụ nền',
      usage: 'Tác vụ theo lịch, lập chỉ mục tri thức',
    },
    queue: { name: 'Hàng đợi', usage: 'Gửi thông báo' },
    realtime: {
      name: 'Tin nhắn thời gian thực',
      usage: 'Hộp thư, trạng thái trực tuyến',
    },
  },
  sharing: {
    shared: 'Dùng chung giữa các phiên bản',
    local: 'Chỉ phiên bản này',
    unknown: 'Chưa khai báo',
  },
  source: { configured: 'Đã cấu hình', default: 'Mặc định' },
  notSet: '(chưa đặt)',
  unavailable: 'Ứng dụng này không sử dụng',
  unregistered: 'Bộ điều hợp chưa được đăng ký',
  selections: 'Chọn theo tên',
  selection: '{{consumer}} → {{backend}}',
  howToChange: 'Cách thay đổi',
  howToChangeIntro:
    'Cài plugin Redis của từng dịch vụ, đăng ký plugin phía máy chủ của nó, rồi chọn nó trong cấu hình:',
  idGeneration: {
    mode: 'Chế độ',
    modeHint:
      'Khi có nhiều phiên bản, hãy gán worker ID tự động để mỗi phiên bản nhận một ID riêng.',
    auto: 'Tự động · mỗi phiên bản một worker ID',
    manual: 'Thủ công · workerId {{workerId}}',
  },
  checklist: {
    intro:
      'Trang này không thể tự kiểm tra các mục sau. Hãy xác nhận bằng cách thao tác trên hai phiên bản:',
    files: 'Tệp tải lên trên phiên bản A có thể tải xuống từ phiên bản B',
    realtime:
      'Tin nhắn tạo trên A đến được người dùng kết nối với B theo thời gian thực, và không mất gì sau khi kết nối lại',
    queue:
      'Tác vụ đưa vào hàng đợi trên A có thể được B xử lý, và việc thử lại không lặp lại tác dụng phụ',
    secrets:
      'Mọi phiên bản dùng cùng secrets.keys, và đăng nhập hoạt động giữa các phiên bản',
    websocket:
      'Bộ cân bằng tải chuyển tiếp kết nối WebSocket và khớp với đường dẫn và tên miền của ứng dụng',
  },
  notes: {
    current:
      'Trang này chỉ hiển thị phiên bản bạn đang kết nối. Nó không thể biết các phiên bản khác có được cấu hình giống vậy không; hãy triển khai chúng từ cùng một cấu hình.',
    noTest:
      'Không có “Kiểm tra kết nối”: các plugin Redis kết nối khi ứng dụng khởi động, và ứng dụng sẽ không khởi động nếu chúng không kết nối được. Lỗi kết nối trong khi chạy được ghi vào nhật ký.',
    instances:
      'Danh sách các phiên bản đang chạy chỉ xuất hiện khi dùng worker ID tự động, do một plugin thương mại cung cấp.',
  },
  checks: {
    database: {
      sqlite: {
        title: 'Cơ sở dữ liệu',
        detail:
          'SQLite chỉ phục vụ được một phiên bản. Nhiều phiên bản cần PostgreSQL hoặc MySQL.',
        fix: 'Chuyển dữ liệu sang PostgreSQL hoặc MySQL và trỏ kết nối cơ sở dữ liệu chính tới đó.',
      },
      shared: {
        title: 'Cơ sở dữ liệu',
        detail:
          '{{dialect}}: mọi phiên bản kết nối tới cùng một cơ sở dữ liệu.',
      },
    },
    service: {
      unregistered: {
        title: '{{service}}',
        detail:
          '{{configPath}} chọn bộ điều hợp “{{adapter}}”, nhưng không có plugin đã đăng ký nào cung cấp nó. Dịch vụ sẽ lỗi ở lần dùng đầu tiên.',
        fix: 'Cài và đăng ký plugin cung cấp “{{adapter}}”, hoặc chọn một backend khác.',
      },
      local: {
        title: '{{service}} vẫn chỉ cục bộ trên phiên bản này',
        detail:
          'Mỗi phiên bản giữ trạng thái riêng. Hãy cài {{plugin}} và đặt {{configPath}} thành một backend Redis.',
        fix: 'Cài {{plugin}}, đăng ký plugin phía máy chủ của nó, rồi chọn nó:',
      },
      selectionLocal: {
        title: '{{service}}',
        detail:
          '{{consumer}} dùng rõ ràng backend “{{backend}}”, vốn chỉ cục bộ trên phiên bản này.',
      },
    },
    services: {
      local: {
        title:
          'Bộ nhớ đệm, khóa, tác vụ nền, hàng đợi, tin nhắn thời gian thực',
        detail: 'Tất cả đều cục bộ trên phiên bản này: {{services}}.',
      },
    },
    files: {
      local: {
        title: 'Lưu trữ tệp',
        detail:
          'Tệp trong {{collections}} nằm trên ổ đĩa của máy chủ này; các phiên bản khác không đọc được.',
        fix: 'Dùng kho lưu trữ dùng chung như S3 cho các bảng tệp này, và chuyển các tệp hiện có sang đó.',
      },
      defaultLocal: {
        title: 'Lưu trữ tệp',
        detail:
          'Kho lưu trữ mặc định lưu tệp trên ổ đĩa của máy chủ này; các phiên bản khác không đọc được.',
        fix: 'Đặt kho lưu trữ mặc định thành một kho dùng chung như S3.',
      },
      shared: {
        title: 'Lưu trữ tệp',
        detail: 'Không có bảng tệp nào lưu tệp trên ổ đĩa của máy chủ này.',
      },
    },
    idGeneration: {
      auto: {
        title: 'Tạo ID',
        detail: 'Gán tự động: mỗi phiên bản nhận worker ID riêng.',
      },
      manual: {
        title: 'Tạo ID',
        detail:
          'Worker ID thủ công {{workerId}}. Hai phiên bản có cùng worker ID có thể tạo ra các ID trùng nhau.',
        fix: 'Đặt cho mỗi phiên bản một SNOWFLAKE_WORKER_ID riêng, hoặc cài plugin tự động gán worker ID.',
      },
    },
    secrets: {
      set: {
        title: 'Khóa bí mật',
        detail:
          'Đã đặt secrets.keys. Hãy đảm bảo mọi phiên bản dùng cùng các khóa.',
      },
      missing: {
        title: 'Khóa bí mật',
        detail:
          'Chưa đặt secrets.keys. Mọi phiên bản cần cùng các khóa để đọc được dữ liệu mà các phiên bản khác mã hóa.',
        fix: 'Tạo khóa bằng openssl rand -hex 32 và đặt nó trên mọi phiên bản.',
      },
    },
    publicOrigin: {
      set: {
        title: 'Địa chỉ công khai',
        detail: 'app.publicOrigin = {{origin}}',
      },
      missing: {
        title: 'Địa chỉ công khai',
        detail:
          'Chưa đặt app.publicOrigin. Khi đứng sau bộ cân bằng tải, liên kết và callback cần địa chỉ công khai.',
        fix: 'Đặt app.publicOrigin thành địa chỉ mà người dùng truy cập.',
      },
    },
    checkFailed: {
      title: 'Một mục kiểm tra không chạy được',
      detail: 'Mục kiểm tra “{{check}}” bị lỗi; xem nhật ký.',
    },
  },
};

export default viVN;
