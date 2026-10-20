import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  navigation: {
    parameters: 'Thông số thời gian chạy',
    group: 'Quy trình',
    tickets: 'Bàn trợ giúp',
    expenses: 'Báo cáo chi phí',
    invoices: 'Hóa đơn điện tử',
    orders: 'Thanh toán đơn hàng',
    exports: 'Xuất dữ liệu',
    purchases: 'Khuyến mại chớp nhoáng',
    fulfilments: 'Vận chuyển',
    subscriptions: 'Đăng ký',
  },
  parameters: {
    fields: {
      paymentWindowMinutes: {
        title: 'Thời gian chờ thanh toán (phút)',
        description:
          'Hủy đơn hàng chưa thanh toán sau thời gian chờ đợi này. Những thay đổi áp dụng cho bộ tính giờ thanh toán mới được lên lịch; bộ tính giờ hiện có giữ thời gian đến hạn của họ.',
      },
      escalateAfterMinutes: {
        title: 'Thời gian chờ xem xét của người quản lý (phút)',
        description:
          'Gửi yêu cầu xem xét của người quản lý đang chờ xử lý sau thời gian chờ đợi này. Những thay đổi áp dụng cho bộ tính giờ đánh giá mới được lên lịch; bộ tính giờ hiện có giữ thời gian đến hạn của họ.',
      },
      waitMinutes: {
        title: 'Thời gian chờ trả lời của khách hàng (phút)',
        description:
          'Đóng yêu cầu nếu khách hàng không trả lời trong thời gian chờ này. Các thay đổi áp dụng cho bộ hẹn giờ mới được lên lịch; bộ tính giờ hiện có giữ thời gian đến hạn của họ.',
      },
      querySeconds: {
        title: 'Độ trễ truy vấn trạng thái hóa đơn (giây)',
        description:
          'Truy vấn nhà cung cấp hóa đơn nếu không có cuộc gọi lại nào đến trong thời gian chờ đợi này. Các thay đổi áp dụng cho các truy vấn mới được lên lịch; các truy vấn hiện tại giữ nguyên thời gian đến hạn của chúng.',
      },
      pollSeconds: {
        title: 'Khoảng thời gian kiểm tra tiến trình xuất (giây)',
        description:
          'Hãy đợi thật lâu trước khi kiểm tra quá trình xuất đang diễn ra. Những thay đổi áp dụng cho các lần kiểm tra mới được lên lịch; séc hiện có giữ đúng thời hạn.',
      },
      maxMinutes: {
        title: 'Thời gian chờ hoàn thành xuất (phút)',
        description:
          'Đặt thời hạn hoàn thành khi công việc xuất bắt đầu. Một công việc chưa hoàn thành sẽ hết hạn vào thời hạn đó. Những thay đổi không làm thay đổi thời hạn công việc hiện tại.',
      },
      periodMinutes: {
        title: 'Thời gian gia hạn đăng ký (phút)',
        description:
          'Sử dụng khoảng thời gian này để tính toán thời gian kết thúc mới sau khi tính phí thành công. Các thay đổi sẽ được áp dụng sau lần tính phí thành công tiếp theo; thời điểm kết thúc hiện tại vẫn cố định.',
      },
      dunningMinutes: {
        title:
          'Khoảng thời gian thử lại thanh toán gia hạn không thành công (phút)',
        description:
          'Hãy đợi thật lâu trước khi thử lại khoản thanh toán gia hạn không thành công. Những thay đổi áp dụng cho những lần thử lại mới được lên lịch; các lần thử lại hiện tại vẫn giữ nguyên thời gian đến hạn của chúng.',
      },
      maxDunning: {
        title: 'Giới hạn lỗi thanh toán gia hạn',
        description:
          'Hủy đăng ký ở lần thử lại tự động tiếp theo nếu số lần thanh toán không thành công đã đạt đến giới hạn này. Những thay đổi được áp dụng ở quyết định thử lại tiếp theo.',
      },
      reopenDays: {
        title: 'Thời hạn mở lại vé (ngày)',
        description:
          'Cho phép mở lại trong vòng nhiều ngày sau khi vé đóng; nếu không thì phải có một vé mới. Mỗi yêu cầu mở lại đều sử dụng cài đặt mới nhất.',
      },
    },
    loading: 'Đang tải tham số…',
    title: 'Thông số thời gian chạy',
    description:
      'Chỉ thay đổi các giá trị được khai báo bằng mã. Cấu trúc quy trình làm việc, các quyết định và thời gian chờ vẫn nằm trong mã.',
    ruleExplanation:
      'Tất cả các điều kiện trong một nhóm phải phù hợp. Các nhóm riêng biệt được thêm vào với nhau. Đặt người dùng thay thế vào các nhóm riêng biệt.',
    allConditions: 'Phù hợp với tất cả các điều kiện này',
    alsoInclude: 'Cũng bao gồm',
    selectionType: 'Kiểu lựa chọn',
    searchReference: 'Tìm kiếm theo tên',
    noMatches: 'Không có tài liệu tham khảo phù hợp',
    previousPage: 'Trang trước',
    nextPage: 'Trang tiếp theo',
    reference: 'Tài liệu tham khảo',
    remove: 'Loại bỏ',
    addCondition: 'Thêm điều kiện',
    addGroup: 'Ngoài ra còn bao gồm một nhóm khác',
    revision: 'Bản sửa đổi {{revision}}',
    codeDefaults: 'Mã mặc định',
    databaseVersion: 'Đã lưu cấu hình',
    snapshotEffect:
      'Ảnh chụp nhanh: đã sửa ở lần gửi đầu tiên; được giữ lại sau khi trả lại hoặc rút tiền',
    liveEffect:
      'Các lần đọc tham số trong tương lai sử dụng cấu hình mới nhất; bộ tính giờ và thời hạn hiện tại vẫn cố định.',
    yes: 'Có',
    no: 'Không',
    invalidObject: 'Nhập đối tượng JSON hợp lệ.',
    saved: 'Đã lưu cấu hình.',
    conflict:
      'Bản sửa đổi đã thay đổi. Dữ liệu đầu vào của bạn đã được bảo toàn; xem lại các giá trị hiện tại trước khi thử lại.',
    currentRevision: 'Bản sửa đổi đã lưu hiện tại: {{revision}}',
    keepDraft: 'Giữ thông tin đầu vào của tôi và sử dụng bản sửa đổi này',
    save: 'Lưu giá trị',
    readOnly:
      'Bạn có thể đọc những giá trị này nhưng không thể thay đổi chúng.',
    preview: 'Xem trước ứng cử viên cho Lin',
    candidates: 'Ứng viên',
    noCandidates:
      'Không có ứng cử viên đủ tư cách; việc nộp hồ sơ sẽ bị từ chối.',
    editCurrent: 'Chỉnh sửa cấu hình hiện tại',
    historyBoundary:
      'Điều này chỉnh sửa cấu hình hiện tại. Sự thật lịch sử và các ứng cử viên được chỉ định hiện tại không thay đổi.',
    history: 'Sử dụng tham số thực tế',
    effectivePreview: 'Giá trị hiệu dụng cho bản ghi này hiện nay',
    firstSnapshot: 'Ảnh chụp nhanh lần gửi đầu tiên',
    notRecorded: 'Không được ghi lại',
    diagramEntry: 'Mục sơ đồ tùy chọn',
    diagramHint:
      'Nhấp vào nút bị ràng buộc hoặc quá trình chuyển đổi để mở trình chỉnh sửa được chia sẻ. Các mục không bị ràng buộc hiển thị chi tiết ban đầu của chúng. Việc nhấp vào không bao giờ thực hiện quá trình chuyển đổi.',
    workflow: 'Quy trình',
    types: {
      department: 'Sở',
      role: 'Vai trò',
      user: 'Người',
    },
  },
  invoices: {
    title: 'Hóa đơn điện tử',
    list: 'Hóa đơn',
    new: 'Hóa đơn mới',
    empty: 'Ở đây không có hóa đơn.',
    pick: 'Chọn một hóa đơn để theo dõi vấn đề của nó.',
    description:
      'Lập hóa đơn cho đơn hàng sandbox đã hoàn thành. Đợi webhook nền tảng; truy vấn sau {{seconds}} giây mà không có. Việc gửi bài được thử tối đa 3 lần.',
    shows:
      'Việc gửi, gọi lại, truy vấn hết thời gian chờ và thử lại đều có chung một yêu cầu của nhà cung cấp. Thông báo lặp lại sẽ được áp dụng một lần và các lần thử lại sẽ không bao giờ xuất hóa đơn thứ hai.',
    orderSummary: 'Đơn hàng #{{order}} · {{amount}}',
    fields: {
      order: 'Đơn hàng đã hoàn thành',
      customer: 'Khách hàng',
      amount: 'Số tiền',
      taxNumber: 'Mã số thuế',
      request: 'Yêu cầu của nhà cung cấp',
      number: 'Số hóa đơn',
      queries: 'Truy vấn',
    },
    actions: {
      submit: 'Yêu cầu hóa đơn',
      retryInvoice: 'Thử lại hóa đơn',
    },
    form: {
      title: 'Yêu cầu hóa đơn điện tử',
      ordersHint:
        'Chọn một lệnh trình diễn đã hoàn thành. Mỗi đơn hàng chỉ có thể có một hóa đơn.',
      order: 'Đơn hàng #{{order}} · {{customer}} · {{amount}} · Đã hoàn thành',
      invoiceTitle: 'Tiêu đề hóa đơn',
      failSubmissions: 'Bài gửi không cố ý',
      failHint:
        'Đặt 1 hoặc 2 để xem số lần thử lại tự động; 3 điểm dừng ở vấn đề không thành công. Thử lại hóa đơn sau đó phục hồi.',
      submit: 'Tạo',
    },
    banner: {
      draft: 'Chưa được yêu cầu.',
      submitting: 'Gửi yêu cầu; thất bại được thử lại…',
      awaiting: 'Đang chờ webhook nền tảng; truy vấn trong {{time}}.',
      querying: 'Truy vấn nền tảng lập hoá đơn…',
      issued: 'Xuất hóa đơn. Bản PDF trình diễn đã sẵn sàng.',
      failed: 'Sự cố không thành công: {{error}} Bạn có thể thử lại hóa đơn.',
    },
    outside: {
      title: 'Nền tảng lập hoá đơn (sandbox)',
      description:
        'Mô phỏng nền tảng bên ngoài hoàn thành yêu cầu và gửi webhook của nó. Không có hệ thống thuế thực sự được kết nối.',
      result: 'Kết quả nền tảng',
      hint: 'Giữ webhook và phát hành thành công: hóa đơn vẫn chờ, sau đó truy vấn kết quả sau 30 giây. Việc cung cấp sự kiện cũ sau đó không thể phát hành lại.',
      issue: 'Phát hành thành công',
      fail: 'Từ chối hóa đơn',
      download: 'Tải xuống bản PDF mẫu',
      pdfHint:
        'Tệp cho biết HÓA ĐƠN SANDBOX và không phải là hóa đơn thuế hợp lệ.',
    },
  },
  identity: {
    label: 'Đăng nhập bằng',
  },
  roles: {
    agent: 'Đại lý hỗ trợ',
    customer: 'Khách hàng',
    applicant: 'Nhân viên',
    manager: 'Người quản lý',
    director: 'Giám đốc điều hành',
    finance: 'Tài chính',
  },
  common: {
    signedInUser: 'Người dùng đã đăng nhập',
    system: 'Hệ thống',
    unassigned: 'Chưa được giao',
    loading: 'Đang tải…',
    cancel: 'Hủy',
    close: 'Đóng',
    demoOptions: 'Tùy chọn demo',
  },
  tickets: {
    title: 'Bàn trợ giúp',
    agentDescription:
      'Nhận ticket mới, trả lời khách hàng và giải quyết. Một yêu cầu đang chờ khách hàng sẽ tự đóng lại khi họ giữ im lặng và một phản hồi của khách hàng sẽ mang nó trở lại cho người được giao.',
    customerDescription:
      'Hãy yêu cầu nhóm hỗ trợ trợ giúp và theo dõi cuộc trò chuyện. Một vé đã đóng có thể được mở lại trong những ngày {{days}}.',
    queue: 'Xếp hàng mua vé',
    mine: 'Vé của tôi',
    newTicket: 'Vé mới',
    empty: 'Ở đây không có vé.',
    pick: 'Chọn một vé để đọc đoạn hội thoại.',
    filters: {
      all: 'Tất cả',
      new: 'Mới',
      open: 'Mở',
      awaitingCustomer: 'Chờ đợi',
      closed: 'Đã đóng',
    },
    form: {
      title: 'Liên hệ hỗ trợ',
      subject: 'Chủ đề',
      subjectPlaceholder: 'Tóm tắt vấn đề trong một câu',
      category: 'Thể loại',
      priority: 'Ưu tiên',
      description: 'Mô tả',
      descriptionPlaceholder:
        'Điều gì đã xảy ra, điều bạn mong đợi và các bước để tái tạo nó',
      failNotifications: 'Việc gửi email không cố ý',
      failHint:
        'Mỗi câu trả lời cho vé này sẽ gửi email cho bạn. Hãy thử lần đầu tiên không thành công để xem hiệu ứng thử lại.',
      submit: 'Gửi vé',
    },
    categories: {
      account: 'Tài khoản và đăng nhập',
      billing: 'Thanh toán',
      howto: 'Làm sao tôi…',
      incident: 'Có gì đó bị hỏng',
    },
    priorities: {
      low: 'Thấp',
      normal: 'Bình thường',
      high: 'Cao',
      urgent: 'Khẩn cấp',
    },
    meta: {
      customer: 'Khách hàng',
      category: 'Thể loại',
      priority: 'Ưu tiên',
      assignee: 'Người được giao',
      created: 'Đã tạo',
    },
    banner: {
      new: 'Đang chờ đại lý đến nhận.',
      open: '{{assignee}} đang nghiên cứu nó.',
      awaiting:
        'Đang chờ khách hàng. Tự động đóng trong {{time}} mà không có phản hồi.',
      overdue: 'Sự chờ đợi đã kết thúc; lần quét tiếp theo sẽ đóng nó lại.',
      resolved: 'Đã giải quyết bằng sự hỗ trợ.',
      timeout: 'Tự động đóng: khách hàng không phản hồi kịp thời.',
      reopenUntil: 'Bạn có thể mở lại nó cho đến {{date}}.',
      reopenExpired: 'Nó không thể mở lại được nữa; vui lòng mở một vé mới.',
    },
    thread: {
      wrote: '{{name}} · {{time}}',
      accept: '{{actor}} đã lấy vé',
      resolve: '{{actor}} đã đánh dấu nó đã được giải quyết',
      autoClose: 'Tự động đóng sau khi chờ {{minutes}} phút',
      reopen: '{{actor}} đã mở lại vé',
      delivery: {
        queued: 'Hàng đợi gửi email cho khách hàng',
        running: 'Đang gửi email cho khách hàng…',
        succeeded: 'Đã gửi qua email cho khách hàng',
        failed: 'Email không thành công sau khi thử {{attempts}}: {{error}}',
        retrying:
          'Nỗ lực gửi email {{attempts}} không thành công, đang thử lại: {{error}}',
      },
    },
    composer: {
      agentPlaceholder: 'Trả lời khách hàng…',
      customerPlaceholder: 'Thêm một câu trả lời…',
      reopenPlaceholder: 'Hãy cho chúng tôi biết còn vấn đề gì nữa…',
      reply: 'Gửi trả lời',
      accept: 'Lấy vé',
      resolve: 'Mark giải quyết',
      customerReply: 'Gửi',
      reopen: 'Mở lại',
      nothing: 'Hiện tại bạn không thể làm gì với tấm vé này.',
    },
  },
  expenses: {
    title: 'Báo cáo chi phí',
    applicantDescription:
      'Yêu cầu chi phí kinh doanh. Lên đến {{auto}} được phê duyệt tự động; ở trên mà người quản lý của bạn phê duyệt và trên {{finance}} thì giám đốc tài chính cũng vậy.',
    approverDescription:
      'Các báo cáo đang chờ bạn phê duyệt. Báo cáo bạn để lại trong số phút {{minutes}} sẽ được chuyển đến người quản lý của chính bạn.',
    finalApproverDescription: 'Các báo cáo đang chờ bạn phê duyệt.',
    mine: 'Báo cáo của tôi',
    approvals: 'Chờ em',
    newReport: 'Báo cáo mới',
    empty: 'Không có báo cáo nào ở đây.',
    emptyApprovals: 'Không có gì đang chờ đợi sự chấp thuận của bạn.',
    pick: 'Chọn một báo cáo để xem nó.',
    number: 'Báo cáo {{id}}',
    editor: {
      title: 'Mục đích',
      titlePlaceholder: 'Ví dụ: Triển lãm thương mại Thượng Hải, tháng 10',
      purpose: 'Chi tiết',
      purposePlaceholder:
        'Ai đã đi, tại sao và bất cứ điều gì người phê duyệt nên biết',
      items: 'Chi phí',
      date: 'Ngày tháng',
      category: 'Thể loại',
      description: 'Mô tả',
      amount: 'Số tiền (¥)',
      addItem: 'Thêm chi phí',
      removeItem: 'Loại bỏ',
      total: 'Tổng cộng',
      failPayments: 'Các nỗ lực thanh toán không cố ý',
      failHint:
        'Một báo cáo được phê duyệt sẽ được thanh toán theo hiệu lực. Hãy thử lần đầu tiên thất bại để xem nó thử lại.',
      save: 'Lưu bản nháp',
      saved: 'Đã lưu.',
      submit: 'Gửi để phê duyệt',
      resubmit: 'Gửi lại',
    },
    categories: {
      transport: 'Vận tải',
      lodging: 'Chỗ ở',
      meals: 'Bữa ăn',
      office: 'Vật tư văn phòng',
      entertainment: 'Giải trí cho khách hàng',
      other: 'Khác',
    },
    steps: {
      submit: 'Đã gửi',
      manager: 'Người quản lý',
      finance: 'Tài chính',
      payment: 'Đã trả tiền',
    },
    meta: {
      applicant: 'Người nộp đơn',
      approver: 'Chờ đợi',
      created: 'Đã tạo',
      paymentRef: 'Tham chiếu thanh toán',
      total: 'Tổng cộng',
    },
    banner: {
      draft:
        'Bản nháp. Chỉ bạn mới có thể nhìn thấy nó cho đến khi bạn gửi nó.',
      awaiting:
        'Đang chờ {{approver}}. Chuyển cho người quản lý của họ trong {{time}} mà không có quyết định.',
      awaitingFinal: 'Đang chờ {{approver}}.',
      overdue: 'Sự chờ đợi đã kết thúc; lần quét tiếp theo sẽ tiếp tục.',
      needsInfo: '{{actor}} đã gửi lại: {{reason}}',
      rejected: '{{actor}} đã từ chối nó: {{reason}}',
      approved: 'Đã được phê duyệt. Thanh toán đang được tiến hành.',
      paymentRetrying:
        'Nỗ lực thanh toán {{attempts}} không thành công, đang thử lại: {{error}}',
      paymentFailed:
        'Thanh toán không thành công sau khi thử {{attempts}}: {{error}}. Tài chính sẽ theo sau.',
      paid: 'Đã trả tiền. Tham khảo {{ref}}.',
    },
    timeline: {
      title: 'Lịch sử phê duyệt',
      empty: 'Chưa gửi.',
      autoApproved: 'Trong {{limit}}: được phê duyệt tự động',
      escalated:
        'Không có quyết định kịp thời; được chuyển cho người quản lý tiếp theo',
      paid: 'Thanh toán hoàn tất',
    },
    decision: {
      title: 'Quyết định của bạn',
      placeholder: 'Bình luận (bắt buộc phải gửi lại hoặc từ chối)',
      approve: 'Phê duyệt',
      requestInfo: 'Gửi lại',
      reject: 'Từ chối',
    },
    withdraw: 'Rút lại',
  },
  flowDiagram: {
    overview: 'Tổng quan về sơ đồ',
    actualSize: 'Kích thước thực tế',
    states: 'Kỳ',
    transitions: 'Chuyển tiếp',
    configurable: 'Thông số',
    current: 'Hiện tại',
    visited: 'Đã ghé thăm',
    initial: 'Ban đầu',
    final: 'Cuối cùng',
    state: 'Trạng thái',
    zoomOut: 'Thu nhỏ',
    zoomIn: 'Phóng to',
    fit: 'Phù hợp để xem',
    empty: 'Không có trạng thái nào để hiển thị.',
    loading: 'Lập sơ đồ…',
    failed: 'Không thể bố trí sơ đồ này.',
    nodeHelp: 'Nhấn Enter hoặc Space để chọn trạng thái.',
    edgeHelp: 'Nhấn Enter hoặc Space để chọn chuyển tiếp.',
  },
  diagramStatus: {
    traversed: 'Đi ngang qua',
    end: 'Kết thúc',
    current: 'Hiện tại',
    visited: 'Đã ghé thăm',
    available: 'Có sẵn',
    pending: 'Không đi qua',
  },
  flows: {
    customer: 'Khách hàng',
    final: 'Cái này đã xong; không có gì lay chuyển nó nữa.',
    process: 'Quy trình',
    legend:
      'Trạng thái hiện tại có mức lấp đầy mạnh hơn; các trạng thái đã truy cập và các chuyển tiếp di chuyển ngang thực tế có chung một màu nhấn. Chú giải xác định các phần chuyển tiếp có sẵn và các phần không được duyệt qua. Các trạng thái ban đầu có đường viền hình viên thuốc, trạng thái cuối cùng có đường viền kép. Chọn một trạng thái hoặc quá trình chuyển đổi để biết chi tiết. ⚙ chỉ dành cho máy chủ, ⏱ kích hoạt, ✓/✗ tiếp tục hiệu ứng.',
    nothing: 'Hiện tại ở đây không có gì để bạn làm; nó đang đợi ở bên ngoài.',
  },
  webhooks: {
    title: 'Webhook',
    hint: 'Hộp cát đã gửi, giữ hoặc phân phối những gì và cách mỗi lần phân phối được trả lời. Phân phối lại một lần nữa để xem bản phát lại hoặc giữ các bản phát lại theo thứ tự khác.',
    empty: 'Chưa có webhook nào.',
    hold: 'Giữ webhook',
    deliver: 'Giao hàng',
    deliverAgain: 'Giao hàng lần nữa',
    deliveries_one: 'đã phân phối thời gian {{count}}',
    deliveries_other: 'đã phân phối {{count}} lần',
    occurred: 'Đã xảy ra {{time}}',
    outcomes: {
      applied: 'Đã áp dụng',
      replayed: 'Đã phát lại',
      ignored: 'Bỏ qua',
      retry: 'Sẽ thử lại',
      held: 'Tổ chức',
    },
  },
  orders: {
    title: 'Thanh toán đơn hàng',
    list: 'Đơn hàng',
    new: 'Trật tự mới',
    empty: 'Không có đơn đặt hàng nào ở đây.',
    pick: 'Chọn một đơn hàng để xem khoản thanh toán của nó ở đâu.',
    shows:
      'Khoản thanh toán được xác nhận bởi webhook của nhà cung cấp chứ không phải bởi trang: đơn đặt hàng chờ dưới dạng trạng thái và webhook — dù đến muộn, sớm hay thường xuyên — sẽ chuyển nó vào đúng một lần. Khoản thanh toán đến sau khi đơn hàng bị hủy sẽ được hoàn lại.',
    description:
      'Khách hàng thanh toán trên trang thanh toán được lưu trữ trên máy chủ của nhà cung cấp dịch vụ thanh toán; đơn hàng sẽ tiếp tục khi webhook của nhà cung cấp đến. Một đơn hàng chưa thanh toán sẽ đóng sau vài phút {{minutes}}.',
    nothing:
      'Bạn không cần phải làm gì: đơn hàng đang chờ nhà cung cấp dịch vụ thanh toán.',
    actions: {
      checkout: 'Trả tiền',
      cancel: 'Hủy đơn hàng',
      ship: 'Tàu',
      refundOrder: 'Hoàn tiền',
      retryRefund: 'Thử lại hoàn tiền',
    },
    form: {
      title: 'Đặt hàng',
      item: 'Vật phẩm',
      amount: 'Số tiền (¥)',
      failCheckouts: 'Các nỗ lực thanh toán không cố ý',
      failRefunds: 'Nỗ lực hoàn tiền không cố ý',
      failHint:
        'Việc mở thanh toán và hoàn tiền có tác dụng với việc thử lại; khiến họ không xem được lần thử lại và nơi lệnh dừng.',
      submit: 'Đặt hàng',
    },
    fields: {
      customer: 'Khách hàng',
      amount: 'Số tiền',
      attempt: 'Vòng thanh toán',
      session: 'Phiên thanh toán',
      paymentRef: 'Thanh toán',
      refundRef: 'Hoàn tiền',
    },
    banner: {
      draft: 'Chưa thanh toán.',
      creatingCheckout: 'Mở quầy thanh toán của nhà cung cấp…',
      awaitingPayment:
        'Đang chờ nhà cung cấp thanh toán. Đóng trong {{time}} nếu nó không thanh toán.',
      overdue: 'Cửa sổ đã kết thúc; lần quét tiếp theo sẽ đóng nó lại.',
      paymentFailed: '{{error}} Thanh toán lại hoặc đóng trong {{time}}.',
      paid: 'Đã thanh toán, sẵn sàng giao hàng.',
      cancelled: {
        customer: 'Bị khách hàng hủy.',
        timeout: 'Đã đóng: không thanh toán đúng hạn.',
        refundRequested: 'Hoàn tiền theo yêu cầu của khách hàng.',
      },
      refunding: 'Hoàn tiền…',
      refundNeedsAttention:
        'Việc hoàn tiền không thành công: {{error}} Nó đang chờ ai đó thử lại.',
      refunded: 'Đã hoàn lại tiền.',
      fulfilled: 'Đã thanh toán và giao hàng.',
    },
    sessionStatus: {
      open: 'mở',
      paid: 'đã trả tiền',
      declined: 'đã từ chối',
      expired: 'đã hết hạn',
    },
    outside: {
      title: 'Nhà cung cấp thanh toán (hộp cát)',
      description:
        'Phát cho khách hàng khi thanh toán của nhà cung cấp và nhà cung cấp gửi webhook của mình. Giữ webhook để gửi nó muộn, hai lần hoặc sau khi hủy.',
      checkout: 'Thanh toán được lưu trữ',
      session: 'Phiên {{id}}: {{status}}.',
      noSession:
        'Không có quầy thanh toán nào được mở; khách hàng thanh toán trước.',
      pay: 'Trả tiền',
      decline: 'Từ chối thẻ',
      tryThis:
        'Hãy thử: giữ webhook, thanh toán, hủy đơn hàng, sau đó giao webhook đã giữ — tiền sẽ đến sau khi hủy và được hoàn lại.',
    },
  },
  exports: {
    title: 'Xuất dữ liệu',
    list: 'Xuất khẩu',
    new: 'Xuất khẩu mới',
    empty: 'Không có xuất khẩu ở đây.',
    pick: 'Chọn một bản xuất để xem nó được thăm dò ý kiến.',
    shows:
      'Nhà cung cấp không có webhook, do đó, vòng đời yêu cầu: trình kích hoạt sẽ tự chuyển đổi cứ sau vài giây và chuyển sang trạng thái một lần nữa để thăm dò ý kiến ​​​​của nhà cung cấp. Thời hạn cố định trong hồ sơ sẽ kết thúc thời gian chờ đợi.',
    description:
      'Nhà cung cấp kết xuất quá trình xuất chậm và không gọi ai quay lại, do đó, mỗi lần xuất sẽ thăm dò nó mỗi giây {{seconds}} và bỏ cuộc sau vài phút {{minutes}}.',
    nothing:
      'Bạn không cần phải làm gì: việc xuất khẩu đang thăm dò nhà cung cấp.',
    actions: {
      submit: 'Bắt đầu xuất',
      retry: 'Xuất lại',
      cancel: 'Hủy',
    },
    outcomes: {
      success: 'thành công',
      failure: 'thất bại',
      stuck: 'bị kẹt ở mức 60%',
    },
    jobStatus: {
      running: 'đang chạy',
      succeeded: 'đã xong',
      failed: 'thất bại',
      cancelled: 'đã hủy',
    },
    form: {
      title: 'Yêu cầu xuất khẩu',
      name: 'Tên',
      duration: 'Nhà cung cấp mất (giây)',
      outcome: 'Công việc của người bán hàng',
      hint: 'Một công việc bị mắc kẹt không bao giờ kết thúc: việc xuất hết thời hạn và dừng công việc.',
      submit: 'Tạo',
    },
    fields: {
      vendor: 'Nhà cung cấp',
      vendorValue: '{{seconds}} s, {{outcome}}',
      job: 'Công việc của nhà cung cấp',
      polls: 'Thăm dò ý kiến',
      deadline: 'Thời hạn',
    },
    banner: {
      draft: 'Chưa bắt đầu.',
      starting: 'Đang gửi công việc cho nhà cung cấp…',
      processing: 'Nhà cung cấp đang làm việc với nó. Bỏ cuộc trong {{time}}.',
      done: 'Sẵn sàng: {{url}}',
      failed: 'Không thành công: {{error}}',
      timedOut:
        'Nhà cung cấp không hoàn thành trước thời hạn; công việc của nó đã bị dừng lại.',
      cancelled: 'Đã hủy.',
    },
    outside: {
      title: 'Nhà cung cấp (hộp cát)',
      description:
        'Nhà xuất khẩu biết gì về công việc của nhà cung cấp: chỉ những gì cuộc thăm dò cuối cùng của họ nhìn thấy. Nhà cung cấp không gửi webhook nên không có gì khác có thể gửi được.',
      lifecycleSide: 'Xuất gia biết gì',
      lifecycleHint:
        'Công việc {{id}}, như cuộc thăm dò cuối cùng đã thấy; cuộc thăm dò tiếp theo sẽ cập nhật nó.',
      lastPoll:
        'Cuộc thăm dò cuối cùng cho thấy {{status}}, {{progress}}% (cuộc thăm dò {{count}}).',
      noPoll: 'Chưa được bình chọn.',
      nextPoll: 'Cuộc thăm dò tiếp theo về {{time}}.',
      pollDue: 'Cuộc quét thăm dò tiếp theo nó.',
      noJob: 'Chưa có việc làm ở nhà cung cấp.',
    },
  },
  purchases: {
    title: 'Khuyến mại chớp nhoáng',
    list: 'Mua hàng',
    new: 'Mua mới',
    empty: 'Không mua hàng ở đây.',
    pick: 'Chọn mua hàng để làm theo các bước của nó.',
    shows:
      'Một giao dịch mua trải dài trên hai hệ thống mà việc khôi phục cơ sở dữ liệu không thể hoàn tác. Mỗi bước là một trạng thái có một hiệu ứng và khi khoản phí bị từ chối, việc đặt trước sẽ được hoàn tác theo từng bước - vì vậy những gì vẫn còn nợ luôn là trạng thái của bản ghi.',
    description:
      'Kho giữ đơn vị, sau đó người cung cấp dịch vụ thanh toán lấy tiền. Khi thẻ bị từ chối, đơn vị sẽ được trả lại bằng một bước bồi thường; một sự đền bù liên tục thất bại dừng lại và chờ đợi một người.',
    nothing: 'Bạn không cần phải làm gì: giao dịch mua đang diễn ra các bước.',
    actions: {
      submit: 'Đặt hàng',
      abandon: 'Loại bỏ',
      retryRelease: 'Thử lại việc phát hành',
    },
    items: {
      headphones: 'Tai nghe',
      keyboard: 'Bàn phím cơ',
      lamp: 'Đèn bàn',
    },
    form: {
      title: 'Mua trong đợt giảm giá chớp nhoáng',
      item: 'Vật phẩm',
      quantity: 'Số lượng',
      total: 'Tổng {{total}}',
      declineCharge: 'Thẻ bị từ chối',
      failReleases: 'Phát hành cổ phiếu không cố ý',
      failHint:
        'Từ chối thẻ để xem bồi thường; làm cho việc phát hành thất bại 3 lần trở lên để xem nó dừng lại và chờ một người.',
      submit: 'Tạo',
    },
    fields: {
      customer: 'Khách hàng',
      amount: 'Số tiền',
      reservation: 'Đặt chỗ',
      paymentRef: 'Thanh toán',
    },
    banner: {
      draft: 'Chưa đặt.',
      reserving: 'Đặt trước các đơn vị…',
      charging: 'Đơn vị nắm giữ; nạp thẻ…',
      releasing: 'Sạc không thành công ({{error}}); trả lại các đơn vị…',
      compensationNeedsAttention:
        'Không thể trả lại các đơn vị: {{error}} Nó chờ ai đó thử lại bản phát hành.',
      confirmed: 'Đã xác nhận: đơn vị được bảo lưu và thanh toán.',
      cancelled: {
        customer: 'Bị loại bỏ.',
        outOfStock: 'Đã hủy: {{error}}',
        paymentDeclined: 'Đã hủy: thẻ bị từ chối và đơn vị được trả lại.',
      },
    },
    outside: {
      title: 'Nhà cung cấp kho hàng và thanh toán (sandbox)',
      description:
        'Mỗi bước là một hiệu ứng trên một hệ thống bên ngoài ứng dụng; việc hoàn tác cũng là một bước.',
      steps: 'Bước',
      stepsHint: 'Lần chạy cuối cùng của hiệu ứng của mỗi bước.',
      reserve: 'Hàng dự trữ',
      charge: 'Nạp thẻ',
      release: 'Xuất kho (bồi thường)',
      notYet: 'Không chạy',
      stock: 'Kho hàng',
      stockHint: 'Xem các đơn vị rời đi và quay trở lại.',
      item: 'Vật phẩm',
      available: 'Có sẵn',
      reserved: 'Đã đặt trước',
    },
  },
  fulfilments: {
    title: 'Vận chuyển',
    list: 'Lô hàng',
    new: 'Lô hàng mới',
    empty: 'Không có lô hàng nào ở đây.',
    pick: 'Chọn lô hàng để thanh toán, kho bãi và người vận chuyển.',
    shows:
      'Một lô hàng chờ hai tín hiệu từ hai hệ thống theo thứ tự bất kỳ mà chúng đến, sau đó theo dõi các sự kiện của người vận chuyển - áp dụng theo thời điểm chúng xảy ra chứ không phải thời điểm chúng đến.',
    description:
      'Một lô hàng sẽ rời đi sau khi thanh toán được thu và nhà kho đã chọn nó, theo một trong hai đơn hàng. Sau đó, webhooks của nhà cung cấp dịch vụ sẽ đến muộn và không theo thứ tự; chỉ có một sự kiện mới hơn di chuyển nó.',
    nothing: 'Bạn không cần phải làm gì cả: hàng đợi ở bên ngoài.',
    actions: {
      ship: 'Trao tay cho người vận chuyển',
      cancel: 'Hủy lô hàng',
    },
    signals: {
      payment: 'khoản thanh toán bị bắt',
      pick: 'kho đã chọn',
    },
    and: 'và',
    carrier: {
      booked: 'Đã đặt',
      pickedUp: 'Đã nhặt được',
      inTransit: 'Đang quá cảnh',
      outForDelivery: 'Ra ngoài giao hàng',
      delivered: 'Đã giao hàng',
      exception: 'Ngoại lệ',
    },
    form: {
      title: 'Mở một lô hàng',
      name: 'Tên',
      customer: 'Khách hàng',
      submit: 'Tạo',
    },
    fields: {
      customer: 'Khách hàng',
      paid: 'Thanh toán bị bắt',
      picked: 'Đã chọn',
      tracking: 'Số theo dõi',
      carrier: 'Người vận chuyển nói',
      carrierAt: 'Kể từ khi',
    },
    banner: {
      preparing: 'Đang chờ: {{waiting}}.',
      readyToShip:
        'Đã thanh toán và đã nhận hàng: sẵn sàng giao cho người vận chuyển.',
      booking: 'Đặt vé hãng vận chuyển…',
      shipped: 'Đang trên đường tới.',
      exception: 'Nhà vận chuyển báo cáo sự cố; một sự kiện mới hơn sẽ xóa nó.',
      delivered: 'Đã giao hàng.',
      cancelled: 'Đã hủy.',
    },
    outside: {
      title: 'Nhà cung cấp thanh toán, kho hàng và nhà vận chuyển (hộp cát)',
      description:
        'Gửi webhook của mỗi hệ thống, ngay bây giờ hoặc được giữ. Cung cấp những cái được giữ theo thứ tự khác để xem cái nào được áp dụng.',
      signals: 'Hai tín hiệu',
      signalsHint:
        'Hoặc có thể đến trước; chiếc thứ hai chuyển lô hàng đi tiếp.',
      capture: 'Thanh toán bị bắt',
      pick: 'Kho đã chọn',
      carrierTitle: 'Đơn vị vận chuyển',
      carrierHint: 'Sự kiện về bưu kiện, mỗi sự kiện có thời gian xảy ra.',
      status: 'Trạng thái',
      location: 'Vị trí',
      offset: 'Vài phút kể từ bây giờ',
      send: 'Gửi',
      offsetHint:
        'Trường cuối cùng thay đổi khi quá trình quét diễn ra: số âm báo cáo lần quét cũ hơn.',
      scramble: 'Giữ ba lần quét để phân phối theo thứ tự bất kỳ',
    },
  },
  subscriptions: {
    title: 'Đăng ký',
    list: 'Đăng ký',
    new: 'Theo dõi',
    empty: 'Không có đăng ký ở đây.',
    pick: 'Chọn một thuê bao để theo dõi thanh toán của nó.',
    shows:
      'Một thuê bao sẽ di chuyển vòng quanh hoạt động → tính phí → hoạt động mỗi kỳ một lần, miễn là nó còn tồn tại. Việc gia hạn sẽ đến hạn vào thời điểm kết thúc giai đoạn đăng ký mà quá trình quét tìm thấy; thẻ bị từ chối sẽ được thử lại bằng trình kích hoạt cho đến khi nó bỏ cuộc.',
    description:
      'Được sạc mỗi phút {{period}}. Khoản phí bị từ chối sẽ được thử lại sau mỗi phút {{dunning}}; sau khi {{tries}} thử đăng ký sẽ bị hủy.',
    nothing: 'Bạn không cần phải làm gì: quá trình thanh toán sẽ tự diễn ra.',
    actions: {
      updateCard: 'Cập nhật thẻ',
      cancel: 'Hủy đăng ký',
    },
    plans: {
      basic: 'Cơ bản',
      pro: 'Chuyên nghiệp',
    },
    periodN_one: 'Thời kỳ {{count}}',
    periodN_other: 'Chu kỳ {{count}}',
    form: {
      title: 'Theo dõi',
      plan: 'Kế hoạch',
      charge: '{{price}} được tính phí ngay bây giờ và vào đầu mỗi kỳ.',
      cardDeclines: 'Phí thẻ từ chối',
      failHint:
        'Từ chối là câu trả lời, không phải ngừng hoạt động: việc sạc không được thử lại ngay lập tức mà bằng nút kích hoạt, dưới một khóa mới.',
      submit: 'Theo dõi',
    },
    fields: {
      customer: 'Khách hàng',
      periods: 'Kỳ trả tiền',
      periodEnd: 'Thời kỳ kết thúc',
      dunning: 'Lần thử thất bại',
      lastCharge: 'Lần sạc cuối cùng',
      card: 'Thẻ bài',
      cardWorks: 'Tác phẩm',
      cardValue_one: 'từ chối khoản phí tiếp theo',
      cardValue_other: 'từ chối các khoản phí {{count}} tiếp theo',
    },
    banner: {
      renewing: 'Sạc thẻ…',
      active: 'Đang hoạt động. Gia hạn trong {{time}}.',
      due: 'Thời kỳ đã kết thúc; lần quét tiếp theo sẽ làm mới nó.',
      pastDue:
        '{{error}} Hãy thử {{tries}} của {{max}}; lần thử tiếp theo trong {{time}}.',
      cancelled: {
        customer: 'Hủy đăng ký.',
        unpaid: 'Đã hủy: thẻ liên tục bị từ chối.',
      },
    },
    outside: {
      title: 'Thanh toán (hộp cát)',
      description:
        'Mỗi lần sạc là một lần chạy của hiệu ứng sạc, được xác định theo thời gian và lần thử.',
      charges: 'Khoản thu',
      chargesHint: 'Cũ nhất đầu tiên.',
      noCharges: 'Chưa có cáo buộc nào.',
      sweep: 'Quét gia hạn',
      sweepHint:
        'Các lần gia hạn được tìm thấy bằng cách quét vào cuối mỗi kỳ đăng ký; nó chạy cứ sau 10 giây, hoặc bây giờ.',
    },
  },
  guide: {
    title: 'Về ví dụ này',
    show: 'Hiển thị',
    hide: 'Ẩn',
    purpose: 'Nó hiển thị gì',
    howTo: 'Làm sao để thử',
    samples:
      'Bản ghi mẫu tải khi ứng dụng được cài đặt với dữ liệu mẫu (APP_SAMPLE_DATA=true). Trên cơ sở dữ liệu được cài đặt không có chúng, hãy chạy “pnpm nocobase db sample”.',
    invoices: {
      purpose:
        'Sử dụng một yêu cầu của nhà cung cấp để minh họa các cuộc gọi lại, truy vấn hết thời gian chờ và thử lại bằng bản PDF mẫu có thể tải xuống.',
      step1:
        'Mở mẫu cho đơn hàng số 1024, yêu cầu mẫu, sau đó nhấp vào Phát hành thành công trong hộp cát. Sau webhook, hãy tải xuống bản PDF mẫu.',
      step2:
        'Gửi lại thông báo tương tự: thông báo được phát lại và không có hóa đơn thứ hai nào được phát hành.',
      step3:
        'Với đơn hàng #1026, giữ webhook và phát hành thành công. Sau 30 giây truy vấn sẽ hoàn thành nó. Một lần giao hàng sau đó không thể phát hành lại.',
      step4:
        'Mẫu 晨光书店 không gửi được 3 lần. Thử lại hóa đơn khôi phục từ sự cố không thành công và giữ nguyên yêu cầu của nhà cung cấp.',
    },
    tickets: {
      purpose:
        'Một vé giữ nguyên vị trí của nó trong trường trạng thái của chính nó và mọi thay đổi — chấp nhận, trả lời, giải quyết, mở lại — là một quá trình chuyển đổi được khai báo trong nguồn. Cuộc hội thoại là nhật ký chuyển tiếp: mỗi tin nhắn là đầu vào của quá trình chuyển đổi mà nó gây ra. Email chạy dưới dạng hiệu ứng sau khi quá trình chuyển đổi được thực hiện, với số lần thử lại và yêu cầu còn lại đang chờ khách hàng sẽ bị đóng bằng trình kích hoạt.',
      step1:
        'Sử dụng “Đã đăng nhập với tư cách” ở trên cùng bên phải để chuyển đổi giữa các đại lý hỗ trợ và khách hàng. Đại lý nhìn thấy toàn bộ hàng đợi; khách hàng chỉ nhìn thấy vé của chính họ.',
      step2:
        'Với tư cách là đại lý, hãy mở vé mới “无法登录管理后台” và trả lời. Bây giờ nó đang đợi khách hàng và tự đóng lại sau vài phút im lặng; các trình kích hoạt được quét cứ sau 10 giây.',
      step3:
        'Chuyển sang 王女士 và trả lời một vé đang chờ cô ấy: nó sẽ quay trở lại đại lý của nó. Khách hàng có thể mở lại một vé đã đóng trong 7 ngày — hãy thử với tên 李先生 trên “如何导出本月的订单报表？”.',
      step4:
        'Gửi yêu cầu với tư cách là khách hàng có cài đặt “Gửi email không đúng mục đích” trong tùy chọn Demo, sau đó trả lời yêu cầu đó với tư cách là nhân viên hỗ trợ: “Dưới mui xe” hiển thị hiệu ứng email không thành công và đang thử lại.',
    },
    expenses: {
      purpose:
        'Một báo cáo chi phí được định tuyến theo số tiền: tối đa 5.000 yên sẽ được phê duyệt tự động, trên mức người quản lý của người nộp đơn phê duyệt và trên 50.000 yên thì giám đốc tài chính cũng vậy. Người phê duyệt phê duyệt, gửi lại hoặc từ chối có lý do, người quản lý nhàn rỗi được chuyển qua trình kích hoạt và báo cáo đã phê duyệt sẽ được thanh toán bằng hiệu ứng sau đó đánh dấu báo cáo đó đã được thanh toán.',
      step1:
        'Sử dụng “Đã đăng nhập với tư cách” để đóng vai nhân viên 林晓 và 何东, người quản lý, giám đốc điều hành và giám đốc tài chính của họ. Một nhân viên xem báo cáo của chính họ; người phê duyệt sẽ thấy điều gì đang chờ đợi họ.',
      step2:
        'Với tư cách là 林晓, hãy gửi bản dự thảo “杭州客户拜访” (¥872): nó được phê duyệt tự động và được thanh toán ngay sau đó. “Dưới mui xe” cho thấy hiệu ứng thanh toán và quá trình chuyển đổi “trả phí” mà nó đã thực hiện.',
      step3:
        'Chuyển sang 赵静, giám đốc tài chính, và phê duyệt “法兰克福展会参展”, mà 陈明 đã phê duyệt: trên 50.000 Yên thì cần cả hai.',
      step4:
        'Với tư cách là 何东, hãy gửi lại “北京客户现场支持”, đã được gửi lại để biết thêm thông tin, sau đó phê duyệt dưới dạng 孙磊. Một báo cáo để lại cho người quản lý trong 3 phút sẽ được chuyển đến người quản lý của người quản lý đó.',
      step5:
        'Trong phần “Dưới mui xe”, “Danh tính hiện tại có thể làm gì” đưa ra lý do cho mọi hành động mà người hiện tại có thể không thực hiện. Mở một báo cáo đang chờ trong hai cửa sổ và thực hiện trên cả hai cửa sổ: cửa sổ thứ hai bị từ chối vì phiên bản mà nó nhìn thấy đã cũ.',
    },
    orders: {
      purpose:
        'Một đơn hàng được đánh dấu chỉ thanh toán bởi webhook của nhà cung cấp thanh toán, không bao giờ theo trang. Trong khi chờ đợi, nó chỉ là một trạng thái được ghi lại — không tính giờ, không yêu cầu mở — và một webhook đến muộn, sớm hoặc hai lần vẫn di chuyển nó đúng một lần. Tiền đến sau khi đơn hàng bị hủy sẽ được hoàn lại.',
      step1:
        'Mở đơn hàng mẫu “降噪耳机 × 1” và nhấp vào “Thanh toán”: một hiệu ứng mở ra trang thanh toán được lưu trữ của nhà cung cấp và đơn hàng đang chờ thanh toán.',
      step2:
        'Trong thẻ “Nhà cung cấp dịch vụ thanh toán (sandbox)” có nét đứt, thanh toán hoặc từ chối thẻ. Webhook mà nhà cung cấp gửi sẽ di chuyển đơn hàng; “Giao lại” được trả lời Phát lại.',
      step3:
        'Đánh dấu vào “Giữ webhook”, thanh toán, nhấp vào “Hủy đơn hàng”, sau đó gửi webhook đã giữ: khoản thanh toán sẽ đến sau khi hủy và được hoàn lại.',
      step4:
        'Mẫu “机械键盘 × 1” cố tình không thực hiện được lần kiểm tra đầu tiên, để cho thấy hiệu quả của việc thử lại. Một đơn hàng chưa thanh toán sẽ hết hạn sau 3 phút.',
    },
    exports: {
      purpose:
        'Nhà cung cấp không gửi webhook nên quá trình xuất sẽ thăm dò ý kiến ​​đó: một trình kích hoạt kích hoạt "cuộc thăm dò" tự chuyển đổi, việc nhập lại "xử lý" sẽ chạy kiểm tra và thời hạn ghi trên bản ghi sẽ quyết định thời điểm bỏ cuộc.',
      step1:
        'Mở “9 月订单明细” và nhấp vào “Bắt đầu xuất”. Nhà cung cấp mất 30 giây; xem “Những gì nhà cung cấp biết” chạy trước những gì nhà xuất khẩu biết cho đến cuộc thăm dò tiếp theo.',
      step2:
        'Bắt đầu “全年客户名单”, công việc của nhà cung cấp bị kẹt: vào thời hạn xuất khẩu hết thời gian và dừng công việc của nhà cung cấp. “Xuất lại” bắt đầu một vòng mới.',
      step3:
        'Trong phần “Under the Hood”, mỗi cuộc thăm dò ý kiến là một quá trình chuyển đổi trong nhật ký và mỗi lần kiểm tra là một lần chạy hiệu ứng.',
    },
    purchases: {
      purpose:
        'Việc mua hàng chớp nhoáng bao gồm hai hệ thống: kho dự trữ hàng hóa, sau đó nhà cung cấp dịch vụ thanh toán sẽ tính phí vào thẻ. Khi khoản phí bị từ chối, việc đặt chỗ sẽ được hoàn tác bằng một bước bồi thường riêng; một khoản bồi thường liên tục dừng ở trạng thái mà một người thử lại.',
      step1:
        'Mở giao dịch mua mẫu hai chiếc đèn và nhấp vào “Đặt hàng”: đơn vị được đặt trước, thẻ được tính phí và giao dịch mua hoàn tất.',
      step2:
        'Đặt mua bàn phím mẫu có thẻ bị từ chối và xem thiết bị rời khỏi “Kho kho” và quay trở lại.',
      step3:
        'Tạo giao dịch mua với thẻ bị từ chối và “Cố ý phát hành hàng không thành công” được đặt thành 3: quá trình phát hành dừng lại và chờ “Thử phát hành lại”.',
    },
    fulfilments: {
      purpose:
        'Một lô hàng chờ hai tín hiệu từ hai hệ thống - khoản thanh toán được ghi nhận và việc lấy hàng của kho - theo bất kỳ thứ tự nào chúng đến, sau đó sẽ đi theo nhà vận chuyển. Các sự kiện của nhà cung cấp dịch vụ được áp dụng theo thời điểm chúng xảy ra chứ không phải thời điểm chúng đến và một sự kiện cũ hơn sẽ bị từ chối vì cũ.',
      step1:
        'Mở lô hàng mẫu và gửi “Đã chọn kho” và “Đã thu hồi thanh toán” theo một trong hai thứ tự: thứ hai chuyển lô hàng đó sang trạng thái sẵn sàng vận chuyển.',
      step2:
        'Nhấp vào “Giao cho nhà cung cấp dịch vụ”, sau đó gửi bản quét của nhà cung cấp dịch vụ, mỗi bản có trạng thái và vị trí.',
      step3:
        'Đánh dấu vào “Giữ ba lần quét để phân phối theo thứ tự bất kỳ” và gửi bản quét mới nhất trước: những bản quét trước đó sẽ bị bỏ qua vì cũ.',
      step4:
        'Giá trị âm “Phút kể từ bây giờ” báo cáo quá trình quét đã xảy ra trước đó, đó là biểu hiện của một sự kiện muộn.',
    },
    subscriptions: {
      purpose:
        'Gói đăng ký sẽ được tính phí vào đầu mỗi kỳ trong suốt thời gian đăng ký. Quá trình quét của plugin sẽ gia hạn từng plugin vào cuối kỳ của riêng nó và khoản phí bị từ chối sẽ được thử lại bằng trình kích hoạt hạn chế, dưới một khóa mới, cho đến khi nó phục hồi hoặc đăng ký bị hủy.',
      step1:
        'Nhấp vào “Đăng ký” và chọn gói: khoản phí đầu tiên sẽ được thực hiện ngay lập tức. Không có đăng ký mẫu vì tạo một mẫu sẽ tính phí vào thẻ.',
      step2:
        'Đăng ký với “Tính phí thẻ từ chối” được đặt thành 1: thẻ quá hạn, được thử lại một phút sau đó và khôi phục. “Cập nhật thẻ” sẽ khôi phục nó ngay lập tức.',
      step3:
        'Một tiết kéo dài 3 phút; “Chạy trình kích hoạt ngay bây giờ” trong phần “Quét gia hạn” sẽ gia hạn bất cứ thứ gì đến hạn mà không cần đợi lần quét tiếp theo.',
    },
  },
  blockers: {
    invoiceRequestMismatch: 'Kết quả thuộc về một yêu cầu hóa đơn khác.',
    agentOnly: 'Chỉ có đại lý hỗ trợ mới có thể làm việc trên vé.',
    requesterOnly: 'Chỉ có khách hàng đã nộp vé mới có thể thực hiện việc này.',
    systemOnly: 'Hệ thống sẽ tự thực hiện việc này sau khi hết thời gian chờ.',
    reopenExpired:
      'Đã đóng cửa quá lâu để mở lại; thay vào đó hãy nộp một vé mới.',
    applicantOnly:
      'Chỉ người nộp đơn mới có thể thực hiện việc này với báo cáo của mình.',
    approverOnly:
      'Chỉ người phê duyệt hiện tại mới có thể quyết định về báo cáo này.',
    topApprover: 'Người phê duyệt hiện tại đã là cấp cao nhất.',
    customersOnly: 'Chỉ có khách hàng mới có thể tự mình gửi yêu cầu.',
    applicantsOnly:
      'Chỉ nhân viên mới có thể nộp báo cáo chi phí cho chính mình.',
    alreadyPaid: 'Thanh toán đã được xác nhận.',
    alreadyPicked: 'Kho đã lấy rồi.',
    staleCarrierEvent: 'Một sự kiện vận chuyển mới hơn đã được áp dụng.',
    periodNotOver: 'Giai đoạn hiện tại vẫn chưa kết thúc.',
  },
  problems: {
    orderRef: 'Chọn đơn hàng hộp cát đã hoàn thành.',
    taxNumber: 'Nhập mã số thuế từ 15 đến 20 chữ cái hoặc chữ số.',
    message: 'Viết tin nhắn.',
    reason: 'Đưa ra lý do.',
    subject: 'Cho tấm vé một chủ đề.',
    description: 'Mô tả vấn đề.',
    category: 'Chọn một danh mục.',
    priority: 'Chọn mức độ ưu tiên.',
    title: 'Đặt tên cho nó.',
    amountCents: 'Số tiền phải lớn hơn 0.',
    durationSeconds: 'Nhà cung cấp mất từ ​​5 đến 600 giây.',
    vendorOutcome: 'Chọn cách kết thúc công việc.',
    sku: 'Chọn một mục.',
    quantity: 'Mua từ 1 đến 5.',
    plan: 'Chọn một phương án.',
    customerId: 'Chọn khách hàng.',
  },
  errors: {
    EXPENSE_NOT_FOUND: 'Báo cáo chi phí không tồn tại.',
    OWN_EXPENSE_ONLY: 'Chỉ người nộp đơn mới có thể chỉnh sửa báo cáo này.',
    EXPENSE_LOCKED:
      'Một báo cáo đang được xem xét không thể được chỉnh sửa; hãy rút nó trước.',
    EXPENSE_CHANGED:
      'Báo cáo đã thay đổi trong khi bạn đang chỉnh sửa nó; tải lại và thử lại.',
    SANDBOX_SESSION_CLOSED: 'Quầy thanh toán không còn mở nữa.',
    SANDBOX_NOT_FOUND: 'Hộp cát không có đối tượng như vậy.',
    UNKNOWN_WEBHOOK_EVENT: 'Hộp cát không gửi sự kiện đó.',
    WEBHOOK_EVENT_NOT_FOUND: 'Không có sự kiện webhook nào như vậy.',
  },
  lifecycle: {
    title: 'Dưới mui xe',
    hint: 'Vòng đời được ghi lại cho bản ghi này là gì. Một ứng dụng thực sự sẽ không hiển thị điều này cho người dùng.',
    available: 'Danh tính hiện tại có thể làm gì',
    final: 'Không có quá trình chuyển đổi nào rời khỏi trạng thái này.',
    diagram: 'Sơ đồ tương tác',
    diagramHint:
      'toMermaid(describe()) vẽ vòng đời dưới dạng sơ đồ trạng thái; dán nó vào bất kỳ trình kết xuất Nàng tiên cá nào.',
    retry: 'Thử lại',
    cancel: 'Hủy',
    continue: 'Tiếp tục',
    continuationWaits: '{{transition}} chờ: {{error}}',
    continuationAbandoned:
      '{{transition}} bỏ cuộc sau khi {{attempts}} thử, cho đến khi tiếp tục bằng tay: {{error}}',
    states: 'Kỳ',
    parameters: 'Thông số',
    transitions: 'Nhật ký chuyển tiếp',
    effects: 'Hiệu ứng chạy',
    noTransitions: 'Chưa có sự chuyển tiếp nào.',
    noEffects: 'Chưa có hiệu ứng nào.',
    attempts: '{{attempts}}/{{max}}',
    runTriggers: 'Chạy trình kích hoạt ngay bây giờ',
    sweepNote:
      'Dù sao thì kích hoạt vẫn được quét sau mỗi 10 giây; điều này chạy quét ngay lập tức.',
    swept_one: 'Quá trình quét đã kích hoạt quá trình chuyển đổi {{count}}.',
    swept_other: 'Quá trình quét đã kích hoạt các chuyển đổi {{count}}.',
    columns: {
      time: 'Thời gian',
      transition: 'Chuyển tiếp',
      change: 'Thay đổi',
      actor: 'Bởi',
      input: 'Đầu vào',
      effect: 'Hiệu ứng',
      status: 'Trạng thái',
      attempts: 'Nỗ lực',
      error: 'Lỗi cuối cùng',
    },
  },
  states: {
    review: 'Đang xem xét',
    submitting: 'Đang gửi',
    awaitingIssue: 'Đang chờ vấn đề',
    querying: 'Truy vấn',
    issued: 'Đã ban hành',
    issueFailed: 'Sự cố không thành công',
    new: 'Mới',
    open: 'Mở',
    awaitingCustomer: 'Đang chờ khách hàng',
    closed: 'Đã đóng',
    draft: 'Bản nháp',
    awaitingManager: 'Đang chờ quản lý',
    awaitingFinance: 'Đang chờ tài chính',
    needsInfo: 'Đã gửi lại',
    approved: 'Đã phê duyệt',
    rejected: 'Đã từ chối',
    paid: 'Đã trả tiền',
    creatingCheckout: 'Mở quầy thanh toán',
    awaitingPayment: 'Đang chờ thanh toán',
    paymentFailed: 'Thanh toán không thành công',
    cancelled: 'Đã hủy',
    refunding: 'Hoàn tiền',
    refundNeedsAttention: 'Cần chú ý hoàn tiền',
    refunded: 'Đã hoàn lại',
    fulfilled: 'Đã vận chuyển',
    starting: 'Bắt đầu',
    processing: 'Đang xử lý',
    done: 'Hoàn thành',
    failed: 'Thất bại',
    timedOut: 'Đã hết thời gian',
    reserving: 'Dự trữ hàng tồn kho',
    charging: 'Đang thu tiền',
    releasing: 'Xuất kho',
    compensationNeedsAttention: 'Bồi thường bị mắc kẹt',
    confirmed: 'Đã xác nhận',
    preparing: 'Đang chuẩn bị',
    readyToShip: 'Sẵn sàng giao hàng',
    booking: 'Hãng đặt vé',
    shipped: 'Đang quá cảnh',
    exception: 'Ngoại lệ của nhà cung cấp dịch vụ',
    delivered: 'Đã giao hàng',
    renewing: 'Đang thu tiền',
    active: 'Đang hoạt động',
    pastDue: 'Quá hạn',
  },
  transitions: {
    retry: 'Thử lại',
    jobStarted: 'Đã gửi công việc',
    startFailed: 'Gửi không thành công',
    poll: 'Kết quả bình chọn',
    jobDone: 'Đã xuất xong',
    jobFailed: 'Xuất không thành công',
    cancel: 'Hủy',
    paymentCaptured: 'Thanh toán bị bắt',
    picked: 'Kho đã chọn',
    ship: 'Tàu',
    booked: 'Đã đặt chỗ hãng vận chuyển',
    trackingUpdated: 'Cập nhật theo dõi',
    checkout: 'Mở thanh toán',
    checkoutCreated: 'Đã mở thanh toán',
    checkoutFailed: 'Thanh toán không thành công',
    paymentSucceeded: 'Thanh toán thành công',
    paymentDeclined: 'Thanh toán bị từ chối',
    paidAfterCancel: 'Thanh toán sau khi hủy',
    expire: 'Đóng sau khi hết thời gian chờ',
    refundOrder: 'Hoàn tiền',
    refunded: 'Hoàn tiền hoàn tất',
    refundFailed: 'Hoàn tiền không thành công',
    retryRefund: 'Thử lại hoàn tiền',
    charged: 'Phí thành công',
    chargeFailed: 'Sạc không thành công',
    renew: 'Gia hạn khi đến hạn',
    retryCharge: 'Thử lại phí',
    updateCard: 'Cập nhật thẻ',
    abandon: 'Từ bỏ',
    stockReserved: 'Đã dự trữ hàng',
    stockUnavailable: 'Hàng không có sẵn',
    stockReleased: 'Đã phát hành hàng',
    releaseFailed: 'Phát hành cổ phiếu không thành công',
    retryRelease: 'Thử lại phát hành cổ phiếu',
    retryInvoice: 'Thử lại hóa đơn',
    submitted: 'Đã gửi yêu cầu',
    submissionFailed: 'Gửi không thành công',
    query: 'Truy vấn hóa đơn',
    stillPending: 'Vẫn đang chờ xử lý',
    issued: 'Xuất hóa đơn',
    issueFailed: 'Sự cố không thành công',
    queryFailed: 'Truy vấn không thành công',
    create: 'Đã tạo',
    accept: 'Lấy',
    reply: 'Trả lời',
    customerReply: 'Khách hàng trả lời',
    resolve: 'Giải quyết',
    autoClose: 'Tự động đóng',
    reopen: 'Mở lại',
    submit: 'Gửi',
    approve: 'Phê duyệt',
    reject: 'Từ chối',
    requestInfo: 'Gửi lại',
    resubmit: 'Gửi lại',
    withdraw: 'Rút lại',
    escalate: 'Leo thang',
    paid: 'Mark đã trả tiền',
  },
  runs: {
    queued: 'Đã xếp hàng',
    running: 'Đang chạy',
    succeeded: 'Đã thành công',
    failed: 'Thất bại',
    dead: 'Bỏ cuộc',
    cancelled: 'Đã hủy',
  },
};

export default viVN;
