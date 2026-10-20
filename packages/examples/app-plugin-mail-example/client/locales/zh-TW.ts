import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  navigation: {
    mailExample: '郵件範例',
    workspace: '收件匣並撰寫',
    accounts: '賬戶',
    allMail: '所有郵件',
    activity: '傳送活動',
    syncLogs: '同步日誌',
  },
  workspace: {
    title: '收件匣並撰寫',
    description:
      '閱讀範例訊息、檢查附件、回覆或撰寫新訊息。類比提供者接受傳送而不聯絡外部郵件服務。',
  },
  activity: {
    title: '傳送活動',
    description:
      '檢視郵件正常傳送流程建立的投遞記錄。模擬提供者模擬接受，郵件將訊息儲存在本機「已傳送」資料夾中。',
    subject: '主旨',
    recipients: '收件人',
    account: '傳送帳戶',
    status: '狀態',
    created: '已提交',
    noSubject: '（無主題）',
    loadFailed: '無法載入傳送活動。',
    emptyTitle: '尚未傳送活動',
    emptyDescription: '從工作區傳送示例訊息，以在此處檢視其模擬傳送結果。',
    statuses: {
      pending: '待處理',
      submitting: '正在傳送',
      accepted: '已接受（模擬）',
      failed: '失敗',
      unknown: '未知',
      cancelled: '已取消',
    },
  },
  providers: {
    demo: 'Gmail（模擬）',
    'demo-microsoft': 'Microsoft 365（模擬）',
    'demo-imap-smtp': 'IMAP/SMTP（模擬）',
  },
  accounts: {
    title: '信箱帳戶',
    description: '準備範例郵箱及其訊息。',
  },
  allMail: {
    title: '所有郵件',
    description:
      '瀏覽從模擬郵箱匯入的郵件，按關鍵字搜尋，並檢查每封郵件的帳戶、讀取狀態、星標和附件元資料。',
    listTitle: '留言列表',
    resultCount: '{{count}} 封郵件',
    pageCount: '{{pages}} 的第 {{page}} 頁',
    searchLabel: '搜尋郵件',
    searchPlaceholder: '搜尋主題、寄件者或訊息內容',
    search: '搜尋',
    account: '帳號',
    from: '來自',
    subject: '主題與預覽',
    flags: '訊息狀態',
    date: '已收到',
    unread: '未讀',
    starred: '已加星標',
    attachment: '附件',
    previous: '上一步',
    next: '下一步',
    emptyTitle: '未找到訊息',
    emptyDescription: '嘗試其他關鍵字或清除搜尋以檢視所有類比訊息。',
    loadFailed: '無法載入所有郵件。',
  },
  syncLogs: {
    title: '同步日誌',
    description:
      '檢視三個模擬郵箱的歷史記錄和增量同步執行，包括狀態、階段、已處理計數和錯誤。',
    account: '信箱帳號',
    mode: '同步模式',
    status: '狀態',
    phase: '相',
    progress: '進展',
    started: '開始',
    completed: '已完成',
    error: '錯誤',
    unknownAccount: '未知帳戶',
    empty: '尚未執行同步。從帳戶頁面開始同步。',
    loadFailed: '無法載入同步日誌。',
    pageCount: '{{pages}} · {{total}} 的頁面 {{page}} 執行',
    messages: '{{count}} 訊息已處理',
    batches: '{{count}} 批次',
    modes: {
      initial: '初始同步',
      incremental: '增量同步',
    },
    statuses: {
      pending: '待處理',
      running: '執行中',
      completed: '已完成',
      partial: '部分',
      failed: '失敗',
      cancelled: '已取消',
    },
    phases: {
      preparing: '準備',
      history: '訊息歷史記錄',
      catchUp: '追趕',
      incremental: '增量更新',
      completed: '已完成',
    },
  },
  demo: {
    noPreview: '無法預覽。',
    preparing: '正在準備演示郵箱資料...',
    retry: '重試設定',
    openWorkspace: '開啟郵件工作區',
    refresh: '重新整理',
    loading: '載入中…',
  },
};

export default zhTW;
