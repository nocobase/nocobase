import type { MailPagesResource } from './pages.en-US.js';

const pagesZhTW: MailPagesResource = {
  navigation: {
    mail: '郵件',
    mailTeam: '團隊郵件',
    mailAccounts: '郵件帳戶',
    mailAccountsDescription: '連線你的信箱，管理簽名、模板和標籤。',
    mailSettings: '信箱',
    mailSettingsDescription: '郵件提供者、各帳戶狀態、同步日誌和傳送日誌。',
  },
  access: {
    section: '郵件',
    team: {
      title: '團隊郵件',
      description: '成員已同步的郵件，唯讀。',
      actions: {
        view: '檢視',
        process: '處理（標記已讀、加上星號、封存）',
      },
    },
    settings: {
      title: '信箱',
      actions: {
        read: '檢視',
        manage: '管理（重試和取消成員的同步與傳送）',
      },
    },
  },
  pages: {
    loading: '載入中…',
    empty: '沒有可顯示的內容。',
    member: '成員',
    allMembers: '所有成員',
    workspace: {
      reauthorizationNotice:
        '{{addresses}} 需要重新連線，在此之前不會同步或傳送郵件。',
      reauthorize: '前往郵件帳戶重新連線',
      needsReauthorization: '需要重新授權',
    },
    accounts: {
      title: '郵件帳戶',
      description:
        '連線你的信箱，即可在郵件中收發郵件。你的郵件只有你能看到；擁有團隊郵件權限的人可以閱讀，但無法變更。',
      reauthorizationNotice:
        '{{addresses}} 的授權已不再有效，在你以同一提供者重新連線之前，不會同步或傳送郵件。',
      reauthorize: '重新連線',
      tabs: {
        accounts: '帳戶',
        signatures: '簽名',
        templates: '模板',
        labels: '標籤',
        activity: '活動',
      },
    },
    activity: {
      sends: '傳送',
      syncs: '同步',
    },
    logs: {
      started: '開始時間',
      time: '時間',
      account: '帳戶',
      accountMember: '帳戶 · 成員',
      mode: '方式',
      initial: '首次同步',
      incremental: '增量同步',
      result: '結果',
      allResults: '所有結果',
      detail: '詳細資訊',
      reason: '原因',
      processed: '{{count}} 封郵件',
      subject: '主旨',
      recipients: '收件者',
      recipientCount: '收件者',
      bulk: '批次傳送',
      bulkCount: '{{count}}（批次）',
      scheduled: '排程傳送',
      retry: '重試',
      cancel: '取消',
      window: '時間',
      windows: {
        day: '最近 24 小時',
        week: '最近 7 天',
        month: '最近 30 天',
        all: '所有時間',
      },
    },
    team: {
      title: '團隊郵件',
      description:
        '閱讀成員已同步的郵件，用於工作交接和合規檢查。開啟郵件不會將其標記為已讀，也無法回覆。',
      account: '帳戶',
      allAccounts: '所有帳戶',
      participant: '地址或 @網域',
      keyword: '主旨關鍵字',
      memberAccount: '成員 · 帳戶',
      counterpart: '往來對象',
      view: '檢視',
      selectAll: '全選本頁',
      empty: '沒有符合的已同步郵件。',
      readOnly: '唯讀。開啟不會標記為已讀。',
      applied: '已更新 {{succeeded}} 封，{{failed}} 封失敗。',
      actions: {
        markRead: '標記已讀',
        star: '加上星號',
        archive: '封存',
      },
    },
    settings: {
      title: '信箱',
      description:
        '成員可連線的郵件提供者，以及每個帳戶的連線、同步和傳送狀態。此處不會顯示任何郵件內容。系統通知郵件請在通知中設定。',
      tabs: {
        providers: '提供者',
        accounts: '帳戶',
        syncRuns: '同步日誌',
        submissions: '傳送日誌',
        runtime: '執行設定',
      },
      sources: {
        environment: '環境變數',
        config: 'config.yml',
        default: '預設值',
        code: '程式碼',
      },
      providers: {
        name: '名稱',
        type: '類型',
        capabilities: '功能',
        accounts: '帳戶',
        source: '來源',
        attention: '{{count}} 個需要重新授權',
        howTo: '如何新增提供者',
        howToDescription:
          '在應用程式設定的 mail.providers 下新增一個項目，並將密鑰保存在環境變數中。重新啟動應用程式後生效。',
        callbackHint: '請在 Google 或 Microsoft 註冊以下 OAuth 重新導向網址：',
      },
      accounts: {
        filter: {
          all: '全部',
          attention: '需要重新授權',
          suspended: '已停用',
        },
        provider: '提供者',
        allProviders: '所有提供者',
        search: '成員或地址',
        lastSynced: '最近同步',
        status: '狀態',
        showRuns: '同步記錄',
        note: '管理員無法授權或移除成員的帳戶。成員需在 個人設定 › 郵件帳戶 中自行重新連線。',
      },
      runtime: {
        setting: '設定項目',
        value: '目前值',
        effect: '影響',
        automaticSyncInterval: '自動同步間隔',
        automaticSyncIntervalEffect: '沒有推播通知的帳戶檢查新郵件的頻率。',
        syncBatchSize: '每批同步郵件數',
        syncBatchSizeEffect:
          '批次越大，首次同步越快完成，但也更容易觸及提供者的速率限制。',
        oauthCallbackUrl: 'OAuth 重新導向網址',
        oauthCallbackUrlEffect:
          '請在 Google 或 Microsoft 開發人員主控台中註冊。',
        oauthReturnUrl: '授權後返回頁面',
        oauthReturnUrlEffect: '連線 OAuth 帳戶後返回的頁面。',
        pushWebhook: '推播 Webhook',
        pushWebhookEffect:
          '未設定時，Gmail 和 Microsoft 365 也會依同步間隔檢查新郵件。',
        jobs: '背景工作',
        jobsEffect: '多執行個體部署需要共用佇列。',
        logRetention: '日誌保留',
        logRetentionEffect: '超過此期限的已結束同步記錄和傳送記錄會自動刪除。',
        credentialVault: '憑證儲存',
        credentialVaultEffect: '已連線帳戶的 OAuth 權杖和密碼的保存位置。',
        minutes: '{{count}} 分鐘',
        days: '{{count}} 天',
        keepForever: '永久保留',
        notConfigured: '未設定',
        secretConfigured: '已設定密鑰',
        secretMissing: '未設定密鑰',
        jobsDefault: '跟隨 jobs.default',
        vaultBuiltin: '內建，保存在應用程式資料庫中',
        vaultApplication: '由應用程式註冊',
        copy: '複製',
        copied: '已複製',
        readOnly:
          '唯讀：這些設定來自 config.yml 和 MAIL_* 環境變數，重新啟動後生效。',
      },
    },
  },
};

export default pagesZhTW;
