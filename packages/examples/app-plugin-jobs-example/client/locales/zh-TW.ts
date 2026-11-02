import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  authorization: {
    title: '工作時間表範例',
    update: '啟動與停止規則',
  },
  navigation: {
    group: '工作範例',
    jobs: '一次性工作',
    schedules: '排程',
  },
  jobs: {
    title: '後臺作業',
    description:
      '每個作業在佇列中等待，然後工作十秒並每秒報告 10% 的進度。此頁面開啟時，進度會透過 WebSocket 到達。',
    create: '創造就業機會',
    creating: '創造…',
    listTitle: '你的工作',
    count: '{{count}} 職位',
    empty: '還沒有工作。建立一個來觀察其進展。',
    loading: '載入中…',
    job: '作業 {{id}}',
    createdAt: '建立{{time}}',
    attempt: '嘗試{{attempt}}',
    progress: '進展',
    live: '即時',
    offline: '重新連線',
  },
  schedules: {
    title: '排程',
    description:
      'ScheduleExecutor 上的重複規則。此頁面可以啟動的每個規則都是在程式碼中定義的，因此其處理程序在執行程式啟動之前註冊 - 在重新啟動之前啟動的規則將在重新啟動後繼續執行。此頁面開啟時，變更會透過 WebSocket 到達。',
    listTitle: '規則',
    loading: '載入中…',
    start: '開始',
    stop: '停止',
    builtIn: '內建',
    every: '每{{seconds}}',
    cron: 'Cron {{cron}} (UTC)',
    limit: '最多 {{limit}} 次',
    nextRun: '接下來在{{seconds}}s執行',
    nextRunDue: '下一次執行現在到期',
    noNextRun: '不再執行',
    firings: '{{count}} 在此例項上執行',
    delay: '延遲開始 {{ms}} 毫秒',
    noRuns: '尚未執行。',
    live: '即時',
    offline: '重新連線',
    rule: {
      heartbeat: '心跳',
      interval: '間隔',
      limited: '有限公司',
      cron: '規劃任務',
    },
    ruleDescription: {
      heartbeat: '該外掛在每次啟動時都會寫入此規則，並且永遠不會停止。',
      interval: '執行時切換間隔；下一次執行是從新的開始計劃的。',
      limited: '五次執行後自行結束。再次開始，還有五個。',
      cron: '在每分鐘開始時執行。',
    },
    state: {
      active: '啟用中',
      ended: '已結束',
      stopped: '已停止',
    },
    outcome: {
      running: '執行中',
      succeeded: '成功',
      failed: '失敗',
    },
  },
  status: {
    queued: '已排隊',
    running: '執行中',
    completed: '已完成',
    failed: '失敗',
  },
};

export default zhTW;
