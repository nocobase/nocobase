import type { MailPagesResource } from './pages.en-US.js';

const pagesViVN: MailPagesResource = {
  navigation: {
    mail: 'Thư',
    mailTeam: 'Thư nhóm',
    mailAccounts: 'Tài khoản thư',
    mailAccountsDescription:
      'Kết nối hộp thư của bạn và quản lý chữ ký, mẫu và nhãn.',
    mailSettings: 'Thư',
    mailSettingsDescription:
      'Nhà cung cấp thư, trạng thái của từng tài khoản, nhật ký đồng bộ và nhật ký gửi.',
  },
  access: {
    section: 'Thư',
    team: {
      title: 'Thư nhóm',
      description: 'Thư đã đồng bộ của các thành viên, chỉ đọc.',
      actions: {
        view: 'Xem',
        process: 'Xử lý (đánh dấu đã đọc, gắn sao, lưu trữ)',
      },
    },
    settings: {
      title: 'Thư',
      actions: {
        read: 'Xem',
        manage: 'Quản lý (thử lại và hủy đồng bộ, gửi thư của thành viên)',
      },
    },
  },
  pages: {
    loading: 'Đang tải…',
    empty: 'Không có gì để hiển thị.',
    member: 'Thành viên',
    allMembers: 'Tất cả thành viên',
    workspace: {
      reauthorizationNotice:
        '{{addresses}} cần được kết nối lại: cho đến lúc đó sẽ không đồng bộ hay gửi thư.',
      reauthorize: 'Kết nối lại trong Tài khoản thư',
      needsReauthorization: 'cần ủy quyền lại',
    },
    accounts: {
      title: 'Tài khoản thư',
      description:
        'Kết nối hộp thư để gửi và nhận trong Thư. Chỉ bạn mới xem được thư của mình; những người có quyền truy cập Thư nhóm có thể đọc nhưng không thể thay đổi.',
      reauthorizationNotice:
        'Ủy quyền của {{addresses}} không còn được chấp nhận: sẽ không đồng bộ hay gửi thư cho đến khi bạn kết nối lại với cùng nhà cung cấp.',
      reauthorize: 'Kết nối lại',
      tabs: {
        accounts: 'Tài khoản',
        signatures: 'Chữ ký',
        templates: 'Mẫu',
        labels: 'Nhãn',
        activity: 'Hoạt động',
      },
    },
    activity: {
      sends: 'Lượt gửi',
      syncs: 'Lượt đồng bộ',
    },
    logs: {
      started: 'Bắt đầu',
      time: 'Thời gian',
      account: 'Tài khoản',
      accountMember: 'Tài khoản · thành viên',
      mode: 'Chế độ',
      initial: 'Đồng bộ lần đầu',
      incremental: 'Gia tăng',
      result: 'Kết quả',
      allResults: 'Tất cả kết quả',
      detail: 'Chi tiết',
      reason: 'Lý do',
      processed: '{{count}} thư',
      subject: 'Chủ đề',
      recipients: 'Người nhận',
      recipientCount: 'Người nhận',
      bulk: 'Gửi hàng loạt',
      bulkCount: '{{count}} (hàng loạt)',
      showRecipients: 'Hiện người nhận',
      hideRecipients: 'Ẩn người nhận',
      scheduled: 'Đã lên lịch',
      retry: 'Thử lại',
      cancel: 'Hủy',
      window: 'Thời gian',
      windows: {
        day: '24 giờ qua',
        week: '7 ngày qua',
        month: '30 ngày qua',
        all: 'Mọi thời gian',
      },
    },
    team: {
      title: 'Thư nhóm',
      description:
        'Đọc thư mà các thành viên đã đồng bộ, phục vụ bàn giao công việc và kiểm tra tuân thủ. Mở thư không đánh dấu thư là đã đọc và bạn không thể trả lời.',
      account: 'Tài khoản',
      allAccounts: 'Tất cả tài khoản',
      participant: 'Địa chỉ hoặc @tên miền',
      keyword: 'Từ khóa chủ đề',
      memberAccount: 'Thành viên · tài khoản',
      counterpart: 'Với',
      view: 'Xem',
      selectAll: 'Chọn tất cả trên trang này',
      empty: 'Không có thư đã đồng bộ nào phù hợp.',
      readOnly: 'Chỉ đọc. Mở thư không đánh dấu là đã đọc.',
      applied: 'Đã cập nhật {{succeeded}}, {{failed}} thất bại.',
      actions: {
        markRead: 'Đánh dấu đã đọc',
        star: 'Gắn sao',
        archive: 'Lưu trữ',
      },
    },
    settings: {
      title: 'Thư',
      description:
        'Các nhà cung cấp thư mà thành viên có thể kết nối, cùng trạng thái kết nối, đồng bộ và gửi thư của từng tài khoản. Không hiển thị nội dung thư nào ở đây. Email thông báo hệ thống được cấu hình trong Thông báo.',
      tabs: {
        providers: 'Nhà cung cấp',
        accounts: 'Tài khoản',
        syncRuns: 'Nhật ký đồng bộ',
        submissions: 'Nhật ký gửi',
        runtime: 'Cấu hình thời gian chạy',
      },
      sources: {
        environment: 'Biến môi trường',
        config: 'config.yml',
        default: 'Mặc định',
        code: 'Mã',
        unknown: 'Không rõ',
      },
      providers: {
        name: 'Tên',
        type: 'Loại',
        capabilities: 'Khả năng',
        accounts: 'Tài khoản',
        source: 'Nguồn',
        attention: '{{count}} cần ủy quyền lại',
        howTo: 'Cách thêm nhà cung cấp',
        howToDescription:
          'Thêm một mục trong mail.providers của cấu hình ứng dụng và lưu các bí mật trong biến môi trường. Khởi động lại ứng dụng để áp dụng.',
        callbackHint:
          'Đăng ký URL chuyển hướng OAuth này với Google hoặc Microsoft:',
      },
      accounts: {
        filter: {
          all: 'Tất cả',
          attention: 'Cần ủy quyền lại',
          suspended: 'Đã vô hiệu hóa',
        },
        provider: 'Nhà cung cấp',
        allProviders: 'Tất cả nhà cung cấp',
        search: 'Thành viên hoặc địa chỉ',
        lastSynced: 'Đồng bộ lần cuối',
        status: 'Trạng thái',
        showRuns: 'Lượt đồng bộ',
        note: 'Quản trị viên không thể ủy quyền hoặc xóa tài khoản của thành viên. Thành viên tự kết nối lại tài khoản của mình trong Cài đặt cá nhân › Tài khoản thư.',
      },
      runtime: {
        setting: 'Cài đặt',
        value: 'Giá trị hiện tại',
        effect: 'Ảnh hưởng',
        automaticSyncInterval: 'Khoảng thời gian đồng bộ tự động',
        automaticSyncIntervalEffect:
          'Tần suất kiểm tra thư mới đối với các tài khoản không có thông báo đẩy.',
        syncBatchSize: 'Số thư mỗi lô đồng bộ',
        syncBatchSizeEffect:
          'Lô lớn hơn giúp hoàn tất đồng bộ lần đầu nhanh hơn nhưng dễ chạm giới hạn tốc độ của nhà cung cấp hơn.',
        oauthCallbackUrl: 'URL chuyển hướng OAuth',
        oauthCallbackUrlEffect:
          'Đăng ký URL này trong bảng điều khiển dành cho nhà phát triển của Google hoặc Microsoft.',
        oauthReturnUrl: 'Trang sau khi ủy quyền',
        oauthReturnUrlEffect:
          'Nơi người dùng quay lại sau khi kết nối tài khoản OAuth.',
        pushWebhook: 'Webhook đẩy',
        pushWebhookEffect:
          'Nếu không có, Gmail và Microsoft 365 cũng được kiểm tra theo khoảng thời gian đồng bộ.',
        jobs: 'Tác vụ nền',
        jobsEffect: 'Triển khai nhiều phiên bản cần một hàng đợi dùng chung.',
        logRetention: 'Lưu giữ nhật ký',
        logRetentionEffect:
          'Các lượt đồng bộ và lượt gửi đã kết thúc cũ hơn thời hạn này sẽ tự động bị xóa.',
        credentialVault: 'Lưu trữ thông tin xác thực',
        credentialVaultEffect:
          'Nơi lưu token OAuth và mật khẩu của các tài khoản đã kết nối.',
        minutes: '{{count}} phút',
        days: '{{count}} ngày',
        keepForever: 'Giữ vĩnh viễn',
        notConfigured: 'Chưa cấu hình',
        secretConfigured: 'Đã cấu hình bí mật',
        secretMissing: 'Chưa cấu hình bí mật',
        jobsDefault: 'Theo jobs.default',
        vaultBuiltin: 'Tích hợp sẵn, trong cơ sở dữ liệu của ứng dụng',
        vaultApplication: 'Do ứng dụng đăng ký',
        copy: 'Sao chép',
        copied: 'Đã sao chép',
        readOnly:
          'Chỉ đọc: các cài đặt này lấy từ config.yml và các biến môi trường MAIL_*, có hiệu lực sau khi khởi động lại.',
      },
    },
  },
};

export default pagesViVN;
