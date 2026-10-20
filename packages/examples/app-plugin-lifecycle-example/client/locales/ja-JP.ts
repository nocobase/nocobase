import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  navigation: {
    parameters: '実行時パラメータ',
    group: 'ワークフロー',
    tickets: 'ヘルプデスク',
    expenses: '経費報告書',
    invoices: '電子請求書発行',
    orders: '注文支払い',
    exports: 'データのエクスポート',
    purchases: 'フラッシュセール',
    fulfilments: '送料',
    subscriptions: '定期購入',
  },
  parameters: {
    fields: {
      paymentWindowMinutes: {
        title: '支払いタイムアウト (分)',
        description:
          'この待機後に未払いの注文をキャンセルします。変更は、新しくスケジュールされた支払いタイマーに適用されます。既存のタイマーは期限を守ります。',
      },
      escalateAfterMinutes: {
        title: 'マネージャーのレビュータイムアウト (分)',
        description:
          'この待機後に保留中のマネージャーのレビューをエスカレーションします。変更は、新しくスケジュールされたレビュー タイマーに適用されます。既存のタイマーは期限を守ります。',
      },
      waitMinutes: {
        title: '顧客応答タイムアウト (分)',
        description:
          '顧客がこの待ち時間内に応答しない場合は、チケットを閉じます。変更は、新しくスケジュールされたタイマーに適用されます。既存のタイマーは期限を守ります。',
      },
      querySeconds: {
        title: '請求書ステータス照会遅延 (秒)',
        description:
          'この待ち時間内にコールバックが到着しない場合は、請求書プロバイダーに問い合わせます。変更は、新しくスケジュールされたクエリに適用されます。既存のクエリは期限を守ります。',
      },
      pollSeconds: {
        title: 'エクスポート進捗確認間隔(秒)',
        description:
          '進行中のエクスポートを確認する前に、このくらいの時間待ちます。変更は、新しくスケジュールされたチェックに適用されます。既存の小切手は期限を守ります。',
      },
      maxMinutes: {
        title: 'エクスポート完了タイムアウト (分)',
        description:
          'エクスポートジョブ開始時の完了期限を設定します。未完了のジョブはその期限でタイムアウトになります。変更によって既存のジョブの期限が変更されることはありません。',
      },
      periodMinutes: {
        title: 'サブスクリプション更新期間 (分)',
        description:
          'この期間を使用して、チャージが成功した後の新しい期間の終了日を計算します。変更は次回の充電成功後に適用されます。当期末は固定のままです。',
      },
      dunningMinutes: {
        title: '更新失敗時の支払い再試行間隔 (分)',
        description:
          '失敗した更新支払いを再試行する前に、この時間待機します。変更は、新しくスケジュールされた再試行に適用されます。既存の再試行は期限を守ります。',
      },
      maxDunning: {
        title: '更新支払い失敗限度額',
        description:
          '支払い失敗回数がこの制限に達した場合、次回の自動再試行時にサブスクリプションをキャンセルします。変更は次回の再試行決定時に適用されます。',
      },
      reopenDays: {
        title: 'チケット再開期限（日）',
        description:
          'チケットが閉じられてからこの日数以内に再開できるようにします。それ以外の場合は、新しいチケットが必要です。各再開リクエストでは最新の設定が使用されます。',
      },
    },
    loading: 'パラメータをロード中…',
    title: '実行時パラメータ',
    description:
      'コードで宣言された値のみを変更します。ワークフローの構造、決定、タイムアウトはコード内に残ります。',
    ruleExplanation:
      '1 つのグループ内のすべての条件が一致する必要があります。別々のグループが一緒に追加されます。代替ユーザーを別のグループに配置します。',
    allConditions: 'これらの条件をすべて満たす',
    alsoInclude: 'また、',
    selectionType: '選択タイプ',
    searchReference: '名前から探す',
    noMatches: '一致する参考文献はありません',
    previousPage: '前のページへ',
    nextPage: '次のページ',
    reference: '参照',
    remove: '削除',
    addCondition: '条件の追加',
    addGroup: '別のグループも含める',
    revision: 'リビジョン {{revision}}',
    codeDefaults: 'コードのデフォルト',
    databaseVersion: '保存された設定',
    snapshotEffect:
      'スナップショット: 最初の送信時に修正されました。返品または撤回後も保持される',
    liveEffect:
      '今後のパラメータの読み取りには最新の設定が使用されます。既存のタイマーと期限は固定されたままになります。',
    yes: 'はい',
    no: 'いいえ',
    invalidObject: '有効な JSON オブジェクトを入力してください。',
    saved: '設定が保存されました。',
    conflict:
      'リビジョンが変更されました。入力内容は保存されています。再試行する前に現在の値を確認してください。',
    currentRevision: '現在保存されているリビジョン: {{revision}}',
    keepDraft: '入力内容を保持し、このリビジョンを使用してください',
    save: '値を保存する',
    readOnly:
      'これらの値を読み取ることはできますが、変更することはできません。',
    preview: 'リンのプレビュー候補',
    candidates: '候補者',
    noCandidates: '適格な候補者はいない。提出は拒否されます。',
    editCurrent: '現在の設定を編集します',
    historyBoundary:
      '現在の設定を編集します。歴史的事実および既存の割り当てられた候補者は変更されません。',
    history: '実際のパラメータの使用法',
    effectivePreview: 'このレコードの現在有効な値',
    firstSnapshot: '最初に送信されたスナップショット',
    notRecorded: '未収録',
    diagramEntry: 'オプションの図エントリ',
    diagramHint:
      'バインドされたノードまたはトランジションをクリックして、共有エディタを開きます。バインドされていないエントリには、元の詳細が表示されます。クリックしてもトランジションは実行されません。',
    workflow: 'ワークフロー',
    types: {
      department: '部門',
      role: 'ロール',
      user: '人物',
    },
  },
  invoices: {
    title: '電子請求書発行',
    list: '請求書',
    new: '新しい請求書',
    empty: 'ここには請求書はありません。',
    pick: '請求書を選択して、その問題を追跡します。',
    description:
      '完了したサンドボックス注文を請求します。プラットフォーム Webhook を待ちます。何もない場合は {{seconds}} 秒後にクエリを実行します。送信は 3 回まで試行できます。',
    shows:
      '送信、コールバック、タイムアウト クエリ、および再試行は 1 つのプロバイダー リクエストを共有します。繰り返し通知が適用されるのは 1 回だけであり、再試行しても 2 回目の請求書が発行されることはありません。',
    orderSummary: '注文 #{{order}} · {{amount}}',
    fields: {
      order: '注文完了',
      customer: '顧客\n【829】お客様オーダーランキング',
      amount: '金額\n【232】金額(円)',
      taxNumber: '納税者番号',
      request: 'プロバイダーリクエスト',
      number: '請求書番号',
      queries: 'クエリ',
    },
    actions: {
      submit: '請求書のリクエスト',
      retryInvoice: '請求書を再試行します',
    },
    form: {
      title: '電子請求書をリクエストする',
      ordersHint:
        '完了したデモンストレーション注文を選択します。各注文に含めることができる請求書は 1 つだけです。',
      order: '注文 #{{order}} · {{customer}} · {{amount}} · 完了しました',
      invoiceTitle: '請求書のタイトル',
      failSubmissions: '意図的に失敗した送信',
      failHint:
        '自動再試行を表示するには、1 または 2 を設定します。発行時に 3 回停止しましたが失敗しました。請求書を再試行すると回復します。',
      submit: '作成',
    },
    banner: {
      draft: 'まだリクエストされていません。',
      submitting: 'リクエストを送信します。失敗は再試行されます…',
      awaiting:
        'プラットフォーム Webhook を待機しています。 {{time}} でクエリを実行しています。',
      querying: '請求プラットフォームにクエリを実行しています…',
      issued: '請求書が発行されました。デモPDFが完成しました。',
      failed: '発行失敗: {{error}} 請求書を再試行できます。',
    },
    outside: {
      title: '請求書発行プラットフォーム (サンドボックス)',
      description:
        'リクエストを完了し、Webhook を送信する外部プラットフォームをシミュレートします。実際の税制は関係ありません。',
      result: 'プラットフォームの結果',
      hint: 'Webhook を保持して正常に発行します。請求書はまだ待機しており、30 秒後に結果をクエリします。古いイベントを後で配信しても、再度発行することはできません。',
      issue: '正常に発行されました',
      fail: '請求書の拒否',
      download: 'サンプルPDFをダウンロード',
      pdfHint:
        'ファイルには SANDBOX INVOICE と書かれていますが、有効な税金請求書ではありません。',
    },
  },
  identity: {
    label: '次のユーザーとしてサインインしました',
  },
  roles: {
    agent: 'サポートエージェント',
    customer: 'お客様',
    applicant: '従業員',
    manager: '管理者',
    director: '幹部',
    finance: '金融',
  },
  common: {
    signedInUser: 'サインインしているユーザー',
    system: 'システム',
    unassigned: '未割り当て',
    loading: '読み込み中…',
    cancel: 'キャンセル',
    close: '閉じる',
    demoOptions: 'デモオプション',
  },
  tickets: {
    title: 'ヘルプデスク',
    agentDescription:
      '新しいチケットを取得し、顧客に返信して解決します。顧客を待っているチケットは、顧客が沈黙すると自動的に閉じられ、顧客の応答によって担当者に戻されます。',
    customerDescription:
      'サポート チームに助けを求め、会話に従ってください。クローズされたチケットは、{{days}} 日間は再度オープンできます。',
    queue: 'チケット待ち行列',
    mine: '私のチケット',
    newTicket: '新しいチケット',
    empty: 'ここにはチケットがありません。',
    pick: 'チケットを選択して会話を読んでください。',
    filters: {
      all: 'すべて',
      new: '新しい',
      open: 'オープン',
      awaitingCustomer: '待っています',
      closed: '閉店',
    },
    form: {
      title: 'サポートに連絡する',
      subject: '件名',
      subjectPlaceholder: '問題を一文で要約する',
      category: 'カテゴリー',
      priority: '優先順位',
      description: '説明',
      descriptionPlaceholder:
        '何が起こったのか、何を期待したか、そしてそれを再現する手順',
      failNotifications: 'メール配信が意図的に失敗する',
      failHint:
        'このチケットへの返信ごとにメールが送信されます。最初の試行は失敗し、効果を再試行して確認してください。',
      submit: 'チケットを送信する',
    },
    categories: {
      account: 'アカウントとサインイン',
      billing: '請求',
      howto: 'どうすれば…',
      incident: '何かが壊れています',
    },
    priorities: {
      low: '低',
      normal: 'ノーマル',
      high: '高',
      urgent: '緊急',
    },
    meta: {
      customer: '顧客\n【829】お客様オーダーランキング',
      category: 'カテゴリー',
      priority: '優先順位',
      assignee: '担当者',
      created: '作成しました',
    },
    banner: {
      new: 'エージェントが受け取るのを待っています。',
      open: '{{assignee}} が取り組んでいます。',
      awaiting:
        'お客様をお待ちしております。 {{time}}では応答せずに自動的に閉じます。',
      overdue: '待ちは終わりました。次のスイープで閉じます。',
      resolved: 'サポートにより解決されました。',
      timeout: '自動的に終了しました: 顧客が時間内に応答しませんでした。',
      reopenUntil: '{{date}}まで再開できます。',
      reopenExpired:
        '再び開くことはできなくなりました。新しいチケットを開いてください。',
    },
    thread: {
      wrote: '{{name}}・{{time}}',
      accept: '{{actor}} がチケットを取りました',
      resolve: '{{actor}} が解決済みとマークしました',
      autoClose: '{{minutes}} 分待つと自動的に閉じられます',
      reopen: '{{actor}} がチケットを再開しました',
      delivery: {
        queued: '顧客へのメールが待機中です',
        running: '顧客にメールを送信中…',
        succeeded: 'お客様にメールで送信しました',
        failed: '{{attempts}} 回の試行後に電子メールが失敗しました: {{error}}',
        retrying:
          '電子メールの試行 {{attempts}} が失敗しました。再試行します: {{error}}',
      },
    },
    composer: {
      agentPlaceholder: 'お客様への返信…',
      customerPlaceholder: '返信を追加…',
      reopenPlaceholder: '何がまだ間違っているか教えてください…',
      reply: '返信を送信',
      accept: 'チケットを取る',
      resolve: 'マークは解決されました',
      customerReply: '送信',
      reopen: '再開',
      nothing: 'このチケットに関して今できることは何もありません。',
    },
  },
  expenses: {
    title: '経費報告書',
    applicantDescription:
      '事業経費を請求します。 {{auto}} までは自動的に承認されます。それ以上はあなたのマネージャーが承認し、{{finance}}以上は財務ディレクターも承認します。',
    approverDescription:
      'レポートはあなたの承認を待っています。 {{minutes}} 分間放置したレポートは、自分のマネージャーに渡されます。',
    finalApproverDescription: 'レポートはあなたの承認を待っています。',
    mine: '私のレポート',
    approvals: '待ってるよ',
    newReport: '新しい報告書',
    empty: 'ここにはレポートがありません。',
    emptyApprovals: 'あなたの承認を待っているものは何もありません。',
    pick: 'レポートを選択して表示します。',
    number: 'レポート {{id}}',
    editor: {
      title: '目的',
      titlePlaceholder: '例: 上海トレードショー、10 月',
      purpose: '詳細',
      purposePlaceholder:
        '誰が行ったのか、なぜ行ったのか、承認者が知っておくべきこと',
      items: '経費',
      date: '日付',
      category: 'カテゴリー',
      description: '説明',
      amount: '金額(円)',
      addItem: '経費を追加する',
      removeItem: '削除',
      total: '合計',
      failPayments: '支払いの試行が意図的に失敗する',
      failHint:
        '承認されたレポートは効果によって支払われます。最初の試行が失敗し、再試行されるのを確認します。',
      save: '下書きの保存',
      saved: '保存しました。',
      submit: '承認のために送信します',
      resubmit: '再送信',
    },
    categories: {
      transport: '輸送',
      lodging: '宿泊施設',
      meals: '食事',
      office: '事務用品',
      entertainment: 'クライアントのエンターテイメント',
      other: 'その他',
    },
    steps: {
      submit: '送信済み',
      manager: 'マネージャー',
      finance: '金融',
      payment: '有料',
    },
    meta: {
      applicant: '申請者',
      approver: '待っています',
      created: '作成しました',
      paymentRef: 'お支払いに関するご案内',
      total: '合計',
    },
    banner: {
      draft: '草案。送信するまではあなただけが見ることができます。',
      awaiting: '{{approver}}を待っています。決定なしで{{time}}で監督にパス。',
      awaitingFinal: '{{approver}}を待っています。',
      overdue: '待ちは終わりました。次のスイープではそれが渡されます。',
      needsInfo: '{{actor}} が返送しました: {{reason}}',
      rejected: '{{actor}} が拒否しました: {{reason}}',
      approved: '承認されました。支払いが進んでいます。',
      paymentRetrying:
        '支払い試行 {{attempts}} が失敗しました。再試行しています: {{error}}',
      paymentFailed:
        '{{attempts}} 回の試行後に支払いが失敗しました: {{error}}。財務はフォローアップします。',
      paid: '有料。 {{ref}}を参照してください。',
    },
    timeline: {
      title: '承認履歴',
      empty: 'まだ提出されていません。',
      autoApproved: '{{limit}}内：自動承認',
      escalated: '決定が間に合わず。次上のマネージャーに渡されました',
      paid: '支払い完了',
    },
    decision: {
      title: 'あなたの決断',
      placeholder: 'コメント (返信または拒否する場合に必要)',
      approve: '承認',
      requestInfo: '差し戻し',
      reject: '却下',
    },
    withdraw: '取り下げ',
  },
  flowDiagram: {
    overview: '図の概要',
    actualSize: '実寸',
    states: '州',
    transitions: 'トランジション',
    configurable: 'パラメータ',
    current: '現在',
    visited: '訪問しました',
    initial: 'イニシャル',
    final: 'ファイナル',
    state: '状態',
    zoomOut: 'ズームアウト',
    zoomIn: '拡大してみる',
    fit: 'ビューに合わせる',
    empty: '表示する状態がありません。',
    loading: '配置図…',
    failed: 'この図をレイアウトできません。',
    nodeHelp: 'Enter または Space を押して状態を選択します。',
    edgeHelp: 'Enter または Space を押してトランジションを選択します。',
  },
  diagramStatus: {
    traversed: '横断しました',
    end: '終了',
    current: '現在',
    visited: '訪問しました',
    available: 'あり',
    pending: '未踏破',
  },
  flows: {
    customer: '顧客\n【829】お客様オーダーランキング',
    final: 'これで完成です。もうそれを動かすものは何もありません。',
    process: 'プロセス',
    legend:
      '現在の状態はより強力な塗りつぶしを持っています。訪問した状態と実際に通過した遷移は 1 つのアクセント カラーを共有します。凡例は、利用可能な遷移と通過されていない部分を示します。初期状態にはピルの境界線があり、最終状態には二重の境界線があります。詳細については、状態または遷移を選択してください。 ⚙サーバーのみ、⏱トリガー、✓/✗効果継続。',
    nothing: '今ここであなたができることは何もありません。それは外を待ちます。',
  },
  webhooks: {
    title: 'Webhook',
    hint: 'サンドボックスが送信、保持、または配信したもの、および各配信に対する応答方法。もう一度配信してリプレイを見るか、別の順序で保留したものを配信します。',
    empty: 'Webhook はまだありません。',
    hold: 'Webhookを保留します',
    deliver: '届ける',
    deliverAgain: '再配達',
    deliveries_one: '配信時間 {{count}}',
    deliveries_other: '{{count}} 回配信されました',
    occurred: '{{time}}が起こりました',
    outcomes: {
      applied: '適用済み',
      replayed: '再生しました',
      ignored: '無視されました',
      retry: '再試行します',
      held: '開催',
    },
  },
  orders: {
    title: '注文支払い',
    list: '注文',
    new: '新しい秩序',
    empty: 'ここでは注文できません。',
    pick: '注文を選択して、その支払い状況を確認します。',
    shows:
      '支払いはページではなくプロバイダーの Webhook によって確認されます。注文は状態として待機し、Webhook は、どんなに遅くても、早くても、頻繁に到着しても、それを 1 回だけ実行します。注文がキャンセルされた後に到着した支払いは返金されます。',
    description:
      '顧客は、決済プロバイダーがホストするチェックアウトで支払います。プロバイダーの Webhook が到着すると、注文が続行されます。未払いの注文は {{minutes}} 分後に終了します。',
    nothing: '何もする必要はありません。注文は支払いプロバイダーを待ちます。',
    actions: {
      checkout: '支払う',
      cancel: '注文をキャンセルする',
      ship: '船',
      refundOrder: '払い戻し',
      retryRefund: '払い戻しの再試行',
    },
    form: {
      title: '注文する',
      item: 'アイテム',
      amount: '金額(円)',
      failCheckouts: 'チェックアウト試行が意図的に失敗する',
      failRefunds: '払い戻しの試行が意図的に失敗する',
      failHint:
        'チェックアウトのオープンと返金は再試行による影響です。再試行と注文がどこで停止するかを監視できないようにします。',
      submit: '注文する',
    },
    fields: {
      customer: '顧客\n【829】お客様オーダーランキング',
      amount: '金額\n【232】金額(円)',
      attempt: '支払いラウンド',
      session: 'チェックアウトセッション',
      paymentRef: 'お支払い\n【2335】キャンセル後のお支払い',
      refundRef: '払い戻し',
    },
    banner: {
      draft: 'まだ支払われていません。',
      creatingCheckout: 'プロバイダーのチェックアウトを開いています…',
      awaitingPayment:
        '決済プロバイダーを待っています。支払われない場合は {{time}} でクローズします。',
      overdue: '窓は終わりました。次のスイープで閉じます。',
      paymentFailed: '{{error}} 再度支払うか、{{time}} で終了します。',
      paid: '支払い済み、発送準備完了。',
      cancelled: {
        customer: 'お客様によりキャンセルされました。',
        timeout: '閉店: 支払いが期限内に行われていません。',
        refundRequested:
          'お客様のご要望により返金いたします。\n【2628】返金されました。',
      },
      refunding: '払い戻し中…',
      refundNeedsAttention:
        '返金に失敗しました: {{error}} 誰かが再試行するのを待ちます。',
      refunded: '返金されました。',
      fulfilled: '支払い済み、発送済み。',
    },
    sessionStatus: {
      open: 'オープン',
      paid: '支払い済み',
      declined: 'が辞退しました',
      expired: '有効期限が切れました',
    },
    outside: {
      title: '決済プロバイダー (サンドボックス)',
      description:
        'プロバイダーのチェックアウトで顧客を再生し、プロバイダーが Webhook を送信します。 Webhook を保持して、遅延、2 回、またはキャンセル後に配信します。',
      checkout: 'ホスト型チェックアウト',
      session: 'セッション{{id}}: {{status}}。',
      noSession: 'チェックアウトは開いていません。顧客が最初に支払います。',
      pay: '支払う',
      decline: 'カードを拒否する',
      tryThis:
        '試してみてください: Webhook を保持し、支払い、注文をキャンセルし、保持した Webhook を配信します。お金はキャンセル後に到着し、返金されます。',
    },
  },
  exports: {
    title: 'データのエクスポート',
    list: '輸出',
    new: '新規輸出',
    empty: 'ここでは輸出はありません。',
    pick: 'エクスポートを選択して、ポーリングされるのを監視します。',
    shows:
      'ベンダーには Webhook がないため、ライフサイクルは次のことを要求します。トリガーは数秒ごとに自己遷移を起動し、再度その状態に入るとベンダーをポーリングします。記録上に定められた期限が来ると待機は終了します。',
    description:
      'ベンダーはエクスポートのレンダリングが遅く、誰もコールバックしないため、各エクスポートは {{seconds}} 秒ごとにポーリングし、{{minutes}} 分後にあきらめます。',
    nothing:
      '何もする必要はありません。エクスポートはベンダーにポーリングしています。',
    actions: {
      submit: 'エクスポート開始',
      retry: '再度エクスポートします',
      cancel: 'キャンセル',
    },
    outcomes: {
      success: '成功します',
      failure: '失敗',
      stuck: 'が 60% で止まってしまいます',
    },
    jobStatus: {
      running: 'ランニング',
      succeeded: '完了',
      failed: '失敗しました',
      cancelled: 'キャンセルされました',
    },
    form: {
      title: 'エクスポートをリクエストする',
      name: '名前',
      duration: 'ベンダーの所要時間 (秒)',
      outcome: 'ベンダーの仕事',
      hint: 'スタックしたジョブは決して終了しません。エクスポートは期限になるとタイムアウトになり、ジョブが停止します。',
      submit: '作成',
    },
    fields: {
      vendor: 'ベンダー',
      vendorValue: '{{seconds}}、{{outcome}}',
      job: 'ベンダーの仕事',
      polls: '投票',
      deadline: '締め切り',
    },
    banner: {
      draft: '開始されていません。',
      starting: 'ベンダーにジョブを送信しています…',
      processing: 'ベンダーが取り組んでいます。 {{time}}でギブアップ。',
      done: '準備完了: {{url}}',
      failed: '失敗: {{error}}',
      timedOut:
        'ベンダーは期限までに作業を終了しませんでした。その仕事は停止されました。',
      cancelled: 'キャンセルされました。',
    },
    outside: {
      title: 'ベンダー (サンドボックス)',
      description:
        'エクスポートがベンダーの仕事について知っていること: 最後の投票で確認されたことのみ。ベンダーは Webhook を送信しないため、他のベンダーは Webhook を送信できません。',
      lifecycleSide: 'エクスポートが知っていること',
      lifecycleHint:
        'ジョブ {{id}}、前回の投票で確認されたとおり。次回の投票で最新の情報が得られます。',
      lastPoll:
        '前回の世論調査では、{{status}}、{{progress}}% ({{count}} 世論調査) でした。',
      noPoll: 'まだ投票されていません。',
      nextPoll: '次の投票は {{time}} あたりです。',
      pollDue: '次のスイープでポーリングします。',
      noJob: 'ベンダーにはまだ仕事がありません。',
    },
  },
  purchases: {
    title: 'フラッシュセール',
    list: '購入品',
    new: '新規購入',
    empty: 'ここでは購入できません。',
    pick: '購入を選択して手順に従います。',
    shows:
      '購入は 2 つのシステムにまたがり、データベースのロールバックでは元に戻すことはできません。各ステップは 1 つの効果を持つ状態であり、請求が拒否されると、予約は独自のステップによって元に戻されます。そのため、まだ支払うべきものは常にレコードの状態です。',
    description:
      '倉庫がユニットを保管し、支払いプロバイダーがお金を受け取ります。カードが拒否されると、補償ステップによってユニットが返されます。失敗し続ける代償は立ち止まって人を待ちます。',
    nothing: '何もする必要はありません。購入は順調に進んでいます。',
    actions: {
      submit: '注文する',
      abandon: '廃棄',
      retryRelease: 'リリースを再試行します',
    },
    items: {
      headphones: 'ヘッドフォン',
      keyboard: 'メカニカルキーボード',
      lamp: 'デスクランプ',
    },
    form: {
      title: 'フラッシュセールで購入する',
      item: 'アイテム',
      quantity: '数量',
      total: '合計 {{total}}',
      declineCharge: 'カードが拒否されました',
      failReleases: '意図的に失敗した株式リリース',
      failHint:
        '補償金を見るためにカードを拒否します。リリースを 3 回以上失敗させて、停止して人を待つのを確認します。',
      submit: '作成',
    },
    fields: {
      customer: '顧客\n【829】お客様オーダーランキング',
      amount: '金額\n【232】金額(円)',
      reservation: '予約',
      paymentRef: 'お支払い\n【2335】キャンセル後のお支払い',
    },
    banner: {
      draft: 'まだ配置されていません。',
      reserving: 'ユニットを予約中…',
      charging: '保有単位。カードにチャージ中…',
      releasing: '充電に失敗しました ({{error}})。ユニットを返却します…',
      compensationNeedsAttention:
        'ユニットを返せませんでした: {{error}} 誰かがリリースを再試行するのを待ちます。',
      confirmed: '確認済み: ユニットは予約され、支払われています。',
      cancelled: {
        customer: '破棄されました。',
        outOfStock: 'キャンセル: {{error}}',
        paymentDeclined:
          'キャンセル: カードは拒否され、ユニットは返されました。',
      },
    },
    outside: {
      title: '倉庫および決済プロバイダー (サンドボックス)',
      description:
        '各ステップはアプリケーションの外部のシステムに影響を与えます。元に戻すのもステップです。',
      steps: 'ステップ',
      stepsHint: '各ステップの効果の最後の実行。',
      reserve: '予約在庫',
      charge: 'カードにチャージする',
      release: '株式放出（補償）',
      notYet: '実行されません',
      stock: '倉庫在庫',
      stockHint: 'ユニットが出発して戻ってくるのを見てください。',
      item: 'アイテム',
      available: 'あり',
      reserved: '予約済み',
    },
  },
  fulfilments: {
    title: '送料',
    list: '発送',
    new: '新入荷',
    empty: 'こちらには発送がありません。',
    pick: '支払い、倉庫、配送業者をプレイする出荷を選択します。',
    shows:
      '貨物は、2 つのシステムからの 2 つの信号を到着順に待ち、その後、運送業者のイベントに従います。これは、到着時ではなく発生時に適用されます。',
    description:
      '支払いが受領され、倉庫がそれをピッキングすると、出荷はいずれかの順序で出発します。通信事業者の Webhook は遅れて到着し、順序が狂います。新しいイベントのみがそれを動かします。',
    nothing: 'あなたがすることは何もありません。荷物は外で待っています。',
    actions: {
      ship: 'ハンドツーキャリア',
      cancel: '出荷をキャンセルする',
    },
    signals: {
      payment: '支払いがキャプチャされました',
      pick: '倉庫でピックされました',
    },
    and: 'と',
    carrier: {
      booked: '予約済み',
      pickedUp: '拾いました',
      inTransit: '輸送中',
      outForDelivery: '配達中です',
      delivered: '納品されました',
      exception: '例外',
    },
    form: {
      title: '貨物を開封する',
      name: '名前',
      customer: '顧客\n【829】お客様オーダーランキング',
      submit: '作成',
    },
    fields: {
      customer: '顧客\n【829】お客様オーダーランキング',
      paid: '支払いが捕捉されました',
      picked: '選んだ',
      tracking: '追跡番号',
      carrier: 'キャリアは言う',
      carrierAt: '現在',
    },
    banner: {
      preparing: '待機中: {{waiting}}。',
      readyToShip: '支払いと受け取り: 運送業者に渡す準備ができています。',
      booking: '運送業者を予約しています…',
      shipped: '途中です。',
      exception:
        '通信事業者が問題を報告しました。新しいイベントでクリアされます。',
      delivered: '納品されました。',
      cancelled: 'キャンセルされました。',
    },
    outside: {
      title: '決済プロバイダー、倉庫および運送業者 (サンドボックス)',
      description:
        '各システムの Webhook を今すぐまたは保留中に送信します。保留されているものを別の順序で配信し、どれが適用されるかを確認します。',
      signals: '2つの信号',
      signalsHint: 'どちらが先に来ても構いません。 2 番目は出荷を進めます。',
      capture: '支払いが捕捉されました',
      pick: '倉庫でピックされました',
      carrierTitle: '運送業者',
      carrierHint: '小包に関する出来事、それぞれが起こった時間。',
      status: '状態',
      location: '所在地',
      offset: '今から数分後',
      send: '送信',
      offsetHint:
        '最後のフィールドはスキャンが発生したときにシフトします。負の数は古いスキャンを報告します。',
      scramble: '3 回のスキャンを保持して任意の順序で配信します',
    },
  },
  subscriptions: {
    title: '定期購入',
    list: '定期購入',
    new: '購読する',
    empty: 'ここには購読はありません。',
    pick: '請求を追跡するサブスクリプションを選択します。',
    shows:
      'サブスクリプションは、有効である限り、期間ごとにアクティブ→充電→アクティブを繰り返します。更新の期限は、スイープが検出したサブスクリプション自体の期間の終了日です。拒否されたカードは、断念するまでトリガーによって再試行されます。',
    description:
      '{{period}} 分ごとに充電されます。拒否された請求は、{{dunning}} 分ごとに再試行されます。 {{tries}} が試行すると、サブスクリプションはキャンセルされます。',
    nothing: '何もする必要はありません。請求は自動的に実行されます。',
    actions: {
      updateCard: 'アップデートカード',
      cancel: '配信停止',
    },
    plans: {
      basic: 'ベーシック',
      pro: 'プロ',
    },
    periodN_one: '{{count}}期間',
    periodN_other: '{{count}}期間',
    form: {
      title: '購読する',
      plan: 'プラン',
      charge: '{{price}} は現在および各期間の開始時に課金されます。',
      cardDeclines: 'カードへの請求が拒否されました',
      failHint:
        '拒否は応答であり、停止ではありません。請求はすぐに再試行されるのではなく、督促トリガーによって新しいキーで再試行されます。',
      submit: '購読する',
    },
    fields: {
      customer: '顧客\n【829】お客様オーダーランキング',
      periods: '支払われた期間',
      periodEnd: '期間終了',
      dunning: '失敗した試行',
      lastCharge: 'ラストチャージ',
      card: 'カード',
      cardWorks: '作品',
      cardValue_one: 'は次の請求を拒否します',
      cardValue_other: 'は次の {{count}} 請求を拒否します',
    },
    banner: {
      renewing: 'カードをチャージ中…',
      active: 'アクティブ。 {{time}}で更新します。',
      due: '期間は終了しました。次のスイープで更新されます。',
      pastDue:
        '{{error}} {{max}} の {{tries}} を試してください。次は {{time}} で試してください。',
      cancelled: {
        customer: '登録を解除しました。',
        unpaid: 'キャンセルされました: カードは拒否され続けました。',
      },
    },
    outside: {
      title: '課金（サンドボックス）',
      description:
        'すべてのチャージは、期間と試行によってキー設定されたチャージ効果の実行です。',
      charges: '請求',
      chargesHint: '古い順。',
      noCharges: 'まだ課金はされていません。',
      sweep: 'リニューアルスイープ',
      sweepHint:
        '更新は、各サブスクリプションの期間終了時にスイープによって検出されます。 10 秒ごと、または今実行されます。',
    },
  },
  guide: {
    title: 'この例について',
    show: 'ショー',
    hide: '隠す',
    purpose: 'それが示すもの',
    howTo: '試し方',
    samples:
      'アプリケーションがサンプル データ (APP_SAMPLE_DATA=true) とともにインストールされると、サンプル レコードがロードされます。これらを使用せずにインストールされたデータベースでは、「pnpm nocobase db sample」を実行します。',
    invoices: {
      purpose:
        '1 つのプロバイダー リクエストを使用して、ダウンロード可能なサンプル PDF を使用して、コールバック、タイムアウト クエリ、および再試行をデモンストレーションします。',
      step1:
        'オーダー #1024 のサンプルを開いてリクエストし、サンドボックスで [正常に発行] をクリックします。 Webhook の後、サンプル PDF をダウンロードします。',
      step2:
        '同じ通知を再度配信します。通知は再実行され、2 回目の請求書は発行されません。',
      step3:
        'オーダー #1026 で、Webhook を保持し、正常に発行しました。 30 秒後にクエリが完了します。後日のお届けでの再発行はできません。',
      step4:
        '晨光书店サンプルの送信に3回失敗しました。請求書の再試行は失敗した問題から回復し、同じプロバイダー要求を維持します。',
    },
    tickets: {
      purpose:
        'チケットは独自のステータス フィールドにその位置を保持し、すべての変更 (受け入れ、応答、解決、再オープン) はソースで宣言された遷移になります。会話は遷移ログです。各メッセージは、それが引き起こした遷移の入力です。電子メールは、移行のコミット後に再試行を伴うエフェクトとして実行され、顧客を待機したままになっているチケットはトリガーによって閉じられます。',
      step1:
        'サポート エージェントと顧客を切り替えるには、右上の [サインイン] を使用します。エージェントはキュー全体を確認します。顧客には自分のチケットのみが表示されます。',
      step2:
        'エージェントとして、新しいチケット「無法登录管理后台」を開いて返信します。現在は顧客を待ち、数分間の沈黙の後に自動的に終了します。トリガーは 10 秒ごとにスイープされます。',
      step3:
        '王女士に切り替えて、彼女を待っているチケットに返信します。チケットはエージェントに戻ります。閉じられたチケットは、顧客が 7 日間再度開くことができます。「どうやって今月の订单报表?」で李先生として試してみてください。',
      step4:
        'デモ オプションで「意図的に失敗する電子メール配信」を設定して顧客としてチケットを提出し、エージェントとして返信します。「内部」では、電子メールの効果が失敗し、再試行されることが示されています。',
    },
    expenses: {
      purpose:
        '経費報告書は金額によってルーティングされます。5,000 円までは自動的に承認され、それを超えると申請者のマネージャーが承認し、50,000 円を超えると財務責任者も承認します。承認者は理由を付けて承認、差し戻し、または拒否し、アイドル状態のマネージャーはトリガーによって引き渡され、承認されたレポートには支払い済みのマークを付ける効果によって支払いが行われます。',
      step1:
        '「サインイン」を使用して、従業員の林晓と何东、そのマネージャー、執行役員、財務部長を演じます。従業員は自分のレポートを確認します。承認者は何が待っているかを確認します。',
      step2:
        '林晓として、「杭州客户拜访」(¥872) の草案を提出します。これは自動的に承認され、すぐに支払われます。 「内部」では、支払い効果とそれが起動した「有料」トランジションを示しています。',
      step3:
        '財務部長の赵静に切り替え、陈明がすでに承認した「法兰克福展会参展」を承認する: 50,000円以上は両方必要。',
      step4:
        '何东として、詳細情報のために返送された「北京客户现场支持」を再送信し、孙磊として承認します。マネージャーに 3 分間放置されたレポートは、マネージャーのマネージャーにエスカレーションされます。',
      step5:
        '「内部」では、「現在のアイデンティティにできること」により、現在の人が実行できないすべての行動の理由が示されます。待機中のレポートを 2 つのウィンドウで開き、両方で操作します。2 番目のウィンドウは、表示されたバージョンが古いため拒否されます。',
    },
    orders: {
      purpose:
        '注文は、支払いプロバイダーの Webhook によってのみ支払い済みとしてマークされ、ページによっては決してマークされません。待機中は記録上の単なる状態 (タイマーなし、オープン リクエストなし) であり、遅く、早く、または 2 回到着した Webhook によっても、正確に 1 回だけ移動されます。注文がキャンセルされた後に到着したお金は返金されます。',
      step1:
        'サンプル注文「降噪耳机 × 1」を開き、「支払う」をクリックします。プロバイダーのホスト型チェックアウトが開き、注文は支払いを待ちます。',
      step2:
        '破線の「決済プロバイダー (サンドボックス)」カードで、カードを支払うか拒否します。プロバイダーが送信する Webhook が注文を動かします。 「もう一度配信してください」と答えると再生されます。',
      step3:
        '「Webhook を保留する」にチェックを入れて支払い、「注文をキャンセル」をクリックして保留された Webhook を配信します。支払いはキャンセル後に支払われ、返金されます。',
      step4:
        'サンプル「機械键盘 × 1」は、再試行の効果を示すために、意図的に最初のチェックアウトに失敗しました。未払いのままの注文は 3 分後に期限切れになります。',
    },
    exports: {
      purpose:
        'ベンダーは Webhook を送信しないので、エクスポートはそれをポーリングします。トリガーが自己遷移「ポーリング」を起動し、「処理」を再入力するとチェックが実行され、レコードに書かれた期限がいつ中止するかを決定します。',
      step1:
        '「9月订单明细」を開き、「エクスポート開始」をクリックします。ベンダーの所要時間は 30 秒です。次のポーリングまで、「ベンダーが知っていること」がエクスポートが知っていることよりも先に実行されるのを確認してください。',
      step2:
        '「全年客户名单」を開始すると、ベンダーのジョブが停止します。期限になるとエクスポートがタイムアウトになり、ベンダーのジョブが停止します。 「再度エクスポート」すると新しいラウンドが始まります。',
      step3:
        '「内部」では、すべてのポーリングはログ内の遷移であり、すべてのチェックはエフェクトの実行です。',
    },
    purchases: {
      purpose:
        'フラッシュセールの購入は 2 つのシステムにまたがります。倉庫が在庫を確保し、次に支払いプロバイダーがカードに請求します。請求が拒否されると、独自の補償ステップによって予約が取り消されます。失敗し続ける補償は、人が再試行する状態で停止します。',
      step1:
        '2 つのランプのサンプル購入を開き、「注文する」をクリックします。ユニットが予約され、カードに請求され、購入が完了します。',
      step2:
        'カードが拒否されたサンプル キーボードを購入し、ユニットが「倉庫在庫」から出て戻ってくるのを観察します。',
      step3:
        'カードが拒否され、「意図的に失敗したストック リリース」を 3 に設定して購入を作成します。リリースは停止し、「リリースを再試行」するまで待機します。',
    },
    fulfilments: {
      purpose:
        '貨物は、2 つのシステムからの 2 つの信号 (支払いの受け取りと倉庫のピッキング) を順番に待ってから、運送業者に従います。キャリア イベントは、到着時ではなく発生時に適用され、古いイベントは古いものとして拒否されます。',
      step1:
        'サンプル出荷を開き、「倉庫ピッキング」と「支払い捕捉」をいずれかの順序で送信します。2 番目の送信により、出荷準備完了状態に移行します。',
      step2:
        '「運送業者に渡す」をクリックして、運送業者のスキャンをステータスと場所とともに送信します。',
      step3:
        '「3 つのスキャンを保持して任意の順序で配信する」にチェックを入れ、最新のスキャンを最初に配信します。以前のスキャンは古いものとして無視されます。',
      step4:
        '否定的な「今から数分」は、以前に発生したスキャンを報告します。これは、遅いイベントの様子です。',
    },
    subscriptions: {
      purpose:
        'サブスクリプションは、存続期間中、各期間の開始時に請求されます。プラグインのスイープは、それぞれの期間終了時にそれぞれを更新し、拒否された請求は、回復するかサブスクリプションがキャンセルされるまで、新しいキーの下で督促トリガーによって再試行されます。',
      step1:
        '「購読」をクリックしてプランを選択します。最初の充電はすぐに実行されます。サンプル サブスクリプションを作成するとカードに請求されるため、サンプル サブスクリプションはありません。',
      step2:
        '「カードの請求を拒否する」を 1 に設定して購読します。期限を過ぎますが、1 分後に再試行され、回復します。 「アップデートカード」で一気に回復します。',
      step3:
        '生理は 3 分間続きます。 「更新スイープ」の「今すぐトリガーを実行」を選択すると、次のスイープを待たずに期限が切れたものを更新します。',
    },
  },
  blockers: {
    invoiceRequestMismatch: '結果は別の請求書リクエストに属します。',
    agentOnly: 'チケットを処理できるのはサポート エージェントだけです。',
    requesterOnly: 'チケットを提出したお客様のみが行うことができます。',
    systemOnly: '待機時間が経過すると、システムはこれを独自に実行します。',
    reopenExpired:
      '閉店してから時間が経ちすぎて再開できません。代わりに新しいチケットを提出してください。',
    applicantOnly: '申請者のみがレポートでこれを行うことができます。',
    approverOnly: 'このレポートについては、現在の承認者のみが決定できます。',
    topApprover: '現在の承認者はすでに最高レベルです。',
    customersOnly: 'チケットを提出できるのは顧客だけです。',
    applicantsOnly: '経費報告書を提出できるのは従業員だけです。',
    alreadyPaid: 'ご入金は確認済みです。',
    alreadyPicked: '倉庫ではすでにピッキングされています。',
    staleCarrierEvent: '新しいキャリアイベントがすでに適用されています。',
    periodNotOver: '今期はまだ終了していません。',
  },
  problems: {
    orderRef: '完了したサンドボックス注文を選択します。',
    taxNumber: '税番号を 15 ～ 20 文字または数字で入力します。',
    message: 'メッセージを書きます。',
    reason: '理由を述べてください。',
    subject: 'チケットに件名を付けます。',
    description: '問題を説明してください。',
    category: 'カテゴリを選択してください。',
    priority: '優先順位を選択してください。',
    title: '名前を付けてください。',
    amountCents: '金額は0以上である必要があります。',
    durationSeconds: 'ベンダーには 5 ～ 600 秒かかります。',
    vendorOutcome: 'ジョブの終了方法を選択します。',
    sku: '項目を選択してください。\n［551］このカードのリンクされていない対象１枚を選ぶ。接続によってターゲットは作成されません。 hasOne ターゲットが使用可能である必要があります。',
    quantity: '1〜5の間で購入してください。',
    plan: 'プランを選択してください。',
    customerId: '顧客を選択してください。',
  },
  errors: {
    EXPENSE_NOT_FOUND: '経費報告書が存在しません。',
    OWN_EXPENSE_ONLY: 'このレポートは申請者のみが編集できます。',
    EXPENSE_LOCKED:
      'レビュー中のレポートは編集できません。まずそれを撤回してください。',
    EXPENSE_CHANGED:
      'レポートの編集中にレポートが変更されました。リロードしてもう一度試してください。',
    SANDBOX_SESSION_CLOSED: 'チェックアウトは終了しました。',
    SANDBOX_NOT_FOUND: 'サンドボックスにはそのようなオブジェクトはありません。',
    UNKNOWN_WEBHOOK_EVENT: 'サンドボックスはそのイベントを送信しません。',
    WEBHOOK_EVENT_NOT_FOUND: 'そのような Webhook イベントはありません。',
  },
  lifecycle: {
    title: 'ボンネットの下',
    hint: 'このレコードに対してライフサイクルが記録した内容。実際のアプリケーションでは、これをユーザーに表示しません。',
    available: '現在のアイデンティティでできること',
    final: 'この状態から出る遷移はありません。',
    diagram: 'インタラクティブな図',
    diagramHint:
      'toMermaid(describe()) はライフサイクルを状態図として描画します。 paste it into any Mermaid renderer.',
    retry: '再試行',
    cancel: 'キャンセル',
    continue: '続き',
    continuationWaits: '{{transition}} 待機: {{error}}',
    continuationAbandoned:
      '{{transition}} は {{attempts}} が試行した後、手動で続行するまで諦めました: {{error}}',
    states: '州',
    parameters: 'パラメータ',
    transitions: '移行ログ',
    effects: 'エフェクト実行',
    noTransitions: 'まだ移行はありません。',
    noEffects: 'まだ効果はありません。',
    attempts: '{{attempts}}/{{max}}',
    runTriggers: '今すぐトリガーを実行します',
    sweepNote:
      'とにかくトリガーは 10 秒ごとにスイープされます。これにより、スイープがすぐに実行されます。',
    swept_one: 'スイープにより {{count}} トランジションが発生しました。',
    swept_other: 'スイープにより {{count}} トランジションが発生しました。',
    columns: {
      time: '時間',
      transition: 'トランジション',
      change: '変更',
      actor: 'によって',
      input: '入力',
      effect: 'エフェクト',
      status: '状態',
      attempts: '試み',
      error: '最後のエラー',
    },
  },
  states: {
    review: '検討中',
    submitting: '送信中',
    awaitingIssue: '発行待ち',
    querying: 'クエリ中',
    issued: '発行',
    issueFailed: '発行に失敗しました',
    new: '新しい',
    open: 'オープン',
    awaitingCustomer: '接客',
    closed: '閉店',
    draft: '下書き',
    awaitingManager: 'マネージャー待ち',
    awaitingFinance: '融資待ち',
    needsInfo: '返送されました',
    approved: '承認済み',
    rejected: '却下済み',
    paid: '有料',
    creatingCheckout: 'チェックアウトを開始する',
    awaitingPayment: '支払い待ち',
    paymentFailed: '支払いに失敗しました',
    cancelled: 'キャンセル済み',
    refunding: '払い戻し',
    refundNeedsAttention: '払い戻しには注意が必要です',
    refunded: '返金されました',
    fulfilled: '発送済み',
    starting: 'スタート',
    processing: '加工',
    done: '完了',
    failed: '失敗しました',
    timedOut: 'タイムアウトになりました',
    reserving: '在庫確保',
    charging: '請求処理中',
    releasing: '在庫放出',
    compensationNeedsAttention: '補償がスタックしました',
    confirmed: '確認しました',
    preparing: '準備中',
    readyToShip: '出荷準備完了',
    booking: '予約キャリア',
    shipped: '輸送中',
    exception: 'キャリア例外',
    delivered: '納品されました',
    renewing: '請求処理中',
    active: 'アクティブ',
    pastDue: '延滞',
  },
  transitions: {
    retry: '再試行',
    jobStarted: 'ジョブが送信されました',
    startFailed: '送信できませんでした',
    poll: '投票結果',
    jobDone: 'エクスポートが完了しました',
    jobFailed: 'エクスポートに失敗しました',
    cancel: 'キャンセル',
    paymentCaptured: '支払いが捕捉されました',
    picked: '倉庫でピックされました',
    ship: '船',
    booked: '航空会社が予約済み',
    trackingUpdated: '追跡が更新されました',
    checkout: 'チェックアウトを開く',
    checkoutCreated: 'チェックアウトがオープンしました',
    checkoutFailed: 'チェックアウトに失敗しました',
    paymentSucceeded: '支払いが成功しました',
    paymentDeclined: '支払いが拒否されました',
    paidAfterCancel: 'キャンセル後のお支払い',
    expire: 'タイムアウト後に閉じる',
    refundOrder: '払い戻し',
    refunded: '払い戻し完了',
    refundFailed: '払い戻しに失敗しました',
    retryRefund: '払い戻しの再試行',
    charged: 'チャージ成功',
    chargeFailed: '充電に失敗しました',
    renew: '期限が切れたら更新する',
    retryCharge: 'リトライチャージ',
    updateCard: 'アップデートカード',
    abandon: '放棄する',
    stockReserved: '在庫確保済み',
    stockUnavailable: '在庫なし',
    stockReleased: '在庫放出',
    releaseFailed: '在庫放出に失敗しました',
    retryRelease: '在庫解放をリトライ',
    retryInvoice: '請求書を再試行します',
    submitted: 'リクエストが送信されました',
    submissionFailed: '送信できませんでした',
    query: '請求書のクエリ',
    stillPending: 'まだ保留中',
    issued: '請求書発行',
    issueFailed: '発行に失敗しました',
    queryFailed: 'クエリが失敗しました',
    create: '作成しました',
    accept: 'テイク',
    reply: '返信',
    customerReply: 'お客様からの返信',
    resolve: '解決する',
    autoClose: '自動的に閉じます',
    reopen: '再開',
    submit: '送信する',
    approve: '承認',
    reject: '却下',
    requestInfo: '差し戻し',
    resubmit: '再送信',
    withdraw: '取り下げ',
    escalate: 'エスカレート',
    paid: 'マークが支払われました',
  },
  runs: {
    queued: 'キューに登録されました',
    running: '実行中',
    succeeded: '成功しました',
    failed: '失敗しました',
    dead: '諦めた',
    cancelled: 'キャンセル済み',
  },
};

export default jaJP;
