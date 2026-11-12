import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  modelSuggestions: {
    design:
      'Suy luận mạnh nhất: đề xuất, kiến trúc, điều tra vấn đề khó và đánh giá thay đổi quan trọng; cũng triển khai thông thường và thay đổi nhiều gói.',
    large:
      'Triển khai lớn, thay đổi nhiều gói, tái cấu trúc và triển khai thông thường; cũng viết đề xuất, đánh giá mã và thay đổi nhỏ.',
    review:
      'Đánh giá mã và phân tích lỗi CI; cũng viết đề xuất và điều tra vấn đề khó.',
    routine:
      'Triển khai thông thường, sửa lỗi nhỏ, kiểm thử và câu chữ; cũng phân tích lỗi CI.',
    small:
      'Thay đổi nhỏ, chỉnh sửa cơ học và kiểm thử, rẻ và nhanh; cũng phân tích lỗi CI.',
    explanation: 'Hiểu yêu cầu, giải thích và viết đề xuất.',
  },
  goodAtTemplates: {
    fill: 'Điền từ mẫu',
    design: 'Thiết kế và đánh giá',
    large: 'Triển khai lớn',
    review: 'Đánh giá mã và CI',
    routine: 'Triển khai thông thường',
    small: 'Thay đổi nhỏ',
    explanation: 'Giải thích và đề xuất',
    undo: 'Hoàn tác',
  },
  actions: {
    back: 'Quay lại',
    cancel: 'Hủy',
    close: 'Đóng',
    delete: 'Xóa',
    edit: 'Chỉnh sửa',
    save: 'Lưu',
  },
  common: {
    refresh: 'Làm mới',
    cancel: 'Hủy',
    copy: 'Sao chép',
    copied: 'Đã sao chép',
    save: 'Lưu',
    close: 'Đóng',
    create: 'Tạo',
    createNamed: 'Tạo "{{name}}"',
    creating: 'Tạo ra…',
    noOptions: 'Không có lựa chọn',
    forbidden: 'Bạn không được phép làm điều này.',
    loading: 'Đang tải',
    notFound: 'Nó không còn tồn tại.',
    requestFailed: 'Yêu cầu không thành công. Hãy thử lại.',
    retry: 'Thử lại',
    secretKept: 'Set — để trống để giữ nó',
  },
  status: {
    loading: 'Đang tải',
  },
  unsavedChanges: {
    description: 'Nội dung bạn nhập chưa được gửi và sẽ bị mất.',
    discard: 'Loại bỏ',
    keepEditing: 'Tiếp tục chỉnh sửa',
    title: 'Hủy các thay đổi chưa được lưu?',
  },
  errors: {
    boundRunnerIncompatible:
      'Môi trường này không thể chạy Agent đã chọn. Hãy đổi môi trường để tiếp tục.',
    CONFLICT: 'Trong lúc đó, nó đã thay đổi. Tải lại và thử lại.',
    REVISION_CONFLICT: 'Trong lúc đó, nó đã thay đổi. Tải lại và thử lại.',
    FORBIDDEN: 'Bạn không được phép làm điều này.',
    AGENT_NOT_FOUND: 'Nó không còn tồn tại.',
    RUN_NOT_FOUND: 'Nó không còn tồn tại.',
    SKILL_NOT_FOUND: 'Nó không còn tồn tại.',
    SKILL_VERSION_NOT_FOUND: 'Nó không còn tồn tại.',
    CONVERSATION_NOT_FOUND: 'Nó không còn tồn tại.',
    RUNNER_NOT_FOUND: 'Nó không còn tồn tại.',
    VARIABLE_NOT_FOUND: 'Nó không còn tồn tại.',
    MODEL_SERVICE_NOT_FOUND: 'Nó không còn tồn tại.',
    SCOPE_NOT_FOUND: 'Nó không còn tồn tại.',
    INVALID_INPUT: 'Một số giá trị không hợp lệ.',
    SECRETS_KEY_MISSING:
      'Các biến không thể được lưu hoặc hiển thị: máy chủ không có khóa bí mật. Yêu cầu quản trị viên đặt các khóa bí mật trong cấu hình ứng dụng.',
  },
  command: {
    copy: 'Lệnh sao chép',
    copied: 'Đã sao chép',
    copyFailed: 'Không thể sao chép. Chọn lệnh và tự sao chép nó.',
  },
  tools: {
    claude: 'Claude Code',
    codex: 'Codex',
    opencode: 'OpenCode',
    pi: 'Pi',
    gemini: 'Gemini CLI',
    copilot: 'GitHub Copilot',
    cursor: 'Cursor',
    qwen: 'Qwen Code',
    kimi: 'Kimi CLI',
    codebuddy: 'CodeBuddy Code',
    qoder: 'Qoder CLI',
    goose: 'Goose',
    auggie: 'Auggie',
    droid: 'Factory Droid',
    kilo: 'Kilo Code',
    cline: 'Cline',
    amp: 'Amp',
    vibe: 'Mistral Vibe',
    dsh: 'DeepSeek Harness',
  },
  agents: {
    unavailableNow: 'Hiện không khả dụng',
    title: 'Tác nhân',
    description:
      'Thêm Agent từ các mô hình mà môi trường chạy báo cáo. Lead Agent giao từng bước của nhiệm vụ cho Agent có mô tả phù hợp.',
    fromRunners: 'Đại lý từ môi trường chạy',
    display: {
      search: 'Tìm kiếm người mẫu hoặc nhà cung cấp',
      select: 'Chọn {{name}}',
      showDisabled: 'Hiện đã tắt',
      hideDisabled: 'Ẩn đã tắt',
    },
    filterLabel: 'Hiển thị Agents',
    filters: {
      all: 'Tất cả {{count}}',
      enabled: 'Đã bật {{count}}',
      unreported: 'Không có môi trường chạy {{count}}',
    },
    loadFailed: 'Không thể tải các Agents',
    loadMore: 'Tải thêm',
    emptyTitle: 'Chưa có Agents',
    emptyDescription:
      'Kết nối môi trường chạy có công cụ lập trình đã đăng nhập, rồi thêm Agent từ “Các mô hình khả dụng”.',
    noneInFilter: 'Không có Agent ở đây.',
    howToAdd:
      'Để thêm Agent, hãy cài công cụ lập trình trên một môi trường chạy và đăng nhập một mô hình bạn được dùng: khi môi trường chạy báo cáo nó, hãy thêm từ Mô hình khả dụng và ghi rõ nó giỏi việc gì. Agent chỉ có trên môi trường chạy cá nhân chỉ làm các nhiệm vụ do chủ sở hữu của chúng khởi động.',
    goodAtMissing: 'Chưa viết',
    columns: {
      agent: 'Tác nhân',
      goodAt: 'Giỏi',
      where: 'Nó chạy ở đâu',
      effort: 'Nỗ lực lý luận',
      state: 'Trạng thái',
    },
    where: {
      none: 'Không có môi trường chạy',
      team_one: '{{count}} môi trường chạy của nhóm',
      team_other: '{{count}} môi trường chạy của nhóm',
      personal_one: '{{count}} môi trường chạy cá nhân đang trực tuyến',
      personal_other: '{{count}} môi trường chạy cá nhân đang trực tuyến',
      both: 'Nhóm {{team}} · {{personal}} cá nhân',
      names: '{{names}}',
      noneOnline: 'Hiện tại không có môi trường chạy nào trực tuyến',
      personalOnly: 'Chỉ dành cho vận động viên chạy bộ cá nhân',
      lastReported: '{{when}} được báo cáo lần cuối',
    },
    state: {
      enabled: 'Đã bật',
      disabled: 'Đã tắt',
      unreported: 'Không có môi trường chạy',
    },
    effort: {
      default: 'Mặc định của công cụ',
      off: 'Tắt',
      minimal: 'Tối thiểu',
      low: 'Thấp',
      medium: 'Vừa',
      high: 'Cao',
      xhigh: 'Cực cao',
      max: 'Tối đa',
      ultra: 'Cực',
    },
    enable: {
      reportedBy_one: 'Á hậu {{count}} tường thuật trực tuyến: {{names}}.',
      reportedBy_other:
        'Báo cáo của các vận động viên {{count}} trực tuyến: {{names}}.',
      noRunnerNow: 'Hiện tại không có môi trường chạy nào có nó trực tuyến.',
      goodAtHint:
        'Lead Agent quyết định những gì sẽ giao cho Agent này bằng những lời này. Nói những gì nó phù hợp và những gì nó không.',
      goodAtRequired: 'Viết ra nó giỏi về cái gì trước khi kích hoạt nó.',
      effortHint: 'Lead Agent không thể thay đổi nó khi bàn giao công việc.',
      personalOnly:
        'Chỉ môi trường chạy cá nhân có nó: Lead Agent chỉ giao cho nó các nhiệm vụ do chủ sở hữu của chúng khởi động.',
    },
    edit: {
      button: 'Chỉnh sửa',
      buttonFor: 'Chỉnh sửa {{name}}',
      title: 'Chỉnh sửa {{name}}',
      enabled: 'Đã bật',
      done: '{{name}} đã lưu',
    },
    available: {
      open: 'Thêm agent',
      title: 'Các mô hình khả dụng',
      description:
        'Chỉ những công cụ được chọn trên môi trường chạy mới được phát hiện và xuất hiện ở đây. Các tổ hợp được ứng dụng đề xuất sẽ tự tạo và tự bật ngay khi một runner báo cáo chúng; hãy thêm agent từ bất kỳ tổ hợp nào khác.',
      recommended: 'Tự động bật khi được báo cáo',
      added: 'Đã thêm',
      add: 'Thêm',
      status: {
        available: 'Khả dụng',
        needsSetup: 'Cần thiết lập',
        versionTooOld: 'Phiên bản quá cũ',
        failed: 'Phát hiện thất bại',
      },
      details: 'Chi tiết công cụ',
      setupCommand: 'Chạy {{command}} trên môi trường chạy.',
      setupUnknown:
        'Công cụ này cần được thiết lập, nhưng chúng tôi không biết lệnh tương ứng.',
      upgradeAdvice:
        'Nâng cấp công cụ và bộ điều hợp ACP lên bản mới nhất trên môi trường, rồi làm mới việc phát hiện.',
      minimumVersionUnknown:
        'Chưa rõ phiên bản công cụ tối thiểu được hỗ trợ. Xem tài liệu tương thích của công cụ.',
      noDetail: 'Công cụ không cung cấp thêm chi tiết.',
      showMore: 'Xem thêm',
      showLess: 'Thu gọn',
      groupSearchPlaceholder: 'Tìm mô hình của công cụ này',
      group_one: '{{tool}} · {{count}} mô hình · {{runners}}',
      group_other: '{{tool}} · {{count}} mô hình · {{runners}}',
      runners_one: '{{count}} runner',
      runners_other: '{{count}} runner',
      noModels: 'Không có mô hình nào ở đây.',
      selectedCount_one: 'Đã chọn {{count}}',
      selectedCount_other: 'Đã chọn {{count}}',
      addSelected: 'Thêm {{count}}',
      confirmTitle_one: 'Thêm {{count}} agent',
      confirmTitle_other: 'Thêm {{count}} agent',
      confirmAction_one: 'Thêm {{count}}',
      confirmAction_other: 'Thêm {{count}}',
      goodAtNeeded: 'Giỏi về gì?',
      addedCount_one: 'Đã thêm {{count}} agent.',
      addedCount_other: 'Đã thêm {{count}} agent.',
      addedPartial:
        'Đã thêm {{succeeded}}, {{failed}} không thể thêm. Lý do ở dưới mỗi mục.',
      addFailed:
        '{{failed}} không thể thêm. Lý do ở dưới mỗi mục; hãy thử lại.',
    },
  },
  agentTypes: {
    label: 'Loại tác nhân',
    question: 'Agent kiểu gì thế?',
    online: 'Trực tuyến',
    runner: 'Trình chạy',
    onlineHint:
      'Câu trả lời trong vài giây trên máy chủ thông qua dịch vụ mẫu. Không cần môi trường chạy; nó không thể chạm vào mã.',
    runnerHint:
      'Điều khiển công cụ mã hóa trong môi trường chạy và hoạt động trong thư mục đang hoạt động: mã, tệp, lệnh.',
    immutable:
      'Một Agent giữ nguyên loại của nó; tạo một Agent khác cho loại khác.',
    onServer: 'Trên máy chủ',
    filterAll: 'Tất cả các loại',
    noneOfType: 'Không có Agent thuộc loại này.',
  },
  agentSkills: {
    title: 'Kỹ năng',
    description:
      'Hướng dẫn sử dụng mà Agent đọc khi một nhiệm vụ phù hợp với mô tả của họ. Được đặt trong thư mục làm việc của nó trước mỗi lần chạy.',
    manage: 'Quản lý kỹ năng',
    placeholder: 'Chọn kỹ năng',
    empty: 'Chưa có kỹ năng.',
    save: 'Lưu kỹ năng',
    descriptionOnline:
      'Hướng dẫn Agent đọc khi tác vụ khớp với mô tả của họ, trong hộp cát chỉ đọc trên máy chủ.',
    onlineScripts:
      'Các tập lệnh không được thực thi cho các Agents trực tuyến: Agent có thể đọc chúng chứ không thể chạy chúng.',
    skippedScripts: ': {{paths}}',
    pathSeparator: ', ',
  },
  brief: {
    preview: 'Xem trước lời nhắc đầy đủ',
    previewTitle: 'Xem trước lời nhắc đầy đủ',
    previewDescription:
      'Thật là một hành động của Agent này sẽ được gửi đi bây giờ, với một chủ đề bịa đặt. Không có gì được xếp hàng.',
    scenario: 'Kịch bản',
    sample:
      'Về một chủ đề bịa đặt: {{subject}}. Các giá trị được đánh dấu [mẫu] được tạo thành.',
    previewFailed: 'Không thể hiển thị lời nhắc đầy đủ.',
    system: 'Lời nhắc hệ thống',
    showAs: 'Hiển thị dưới dạng',
    rendered: 'Kết xuất',
    raw: 'Nguyên',
    platform:
      'Các quy tắc và nhiệm vụ của nền tảng · về các ký tự {{size}} (tiếng Anh)',
    platformNote:
      'Quy tắc nền tảng được gửi bằng tiếng Anh; Agent vẫn trả lời bằng ngôn ngữ của bạn.',
    agentPrompt: 'Lời nhắc của đại lý (do bạn viết)',
    noAgentPrompt: 'Agent này không có lời nhắc riêng.',
    firstMessage: 'Tin nhắn đầu tiên',
    empty: 'Trống rỗng',
    previewPlaceholders:
      'Các ghi chú trong ngoặc về môi trường chạy được điền vào bởi môi trường chạy chạy nó: các thư mục làm việc của nó và lời nhắc khởi tạo của các thư mục mà nó vừa chuẩn bị.',
    placeholders:
      'Trình giữ chỗ {{runner.…}} được điền vào bởi môi trường chạy chạy nó: các thư mục làm việc của nó và lời nhắc khởi tạo của các thư mục mà nó vừa chuẩn bị.',
    layers: {
      system: 'Quy tắc',
      task: 'Tác vụ',
      context: 'Bối cảnh',
      agent: 'Lời nhắc của đại lý',
      turn: 'Lượt đầu tiên',
    },
  },
  envVars: {
    title: 'Biến môi trường',
    description:
      'Được chuyển đến công cụ mã hóa trong mỗi lần chạy và được ẩn trong các bản ghi lần chạy; các giá trị không được hiển thị lại sau khi lưu. Bất kỳ ai có thể sử dụng Agent dùng chung đều có thể nhận các giá trị này trên máy tính của riêng họ; đánh dấu các bí mật có rủi ro cao "Chỉ môi trường chạy của nhóm".',
    add: 'Thêm biến',
    addTitle: 'Thêm biến môi trường',
    editTitle: 'Thay thế {{name}}',
    writeOnly: 'Giá trị được lưu trữ được mã hóa và thay thế giá trị trước đó.',
    name: 'Tên',
    nameHint: 'Chữ hoa, chữ số và dấu gạch dưới.',
    value: 'Giá trị',
    valueTooLong: 'Giá trị lớn hơn 8 KB.',
    keepValueHint: 'Để trống để giữ giá trị hiện tại.',
    teamRunnersOnly: 'Chỉ môi trường chạy của nhóm',
    teamRunnersOnlyHint:
      'Nếu không có nó, một lần chạy sẽ gửi giá trị đến môi trường chạy thực hiện nó, bao gồm cả môi trường chạy cá nhân của bất kỳ ai có thể sử dụng Agent. Với nó, chỉ có môi trường chạy nhóm mới thực hiện các lần chạy có biến này.',
    teamRunnersOnlyBadge: 'Chỉ môi trường chạy của nhóm',
    fromRunner: 'Lấy từ môi trường chạy',
    fromRunnerHint:
      'Không có giá trị nào được giữ ở đây: môi trường chạy thực hiện một lần chạy cung cấp giá trị đó từ máy của chính nó, được đặt ở đó bằng {{command}} hoặc được truyền bằng `--pass-env`. Một môi trường chạy không cung cấp nó sẽ không chạy được trước khi bắt đầu.',
    fromRunnerBadge: 'Từ môi trường chạy',
    valueRequired:
      'Nhập một giá trị hoặc tiếp tục lấy giá trị đó từ môi trường chạy.',
    empty: 'Không có biến môi trường.',
    scope: 'Phạm vi',
    updated: 'Đã cập nhật',
    actionsHead: 'Thao tác',
    edit: 'Thay thế giá trị',
    actions: 'Hành động dành cho {{name}}',
    accessLog: 'Nhật ký truy cập',
    accessLogAll: 'Xem nhật ký truy cập đầy đủ',
    accessLogOf: 'Nhật ký truy cập của {{name}}',
    accessLogDescription:
      'Ai đã xem, đặt hoặc xóa các biến và thời điểm cũng như lần chạy nào đã nhận được chúng.',
    delete: 'Xóa',
    deleteTitle: 'Xóa {{name}}?',
    deleteDescription: 'Chạy sau này không còn nhận được biến.',
    deleteConfirm: 'Xóa',
    deleted: 'Đã xóa {{name}}.',
    saved: 'Đã lưu {{name}}.',
    updatedBy: '{{name}} · {{time}}',
    reveal: 'Tiết lộ giá trị',
    revealTitle: 'Tiết lộ giá trị?',
    revealAudit:
      'Việc tiết lộ được ghi lại trong nhật ký truy cập cùng với tên và thời gian của bạn.',
    revealedTitle: 'Giá trị biến',
    revealedNote: 'Tiết lộ này đã được ghi lại. Đóng nó khi bạn làm xong.',
    runner: 'Thời gian chạy {{id}}',
    auditsEmpty: 'Chưa có gì được ghi lại.',
    auditAction: {
      reveal: 'tiết lộ',
      set: 'bộ',
      delete: 'đã xóa',
      deliver: 'nhận được cho một lần chạy',
    },
    nameProblems: {
      required: 'Nhập tên.',
      pattern:
        'Chỉ sử dụng chữ in hoa, chữ số và dấu gạch dưới, không bắt đầu bằng chữ số.',
      reserved: 'Tên này được bảo lưu.',
      duplicate: 'Một biến có tên này tồn tại; thay vào đó hãy chỉnh sửa nó.',
    },
  },
  scopeVariables: {
    title: 'Các biến và bí mật',
    description:
      'Trao cho mọi Agent làm việc ở đây. Các biến cụ thể hơn (của thư mục làm việc, sau đó của Agent) sẽ vượt qua được những biến này.',
  },
  scopes: {
    workdir: 'Thư mục làm việc',
  },
  subjects: {
    conversation: 'Cuộc trò chuyện',
    consultation: 'Tư vấn',
  },
  usage: {
    otherUse: {
      title: 'Sử dụng mô hình khác',
      description:
        'Mô hình gọi các hoạt động Agent bên ngoài, chẳng hạn như lập chỉ mục và tìm kiếm cơ sở kiến thức.',
      purpose: 'Sử dụng',
      source: 'Được hỏi bởi',
      model: 'Mô hình',
      calls: 'Cuộc gọi',
      units: 'Vật phẩm',
      purposes: {
        embedding: 'Nhúng',
        rerank: 'Sắp xếp lại',
        text: 'Văn bản tiện ích',
      },
    },
    title: 'Mức sử dụng',
    description:
      'Agent nào đang chạy đã được sử dụng và giá của chúng ở mức giá mẫu hiện tại.',
    loadFailed: 'Không thể tải việc sử dụng',
    groupBy: 'Nhóm theo',
    groupByValue: 'Nhóm bởi {{group}}',
    empty: 'Không có hoạt động nào trong giai đoạn này.',
    total: 'Tổng cộng',
    noGroup: 'Không có',
    unknown: 'Không rõ',
    onlineTool: 'Trực tuyến (dịch vụ mẫu)',
    setPrices: 'Thiết lập giá',
    chart: {
      title: 'Xu hướng hàng ngày',
      metric: 'Hiển thị',
      cost: 'Chi phí',
      tokens: 'Mã thông báo',
      total: 'Tổng cộng',
      other: 'Khác',
    },
    pricedNote:
      'Chi phí bao gồm {{priced}} của số lần chạy {{total}}; các mẫu này chưa có giá: {{models}}.',
    filters: {
      allGroups: 'Tất cả: {{group}}',
      agent: 'Tác nhân',
      allAgents: 'Tất cả Agents',
      person: 'Bị đánh thức bởi',
      allPeople: 'Mọi người',
      range: 'Phạm vi ngày',
      presets: 'Phạm vi nhanh',
    },
    presets: {
      last7: '7 ngày qua',
      last30: '30 ngày qua',
      thisMonth: 'Tháng này',
      lastMonth: 'Tháng trước',
      last90: '90 ngày qua',
    },
    groups: {
      agent: 'Tác nhân',
      person: 'Bị đánh thức bởi',
      group: 'Nhóm',
      subject: 'Chủ đề',
      day: 'Ngày',
      model: 'Mô hình',
      tool: 'Công cụ mã hóa',
      type: 'Loại tác nhân',
    },
    columns: {
      runs: 'Lượt chạy',
      duration: 'Thời lượng',
      input: 'Đầu vào',
      output: 'Đầu ra',
      cacheRead: 'Đọc bộ nhớ đệm',
      cacheWrite: 'Ghi vào bộ nhớ đệm',
      cost: 'Chi phí dự kiến',
    },
  },
  defaultSkills: {
    title: 'Kỹ năng mặc định',
    description: 'Mọi Agent làm việc ở đây đều có những kỹ năng này.',
    save: 'Lưu kỹ năng',
    saved: 'Đã lưu các kỹ năng mặc định.',
  },
  runs: {
    title: 'Nhật ký thực hiện',
    empty: 'Chưa có lượt chạy nào.',
    loadFailed: 'Không thể tải nhật ký thực thi',
    unknownAgent: 'Tác nhân',
    attempt: 'thử {{attempt}} của {{max}}',
    viewTranscript: 'Xem bản ghi',
    transcriptTitle: 'Bản ghi lượt chạy',
    viewAll: 'Xem tất cả {{count}}',
    allTitle: 'Tất cả các lần chạy ({{count}})',
    filters: {
      agent: 'Tác nhân',
      status: 'Trạng thái',
      allAgents: 'Tất cả Agents',
      allStatuses: 'Tất cả trạng thái',
    },
    noMatch: 'Không có lượt chạy nào phù hợp với các bộ lọc này.',
    cancel: 'Dừng',
    stopping: 'Dừng lại…',
    cancelTitle: 'Dừng cuộc chạy này?',
    cancelDescription: '{{name}} sẽ bị dừng. Những gì nó đã thay đổi vẫn còn.',
    cancelRequested: 'Yêu cầu dừng',
    retry: 'Thử lại',
    retried: 'Lượt chạy được đưa vào hàng đợi trở lại',
    viewBrief: 'Xem toàn bộ lời nhắc',
    briefTitle: 'Lời nhắc đầy đủ',
    briefDescription:
      'Những gì Agent đã được thông báo khi lần chạy này được yêu cầu lần cuối.',
    briefOf: 'Thử {{attempt}}, đã xác nhận {{time}}',
    briefUnavailable: 'Không có lời nhắc đầy đủ cho lần chạy này.',
    processDataCleared:
      'Dữ liệu quá trình chạy đã bị xóa theo chính sách lưu giữ.',
    briefFailed: 'Không thể tải toàn bộ lời nhắc',
    workspaceReset: {
      button: 'Làm sạch thư mục làm việc',
      title: 'Làm sạch thư mục làm việc?',
      description:
        'Lần chạy tiếp theo bắt đầu từ lần thanh toán mới và được đưa ra lời nhắc khởi tạo lại. Những thay đổi không được đẩy sẽ bị mất trong môi trường chạy đó. Một thư mục được sử dụng tại chỗ sẽ không bao giờ bị xóa.',
      confirm: 'Sạch sẽ',
      done: 'Lần chạy tiếp theo bắt đầu từ lần thanh toán mới.',
    },
    stateChanged: 'Trạng thái chạy đã thay đổi. Nhật ký đã được làm mới.',
    status: {
      queued: 'Đã xếp hàng',
      dispatched: 'Đã gửi đi',
      running: 'Đang chạy',
      completed: 'Lượt kết thúc',
      failed: 'Thất bại',
      cancelled: 'Đã hủy',
      cancelling: 'Dừng lại',
    },
    trigger: {
      retry: 'Thử lại',
      message: 'Tin nhắn',
      consultation: 'Tư vấn',
    },
    activity: {
      queued: '{{name}} đã được xếp hàng',
      dispatched: '{{name}} đang bắt đầu',
      running: '{{name}} bắt đầu hoạt động',
      completed: '{{name}} đã kết thúc lượt của mình',
      failed: '{{name}} không thành công',
      cancelled: '{{name}} đã bị dừng',
    },
    live: {
      working: '{{name}} đang hoạt động',
      workingFor: '{{name}} đang hoạt động · {{minutes}} phút',
      queued: '{{name}} đang được xếp hàng đợi',
    },
  },
  transcript: {
    title: 'Bản ghi lượt chạy',
    notFound: 'Hoạt động này không tồn tại.',
    waiting: 'Đang chờ Agent bắt đầu…',
    empty: 'Lần chạy này không ghi nhận sự kiện nào.',
    fetchFailed: 'Không thể tìm nạp sự kiện mới. Đang thử lại…',
    expand: 'Hiển thị tất cả',
    truncated: 'Cắt ngắn: toàn văn quá dài để giữ lại.',
    summary_one: 'Đã tạo sự kiện {{created}} · {{count}}',
    summary_other: 'Đã tạo sự kiện {{created}} · {{count}}',
    took: 'lấy {{duration}}',
    pendingInputs_one: '{{count}} bình luận chờ Agent',
    pendingInputs_other: '{{count}} bình luận chờ Agent',
    inputDelivered_one: 'Giao cho Agent',
    inputDelivered_other: 'Đầu vào {{count}} được gửi tới Agent',
    tokens: 'Đầu vào mã thông báo {{input}}, đầu ra {{output}}',
    kinds: {
      text: 'Tác nhân',
      thinking: 'Suy nghĩ',
      toolUse: 'Công cụ',
      toolResult: 'Kết quả',
      allowed: 'Được phép',
      denied: 'Từ chối',
      input: 'Đầu vào',
      checkout: 'Thanh toán',
      status: 'Trạng thái',
      error: 'Lỗi',
      usage: 'Cách sử dụng',
    },
  },
  failures: {
    runnerUpgrade:
      'Bị gián đoạn khi cập nhật máy thực thi; cuộc chạy sẽ tiếp tục.',
    runnerDiskFull: 'Máy thực thi đã hết dung lượng đĩa.',
    runnerOfflineBeforeStart:
      'Thời gian chạy ngoại tuyến trước khi bắt đầu chạy.',
    runnerOffline: 'Thời gian chạy ngoại tuyến.',
    leaseExpired: 'Thời gian chạy đã ngừng báo cáo.',
    startTimeout: 'Thời gian chạy không bắt đầu chạy đúng lúc.',
    cancelled: 'Đã hủy.',
    idleTimeout: 'Agent ngừng tiến triển.',
    setupFailed: 'Không thể chuẩn bị được cuộc chạy.',
    cliUnavailable: 'Thời gian chạy không thể cài đặt ứng dụng CLI.',
    workspaceBusy: 'Thư mục làm việc đang bận; chờ đợi một nỗ lực khác.',
    checkoutFailed: 'Việc kiểm tra kho lưu trữ không thành công.',
    toolAuth: 'Công cụ mã hóa không được đăng nhập trong môi trường chạy.',
    toolQuota: 'Công cụ mã hóa đã hết hạn ngạch.',
    sessionUnavailable:
      'Không thể tiếp tục phiên ban đầu của công cụ lập trình.',
    toolRateLimit: 'Công cụ mã hóa bị giới hạn tốc độ.',
    toolNetwork: 'Công cụ mã hóa không thể tiếp cận dịch vụ của nó.',
    toolProcess: 'Công cụ mã hóa thoát bất ngờ.',
    contextOverflow: 'Cuộc trò chuyện kéo dài quá lâu đối với người mẫu.',
    delegatedQueueTimeout: 'Hết thời gian xếp hàng đại biểu; rút tiền',
    queuedExpired: 'Không có môi trường chạy nào được thực hiện kịp thời.',
    modelUnavailable: 'Không có mô hình của Agent.',
    stepLimit: 'Agent gọi tool quá nhiều lần mà không trả lời.',
    policyRefused:
      'Không có chính sách nào của môi trường chạy cho phép nó thực hiện công việc này.',
    prepareNetwork:
      'Thời gian chạy không thể tiếp cận máy chủ lưu trữ trong khi chuẩn bị chạy.',
    repoAccessUnavailable: 'Tạm thời không thể truy cập kho mã.',
    repoAccessDenied:
      'Ứng dụng sẽ không cấp thông tin xác thực cho một trong các kho lưu trữ của lần chạy.',
    unknown: 'Việc chạy không thành công.',
  },
  runtimes: {
    pathHint:
      'Runner tìm công cụ lập trình bằng PATH của chính nó. Trong terminal mà which codex / which claude hoạt động, hãy chạy lại nocobase-runner service install và khởi động lại dịch vụ (hoặc chạy lại nocobase-runner start) để nó nhận đúng PATH.',
    quota: {
      ceilingReached: 'Đã đạt ngưỡng hạn mức',
      ceilingLabel: 'Tạm dừng tại',
      ceilingInput: 'Tạm dừng công việc {{tool}} mới khi đạt phần trăm đã dùng',
      ceilingSave: 'Áp dụng',
      ceilingInvalid: 'Nhập phần trăm nguyên từ 1 đến 100 hoặc để trống.',
      ceilingPaused:
        'Một cửa sổ hạn mức đã chạm ngưỡng; công việc mới liên quan chờ đặt lại hoặc thay đổi ngưỡng.',

      workspaceStatus: {
        active: 'Công việc vẫn tiếp tục',
        ended: 'Đã kết thúc · cho phép dọn dẹp',
        checks: 'Đã kết thúc · đang chờ kiểm tra',
        inUse: 'Giữ lại: đang sử dụng',
        changed: 'Được giữ lại: tái sử dụng',
        trackedChanges: 'Được giữ lại: các tệp không được cam kết',
        unpushed: 'Được giữ lại: tác phẩm chưa được đẩy',
        missingEvidence: 'Được giữ lại: cần xác minh',
        gitFailed: 'Được giữ lại: Kiểm tra Git không thành công',
        runNotFound: 'Giữ lại: không tìm thấy chạy',
        ownershipUnknown: 'Giữ lại: chủ sở hữu chưa được xác minh',
        ambiguousSubject: 'Được giữ lại: nhiệm vụ mơ hồ',
        bindingUnavailable: 'Được giữ lại: không có ràng buộc',
        subjectUnknown: 'Được giữ lại: nhiệm vụ không xác định',
        unknown: 'Giữ lại: chưa được xác minh',
      },
      usageLimit: 'Giới hạn sử dụng',
      shortReset: 'đặt lại {{time}}',
      shortUnknown: 'đặt lại không xác định',
      automatic: 'Tự xóa khi thiết lập lại.',
      since: 'kể từ {{time}}',
      marks_one: 'Dấu hạn ngạch {{count}}',
      marks_other: 'Dấu hạn ngạch {{count}}',
      queueHint:
        'Một Agent đạt hạn ngạch vẫn có thể được chọn. Công việc sẽ xếp hàng với thời hạn chờ đợi hiện có.',
      partial: 'Chạy trên {{available}} · {{blocked}} theo hạn ngạch',
      workspaceSize: 'Kích thước không gian làm việc: {{value}}',
      providers_one: 'Nhà cung cấp {{count}} đạt hạn ngạch',
      providers_other: 'Nhà cung cấp {{count}} theo hạn ngạch',
      models_one: '{{count}} mô hình hết hạn ngạch',
      models_other: '{{count}} mô hình hết hạn ngạch',
      percent: '{{percent}}%',
      runColumns: {
        issue: 'Nhiệm vụ / cuộc trò chuyện',
        agent: 'Tác nhân',
        status: 'Trạng thái',
        started: 'Đã bắt đầu',
        duration: 'Thời lượng',
      },
      filter: {
        all: 'Tất cả',
        active: 'Đang hoạt động',
        retained: 'Được giữ lại',
        ended: 'Đã kết thúc',
      },
      columns: {
        directory: 'Thư mục/tác vụ',
        type: 'Loại',
        size: 'Kích thước',
        push: 'Trạng thái đẩy',
        status: 'Trạng thái',
        lastUsed: 'Lần sử dụng cuối cùng',
      },
      previous: 'Trước',
      next: 'Tiếp theo',
      working: 'Đang làm việc',
      readOnly: 'Bản sao chỉ đọc',
      clean: 'Sạch sẽ',
      unpushed: 'Không bị đẩy',
      overview: 'Tổng quan',
      workspaces: 'Không gian làm việc',
      runs: 'Lượt chạy',
      title: 'Hạn ngạch',
      reached: 'Đã đạt hạn ngạch',
      unknown: 'Thời gian đặt lại không xác định',
      resets: 'Đặt lại {{time}}',
      near: 'Gần đến giới hạn',
      clear: 'Xóa',
      clearMark: 'Xóa dấu',
      confirmTitle: 'Xóa dấu hạn ngạch của {{target}}?',
      confirm:
        'Chỉ xóa sau khi xác nhận hạn ngạch đã được khôi phục. {{target}} nhận việc trở lại ngay; nếu hạn ngạch vẫn hết, lần chạy tiếp theo sẽ đánh dấu lại.',
      observed: '{{time}} được báo cáo lần cuối',
      usedPercent: '{{percent}}% đã sử dụng',
      noUsage: 'Chưa có dữ liệu hạn mức',
      hint: 'Dấu tự xóa vào thời điểm đặt lại đã biết, hoặc khi công cụ báo lại còn hạn ngạch. Chỉ xóa thủ công sau khi xác nhận hạn ngạch đã được khôi phục. Chỉ chủ sở hữu môi trường chạy và quản trị viên mới có thể xóa dấu.',
    },
    workspaces: {
      paused:
        'Công việc mới bị tạm dừng cho đến khi dung lượng ổ đĩa được phục hồi. Các hoạt động hiện tại vẫn tiếp tục.',
      working: 'Loại: Thư mục làm việc',
      readOnly: 'Loại: Bản sao chỉ đọc',
      size: 'Kích thước: {{value}}',
      pushed: 'Trạng thái đẩy: Sạch sẽ, không có công việc nào chưa được đẩy',
      unpushed:
        'Trạng thái đẩy: Công việc chưa được cam kết, chưa được đẩy hoặc chưa được xác minh',
      notApplicable: 'Trạng thái đẩy: Không áp dụng',
      title: 'Chẩn đoán không gian làm việc',
      low: 'Dung lượng đĩa thấp',
      previousLow: 'Báo cáo cuối cùng: dung lượng ổ đĩa thấp',
      notReported: 'Chưa nhận được báo cáo không gian làm việc',
      diskUnknown: 'Không thể đo được dung lượng ổ đĩa',
      thresholdOff:
        'Không có cảnh báo không gian trống tối thiểu được cấu hình',
      free: 'Dung lượng trống: {{value}}',
      threshold: 'Dung lượng trống tối thiểu: {{value}}',
      reportedAt: 'Báo cáo lần cuối: {{time}}',
      stale:
        'Đây là những bài đọc trước đây; dung lượng ổ đĩa hiện tại không được xác nhận.',
      empty: 'Không có thư mục làm việc trong báo cáo mới nhất',
      ended: 'Đã kết thúc',
      active: 'Công việc vẫn tiếp tục',
      unknown: 'Không thể xác nhận liệu công việc đã kết thúc hay chưa',
      oldRunner: 'Trình chạy này chưa cung cấp lý do chẩn đoán',
      noCleanup: 'Chưa nhận được kết quả dọn dẹp cục bộ',
      discardsUntracked: 'Dọn dẹp sẽ loại bỏ các tập tin không bị theo dõi',
      decision: {
        settled: 'Công việc kết thúc; cần phải kiểm tra dọn dẹp cục bộ',
        active: 'Công việc vẫn tiếp tục',
        runNotFound: 'Không thể xác nhận: không tìm thấy chạy',
        ownershipUnknown:
          'Không thể xác nhận: không thể xác minh quyền sở hữu của môi trường chạy',
        ambiguousSubject: 'Không thể xác nhận: khóa chủ đề không rõ ràng',
        bindingUnavailable:
          'Không thể xác nhận: ứng dụng không có ràng buộc không gian làm việc',
        subjectUnknown:
          'Không thể xác nhận: ứng dụng không thể giải quyết được chủ đề',
      },
      cleanup: {
        allowed: 'Đã kết thúc; cho phép dọn dẹp',
        inUse: 'Được giữ lại: thư mục đang được sử dụng',
        changed: 'Được giữ lại: thư mục đã được sử dụng lại',
        trackedChanges:
          'Được giữ lại: các tệp được theo dõi có những thay đổi không được cam kết',
        unpushed:
          'Được giữ lại: các cam kết chưa được thực hiện hoặc các đối tượng cam kết cục bộ không đủ',
        missingEvidence: 'Được giữ lại: bằng chứng cam kết không đầy đủ',
        gitFailed: 'Được giữ lại: Kiểm tra Git không thành công',
      },
    },
    title: 'Môi trường chạy',
    description:
      'Thời gian chạy chạy Agents và từng công cụ mã hóa được báo cáo.',
    add: 'Thêm môi trường chạy',
    loadFailed: 'Không thể tải môi trường chạy',
    emptyTitle: 'Chưa có môi trường chạy nào được kết nối',
    emptyDescription:
      'Sau khi môi trường chạy được kết nối, các Agents chạy sẽ đảm nhận công việc ở đó bằng các công cụ mã hóa của nó.',
    noneConnected: 'Không có môi trường chạy nào được kết nối.',
    revokedList_one: '{{count}} đã thu hồi môi trường chạy',
    revokedList_other: '{{count}} đã thu hồi môi trường chạy',
    lastSeen: 'Nhìn thấy lần cuối {{time}}',
    activity: {
      online: 'Trực tuyến {{active}}/{{slots}}',
      busy: 'Bận {{active}}/{{slots}}',
      low_disk: 'Dung lượng ổ đĩa thấp {{active}}/{{slots}}',
      offline: 'Ngoại tuyến · {{time}}',
      offlineNever: 'Ngoại tuyến',
    },
    toolUsage: {
      label: 'Chạy bằng công cụ mã hóa',
      item: '{{tool}} {{used}}/{{limit}}',
    },
    toolSlots: {
      label: 'Giới hạn cho mỗi công cụ mã hóa',
      hint: 'Cần bao nhiêu lần chạy mỗi công cụ mã hóa cùng một lúc, chẳng hạn như ít hơn đối với một công cụ có đăng ký cho phép ít phiên hơn. Để trống một ô để chỉ giới hạn nó bằng các lần chạy đồng thời.',
      none: 'Không giới hạn',
      invalid: 'Nhập các số nguyên từ 1 đến 64 hoặc để trống.',
      inputLabel: 'Chạy {{tool}} cùng một lúc',
      overTotal:
        'Giới hạn của {{tools}} cao hơn số lần chạy đồng thời tối đa ({{slots}}): nhiều nhất là {{slots}} chạy cùng một lúc.',
      noneChecked: 'Kiểm tra công cụ mã hóa ở trên để hạn chế.',
    },
    toolTable: {
      tool: 'Công cụ',
      enabled: 'Bật',
      state: 'Trạng thái',
      limit: 'Ngay lập tức',
      active: 'Đang chạy',
    },
    policy: {
      title: 'Chính sách địa phương',
      description:
        'Chủ sở hữu môi trường chạy cho phép nó lấy những gì, như đã báo cáo. Nó được thay đổi trên máy chứ không phải ở đây.',
      none: 'Không có chính sách địa phương: thực hiện bất kỳ công việc nào được đăng ký.',
      any: 'Bất kỳ',
      nothing: 'Không có',
      agents: 'Tác nhân',
      subjects: 'Đối tượng',
      repos: 'Kho mã',
    },
    variables: {
      title: 'Biến từ máy này',
      description:
        'Các biến mà nó cung cấp để chạy lấy chúng từ môi trường chạy, theo tên; các giá trị vẫn còn trên máy. Đặt một cái ở đó với `nocobase-runner env set NAME` hoặc chuyển nó bằng `--pass-env NAME`.',
      none: 'Không: một lần chạy lấy một biến từ môi trường chạy không thành công ở đây trước khi nó bắt đầu.',
      unknown:
        'Không được báo cáo: nhân vật chạy của nó cũ hơn tính năng này. Cập nhật môi trường chạy để xem chúng.',
    },
    jobs: {
      allow: 'Cho phép xây dựng công việc',
      hint: 'Bản dựng và các bước khác mà ứng dụng này định cấu hình, chạy mà không cần mô hình. Báo cáo môi trường chạy này: {{kinds}}.',
      unsupported:
        'Trình chạy của môi trường chạy này không nhận công việc. Cập nhật môi trường chạy để bật tính năng này.',
    },
    noTools: 'Không tìm thấy công cụ mã hóa',
    actionsFor: 'Hành động dành cho {{name}}',
    columns: {
      name: 'Tên',
      status: 'Trạng thái',
      tools: 'Công cụ',
      sharing: 'Chia sẻ',
      version: 'Trình chạy',
      lastSeen: 'Nhìn thấy lần cuối',
      slots: 'Chạy đồng thời tối đa',
    },
    detail: {
      general: 'Đại tướng',
      tools: 'Công cụ',
      toolsDescription:
        'Các công cụ mã hóa được báo cáo. Công việc cho một công cụ không hoạt động hoặc đã hết hạn ngạch sẽ không được gửi ở đây. Các công tắc và giới hạn được lưu bằng nút “Save”.',
      version: 'Á quân {{version}}',
      runs: 'Các lần chạy gần đây',
      runsEmpty: 'Chưa có lượt chạy nào.',
      runsTotal: '{{count}} lượt chạy',
      runsPagination: 'Phân trang lịch sử',
      runsPrevious: 'Trước',
      runsNext: 'Tiếp',
      runsPage: 'Trang {{page}} / {{pageCount}}',
      runsFailed: 'Không thể tải các lượt chạy của nó.',
      readOnly: 'Chỉ có chủ nhân của nó mới có thể thay đổi nó.',
      owner: 'Chủ sở hữu {{name}}',
    },
    status: {
      updatePending: 'Á hậu chờ cập nhật',
      pruning: 'Á hậu dọn dẹp cửa hàng chung',
      online: 'Trực tuyến',
      offline: 'Ngoại tuyến',
      revoked: 'Đã thu hồi',
      upgrade_required: 'Yêu cầu nâng cấp',
    },
    upgradeRequired: {
      title: 'Thời gian chạy này cần nâng cấp',
      older:
        'Trình chạy {{version}} của nó nói giao thức Agent {{protocol}}; ứng dụng này cần giao thức {{required}}. Nó vẫn được kết nối nhưng không chạy gì cho đến khi được cập nhật.',
      newer:
        'Trình chạy {{version}} của nó nói giao thức Agent {{protocol}}, mới hơn ứng dụng này (giao thức {{required}}). Nó vẫn được kết nối nhưng không chạy gì cho đến khi chạy một môi trường chạy mà ứng dụng này phục vụ.',
      latest:
        'Ứng dụng này phục vụ Á hậu {{latest}}. Chạy cái này trên máy chủ của nó để cập nhật nó:',
      noLatest:
        'Cài đặt môi trường chạy nói giao thức {{required}} hoặc chạy môi trường chạy này trên máy chủ của nó để cập nhật:',
      reinstall:
        'Trình chạy của nó không nói nó được cài đặt như thế nào. Cài đặt lại nó trên máy chủ của nó bằng lệnh từ Thêm môi trường chạy.',
    },
    tool: {
      checking: 'Đang chờ phát hiện',
      failed: 'Phát hiện thất bại',
      redetect: 'Phát hiện lại',
      notProvided: 'Không được cung cấp',
      signedIn: 'Đã đăng nhập',
      signedOut: 'Chưa đăng nhập',
      notInstalled: 'Chưa được cài đặt',
      off: 'Tắt',
      offHint:
        'Tắt: công việc cho công cụ này không được gửi tới môi trường chạy này.',
      enableLabel: 'Chạy {{tool}} trên {{name}}',
      version: 'Phiên bản {{version}}',
    },
    trust: {
      isolationHint:
        'Với cả môi trường chạy cá nhân lẫn dùng chung, hãy chạy runner trong máy ảo hoặc môi trường cô lập: Agent có toàn quyền truy cập và runner không phải hộp cát.',
      label: 'Nó phù hợp với ai',
      team: 'Đội',
      teamHint:
        'Mọi người trong nhóm đều bắt đầu công việc, với các biến số và bí mật của họ. Dành cho máy chủ và máy ảo dùng chung.',
      ownerOnly: 'Cá nhân',
      ownerOnlyHint:
        'Chỉ chạy công việc bạn bắt đầu. Giá trị mặc định cho môi trường chạy mà bạn thêm vào.',
      personalOnly:
        'Thời gian chạy này sẽ mang tính cá nhân: nó chỉ chạy công việc bạn bắt đầu. Bạn có thể chia sẻ nó với nhóm sau.',
    },
    share: {
      title: 'Chia sẻ {{name}} với nhóm?',
      description:
        'Các lần chạy của người khác sẽ chạy trong môi trường chạy này, với các biến và bí mật của họ, đồng thời có thể đọc nội dung trên đó. Chỉ chia sẻ nó nếu điều đó tốt.',
      confirm: 'Chia sẻ với nhóm',
    },
    edit: {
      button: 'Chỉnh sửa',
      title: 'Chỉnh sửa {{name}}',
      name: 'Tên',
      nameRequired: 'Nhập tên.',
      slotsHint: 'Thời gian chạy mất bao nhiêu lần cùng một lúc.',
      slotsInvalid: 'Nhập số nguyên từ 1 đến 64.',
      saved: 'Đã lưu {{name}}',
    },
    upgrade: {
      show: 'Phiên bản {{version}}: đã có phiên bản mới hơn',
      available: 'Đã có bản cập nhật',
      badge: 'Có thể nâng cấp',
      latest: 'Mới nhất',
      installed: 'Phiên bản {{version}}',
      title: 'Á hậu mới hơn cho {{name}}',
      description: 'Đã cài đặt {{version}}, ứng dụng này phục vụ {{latest}}.',
      hint: 'Nó tự cập nhật khi không có Agent nào đang chạy. Để cập nhật nó ngay bây giờ, hãy chạy cái này trên máy chủ của nó.',
    },
    revoke: {
      title: 'Thu hồi thông tin xác thực của {{name}}?',
      description:
        'Á hậu của nó dừng lại ở yêu cầu tiếp theo và các lần chạy của nó quay trở lại hàng đợi. Để kết nối lại, hãy thêm lại môi trường chạy.',
      confirm: 'Thu hồi',
      done: 'Đã thu hồi thông tin xác thực của {{name}}',
    },
    delete: {
      title: 'Xóa {{name}}?',
      description:
        'Thời gian chạy bị thu hồi sẽ bị xóa khỏi danh sách. Quá khứ của nó chạy ở lại.',
      confirm: 'Xóa',
      done: 'Đã xóa {{name}}',
    },
  },
  connect: {
    manual: 'Hoặc tự cài đặt',
    promptTitle: 'Để Agent thiết lập',
    promptCopy: 'Sao chép lời nhắc cho Agent',
    promptShow: 'Xem lời nhắc',
    promptHide: 'Ẩn lời nhắc',
    promptHint:
      'Sao chép lời nhắc này cho một Agent (Claude Code, Codex, v.v.) trên máy đích, Agent sẽ thực hiện các bước bên dưới thay bạn. Lời nhắc chứa thông tin xác thực dùng một lần: chỉ đưa cho Agent đó.',
    windowsPowerShell:
      '1. Cài đặt WSL: chạy trong PowerShell, rồi khởi động lại Windows:',
    windowsUbuntu:
      '2. Mở Ubuntu và chạy lệnh Linux bên dưới. Cài Node.js và các công cụ lập trình bên trong WSL Ubuntu.',
    windowsNetwork:
      'Nếu WSL không truy cập được internet, hãy bật chế độ mạng phản chiếu trong WSL.',
    promptWindows:
      'TRƯỚC TIÊN, hãy xác định bạn có đang chạy bên trong WSL Ubuntu không. Nếu KHÔNG ở trong WSL Ubuntu, hãy DỪNG LẠI: không chạy bất kỳ lệnh cài đặt hay đăng ký nào. Hãy bảo người dùng chạy wsl --install trong PowerShell, khởi động lại Windows, rồi mở Agent bên trong WSL Ubuntu và chạy lại lời nhắc này. CHỈ tiếp tục các bước bên dưới bên trong WSL Ubuntu. Cài cả Node.js và các công cụ lập trình bên trong WSL. Nếu WSL không truy cập được internet, hãy bật chế độ mạng phản chiếu.\n\n',
    promptBody:
      'Thiết lập máy này làm môi trường chạy NocoBase. Hãy dùng máy ảo hoặc môi trường cô lập: Agent có toàn quyền truy cập và runner không phải hộp cát.\n\nKiểm tra có Node.js 24 trở lên và các công cụ lập trình sau đã được cài đặt và đăng nhập: {{tools}}. Dùng cách cài đặt chính thức của chúng, không dùng gói snap.\n\nChạy lệnh đăng ký dùng một lần này để cài runner và CLI của ứng dụng, đăng ký và cài dịch vụ nền của nó:\n{{command}}\n\nKhắc phục các sự cố thiết lập thường gặp: đảm bảo PATH của dịch vụ chứa các công cụ lập trình (kiểm tra which codex / which claude trong terminal cài đặt, rồi chạy lại nocobase-runner service install và khởi động lại dịch vụ); cấu hình proxy cần thiết cho việc tải xuống và cho dịch vụ; xử lý quyền cài đặt npm toàn cục bằng prefix thuộc người dùng hoặc trình quản lý phiên bản Node, không dùng sudo npm install.\n\nKết thúc bằng nocobase-runner status và xác nhận kết nối cùng các công cụ lập trình. Báo cho tôi các bước đăng nhập hoặc mạng còn lại cần tôi hoàn tất. Coi thông tin xác thực đăng ký là bí mật và không đưa vào báo cáo.',
    title: 'Thêm môi trường chạy',
    description:
      'Chạy lệnh bên dưới trên máy chủ đã cài đặt công cụ mã hóa: máy chủ, VM hoặc thiết bị của riêng bạn. Các tác nhân chạy ở đó với toàn quyền truy cập, với tư cách là người dùng chạy môi trường chạy, đồng thời có thể đọc và thay đổi bất kỳ thứ gì mà người dùng có thể, bao gồm cả khóa SSH và các thông tin xác thực khác. Trình chạy không phải là ranh giới bảo mật: chạy nó với tư cách là người dùng chuyên dụng, trong vùng chứa hoặc trong máy ảo.',
    createCredential: 'Tạo lệnh cài đặt',
    advanced: 'Nâng cao: giới hạn cho mỗi công cụ mã hóa',
    run: 'Chạy cái này trên máy chủ đó. Nó tải xuống môi trường chạy (nocobase-runner) và CLI của ứng dụng này từ ứng dụng này, đăng ký môi trường chạy và khởi động nó khi đăng nhập:',
    nodeRequired:
      'Máy chủ cần Node.js 24 trở lên (kiểm tra bằng nút --version). Lệnh dừng và cho biết cách cài đặt khi thiếu.',
    installed: 'Đã cài đặt nocobase-runner chưa? Đăng ký nó thay thế:',
    tokenOnce:
      'Lệnh mang thông tin xác thực một lần cho môi trường chạy "{{trust}}". Nó hoạt động một lần, cho đến {{time}}.',
    after:
      'Trong vài giây, môi trường chạy xuất hiện trong danh sách, với mỗi công cụ mã hóa được tìm thấy…',
    tokenTools: 'Công cụ mã hóa: {{tools}}.',
    tools: 'Công cụ mã hóa',
    toolsHint:
      'Thời gian chạy này chỉ được cung cấp cho các công cụ đã được kiểm tra. Bạn có thể thay đổi nó trên trang Runtimes bất cứ lúc nào.',
    toolsRequired: 'Chọn ít nhất một công cụ mã hóa.',
    slots: 'Chạy đồng thời tối đa',
    slotsHint:
      'Thời gian chạy mất bao nhiêu lần cùng một lúc. Bạn có thể thay đổi nó trên trang Runtimes bất cứ lúc nào.',
    tokenSlots: 'Số lần chạy đồng thời tối đa: {{slots}}.',
    tokenToolSlots: 'Mỗi công cụ mã hóa: {{limits}}.',
    connected: '{{name}} được kết nối.',
    done: 'Hoàn thành',
    system: {
      macos: 'macOS',
      linux: 'Linux',
      windows: 'Windows',
    },
  },
  chat: {
    // Keep new guidance available in English until this locale is translated.
    executionFailed:
      'Thực thi thất bại. Hãy xem lại cuộc trò chuyện đã lưu trước khi thử lại.',
    fileInputFailures: {
      imageCapability:
        'Mô hình này chưa được cấu hình nhận hình ảnh. Hãy chuyển sang mô hình đã xác minh hỗ trợ hình ảnh.',
      unsupportedFormat:
        'Mô hình đã chọn chưa được cấu hình nhận định dạng tệp đính kèm này và không có trình trích xuất văn bản cục bộ nào hỗ trợ. Hãy dùng định dạng tài liệu được hỗ trợ hoặc mô hình đã xác minh hỗ trợ tệp.',
      formatMismatch:
        'Tên tệp đính kèm và loại nội dung chỉ ra hai định dạng tài liệu khác nhau. Hãy kiểm tra định dạng tệp rồi tải lên lại.',
      invalidInline:
        'Dữ liệu tệp đính kèm không hợp lệ hoặc quá lớn. Hãy tải tệp lên lại hoặc dùng tệp nhỏ hơn.',
      fileTooLarge:
        'Một tệp đính kèm vượt quá giới hạn dung lượng. Hãy dùng tệp nhỏ hơn.',
      inputTooLarge:
        'Các tệp đính kèm của cuộc trò chuyện vượt quá giới hạn đầu vào. Hãy dùng tệp nhỏ hơn hoặc bắt đầu cuộc trò chuyện mới.',
      documentTooLarge:
        'Tệp đính kèm vượt quá giới hạn văn bản trích xuất. Hãy dùng tệp nhỏ hơn.',
      contextTooLarge:
        'Các tệp đính kèm của cuộc trò chuyện vượt quá giới hạn văn bản trích xuất. Hãy dùng tệp nhỏ hơn hoặc bắt đầu cuộc trò chuyện mới.',
      fileCount:
        'Cuộc trò chuyện vượt quá giới hạn 100 tệp đầu vào. Hãy bắt đầu cuộc trò chuyện mới.',
      nativeFileCount:
        'Cuộc trò chuyện vượt quá giới hạn tệp gốc đã cấu hình. Hãy dùng ít tệp đính kèm hơn hoặc chuyển chúng sang tài liệu văn bản được hỗ trợ.',
      unreadable:
        'Tệp đính kèm không có văn bản đọc được. Tài liệu quét cần OCR.',
      extractionFailed:
        'Không thể trích xuất văn bản của tệp đính kèm. Hãy kiểm tra tài liệu có đọc được không rồi tải lên lại.',
      extractionTimeout:
        'Trích xuất văn bản tệp đính kèm đã hết thời gian. Hãy dùng tệp nhỏ hơn hoặc thử lại.',
      preparationFailed:
        'Không thể chuẩn bị tệp đính kèm. Hãy kiểm tra quyền truy cập và định dạng tệp rồi thử lại.',
    },
    untitled: 'Cuộc trò chuyện không tên',
    renamed: 'Đổi tên',
    archivedNamed: 'Đã lưu trữ “{{title}}”',
    unarchived: 'Đã khôi phục cuộc hội thoại',
    undo: 'Hoàn tác',
    sendFailed: 'Tin nhắn không được gửi. Hãy thử lại.',
    availability: {
      online: 'Trực tuyến',
      agentMissing: 'Đã xóa',
      agentArchived: 'Không được kích hoạt',
      forbidden: 'Không có sẵn cho bạn',
      noModel: 'Cấu hình mô hình trò chuyện trước',
      noRunner: 'Không có môi trường chạy trực tuyến, không thể chọn',
      othersPersonal:
        'Chỉ có vận động viên chạy bộ cá nhân của người khác mới có',
      modelUnavailable: 'Mẫu không có sẵn',
    },
    offline: {
      fallbackDone: 'Cuộc trò chuyện này hiện sử dụng một Agent khác',
      restoreDone: 'Đã chuyển trở lại',
      newSession: 'Agent bắt đầu phiên mới và đọc cuộc trò chuyện này.',
    },
    notice: {
      switchedToDefault:
        'Đã chuyển sang {{name}}, mặc định của hệ thống, cho đến khi {{own}} hoạt động trở lại.',
      switchedToOnline:
        '{{own}} hiện không có môi trường chạy nào dành cho bạn, vì vậy {{name}} sẽ trả lời cho đến khi {{own}} quay trở lại.',
      onlineFallbackUnavailable:
        'Agent dự phòng trực tuyến không thể trả lời ({{reason}}). Cuộc trò chuyện này vẫn ở lại với {{own}} trong khi chờ môi trường chạy.',
      switchedAgent:
        'Đã chuyển sang {{name}}, giữ nguyên lịch sử cuộc trò chuyện.',
      switchedBack: 'Quay lại với {{name}}.',
      runFailed: 'Agent dừng lại trước khi trả lời.',
      runFailedReason: 'Agent dừng lại trước khi trả lời: {{reason}}',
      runCancelled: 'Yêu cầu hủy bỏ.',
    },
    consultation: {
      unavailableTitle: 'Agent được tư vấn không có sẵn',
      snapshotTitle: 'Đã yêu cầu {{name}} vào thời điểm đó',
      title: 'Đã tư vấn {{name}}',
    },
    steps: {
      thinking: 'Đang suy nghĩ…',
      reading: 'Nhìn vào {{subject}}',
      working: 'Đang làm việc trên {{subject}}',
    },
    agents: {
      personalOnly: 'Chỉ dành cho vận động viên chạy bộ cá nhân',
      hint: 'Liệt kê các Agents được kích hoạt và cho biết lý do tại sao hiện tại người ta không thể trả lời bạn. Các câu trả lời chạy theo trình tự: câu trả lời đầu tiên đợi một người nhận, thường là vài giây.',
      chooseFor: 'Chọn Agent',
      empty: 'Không có Agent nào bạn có thể chọn',
      none: 'Không có Agent',
      unknown: 'Agent vô danh',
      placeholder: 'Chọn Agent',
      myDefault: 'Mặc định của tôi',
      systemDefault: 'Mặc định hệ thống',
    },
  },
  chatProfile: {
    loadFailed: 'Không thể tải cài đặt Agent của bạn',
    defaultAgent: 'Agent trò chuyện mặc định của tôi',
    systemDefault: 'Mặc định hệ thống',
    systemDefaultNamed: 'Mặc định hệ thống ({{name}})',
    noDefault: 'Không có mặc định hệ thống nào được đặt.',
    saved: 'Đã lưu Agent trò chuyện mặc định',
  },
  models: {
    title: 'Mô hình',
    description:
      'Các dịch vụ mô hình gọi Agents trực tuyến và các mô hình mà mỗi dịch vụ cung cấp: mô hình trò chuyện cho các Agents, mô hình nhúng và xếp hạng lại để tìm kiếm.',
  },
  defaultModel: {
    title: 'Mô hình trò chuyện mặc định',
    description:
      'Các Agents trực tuyến không có mô hình trả lời riêng của họ với nó, chẳng hạn như một Agent mới hoặc một Agent đi kèm với ứng dụng.',
    none: 'Chưa có mô hình trò chuyện nào được bật. Thêm dịch vụ mô hình và bật mô hình trò chuyện: mô hình đầu tiên trở thành mặc định.',
    saved: 'Mô hình trò chuyện mặc định hiện là {{model}}.',
  },
  services: {
    list: 'Dịch vụ kiểu mẫu',
    columns: {
      name: 'Tên',
      provider: 'Loại nhà cung cấp',
      status: 'Trạng thái',
    },
    loadFailed: 'Không thể tải các dịch vụ mô hình',
    empty: {
      title: 'Chưa có dịch vụ mẫu',
      description:
        'Sau khi bạn thêm dịch vụ mẫu, các Agents trực tuyến có thể trả lời thông qua dịch vụ đó.',
      readOnly: 'Yêu cầu quản trị viên thêm dịch vụ mẫu.',
    },
    add: {
      open: 'Thêm dịch vụ',
      title: 'Thêm dịch vụ mẫu',
      provider: 'Loại nhà cung cấp',
      created: 'Đã thêm {{title}}.',
    },
    status: {
      on: 'Bật',
      off: 'Tắt',
      noKey: 'Không có phím API',
      noModels: 'Không có mô hình trên',
    },
    service: {
      edit: 'Chỉnh sửa {{title}}',
      defaultHost: 'Nhà cung cấp mặc định',
      actions: 'Thêm hành động cho {{title}}',
      turnOn: 'Bật',
      turnOff: 'Tắt',
      turnedOn: '{{title}} đang bật.',
      turnedOff: '{{title}} tắt.',
      name: 'Tên',
      enabled: 'Đã bật',
      enabledHint:
        'Các Agents trực tuyến chỉ có thể sử dụng các mô hình của nó khi nó đang bật.',
      saved: '{{title}} đã được lưu.',
      delete: 'Xóa',
      deleteTitle: 'Xóa {{title}}?',
      deleteDescription:
        'Các đại lý sử dụng mô hình của nó sẽ ngừng trả lời cho đến khi họ được cung cấp một mô hình khác và giá mô hình của nó sẽ bị xóa.',
      deleted: '{{title}} đã bị xóa.',
    },
    connection: {
      apiKey: 'Phím API',
      keyPlaceholder: 'Dán phím API',
      baseUrl: 'URL cơ sở',
      baseUrlHint: 'Empty sử dụng mặc định của nhà cung cấp, {{url}}.',
      baseUrlRequired: 'Địa chỉ API của nhà cung cấp.',
      baseUrlInvalid: 'URL cơ sở bắt đầu bằng http:// hoặc https://.',
      test: 'Kiểm tra kết nối',
      testing: 'Thử nghiệm…',
      testOk: 'Đã kết nối: {{model}} đã trả lời.',
      testFailed: '{{model}} không trả lời: {{message}}',
      testNeedsModel: 'Kiểm tra mô hình để kiểm tra kết nối.',
      openCodeHint:
        'OpenCode gửi x-opencode-session với mọi yêu cầu (một id phiên cho mỗi cuộc trò chuyện). Nó phục vụ từng dòng mô hình thông qua DeepSeek, GLM, Kimi và MiMo thông qua DeepSeek hoặc OpenAI-compatible, Claude, MiniMax và Qwen thông qua Anthropic, GPT và Grok thông qua OpenAI. Thêm dịch vụ của từng loại bạn cần, tất cả đều có URL cơ sở này.',
    },
    models: {
      title: 'Mô hình',
      description:
        'Kiểm tra các mô hình mà dịch vụ này cung cấp và cho biết mỗi mô hình dùng để làm gì: mô hình trò chuyện trả lời Agents, mô hình nhúng văn bản chỉ mục cho tìm kiếm, sắp xếp lại mô hình theo thứ tự kết quả tìm kiếm. Một mô hình nhúng có thể yêu cầu các vectơ có kích thước.',
      fetching: 'Đang tìm nạp mô hình của nhà cung cấp…',
      fetchFailed:
        'Nhà cung cấp sẽ không liệt kê các model của mình: {{message}}',
      fetch: 'Tìm nạp mô hình',
      search: 'Tìm kiếm mô hình',
      noMatch: 'Không có mô hình nào phù hợp.',
      empty:
        'Chưa có mô hình nào. Tìm nạp chúng từ nhà cung cấp hoặc thêm một nhà cung cấp bằng ID của nhà cung cấp đó.',
      add: 'Thêm mô hình',
      addPlaceholder: 'ID mẫu',
      kind: '{{model}} dùng để làm gì',
      kinds: {
        chat: 'Trò chuyện',
        embedding: 'Nhúng',
        rerank: 'Sắp xếp lại',
      },
      test: 'Kiểm tra {{model}}',
      testOk: 'Đã trả lời là {{kind}}.',
      testFailed: 'Không trả lời: {{message}}',
      notKind: {
        chat: 'Mô hình này trông không giống mô hình trò chuyện',
        embedding: 'Mô hình này trông không giống mô hình nhúng',
        rerank: 'Mô hình này trông không giống mô hình xếp hạng lại',
      },
      looksLike: '{{notKind}}: nó trả lời là {{kind}}.',
      kindNouns: {
        chat: 'mô hình trò chuyện',
        embedding: 'một mô hình nhúng',
        rerank: 'mô hình xếp hạng lại',
      },
      dimensions: 'Kích thước vectơ của {{model}}',
      dimensionsPlaceholder: 'Mặc định',
      counts: {
        chat: 'Trò chuyện {{count}}',
        embedding: 'Nhúng {{count}}',
        rerank: '{{count}} xếp hạng lại',
      },
    },
  },
  prices: {
    loadFailed: 'Không thể tải giá mô hình',
    section: {
      title: 'Giá mẫu',
      description:
        'Trên một triệu mã thông báo, đầu vào / đầu ra. Các báo cáo tính toán chi phí từ chúng.',
      online: 'Trực tuyến (dịch vụ mẫu)',
      noOnline:
        'Chưa có model nào được định giá. Trước tiên hãy bật dịch vụ mô hình và các mô hình của nó.',
      runner: 'Runner (công cụ mã hóa)',
    },
    price: {
      model: 'Mô hình',
      state: 'Nguồn giá và hành động',
      input: 'Đầu vào / 1M',
      output: 'Đầu ra / 1M',
      inputOf: 'Giá đầu vào của {{model}}, trên một triệu token',
      outputOf: 'Giá đầu ra của {{model}}, trên một triệu token',
      save: 'Lưu giá của {{model}}',
      saved: 'Đã lưu giá {{model}}.',
      remove: 'Xóa giá {{model}}',
      removed: 'Giá {{model}} đã bị loại bỏ.',
      unpriced: 'Không có giá',
      unpricedHint: 'Giá của nó ghi “—” trong báo cáo cho đến khi nó có giá.',
      via: 'bởi {{pattern}}',
      viaHint:
        'Được định giá theo quy tắc {{pattern}}. Tiết kiệm ở đây mang lại cho mô hình này giá riêng của nó.',
      invalid: 'Giá là số từ 0 trở lên.',
      readOnly: 'Chỉ người quản lý giá mẫu mới có thể thay đổi chúng.',
    },
    tool: {
      description:
        'Giá của {{tool}} chạy những gì, được định giá theo mẫu từng báo cáo chạy.',
      subscription: 'Đăng ký (không tính phí)',
      subscriptionTag: 'Đăng ký',
      subscriptionHint:
        'Được thanh toán theo gói hàng tháng: các lần chạy của nó không mất phí trong báo cáo.',
      subscribed: '{{tool}} được tính phí theo đăng ký.',
      unsubscribed: '{{tool}} được tính phí theo giá của nó.',
      seen: 'Các mô hình được nhìn thấy trong quá trình chạy',
      noneSeen: 'Chưa có đợt chạy {{tool}} nào báo cáo mẫu máy.',
      rules: 'Quy tắc giá ({{count}})',
      rulesHint:
        'Quy tắc là ID mẫu hoặc mẫu chẳng hạn như claude-sonnet-4*; trận đấu cụ thể nhất sẽ thắng.',
      ruleModel: 'Mô hình hoặc mẫu',
      addRule: 'Thêm giá',
      ruleAdded: 'Đã thêm giá {{model}}.',
    },
  },
  skills: {
    attachments: 'Tệp đính kèm',
    globalMount: 'Tệp đính kèm toàn cầu',
    globalMountDescription:
      'Lưu ngay lập tức. Tất cả các lần chạy trong tương lai đều nhận được kỹ năng này.',
    mountSaved: 'Đã lưu cài đặt tệp đính kèm.',
    mountRetry: 'Không thể tải cài đặt. Thử lại',
    unavailableTarget: 'Mục tiêu không khả dụng',
    noAttachments: 'Không đính kèm ở đâu cả.',
    title: 'Kỹ năng',
    description:
      'Hướng dẫn có thể tái sử dụng với các tệp hỗ trợ. Đính kèm các giá trị mặc định của nhóm trên toàn cầu hoặc vào một dự án hoặc thư mục làm việc.',
    new: 'Kỹ năng mới',
    newTitle: 'Kỹ năng mới',
    newDescription:
      'Viết SKILL.md: tên đầu của nó và mô tả kỹ năng. Thêm tập tin ngay bây giờ hoặc sau này.',
    breadcrumb: 'Kỹ năng',
    loadFailed: 'Không thể tải kỹ năng',
    backToList: 'Trở lại kỹ năng',
    emptyTitle: 'Chưa có kỹ năng',
    emptyDescription:
      'Sau khi bạn thêm một kỹ năng, các Agents sẽ đọc SKILL.md của nó bất cứ khi nào có nhiệm vụ yêu cầu.',
    emptyReadOnly: 'Yêu cầu quản trị viên thêm một kỹ năng.',
    content: 'SKILL.md',
    contentHint:
      'Tên của vấn đề phía trước là tên thư mục của kỹ năng: thay đổi nó sẽ đổi tên kỹ năng. Mô tả cho các Agents biết khi nào nên đọc nó.',
    contentTooLarge: 'SKILL.md lớn hơn {{max}}.',
    emptyContent: 'Kỹ năng này chưa có nội dung.',
    created: 'Tạo ra kỹ năng "{{name}}"',
    saved: 'Đã lưu dưới dạng phiên bản {{version}}.',
    saveVersion: 'Lưu phiên bản mới',
    editing: 'Chỉnh sửa',
    note: 'Ghi chú',
    notePlaceholder: 'Điều gì đã thay đổi trong phiên bản này (tùy chọn)',
    deleted: 'Đã xóa kỹ năng "{{name}}".',
    edit: 'Chỉnh sửa',
    delete: 'Xóa kỹ năng',
    deleteTitle: 'Xóa kỹ năng "{{name}}"?',
    deleteDescription:
      'Mọi Agent và mọi nơi sử dụng kỹ năng này làm mặc định đều sẽ mất nó.',
    readOnly:
      'Chỉ người tạo kỹ năng và quản trị viên không gian làm việc mới có thể thay đổi kỹ năng này.',
    conflict:
      'Người khác vừa thay đổi kỹ năng này. Phiên bản mới nhất đã được tải; thử lại.',
    conflictTitle: 'Có người khác vừa thay đổi kỹ năng này',
    conflictDraft:
      'Ai đó đã lưu phiên bản mới sau khi bạn bắt đầu chỉnh sửa nên những thay đổi của bạn không được lưu. Sao chép những gì bạn muốn giữ lại, sau đó tải phiên bản mới nhất và chỉnh sửa lại.',
    loadLatest: 'Tải phiên bản mới nhất',
    mountedAgents: 'Agents kèm theo',
    noAgents: 'Chưa gắn bó với bất kỳ Agent nào.',
    defaults: 'Kỹ năng mặc định của: {{places}}.',
    defaultsSeparator: ', ',
    files: 'Tệp',
    usage: 'Các tệp {{files}}/{{maxFiles}} · {{size}}/{{maxSize}}',
    uploadTooLarge: '{{name}} lớn hơn {{max}}.',
    uploadInvalidName: 'Không thể thêm {{name}} vào đây; đổi tên nó đầu tiên.',
    skillTooLarge: 'Một kỹ năng có tối đa {{max}}.',
    tooManyFiles: 'Một kỹ năng có thể giữ được hầu hết các tệp {{max}}.',
    filesTooLarge: 'Lớn hơn {{max}}: {{paths}}.',
    binaryFile: 'Tệp nhị phân, {{size}}. Nó không thể được chỉnh sửa ở đây.',
    executable: 'Có thể thực thi được',
    scriptBadge: 'Kịch bản',
    scriptsNote:
      'Có tập lệnh: Agents trực tuyến có thể đọc chúng nhưng không bao giờ chạy chúng',
    compatibility: 'Khả năng tương thích: {{value}}',
    fileContent: 'Nội dung của {{path}}',
    export: 'Xuất khẩu',
    exportVersion: 'Phiên bản xuất {{version}} dưới dạng zip',
    import: 'Nhập khẩu',
    importVersion: 'Nhập phiên bản mới',
    imported: 'Nhập kỹ năng "{{name}}".',
    importInvalid: 'Không thể sử dụng SKILL.md của kho lưu trữ: {{problem}}',
    tree: {
      label: 'Tệp kỹ năng',
      newFile: 'Tập tin mới',
      newFolder: 'Thư mục mới',
      upload: 'Tải tập tin lên',
      actionsFor: 'Hành động dành cho {{name}}',
      rename: 'Đổi tên',
      delete: 'Xóa',
      download: 'Tải xuống',
      replace: 'Thay thế',
      markExecutable: 'Đánh dấu là có thể thực thi được',
      unmarkExecutable: 'Đánh dấu là không thể thực thi được',
      dropHint: 'Thả tập tin vào một thư mục để tải chúng lên đó.',
    },
    entry: {
      description: 'Tên được kiểm tra dựa trên các tập tin đã có ở đó.',
      folderHint:
        'Thư mục trống không được lưu: thêm tệp vào đó trước khi lưu.',
      location: 'Vị trí',
      root: 'Thư mục kỹ năng (/)',
      name: 'Tên',
      renameTitle: 'Đổi tên "{{name}}"',
      conventional: {
        scripts: 'Agents mã có thể chạy. Agents trực tuyến chỉ đọc nó.',
        references: 'Agents tài liệu đọc khi họ cần.',
        assets: 'Mẫu, hình ảnh và các tài nguyên khác.',
      },
      problems: {
        required: 'Nhập tên.',
        invalid: 'Sử dụng tên không có "/", ngoài "." Và "..".',
        taken: 'Một tập tin hoặc thư mục có tên này đã có sẵn ở đó.',
        reserved: 'SKILL.md bản thân nó là kỹ năng; chọn tên khác.',
      },
      deleteFileTitle: 'Xóa tập tin "{{name}}"?',
      deleteFolderTitle: 'Xóa thư mục "{{name}}" và mọi thứ trong đó?',
      deleteDescription:
        'Nó bị xóa khỏi bản dự thảo này; phiên bản đã lưu giữ nó.',
    },
    editor: {
      write: 'Viết',
      preview: 'Xem trước',
      nothingToPreview: 'Chưa có gì để xem trước.',
      noPreview: 'Không có bản xem trước cho loại tập tin này.',
    },
    frontMatter: {
      title: 'Sửa lỗi mặt trước của SKILL.md',
      reasons: {
        missing:
          'Bắt đầu SKILL.md với nội dung phía trước giữa hai dòng "---", kèm theo tên và mô tả.',
        yaml: 'Vấn đề phía trước không hợp lệ YAML.',
        notMapping:
          'Nội dung phía trước phải là khóa và giá trị, chẳng hạn như "name: my-skill".',
        required: 'Thêm {{field}}.',
        empty: '{{field}} không được để trống.',
        type: '{{field}} có loại sai.',
        tooLong: '{{field}} dài hơn ký tự {{max}}.',
        pattern:
          'sử dụng chữ cái viết thường, chữ số và dấu gạch nối đơn và không bắt đầu hoặc kết thúc bằng dấu gạch nối.',
        mismatch: 'phải là tên của thư mục chứa SKILL.md.',
        taken: 'Một kỹ năng khác có tên này; chọn cái khác.',
      },
    },
    template: {
      description:
        'Kỹ năng này có tác dụng gì và khi nào Agent nên sử dụng nó.',
      title: 'Kỹ năng mới',
      whenToUse: 'Khi nào nên sử dụng',
      whenToUseHint: 'Mô tả các nhiệm vụ đòi hỏi kỹ năng này.',
      steps: 'Bước',
      stepsHint: '1. Việc đầu tiên cần làm.\n2. Việc tiếp theo.',
      examples: 'Ví dụ',
      examplesHint: 'Hiển thị đầu vào và kết quả tốt trông như thế nào.',
    },
    columns: {
      name: 'Tên',
      description: 'Mô tả',
      files: 'Tệp',
      version: 'Phiên bản',
      agents: 'Tác nhân',
      updated: 'Đã cập nhật',
    },
    versions: {
      title: 'Phiên bản',
      description:
        'Mỗi lần lưu tạo một phiên bản mới; các tác tử luôn nhận được phiên bản mới nhất.',
      current: 'Hiện tại',
      compare: 'So sánh',
      compareTitle: 'Phiên bản {{version}} → phiên bản {{current}}',
      compareDescription:
        'Các dòng bị xóa kể từ đó có màu đỏ, được thêm vào màu xanh lá cây.',
      unchanged: 'không thay đổi',
      restore: 'Khôi phục',
      restoreTitle: 'Khôi phục phiên bản {{version}}?',
      restoreDescription:
        'Nó được lưu lại dưới dạng phiên bản mới nhất; các Agents có được nó trong lần chạy tiếp theo của họ. Không có gì bị mất: phiên bản hiện tại vẫn còn trong lịch sử.',
      restored:
        'Đã khôi phục phiên bản {{version}} thành phiên bản {{current}}.',
    },
  },
  runWait: {
    capacity:
      'Các khe được sử dụng ở đây {{used}}/{{limit}}; {{detail}}; được báo cáo miễn phí trên các ứng dụng {{reportedFree}}',
    reasons: {
      updatePending: 'Á hậu đang chờ cập nhật; công việc mới bị tạm dừng',
      pruning: 'Á hậu dọn dẹp cửa hàng chung; công việc mới bị tạm dừng',
      toolNotInstalled: 'Không có Á hậu kết nối nào được cài đặt công cụ này',
      incompatible:
        'Trình chạy được kết nối không hỗ trợ khối lượng công việc này; yêu cầu nâng cấp',
      restricted: 'Chính sách của môi trường chạy, thư mục hoặc hạn chế biến',
      unknown: 'Tính đủ điều kiện của khối lượng công việc chưa được thiết lập',
      agentArchived: 'Agent được lưu trữ',
      delayed: 'Đã lên lịch cho {{until}}',
      noRunnerOnline: 'Không có môi trường chạy trực tuyến',
      runnersOffline: 'Thời gian chạy của nó đang ngoại tuyến',
      toolQuota: 'Đã hết hạn mức công cụ; thời gian đặt lại: {{until}}',
      toolUnavailable:
        'Công cụ chưa đăng nhập, bị vô hiệu hóa hoặc mô hình được yêu cầu không có sẵn ({{tool}})',
      noSharedRunner:
        'Chỉ có vận động viên cá nhân của người khác mới trực tuyến',
      missingFeatures: 'Không có môi trường chạy hỗ trợ {{features}}',
      secretsNotAllowed:
        'Cần môi trường chạy nhóm: {{variables}} chỉ dành cho môi trường chạy nhóm',
      sameWorkActive: 'Sau khi chạy xong rồi',
      concurrencyFull: 'Đồng thời đầy đủ ({{active}}/{{limit}})',
      runnersBusy: 'Các vận động viên tương thích đã đầy',
      toolSlotsFull: 'Khe cắm {{tool}} đã đầy ({{used}}/{{limit}})',
      setupRetrying: 'Việc chuẩn bị thất bại; đang thử lại: {{detail}}',
      next: 'Tiếp theo để có môi trường chạy miễn phí',
    },
    unknown: 'Đã xếp hàng đợi ({{reason}})',
    quotaResetUnknown: 'chưa rõ',
    unknownValue: '—',
  },
  access: {
    section: 'Nhóm tác nhân',
    businessSection: 'Nhóm tác nhân',
    businesses: {
      agents: {
        title: 'Đại lý và kỹ năng',
        description: 'Các đặc vụ của đội và kỹ năng họ sử dụng.',
        actions: {
          edit: {
            title: 'Thay đổi Agents và kỹ năng',
            description:
              'Thay đổi cài đặt, kỹ năng và biến của Agent, lưu trữ, khôi phục và xóa nó cũng như chỉnh sửa kỹ năng. Một Agent không được cấp khả năng nào ngoài khả năng của người biên tập',
            related:
              'Thay đổi Agents và kỹ năng (Agents họ sở hữu và kỹ năng họ tạo ra)',
            relatedLabel: 'Đại lý tôi sở hữu và kỹ năng tôi tạo',
            relatedHint:
              'Đại lý mà tôi là chủ sở hữu và các kỹ năng tôi đã tạo',
            all: 'Thay đổi Agents và kỹ năng (tất cả)',
          },
        },
      },
    },
    settings: {
      agents: {
        agents: 'Tác nhân',
        runners: 'Môi trường chạy',
        prices: 'Giá mẫu',
        services: 'Dịch vụ kiểu mẫu',
      },
    },
    actions: {
      read: 'Xem',
      manage: 'Quản lý',
    },
    keyScopes: {
      agents: {
        title: 'Tác nhân',
        description:
          'Xem các Agents, kỹ năng và cách chạy; thay đổi Agents và kỹ năng, hủy và thử lại.',
      },
      runners: {
        title: 'Môi trường chạy',
        description:
          'Xem môi trường chạy và mã thông báo đăng ký; quản lý môi trường chạy.',
      },
      prices: {
        title: 'Giá mẫu',
        description:
          'Xem mô hình giá chi phí được ước tính từ; thay đổi chúng.',
      },
      services: {
        title: 'Dịch vụ kiểu mẫu',
        description:
          'Xem các dịch vụ mẫu và các mẫu họ cung cấp, không bao giờ xem chìa khóa của họ.',
      },
    },
  },
};

export default viVN;
