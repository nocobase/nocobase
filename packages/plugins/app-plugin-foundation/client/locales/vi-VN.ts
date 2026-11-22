import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  nav: {
    plugins: 'Plugin',
    pluginsDescription:
      'Các plugin ứng dụng này đang dùng, phiên bản của chúng và cách bật các plugin còn lại.',
  },
  access: {
    section: 'Hệ thống',
    settings: {
      plugins: 'Plugin',
    },
    actions: {
      read: 'Xem',
    },
  },
  page: {
    title: 'Plugin',
    description:
      'Các plugin ứng dụng này đang dùng. Bật hoặc tắt một plugin sẽ thay đổi mã của ứng dụng và chỉ có hiệu lực sau khi khởi động lại, nên trang này đưa ra các lệnh cần chạy thay vì công tắc.',
    deployed:
      'Đây là ứng dụng đã triển khai: chỉ liệt kê các plugin được triển khai cùng ứng dụng. Các plugin chỉ thấy khi phát triển không có ở đây.',
    attention_one: '{{count}} plugin cần chú ý và được xếp lên đầu.',
    attention_other: '{{count}} plugin cần chú ý và được xếp lên đầu.',
    search: 'Tìm theo tên hoặc gói',
    loading: 'Đang tải plugin…',
    loadFailed: 'Không tải được danh sách plugin.',
    retry: 'Thử lại',
    empty: 'Không có plugin nào phù hợp.',
  },
  filters: {
    label: 'Hiển thị',
    all: 'Tất cả {{count}}',
    enabled: 'Đã bật {{count}}',
    disabled: 'Chưa bật {{count}}',
    attention: 'Cần chú ý {{count}}',
  },
  columns: {
    plugin: 'Plugin',
    version: 'Phiên bản',
    status: 'Trạng thái',
    actions: 'Thao tác',
  },
  groups: {
    enabled: 'Đã bật {{count}}',
    disabled: 'Chưa bật {{count}}',
  },
  status: {
    enabled: 'Đã bật',
    skillsOnly: 'Đã bật · Chỉ có Skill',
    enabledAttention: 'Đã bật · Cần chú ý',
    disabled: 'Chưa bật',
    preinstalled: 'Chưa bật · Chỉ khi phát triển',
    disabledAttention: 'Chưa bật · Cần chú ý',
    unknown: 'Không xác định · Cần build lại',
  },
  reasons: {
    partial:
      'Mới bật một phần: các trang mở được nhưng dữ liệu không tải được. Chạy lại lệnh bật để khắc phục.',
    devDependency:
      'Đã bật nhưng không được đưa vào khi triển khai ứng dụng, nên ứng dụng chạy thật sẽ thiếu plugin này. Chạy lại lệnh bật để khắc phục.',
    missingRequires:
      '“{{title}}” cần {{names}}, nhưng plugin đó chưa được bật.',
    other:
      'Chưa được thiết lập đầy đủ trong ứng dụng này. Chạy lại lệnh bật để khắc phục.',
    requiresFirst: 'Cần bật trước: {{names}} (lệnh bật đã bao gồm)',
    unknown:
      'Ứng dụng này được build trước khi quá trình build ghi lại các plugin dòng lệnh đã đăng ký, nên không thể biết plugin này đã bật hay chưa. Hãy chạy lại pnpm build và triển khai lại.',
  },
  actions: {
    commands: 'Lệnh',
    commandsFor: 'Lệnh cho {{title}}',
    enable: 'Cách bật',
    enableFor: 'Cách bật {{title}}',
  },
  commands: {
    title: 'Lệnh cho {{title}}',
    description:
      'Chạy trong thư mục mã của ứng dụng rồi khởi động lại; với ứng dụng chạy thật, hãy build và triển khai lại.',
    fix: 'Khắc phục vấn đề cần chú ý',
    update: 'Cập nhật lên phiên bản mới nhất',
    unregister: 'Tắt plugin; dữ liệu được giữ lại',
    dependents:
      'Các plugin đã bật phụ thuộc vào nó: {{names}}. Hãy tắt chúng cùng lúc.',
    noDependents:
      'Không có plugin đã bật nào phụ thuộc vào nó, nên có thể tắt riêng.',
    optionalDependents:
      'Các plugin đã bật dùng nó như tùy chọn: {{names}}. Chúng vẫn hoạt động khi không có nó nhưng mất các tính năng cần đến nó.',
  },
  enable: {
    title: 'Bật {{title}}',
    description: 'Chạy trong thư mục mã của ứng dụng:',
    requires:
      '{{title}} phụ thuộc vào {{names}}, plugin này cũng chưa bật; lệnh đã bao gồm nó.',
    development:
      'Phát triển cục bộ: khởi động lại pnpm dev sau khi chạy, rồi tải lại trang này để thấy nó đã bật.',
    live: 'Ứng dụng chạy thật: commit thay đổi, chạy pnpm build --tar rồi nâng cấp bằng trình cài đặt.',
    data: 'Lần khởi động đầu tiên sẽ tạo các bảng của nó. Tắt sau này bằng plugin unregister vẫn giữ dữ liệu.',
  },
  dialog: {
    copy: 'Sao chép lệnh',
    copied: 'Đã sao chép',
    copyFailed: 'Không sao chép được; hãy chọn lệnh và sao chép thủ công.',
    close: 'Đã hiểu',
  },
};

export default viVN;
