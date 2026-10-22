import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  practice: {
    intro:
      '使用下列帳號代替管理員。管理員繞過限制。這些是獨立的銷售協作練習，而不是完整的報價到訂單審批工作流程。每個練習都從種子記錄狀態開始。',
    read: {
      title: '助理查閱專案資訊',
      steps:
        '以 sales_assistant 登入：專案顯示 project-1、project-2 和 project-3，但沒有編輯操作。報價和訂單仍然僅限於擁有的專案。',
      reason:
        '專案共享補助記錄僅供檢視；它既不授予編輯也不授予相關記錄。機密 project-4 仍被排除在外。',
    },
    scopes: {
      title: '工程師準備並提交報價',
      steps:
        '以 sales_engineer 登入：編輯並提交您的 quote-2。您可以諮詢quote-5，但不能更改或提交同事的報價。您可以繼續準備quote-6，但不能為您所在地區以外的專案提交。',
      reason:
        '非機密報價是跨地區的內部參考資料。準備者擁有內容；區域責任管轄提交。檢視並不授予編輯許可權。現有訂單參考單獨接受的報價；提交練習報價並未建立訂單。',
    },
    handover: {
      title: '委託工程師接手報價',
      steps:
        '南區專案業主將quote-7交給北區工程師sales_proposal。以 sales_proposal 身份登入，編輯報價並提交。作為管理員，重置記錄並從提案報價移交共享規則中刪除 sales_proposal。再次登入：該帳戶無法再編輯或提交此報價。',
      reason:
        '移交允許編輯和提交此報價以及提交所需的專案訪問許可權；它並不代表整個南部地區。工程師角色授予操作許可權，同時共用識別記錄。作為進階練習，撤回專案或報價範圍：提交兩者都需要。',
    },
    delivery: {
      title: '送貨專家履行訂單',
      steps:
        '以 sales_delivery 登入。開啟 order-2，分配承運人，維護檢查並輸入交貨參考。確認交付後，其關係和交付狀態均不能再更改。在重複練習之前重置記錄。',
      reason: '送貨人員僅輸入訂單；報價和專案的連結不會授予這些頁面的存取權。',
    },
  },
  reset: {
    action: '重設練習記錄',
    cancel: '取消',
    confirm:
      '恢復每個模擬帳戶的種子專案、報價和訂單嗎？對這些記錄的變更將被覆寫。',
    description:
      '管理員可以在重複練習之前重置業務記錄。保留帳戶和許可權設定；手動恢復任何授權變更。',
    done: '恢復練習記錄。重新整理所有開啟的記錄清單。',
  },
  access: {
    title: '你的角色',
    direct: '直接分配',
    coverage: '每個範例帳戶都透過直接分配來承擔其工作職責。',
  },
  rules: {
    public: '排除機密專案',
    delivery: '地區訂單出貨',
    handover: '提案報價移交',
    projects: '共享範例專案',
  },
  accountMenus: {
    assistant: '專案、報價和訂單（唯讀）',
    engineer: '查閱非保密報價；編輯自己的報價並在指定區域內提交',
    manager: '管理擁有的專案；報價和訂單是隻讀的',
    delivery: '僅限訂單；確認區域交付',
    proposal: '編輯並提交移交的quote-7',
    coordinator: '管理project-8，歸屬區域外',
  },
  relations: {
    access: {
      notGranted: '只讀：不授予交付協調。',
      outsideScope: '只讀：此訂單不在您的交貨範圍內。',
      notReady: '已交付的訂單無法更改。',
    },
    title: '訂單關係',
    description:
      '分配活躍運營商、維護檢查並管理合作運營商。嘗試使用交付帳戶和唯讀帳戶來比較存取許可權。',
    order: '訂單',
    carrier: '承運商',
    unassigned: '未分配',
    assign: '指定承運人',
    disconnect: '刪除分配',
    checks: '交貨檢查',
    done: '已完成',
    pending: '待處理',
    toggle: '切換完成',
    delete: '刪除檢查',
    checkTitle: '檢查標題',
    add: '新增檢查',
    collaborators: '合作營運商',
    note: '合作筆記',
    addProposal: '新增所選運營商',
    replace: '更換為選定的營運商',
    clear: '刪除所有協作者',
    unavailable: '這些關係不可訪問。',
    loading: '正在載入關係...',
  },
  sales: {
    manageRelations: '安排訂單出貨',
    saveFirst: '提交前儲存更改。',
    states: {
      draft: '草稿',
      submitted: '已提交',
      accepted: '已接受',
      ready: '準備就緒',
      delivered: '已交付',
    },
    errors: {
      session: '會話已過期。再次登入。',
      input: '檢查金額和必填欄位。',
      conflict: '記錄狀態已更改。重試之前先重新整理一下。',
      request: '請求失敗。檢查您的連線並重試。',
    },
    operation: {
      outsideScope: '超出允許的操作範圍',
      notReady: '僅可配送現成訂單',
      allowed: '在提交範圍內',
      notGranted: '只讀 — 操作未授予',
      quoteScope: '超出允許報價範圍',
      projectScope: '超出許可範圍的專案',
      notDraft: '只能提交草稿',
      invalidAmount: '金額必須為正數',
    },
    preparedBy: '準備者',
    parentProject: '專案',
    sourceQuote: '來源引用',
    relationships: '相關記錄',
    relatedQuotes: '專案報價',
    relatedOrders: '專案訂單',
    filtered: '篩選條件',
    clearFilter: '清除過濾器',
    noPageAccess: '無法存取頁面',
    descriptions: {
      projects:
        '開啟專案的相關報價和訂單。相關清單僅顯示該帳戶可以存取的記錄。',
      quotes:
        '一個專案可以有多個報價。提交內容獨立檢查專案範圍和報價準備者，然後驗證草稿狀態和金額。',
      orders:
        '每個訂單均引用其來源報價和專案。發貨帳戶只輸入訂單；引用不會授予對其他頁面或記錄的存取許可權。',
    },
    delivery: '發貨',
    orders: '訂單',
    editProject: '編輯專案訊息',
    editQuote: '編輯定價',
    submit: '提交報價',
    submitScopes: {
      projects: '與報價相關的專案',
      quotes: '允許提交的報價',
    },
    deliver: '確認出貨',
    amount: '金額',
    status: '狀態',
    deliveryReference: '交貨參考',
    group: '銷售協作',
    title: '銷售許可權範例',
    projects: '專案',
    quotes: '報價',
    view: '檢視',
    edit: '編輯註釋',
    intro:
      '探索助理查閱記錄、工程師準備報價、委託報價移交和送貨人員履行訂單的訪問邊界。',
    record: '紀錄',
    notes: '備註',
    save: '儲存',
    refresh: '重新整理',
    loading: '載入中…',
    empty: '沒有可存取的記錄',
    readOnly: '只讀',
    saved: '已儲存',
    scope: {
      prepared: '我準備的報價',
      title: '銷售資料範圍',
      unrestricted: '無限制',
      region: '我的區域',
      own: '我擁有的父專案',
      public: '非機密專案',
    },
  },
  title: '銷售許可權範例',
  overview: '指南',
  actions: '操作',
  testAccounts: '帳戶範例',
  account: '帳號',
  permissionSet: '許可權設定',
  password: '密碼範例：AuthzExample123！',
  tryTitle: '配置並驗證',
  roles: {
    assistant: '銷售助理',
    engineer: '銷售工程師',
    manager: '專案經理',
    delivery: '送貨專員',
  },
  forbidden: '您沒有執行此操作的許可權。',
  error: '載入失敗。請再試一次。',
};

export default zhTW;
