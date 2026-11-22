import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  // The shared list, form and overlay components (`components/`).
  actions: {
    close: '閉じる',
  },
  dataTable: {
    filters: 'フィルター',
    filtersApplied: 'フィルター · {{count}}',
    firstPage: '最初のページへ',
    hideColumn: '非表示',
    lastPage: '最後のページへ',
    nextPage: '次のページへ',
    pageOf: '{{page}} / {{pageCount}} ページ',
    previousPage: '前のページへ',
    rowsPerPage: '1 ページの行数',
    selectPage: 'このページをすべて選択',
    selectedCount: '{{total}} 行中 {{selected}} 行を選択中。',
    sort: '並べ替え',
    sortAscending: '昇順',
    sortBy: '並べ替え基準',
    sortDescending: '降順',
    toggleColumns: '列の表示切り替え',
    view: '表示',
  },
  formFeedback: {
    denied:
      '現在の権限ではこのフォームを送信できません。入力内容は保持されています。',
    failed:
      '保存できませんでした。入力内容は保持されています。再試行してください。',
    field: 'この値は受け付けられませんでした。確認して再試行してください。',
    invalid: '強調表示された項目を確認して再試行してください。',
    network:
      '接続できません。接続を確認して再試行してください。入力内容は保持されています。',
  },
  listFeedback: {
    clear: 'フィルターをクリア',
    loading: '読み込み中',
    refreshFailed: '更新に失敗しました。以前のデータを表示しています',
    retry: '再試行',
    retrying: '再試行中…',
    signIn: 'サインイン',
    empty: 'データはまだありません',
    noResults: '結果がありません',
    forbidden: 'アクセスが拒否されました',
    unauthenticated: 'セッションの有効期限が切れました',
    failed: '一覧を読み込めません',
  },
  pendingFeedback: {
    longWait: '通常より時間がかかっています。そのままお待ちいただけます。',
    working: '処理中…',
  },
  routeOverlay: {
    close: '閉じる',
  },
  status: {
    loading: '読み込み中',
    refreshing: '更新中',
  },
  management: {
    actions: '操作',
    actionsFor: '{{name}} の操作',
    all: 'すべてのステータス',
    allRoles: 'すべてのロール',
    assignedRoles: '割り当て済みロール',
    backToSource: '前のページに戻る',
    cancel: 'キャンセル',
    clear: 'フィルターをクリア',
    confirm: '確認',
    conflict:
      '現在のデータと競合しています。最新の記録を確認してから再試行してください。',
    create: '作成',
    created: 'ユーザー「{{name}}」を作成しました',
    denied: 'アクセス権がありません。管理者に連絡してください。',
    disable: '無効化',
    disableHint:
      'このユーザーはサインインできなくなり、既存のセッションは終了します。',
    disableTitle: 'ユーザー「{{name}}」を無効にしますか？',
    disabled: '無効',
    discardHint: '保存されていない変更は失われます。',
    discardTitle: '変更を破棄しますか？',
    editUser: 'ユーザーを編集',
    email: 'メールアドレス',
    enable: '有効化',
    enableHint: 'このユーザーは再びサインインできるようになります。',
    enableTitle: 'ユーザー「{{name}}」を有効にしますか？',
    enabled: '有効',
    failed: 'リクエストを完了できませんでした。再試行してください。',
    identityConflict:
      'このメールアドレスまたはユーザー名はすでに使用されています。',
    invalidEmail: '有効なメールアドレスを入力してください',
    invalidRequest:
      '一部の値が無効です。入力内容またはフィルターを確認して再試行してください。',
    listChanged: '一覧が変更されました。再試行してください。',
    loading: '読み込み中',
    missing: 'この記録は存在しないか、削除されています。',
    name: '氏名',
    newUser: '新規ユーザー',
    noAssignedRoles: 'ロールの割り当てなし',
    noRoleAccess:
      'このユーザーは引き続きサインインしてアカウントの基本機能を使用できます。ロールによる業務アクセスは付与されていません。',
    noRolesFound: '該当するロールがありません。',
    password: '初期パスワード',
    passwordPolicy: 'パスワードが現在のパスワードポリシーを満たしていません。',
    required: 'この項目を入力してください',
    retry: '再試行',
    revokeHint: 'このユーザーは再度サインインする必要があります。',
    revokeRoleHint:
      '表示されているロールによって付与されたアクセス権が削除されます。',
    revokeRoleTitle: '「{{name}}」からロールを取り消しますか？',
    revokeSessions: 'セッションを取り消す',
    revokeTitle: '「{{name}}」のセッションを取り消しますか？',
    roleFilter: 'ロールで絞り込み',
    roleFilterIncomplete:
      'ロールスコープとロールの両方を選択するか、フィルターをクリアしてください。',
    save: '保存',
    saved: '「{{name}}」を保存しました',
    saving: '保存中…',
    searchRoles: 'ロールを検索',
    selectRoles: 'ロールを選択',
    sessionEnded: 'セッションが終了しました。再度サインインしてください。',
    signInAgain: '再度サインイン',
    status: 'ステータス',
    total_one: '{{count}} 人のユーザー',
    total_other: '{{count}} 人のユーザー',
    userActionSaved: {
      disable: 'ユーザー「{{name}}」を無効にしました',
      enable: 'ユーザー「{{name}}」を有効にしました',
      revokeSessions: '「{{name}}」のアクティブなセッションを取り消しました',
    },
    userSearch: '氏名、ユーザー名、メールアドレスで検索',
    username: 'ユーザー名',
    users: 'ユーザー管理',
    usersDescription:
      'アカウント、アクセス権、アクティブなセッションを管理します。',
  },
  humanOnly: {
    manageAccounts:
      'アカウントの管理は人だけが行えます。API キーには付与できません。',
  },
  page: {
    roles: 'ロール',
    loading: '読み込み中',
  },
  notificationTemplates: {
    invitation: {
      contributor: 'ユーザー',
      category: 'アカウント',
      name: 'ユーザー招待',
      trigger:
        '管理者がメールを選択してユーザーを招待したとき、または招待を再送信したとき。',
      recipients:
        '招待された人。その人用に入力されたメールアドレスに送信されます。',
      businessRule:
        'メールを選択して招待を作成または再送信するたびに送信されます。個別にオフにする設定はありません。',
      languagePolicy:
        'メールは招待時に決めた 1 つの言語で送られます。既定は招待者の表示言語で、別の言語も選べます。再送でも同じ言語を使います。その言語のメール文面がない場合は、アプリの既定言語と英語で送られます。',
      channel: '招待メールの送信設定',
      variables: {
        app: 'アプリケーション名',
        inviter: '招待を送った人の名前',
        items: '招待で付与されるロールまたはアクセス権',
        date: '招待の有効期限（メールの言語で表示、UTC）',
        url: '招待を承諾するためのリンク（プレビューでは架空のリンクを使用）',
      },
    },
  },
  accept: {
    title: '招待を受ける',
    language: '言語',
    description: '{{inviter}} さんがあなたを招待しました。',
    summary: 'あなたも参加します: {{items}}',
    loading: '招待状を読み込んでいます…',
    email: 'メール',
    name: '名前',
    username: 'ユーザー名（任意）',
    usernameHint: 'このユーザー名でログインできます。',
    password: 'パスワード',
    nameRequired: 'あなたの名前を入力してください。',
    passwordTooShort: 'パスワードには少なくとも {{min}} 文字が必要です。',
    submit: 'アカウントを作成して参加する',
    join: '招待を受ける',
    submitting: '参加中…',
    signedIn:
      '{{name}} としてサインインしています。新しいアカウントでサインアウトしてこの招待を受け入れます。',
    signOut: 'サインアウト',
    signOutFailed: 'サインアウトできませんでした。',
    existingAccount:
      'このアドレスにはすでにアカウントがあります。続行するには、サインインしてください。',
    alreadyHaveAccount: 'すでにアカウントをお持ちですか？ログイン',
    goToLogin: 'サインインに移動',
    errors: {
      notFound: 'この招待リンクは無効です。',
      expired:
        'この招待状の有効期限は切れています。新しいものを求めてください。',
      accepted: 'この招待はすでに承諾されています。',
      revoked: 'この招待は取り消されました。',
      password: 'パスワードが要件を満たしていません。',
      usernameConflict:
        'このユーザー名はユーザー名またはメールアドレスとして使用されています。別の名前を選んでください。',
      accountConflict: 'このアドレスではアカウントを作成できません。',
      failed: '問題が発生しました。もう一度試してください。',
    },
  },
};

export default jaJP;
