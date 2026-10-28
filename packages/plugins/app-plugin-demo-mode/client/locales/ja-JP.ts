import type { DemoModeResource } from './en-US.js';
const resource: DemoModeResource = {
  authorization: {
    title: 'デモデータ',
    read: '表示',
    manage: '生成と消去',
    configuration: 'デモ設定',
    configure: '設定',
  },
  menu: {
    label: 'デモモード',
    switchAccount: 'アカウントを切り替え',
    title: 'これはデモ環境です',
    description: 'データは毎日自動的にリセットされ、変更は保存されません。',
    accountsDescription:
      '以下のアカウントに切り替えて、各ロールで表示される内容を確認できます。',
    loading: 'アカウントを読み込み中…',
  },
  status: {
    loading: '読み込み中',
  },
  accounts: {
    title: 'アカウント',
    description:
      'いずれかのアカウントでデモに入り、それぞれの役割から見た画面を確認できます。',
    enter: '入る',
    current: '現在',
    entering: '入っています…',
    failed: 'このアカウントにログインできませんでした。',
    unavailable: '現在ログインできるアカウントはありません。',
    password: 'パスワードでサインイン',
  },
  refused: {
    title: 'デモのため変更を保存できません。',
    description: 'その他の機能は通常どおり利用できます。',
  },
  settings: {
    title: 'デモ環境',
    refresh: '更新',
    retry: '再試行',
    busy: 'デモデータを生成またはクリアしています',
    busyHelp: '現在のデータ操作が完了するまでお待ちください。',
    disabled: {
      title: 'このアプリはデモではありません',
      help: 'デモモードはオフです。デプロイ時に NOCOBASE_DEMO_MODE=true でオンにします。',
    },
    errors: {
      failed: 'リクエストが完了しませんでした。もう一度お試しください。',
      demoModeRequired: 'デモモードがオンのときだけ実行できます。',
      signedOut: 'セッションが終了しました。もう一度サインインしてください。',
      denied: 'デモ設定を表示する権限がありません。',
    },
    data: {
      title: 'デモデータ',
      state: {
        importing: '生成中',
        clearing: 'クリア中',
        resetting: 'リセット中',
        failed: '失敗',
        ready: '準備完了',
        none: '未生成',
      },
      presentSummary: '{{language}} · {{time}} に生成',
      resettingSummary:
        '現在のデータをクリアし、{{language}}で再生成しています。',
      phase: {
        clearing: 'クリア中',
        generating: '再生成中',
      },
      absentSummary: 'デモデータはまだ生成されていません。',
      failed: '前回の実行が完了しませんでした',
      unavailable: 'デモデータなし',
      unavailableHelp: 'このアプリはデモデータセットを登録していません。',
    },
    visitors: {
      unavailable: '現在ログインできるアカウントはありません。',
      title: 'アカウント',
      username: 'ユーザー名 {{username}}',
      copyLink: 'リンクをコピー',
      copyLinkFor: '{{name}} の入口リンクをコピー',
      openFor: '{{name}} としてデモを開く',
      copied: 'コピーしました',
      copyFailed:
        'コピーできませんでした。アドレスバーからリンクをコピーしてください。',
    },
    schedule: {
      title: '毎日のリセット',
      description:
        'デモデータは毎日自動的にリセットされます。スケジュールは環境変数で設定します。',
      time: '時刻',
      language: '言語',
      timezone: 'タイムゾーン',
      next: '次回のリセット：{{time}}',
    },
  },
};
export default resource;
