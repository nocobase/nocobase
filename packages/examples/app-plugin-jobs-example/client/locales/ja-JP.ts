import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  authorization: {
    title: 'ジョブのスケジュール例',
    update: '開始と停止のルール',
  },
  navigation: {
    group: 'ジョブの例',
    jobs: '単発の仕事',
    schedules: 'スケジュール',
  },
  jobs: {
    title: 'バックグラウンドジョブ',
    description:
      '各ジョブはキュー内で待機し、その後 10 秒間動作し、毎秒 10% の進行状況を報告します。このページが開いている間、進行状況は WebSocket 経由で到着します。',
    create: 'ジョブの作成',
    creating: '作成中…',
    listTitle: 'あなたの仕事',
    count: '{{count}} 求人',
    empty: 'まだ仕事がありません。進捗状況を監視するために作成します。',
    loading: '読み込み中…',
    job: 'ジョブ {{id}}',
    createdAt: '{{time}} を作成しました',
    attempt: '{{attempt}}を試みる',
    progress: '進歩',
    live: 'リアルタイム',
    offline: '再接続中',
  },
  schedules: {
    title: 'スケジュール',
    description:
      'ScheduleExecutor の繰り返しルール。このページで開始できるすべてのルールはコードで定義されているため、そのハンドラーはエグゼキュータが開始する前に登録されます。つまり、再起動前に開始されたルールはその後も実行され続けます。このページが開いている間、変更は WebSocket 経由で到着します。',
    listTitle: 'ルール',
    loading: '読み込み中…',
    start: '開始',
    stop: '停止',
    builtIn: '内蔵',
    every: '{{seconds}}ごと',
    cron: 'クロン {{cron}} (UTC)',
    limit: '最大 {{limit}} 回',
    nextRun: '次の実行は {{seconds}}s です',
    nextRunDue: '次の実行は現在予定されています',
    noNextRun: 'これ以上の走行はありません',
    firings: '{{count}} はこのインスタンスで実行されます',
    delay: '{{ms}} ミリ秒遅れて開始しました',
    noRuns: 'まだ実行はありません。',
    live: 'リアルタイム',
    offline: '再接続中',
    rule: {
      heartbeat: 'ハートビート',
      interval: 'インターバル',
      limited: '限定',
      cron: 'クロン',
    },
    ruleDescription: {
      heartbeat:
        'プラグインは起動するたびにこのルールを書き込み、決して停止しません。',
      interval:
        '実行中に間隔を切り替えます。次の実行は新しいものから計画されています。',
      limited: '5回実行すると勝手に終了します。あと 5 回やり直してください。',
      cron: '毎分の開始時に実行されます。',
    },
    state: {
      active: 'アクティブ',
      ended: '終了しました',
      stopped: '停止しました',
    },
    outcome: {
      running: '実行中',
      succeeded: '成功しました',
      failed: '失敗しました',
    },
  },
  status: {
    queued: 'キューに登録されました',
    running: '実行中',
    completed: '完成',
    failed: '失敗しました',
  },
};

export default jaJP;
