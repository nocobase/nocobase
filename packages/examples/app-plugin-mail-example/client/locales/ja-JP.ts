import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  navigation: {
    mailExample: 'メール例',
    workspace: '受信箱と作成',
    accounts: 'アカウント',
    allMail: 'すべてのメール',
    activity: '送信アクティビティ',
    syncLogs: 'ログを同期する',
  },
  workspace: {
    title: '受信箱と作成',
    description:
      'サンプル メッセージを読み、添付ファイルを検査し、返信するか、新しいメッセージを作成します。模擬プロバイダーは、外部メール サービスに接続せずに送信を受け入れます。',
  },
  activity: {
    title: '送信アクティビティ',
    description:
      'メールの通常の送信フローで作成された配信記録を確認します。モックプロバイダーは受け入れをシミュレートし、メールはローカルの送信済みフォルダーにメッセージを保存します。',
    subject: '件名',
    recipients: '受信者',
    account: '送信アカウント',
    status: '状態',
    created: '送信済み',
    noSubject: '(主語なし)',
    loadFailed: '送信アクティビティをロードできませんでした。',
    emptyTitle: '送信アクティビティはまだありません',
    emptyDescription:
      'ワークスペースからサンプル メッセージを送信して、そのシミュレートされた配信結果をここで確認します。',
    statuses: {
      pending: '保留中',
      submitting: '送信',
      accepted: '可（模擬）',
      failed: '失敗しました',
      unknown: '不明',
      cancelled: 'キャンセル済み',
    },
  },
  providers: {
    demo: 'Gmail (モック)',
    'demo-microsoft': 'Microsoft 365 (モック)',
    'demo-imap-smtp': 'IMAP/SMTP (モック)',
  },
  accounts: {
    title: 'メールボックスアカウント',
    description: 'サンプルメールボックスとそのメッセージを準備しています。',
  },
  allMail: {
    title: 'すべてのメール',
    description:
      '模擬メールボックスからインポートされたメールを参照し、キーワードで検索し、各メッセージのアカウント、読み取り状態、スター、および添付ファイルのメタデータを検査します。',
    listTitle: 'メッセージ一覧',
    resultCount: '{{count}} メッセージ',
    pageCount: '{{pages}} の {{page}} ページ',
    searchLabel: 'メール検索',
    searchPlaceholder: '件名、送信者、またはメッセージの内容を検索します',
    search: '検索',
    account: 'アカウント',
    from: 'から',
    subject: '件名とプレビュー',
    flags: 'メッセージの状態',
    date: '受け取りました',
    unread: '未読',
    starred: 'スター付き',
    attachment: 'アタッチメント',
    previous: '前へ',
    next: '次へ',
    emptyTitle: 'メッセージが見つかりませんでした',
    emptyDescription:
      '別のキーワードを試すか、検索をクリアして、すべての模擬メッセージを表示します。',
    loadFailed: 'すべてのメールを読み込むことができませんでした。',
  },
  syncLogs: {
    title: 'ログを同期する',
    description:
      'ステータス、フェーズ、処理数、エラーなど、3 つの模擬メールボックスの履歴と増分同期の実行を確認します。',
    account: 'メールボックスアカウント',
    mode: '同期モード',
    status: '状態',
    phase: 'フェーズ',
    progress: '進歩',
    started: '開始しました',
    completed: '完成',
    error: 'エラー',
    unknownAccount: '不明なアカウント',
    empty:
      '同期はまだ実行されていません。アカウント ページから同期を開始します。',
    loadFailed: '同期ログをロードできませんでした。',
    pageCount: '{{pages}}・{{total}}のページ{{page}}が実行されます',
    messages: '{{count}} メッセージが処理されました',
    batches: '{{count}} バッチ',
    modes: {
      initial: '初期同期',
      incremental: '増分同期',
    },
    statuses: {
      pending: '保留中',
      running: '実行中',
      completed: '完成',
      partial: '部分的',
      failed: '失敗しました',
      cancelled: 'キャンセル済み',
    },
    phases: {
      preparing: '準備中',
      history: 'メッセージ履歴',
      catchUp: '追いつく',
      incremental: '増分更新',
      completed: '完成',
    },
  },
  demo: {
    noPreview: 'プレビューはありません。',
    preparing: 'デモメールボックスデータを準備しています…',
    retry: 'セットアップを再試行します',
    openWorkspace: 'メールワークスペースを開く',
    refresh: '更新',
    loading: '読み込み中…',
  },
};

export default jaJP;
