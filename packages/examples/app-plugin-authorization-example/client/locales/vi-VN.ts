import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  practice: {
    intro:
      'Sử dụng các tài khoản bên dưới thay vì quản trị viên. Quản trị viên bỏ qua các hạn chế. Đây là những bài tập cộng tác bán hàng độc lập, không phải là quy trình phê duyệt báo giá theo đơn đặt hàng hoàn chỉnh. Mỗi bài tập bắt đầu từ trạng thái bản ghi hạt giống.',
    read: {
      title: 'Trợ lý tư vấn thông tin dự án',
      steps:
        'Đăng nhập bằng sales_assistant: Các dự án hiển thị project-1, project-2 và project-3 nhưng không có hành động chỉnh sửa. Báo giá và đơn đặt hàng vẫn bị giới hạn trong dự án thuộc sở hữu.',
      reason:
        'Chia sẻ dự án cấp bản ghi chỉ để xem; nó không cấp phép chỉnh sửa cũng như các hồ sơ liên quan. project-4 bí mật vẫn bị loại trừ.',
    },
    scopes: {
      title: 'Một kỹ sư chuẩn bị và nộp báo giá',
      steps:
        'Đăng nhập bằng sales_engineer: chỉnh sửa và gửi quote-2 của bạn. Bạn có thể tham khảo quote-5 nhưng không thể thay đổi hoặc gửi báo giá của đồng nghiệp. Bạn có thể tiếp tục chuẩn bị quote-6 nhưng không thể gửi nó cho một dự án ngoài khu vực của bạn.',
      reason:
        'Các trích dẫn không bí mật là tài liệu tham khảo nội bộ giữa các khu vực. Người chuẩn bị sở hữu nội dung; trách nhiệm khu vực chi phối sự phục tùng. Việc xem không cho phép chỉnh sửa. Các đơn đặt hàng hiện tại tham chiếu các báo giá được chấp nhận riêng biệt; gửi báo giá thực hành không tạo ra đơn đặt hàng.',
    },
    handover: {
      title: 'Kỹ sư được ủy quyền tiếp nhận báo giá',
      steps:
        'Chủ dự án miền Nam giao quote-7 cho sales_proposal, một kỹ sư đến từ miền Bắc. Đăng nhập bằng sales_proposal, chỉnh sửa báo giá và gửi nó. Với tư cách là quản trị viên, hãy đặt lại bản ghi và xóa sales_proposal khỏi quy tắc chia sẻ chuyển giao báo giá đề xuất. Đăng nhập lại: tài khoản không thể chỉnh sửa hoặc gửi báo giá này nữa.',
      reason:
        'Việc bàn giao cho phép chỉnh sửa và gửi báo giá này cùng với quyền truy cập dự án cần thiết để gửi; không đại diện toàn bộ khu vực miền Nam. Vai trò kỹ sư đảm nhận các hoạt động, trong khi việc chia sẻ sẽ xác định các bản ghi. Là một bài tập nâng cao, hãy rút lại phạm vi dự án hoặc báo giá: việc nộp yêu cầu cả hai.',
    },
    delivery: {
      title: 'Chuyên viên giao hàng thực hiện đơn hàng',
      steps:
        'Đăng nhập bằng sales_delivery. Mở order-2, chỉ định nhà cung cấp dịch vụ, duy trì kiểm tra và nhập tham chiếu giao hàng. Sau khi xác nhận việc giao hàng, cả mối quan hệ và trạng thái giao hàng của nó đều không thể thay đổi được nữa. Đặt lại các bản ghi trước khi lặp lại bài tập.',
      reason:
        'Nhân viên giao hàng chỉ nhập Đơn hàng; liên kết đến các trích dẫn và dự án không cấp quyền truy cập vào các trang đó.',
    },
  },
  reset: {
    action: 'Đặt lại hồ sơ thực hành',
    cancel: 'Hủy',
    confirm:
      'Khôi phục các dự án ban đầu, báo giá và đơn đặt hàng cho mọi tài khoản demo? Những thay đổi đối với những bản ghi đó sẽ bị ghi đè.',
    description:
      'Quản trị viên có thể đặt lại hồ sơ kinh doanh tại đây trước khi lặp lại bài tập. Các cài đặt tài khoản và quyền được giữ nguyên; khôi phục mọi thay đổi ủy quyền theo cách thủ công.',
    done: 'Hồ sơ thực hành được khôi phục. Làm mới mọi danh sách bản ghi đang mở.',
  },
  access: {
    title: 'Vai trò của bạn',
    direct: 'Phân công trực tiếp',
    coverage:
      'Mỗi tài khoản mẫu đảm nhận trách nhiệm công việc của mình thông qua sự phân công trực tiếp.',
  },
  rules: {
    public: 'Loại trừ các dự án bí mật',
    delivery: 'Đơn hàng khu vực giao hàng',
    handover: 'Bàn giao báo giá đề xuất',
    projects: 'Các dự án mẫu được chia sẻ',
  },
  accountMenus: {
    assistant: 'Dự án, báo giá và đơn đặt hàng (chỉ đọc)',
    engineer:
      'Tham khảo các trích dẫn không bảo mật; chỉnh sửa báo giá của riêng mình và gửi trong khu vực được chỉ định',
    manager:
      'Quản lý các dự án thuộc sở hữu; báo giá và đơn đặt hàng chỉ được đọc',
    delivery: 'Chỉ đơn đặt hàng; xác nhận giao hàng khu vực',
    proposal: 'Chỉnh sửa và nộp quote-7 bàn giao',
    coordinator: 'Quản lý project-8, ngoài khu vực nhà',
  },
  relations: {
    access: {
      notGranted: 'Chỉ đọc: phối hợp giao hàng không được cấp.',
      outsideScope:
        'Chỉ đọc: đơn hàng này nằm ngoài phạm vi giao hàng của bạn.',
      notReady: 'Đơn hàng đã giao không thể thay đổi.',
    },
    title: 'Mối quan hệ trật tự',
    description:
      'Chỉ định một nhà cung cấp dịch vụ đang hoạt động, duy trì kiểm tra và quản lý các nhà cung cấp dịch vụ cộng tác. Hãy thử tài khoản giao hàng và tài khoản chỉ đọc để so sánh quyền truy cập.',
    order: 'Đơn hàng',
    carrier: 'Đơn vị vận chuyển',
    unassigned: 'Không được giao',
    assign: 'Chỉ định người vận chuyển',
    disconnect: 'Xóa bài tập',
    checks: 'Kiểm tra giao hàng',
    done: 'Hoàn thành',
    pending: 'Đang chờ',
    toggle: 'Chuyển đổi hoàn thành',
    delete: 'Xóa kiểm tra',
    checkTitle: 'Kiểm tra tiêu đề',
    add: 'Thêm séc',
    collaborators: 'Hợp tác vận chuyển',
    note: 'Ghi chú hợp tác',
    addProposal: 'Thêm nhà mạng đã chọn',
    replace: 'Thay thế bằng nhà cung cấp dịch vụ đã chọn',
    clear: 'Xóa tất cả cộng tác viên',
    unavailable: 'Những mối quan hệ này không thể truy cập được.',
    loading: 'Đang tải mối quan hệ…',
  },
  sales: {
    manageRelations: 'Sắp xếp giao hàng',
    saveFirst: 'Lưu các thay đổi trước khi gửi.',
    states: {
      draft: 'Bản nháp',
      submitted: 'Đã gửi',
      accepted: 'Đã chấp nhận',
      ready: 'Sẵn sàng',
      delivered: 'Đã giao hàng',
    },
    errors: {
      session: 'Phiên đã hết hạn. Đăng nhập lại.',
      input: 'Kiểm tra số lượng và các trường bắt buộc.',
      conflict:
        'Trạng thái bản ghi đã thay đổi. Hãy làm mới trước khi thử lại.',
      request:
        'Yêu cầu không thành công. Hãy kiểm tra kết nối của bạn và thử lại.',
    },
    operation: {
      outsideScope: 'Ngoài phạm vi hoạt động được phép',
      notReady: 'Chỉ những đơn hàng đã sẵn sàng mới có thể được giao',
      allowed: 'Trong phạm vi gửi',
      notGranted: 'Chỉ đọc - thao tác không được cấp',
      quoteScope: 'Ngoài phạm vi báo giá được phép',
      projectScope: 'Dự án nằm ngoài phạm vi cho phép',
      notDraft: 'Chỉ có thể gửi bản nháp',
      invalidAmount: 'Số tiền phải dương',
    },
    preparedBy: 'Được chuẩn bị bởi',
    parentProject: 'Dự án',
    sourceQuote: 'Nguồn trích dẫn',
    relationships: 'Hồ sơ liên quan',
    relatedQuotes: 'Báo giá dự án',
    relatedOrders: 'Đơn đặt hàng dự án',
    filtered: 'Lọc bởi',
    clearFilter: 'Xóa bộ lọc',
    noPageAccess: 'Không có quyền truy cập trang',
    descriptions: {
      projects:
        'Mở báo giá và đơn đặt hàng liên quan từ một dự án. Danh sách liên quan chỉ hiển thị các bản ghi mà tài khoản này có thể truy cập.',
      quotes:
        'Một dự án có thể có nhiều trích dẫn. Việc gửi sẽ kiểm tra phạm vi dự án và người chuẩn bị báo giá một cách độc lập, sau đó xác nhận trạng thái và số tiền dự thảo.',
      orders:
        'Mỗi đơn hàng đều tham chiếu đến báo giá nguồn và dự án của nó. Tài khoản giao hàng chỉ nhập Đơn hàng; tài liệu tham khảo không cấp quyền truy cập vào các trang hoặc hồ sơ khác.',
    },
    delivery: 'Giao hàng',
    orders: 'Đơn hàng',
    editProject: 'Chỉnh sửa thông tin dự án',
    editQuote: 'Chỉnh sửa giá',
    submit: 'Gửi báo giá',
    submitScopes: {
      projects: 'Các dự án được liên kết với báo giá',
      quotes: 'Trích dẫn được phép gửi',
    },
    deliver: 'Xác nhận giao hàng',
    amount: 'Số tiền',
    status: 'Trạng thái',
    deliveryReference: 'Tham khảo giao hàng',
    group: 'Hợp tác bán hàng',
    title: 'Ví dụ về quyền bán hàng',
    projects: 'Dự án',
    quotes: 'Báo giá',
    view: 'Xem',
    edit: 'Chỉnh sửa ghi chú',
    intro:
      'Khám phá ranh giới truy cập của trợ lý hồ sơ tư vấn, kỹ sư chuẩn bị báo giá, bàn giao báo giá được ủy quyền và nhân viên giao hàng thực hiện đơn hàng.',
    record: 'Bản ghi',
    notes: 'Ghi chú',
    save: 'Lưu',
    refresh: 'Làm mới',
    loading: 'Đang tải…',
    empty: 'Không có bản ghi nào có thể truy cập được',
    readOnly: 'Chỉ đọc',
    saved: 'Đã lưu',
    scope: {
      prepared: 'Trích dẫn do tôi chuẩn bị',
      title: 'Phạm vi dữ liệu bán hàng',
      unrestricted: 'Không hạn chế',
      region: 'Vùng của tôi',
      own: 'Dự án mẹ thuộc quyền sở hữu của tôi',
      public: 'Những dự án không bí mật',
    },
  },
  title: 'Ví dụ về quyền bán hàng',
  overview: 'Hướng dẫn',
  actions: 'Thao tác',
  testAccounts: 'Tài khoản mẫu',
  account: 'Tài khoản',
  permissionSet: 'Đã đặt quyền',
  password: 'Mật khẩu mẫu: AuthzExample123!',
  tryTitle: 'Cấu hình và xác minh',
  roles: {
    assistant: 'Trợ lý bán hàng',
    engineer: 'Kỹ sư bán hàng',
    manager: 'Quản lý dự án',
    delivery: 'Chuyên gia giao hàng',
  },
  forbidden: 'Bạn không có quyền thực hiện thao tác này.',
  error: 'Không tải được. Vui lòng thử lại.',
};

export default viVN;
