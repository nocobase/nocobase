import type { DistributedResource } from './en-US.js';

const zhTW: DistributedResource = {
  view: {
    deployment: '部署模式',
    multi: '多個執行個體',
    configuration: '目前設定',
    checks: '多執行個體檢查',
    backends: '服務後端',
    readiness: '擴充前檢查',
    pending: '待處理',
    all: '全部',
    empty: '沒有待處理項目。',
    blockers: '必須處理 · {{count}} 項',
    scope: '此頁顯示目前執行個體的設定。修改應用程式設定後，請重新部署。',
  },
  nav: {
    title: '叢集與分散式',
    description: '本執行個體使用了哪些後端，以及應用程式能否以多執行個體執行。',
  },
  page: {
    description:
      '要在多台伺服器或多個處理程序上執行，快取、鎖、背景工作、佇列、即時訊息和 ID 產生都必須使用共用後端。本頁顯示本執行個體實際選用的後端及每項設定的來源，並檢查應用程式能否安全地以多執行個體執行。這些設定位於應用程式設定中，修改後需重新部署。',
    loading: '載入中…',
    loadFailed: '無法載入狀態。',
    retry: '重試',
  },
  summary: {
    single: '單一執行個體',
    singleCaption: '目前的設定適合單一執行個體',
    singleBlockedCaption: '即使只執行一個執行個體，下方也有必須處理的項目',
    shared: '{{shared}} / {{total}}',
    sharedCaption: '項服務已共用',
    requiredCaption: '必須處理',
    recommendedCaption: '建議處理',
  },
  sections: {
    scale: '能否多執行個體執行',
    services: '共用服務',
    idGeneration: 'ID 產生',
    checklist: '上線前核對',
    notes: '說明',
  },
  level: {
    required: '必須處理',
    recommended: '建議處理',
    ok: '正常',
  },
  singleBlocked:
    '即使只執行一個執行個體，下方標為「必須處理」的項目也需要處理。',
  singleHint:
    '以單一執行個體執行無需任何變更。如需擴充為多執行個體：準備 Redis 和共用的 PostgreSQL 或 MySQL 資料庫 → 安裝所需的 Redis 外掛 → 修改設定 → 以兩個執行個體驗證。',
  fix: '處理方式',
  table: {
    service: '服務',
    backend: '選用的後端',
    sharing: '範圍',
    plugin: 'Redis 外掛',
    source: '來源',
    adapter: '轉接器',
  },
  services: {
    caching: {
      name: '快取',
      usage: '登入狀態、權限、設定快取',
    },
    concurrency: {
      name: '並行鎖',
      usage: '遷移、編號、冪等',
    },
    jobs: {
      name: '背景工作',
      usage: '排程工作、知識庫索引',
    },
    queue: { name: '佇列', usage: '通知傳送' },
    realtime: { name: '即時訊息', usage: '站內信、線上狀態' },
  },
  sharing: {
    shared: '執行個體間共用',
    local: '僅本執行個體',
    unknown: '未宣告',
  },
  source: { configured: '已設定', default: '預設值' },
  notSet: '（未設定）',
  unavailable: '本應用程式未使用',
  unregistered: '轉接器未註冊',
  selections: '依名稱選用',
  selection: '{{consumer}} → {{backend}}',
  howToChange: '如何變更',
  howToChangeIntro:
    '為每項服務安裝對應的 Redis 外掛，註冊其伺服器端外掛，然後在設定中選用：',
  idGeneration: {
    mode: '模式',
    modeHint:
      '以多執行個體執行時，請自動分配 worker ID，讓每個執行個體各自取得一個。',
    auto: '自動 · 每個執行個體一個 worker ID',
    manual: '手動 · workerId {{workerId}}',
  },
  checklist: {
    intro: '以下各項本頁無法自行檢查，請在兩個執行個體上實際操作確認：',
    files: '在執行個體 A 上傳的檔案可以從執行個體 B 下載',
    realtime:
      '在 A 上產生的訊息能即時送達連線到 B 的使用者，且重新連線後不會遺失',
    queue: '在 A 上排入佇列的工作可由 B 處理，且重試不會重複產生副作用',
    secrets:
      '所有執行個體使用相同的 secrets.keys，且登入狀態在各執行個體間通用',
    websocket: '負載平衡器轉送 WebSocket 連線，且與應用程式的路徑和網域一致',
  },
  notes: {
    current:
      '本頁只顯示你目前連線的執行個體，無法判斷其他執行個體的設定是否相同；請以同一份設定部署所有執行個體。',
    noTest:
      '這裡沒有「測試連線」：Redis 外掛在應用程式啟動時建立連線，連線失敗時應用程式不會啟動。執行期間的連線錯誤會記錄在日誌中。',
    instances:
      '只有自動分配 worker ID 時才會顯示執行中的執行個體清單，此功能由商業外掛提供。',
  },
  checks: {
    database: {
      sqlite: {
        title: '資料庫',
        detail:
          'SQLite 只能服務單一執行個體。多執行個體需要使用 PostgreSQL 或 MySQL。',
        fix: '將資料移轉到 PostgreSQL 或 MySQL，並將主資料庫連線指向它。',
      },
      shared: {
        title: '資料庫',
        detail:
          '{{dialect}} 支援多個執行個體共用。上線前確認每個執行個體連線的是同一個資料庫。',
      },
    },
    service: {
      unregistered: {
        title: '{{service}}',
        detail:
          '{{configPath}} 選用了轉接器「{{adapter}}」，但沒有已註冊的外掛提供它。此服務在首次使用時會失敗。',
        fix: '安裝並註冊提供「{{adapter}}」的外掛，或選用其他後端。',
      },
      local: {
        title: '{{service}} 仍僅限本執行個體',
        detail:
          '每個執行個體各自保存狀態。請安裝 {{plugin}}，並將 {{configPath}} 設定為 Redis 後端。',
        fix: '安裝 {{plugin}}，註冊其伺服器端外掛，然後選用它：',
      },
      undeclared: {
        title: '{{service}}',
        detail:
          '適配器「{{adapter}}」沒有聲明是否在實例間共享，請向提供它的外掛確認。',
      },
      selectionUndeclared: {
        title: '{{service}}',
        detail:
          '{{consumer}} 明確使用後端「{{backend}}」，其介面卡沒有宣告是否在執行個體間共享。請向提供它的外掛確認。',
      },
      selectionLocal: {
        title: '{{service}}',
        detail:
          '{{consumer}} 明確使用了後端「{{backend}}」，它僅限本執行個體。',
      },
    },
    services: {
      local: {
        title: '快取、鎖、背景工作、佇列、即時訊息',
        detail: '全部僅限本執行個體：{{services}}。',
      },
    },
    files: {
      local: {
        title: '檔案儲存',
        detail:
          '{{collections}} 中的檔案存放在本機磁碟上，其他執行個體無法讀取。',
        fix: '為這些檔案表使用 S3 等共用儲存，並將其現有檔案移轉過去。',
      },
      defaultLocal: {
        title: '檔案儲存',
        detail: '預設儲存將檔案存放在本機磁碟上，其他執行個體無法讀取。',
        fix: '將預設儲存設定為 S3 等共用儲存。',
      },
      shared: {
        title: '檔案儲存',
        detail: '沒有檔案表將檔案存放在本機磁碟上。',
      },
      unchecked: {
        title: '檔案儲存',
        detail:
          '無法讀取連線 {{connections}} 的檔案表，不確定其中是否有檔案存在本機磁碟上。',
      },
    },
    idGeneration: {
      auto: {
        title: 'ID 產生',
        detail: '自動分配：每個執行個體各自取得一個 worker ID。',
      },
      manual: {
        title: 'ID 產生',
        detail:
          '手動指定的 worker ID 為 {{workerId}}。兩個執行個體使用相同的 worker ID 時可能產生重複的 ID。',
        fix: '為每個執行個體設定不同的 SNOWFLAKE_WORKER_ID，或安裝可自動分配 worker ID 的外掛。',
      },
    },
    secrets: {
      set: {
        title: '金鑰',
        detail: '已設定 secrets.keys。請確保所有執行個體使用相同的金鑰。',
      },
      missing: {
        title: '金鑰',
        detail:
          '未設定 secrets.keys。所有執行個體需要相同的金鑰，才能讀取其他執行個體加密的內容。',
        fix: '使用 openssl rand -hex 32 產生金鑰，並在所有執行個體上設定。',
      },
    },
    publicOrigin: {
      invalid: {
        title: '公開位址',
        detail: 'app.publicOrigin 已設定，但不是 http 或 https 位址。',
        fix: '將 app.publicOrigin 設為使用者開啟的位址，例如 https://apps.example.com。',
      },
      set: { title: '公開位址', detail: 'app.publicOrigin = {{origin}}' },
      missing: {
        title: '公開位址',
        detail:
          '未設定 app.publicOrigin。在負載平衡器之後，連結和回呼需要使用公開位址。',
        fix: '將 app.publicOrigin 設定為使用者開啟的位址。',
      },
    },
    checkFailed: {
      title: '有一項檢查無法執行',
      detail: '檢查「{{check}}」失敗，請查看日誌。',
    },
  },
};

export default zhTW;
