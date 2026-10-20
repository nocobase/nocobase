import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  practice: {
    intro:
      '管理者の代わりに以下のアカウントを使用してください。管理者は制限を回避します。これらは独立した販売コラボレーションの演習であり、見積から注文までの完全な承認ワークフローではありません。各演習はシードされたレコードの状態から始まります。',
    read: {
      title: 'アシスタントがプロジェクト情報を調べる',
      steps:
        'sales_assistant としてサインイン: プロジェクトには project-1、project-2、project-3 が表示されますが、編集アクションは表示されません。見積もりと注文は、引き続き所有プロジェクトに限定されます。',
      reason:
        'プロジェクト共有では、閲覧のみを目的としたレコードが付与されます。編集も関連レコードも許可しません。機密 project-4 は除外されたままです。',
    },
    scopes: {
      title: 'エンジニアが見積書を作成して提出する',
      steps:
        'sales_engineer としてサインイン: quote-2 を編集して送信します。 quote-5 に相談することはできますが、同僚の見積もりを変更したり送信したりすることはできません。 quote-6 の準備を続けることはできますが、お住まいの地域外のプロジェクトに提出することはできません。',
      reason:
        '非機密の引用は、地域全体の内部参考資料です。作成者はコンテンツを所有します。提出は地域の責任によって決まります。閲覧しても編集は許可されません。既存の注文は、別途承認された見積もりを参照します。練習用の見積もりを送信しても注文は作成されません。',
    },
    handover: {
      title: '委任されたエンジニアが見積もりを引き継ぎます',
      steps:
        '南部地域のプロジェクト オーナーが quote-7 を北部地域のエンジニア sales_proposal に引き渡します。 sales_proposal としてサインインし、見積もりを編集して送信します。管理者として、レコードをリセットし、提案見積の引き継ぎ共有ルールから sales_proposal を削除します。再度サインインします。アカウントはこの見積もりを編集または送信できなくなります。',
      reason:
        '引き継ぎにより、この見積書の編集と送信、および送信に必要なプロジェクト アクセスが許可されます。南部地域全体を委任するわけではありません。エンジニアの役割は操作を許可し、共有によりレコードを識別します。高度な演習として、プロジェクトまたは見積範囲のいずれかを撤回します。提出には両方が必要です。',
    },
    delivery: {
      title: '配達専門家が注文を処理します',
      steps:
        'sales_delivery としてサインインします。 order-2 を開き、運送業者を割り当て、小切手を管理し、配送参照を入力します。配信を確認した後は、その関係や配信状態を再度変更することはできません。演習を繰り返す前に記録をリセットしてください。',
      reason:
        '配達スタッフは注文のみを入力します。引用やプロジェクトへのリンクでは、それらのページへのアクセスは許可されません。',
    },
  },
  reset: {
    action: '練習記録をリセット',
    cancel: 'キャンセル',
    confirm:
      'すべてのデモアカウントのシードされたプロジェクト、見積もり、注文を復元しますか?これらのレコードへの変更は上書きされます。',
    description:
      '管理者は、演習を繰り返す前に、ここで業務記録をリセットできます。アカウントと権限の設定は保持されます。認可の変更を手動で復元します。',
    done: '練習記録が復元されました。開いているレコード リストを更新します。',
  },
  access: {
    title: 'あなたの役割',
    direct: '直接割り当て',
    coverage: '各アカウント例は、直接割り当てを通じてその職責を保持します。',
  },
  rules: {
    public: '機密プロジェクトを除外する',
    delivery: '地域別配達注文',
    handover: '提案見積書の引き渡し',
    projects: '共有サンプルプロジェクト',
  },
  accountMenus: {
    assistant: 'プロジェクト、見積書、注文 (読み取り専用)',
    engineer:
      '機密でない引用を参照してください。独自の見積もりを編集し、割り当てられた地域内で送信する',
    manager: '所有プロジェクトを管理します。見積書と注文書は読み取り専用です',
    delivery: '注文のみ。地域配送を確認する',
    proposal: '引き継いだquote-7を編集して提出する',
    coordinator: 'ホーム地域外の project-8 を管理します',
  },
  relations: {
    access: {
      notGranted: '読み取り専用: 配送調整は許可されません。',
      outsideScope: '読み取り専用: この注文は配送範囲外です。',
      notReady: '納品された注文は変更できません。',
    },
    title: '順序関係',
    description:
      'アクティブな通信事業者を割り当て、小切手を維持し、協力する通信事業者を管理します。配信アカウントと読み取り専用アカウントを試してアクセスを比較してください。',
    order: '注文',
    carrier: '運送業者',
    unassigned: '何も割り当てられていません',
    assign: 'キャリアの割り当て',
    disconnect: '割り当てを削除する',
    checks: '配達小切手',
    done: '完了',
    pending: '保留中',
    toggle: 'トグル完了',
    delete: 'チェック項目を削除',
    checkTitle: 'タイトルをチェック',
    add: 'チェックを追加する',
    collaborators: '提携通信事業者',
    note: 'コラボノート',
    addProposal: '選択した通信事業者を追加',
    replace: '選択したキャリアに置き換えます',
    clear: '協力者をすべて削除します',
    unavailable: 'これらの関係にはアクセスできません。',
    loading: '関係を読み込み中…',
  },
  sales: {
    manageRelations: '注文配送の手配',
    saveFirst: '送信する前に変更を保存します。',
    states: {
      draft: '下書き',
      submitted: '送信済み',
      accepted: '承認されました',
      ready: '準備完了',
      delivered: '納品されました',
    },
    errors: {
      session: 'セッションが期限切れになりました。再度サインインします。',
      input: '金額と必須項目を確認してください。',
      conflict:
        'レコードの状態が変化しました。再試行する前に更新してください。',
      request:
        'リクエストは失敗しました。接続を確認して、もう一度試してください。',
    },
    operation: {
      outsideScope: '許可された操作範囲外',
      notReady: '準備ができた注文のみ配送可能',
      allowed: '提出範囲内',
      notGranted: '読み取り専用 — 操作は許可されていません',
      quoteScope: '許可された見積範囲外です',
      projectScope: '許可範囲外のプロジェクト',
      notDraft: '提出できるのはドラフトのみです',
      invalidAmount: '金額は正でなければなりません',
    },
    preparedBy: '作成者',
    parentProject: 'プロジェクト',
    sourceQuote: '出典引用',
    relationships: '関連レコード',
    relatedQuotes: 'プロジェクトの引用',
    relatedOrders: 'プロジェクト受注',
    filtered: 'フィルタリング条件',
    clearFilter: 'フィルタークリア',
    noPageAccess: 'ページアクセスなし',
    descriptions: {
      projects:
        'プロジェクトからの関連見積と注文を開きます。関連リストには、このアカウントがアクセスできるレコードのみが表示されます。',
      quotes:
        'プロジェクトには複数の引用符を含めることができます。提出では、プロジェクトの範囲と見積作成者が個別にチェックされ、草案のステータスと金額が検証されます。',
      orders:
        '各注文は、そのソース見積とプロジェクトを参照します。配送アカウントは注文を入力するだけです。参照は他のページやレコードへのアクセスを許可しません。',
    },
    delivery: '配送',
    orders: '注文',
    editProject: 'プロジェクト情報の編集',
    editQuote: '価格設定を編集する',
    submit: '見積書の提出',
    submitScopes: {
      projects: '引用にリンクされているプロジェクト',
      quotes: '引用を送信可能',
    },
    deliver: '配送の確認',
    amount: '金額',
    status: '状態',
    deliveryReference: '納品参照',
    group: '販売協力',
    title: '販売権限の例',
    projects: 'プロジェクト',
    quotes: '見積もり',
    view: '表示',
    edit: 'メモを編集する',
    intro:
      'アシスタントのコンサルティング記録、見積書を作成するエンジニア、委任された見積書の引き継ぎ、注文を処理する配送スタッフのアクセス境界を探索します。',
    record: 'レコード',
    notes: 'メモ',
    save: '保存',
    refresh: '更新',
    loading: '読み込み中…',
    empty: 'アクセス可能な記録はありません',
    readOnly: '読み取り専用',
    saved: '保存しました',
    scope: {
      prepared: '私が作成した名言',
      title: '売上データの範囲',
      unrestricted: '制限なし',
      region: '私の地域',
      own: '私が所有する親プロジェクト',
      public: '非機密プロジェクト',
    },
  },
  title: '販売権限の例',
  overview: 'ガイド',
  actions: '操作',
  testAccounts: 'アカウントの例',
  account: 'アカウント',
  permissionSet: '権限セット',
  password: 'パスワードの例: AuthzExample123!',
  tryTitle: '設定と確認',
  roles: {
    assistant: '営業アシスタント',
    engineer: 'セールスエンジニア',
    manager: 'プロジェクトマネージャー',
    delivery: '配達専門家',
  },
  forbidden: 'この操作に対する権限がありません。',
  error: '読み込みに失敗しました。もう一度試してください。',
};

export default jaJP;
