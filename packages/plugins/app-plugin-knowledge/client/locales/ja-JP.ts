import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  indexing: {
    failedDocumentCount: '失敗した文書：{{count}}',
    enabled: 'インデックスを有効にする',
    enabledHint:
      '無効にするとテキスト検索のみを使用します。変更は保存後に適用されます。',
    chooseInstance: 'インデックスインスタンスを選択',
    documentProgress: '文書の進捗',
    pendingDocuments: '処理待ちの文書',
    failedDocuments: '失敗した文書',
    preparedChunks: '準備済みチャンク',
    committedChunks: '確定済みチャンク',
    agentPrompt:
      'この NocoBase 3 アプリケーションのナレッジベース索引の設定を手伝ってください。\n\nまず AGENTS.md を読み、このアプリケーションで実際に使える索引タイプ（type）を確認してください。現在のベクトルデータベースの選択肢は、SQLite + sqlite-vec（type は sqlite-vec、ローカルファイル）と PostgreSQL + pgvector（type は pgvector、vector 拡張が必要）です。配置環境に合う選択肢と必要条件を説明し、私が選んでから進めてください。\n\n選択後、SQLite なら索引ファイルの場所、PostgreSQL なら接続情報と vector 拡張の準備状況を確認してください。パスワードや API キーを表示しないでください。\n\n変更案を示して私の確認を得てから、アプリケーションの config.yaml の knowledge.indexing に書き込み、ほかの設定は残してください。既存ファイルが config.yml ならそれを編集し、別の設定ファイルを作らないでください。\n\n最後に設定を安全に検証し、再起動の方法を説明してください。再起動や依存関係のインストールには事前の確認が必要です。索引設定を開き直し、有効化、インスタンスと埋め込みモデルの選択、保存を案内してください。有料モデルの呼び出しや索引再構築も事前に確認してください。',
    databases: {
      sqlite: {
        name: 'SQLite ベクトルデータベース',
        description:
          'sqlite-vec ベクトル拡張を使用し、アプリケーションサーバー上の SQLite ファイルに索引を保存します。別のデータベースサービスは不要で、単一ホストの構成に適しています。',
      },
      pgvector: {
        name: 'PostgreSQL ベクトルデータベース',
        description:
          'pgvector ベクトル拡張を使用し、PostgreSQL でベクトルを保存・検索します。接続情報と vector 拡張が必要です。既存の PostgreSQL サービスや複数サーバーでの索引共有に適しています。',
      },
    },
    setupTitle: '設定手順',
    setup: {
      instance:
        'アプリケーションの config.yaml を開き、knowledge.indexing に索引インスタンスを追加します。名前、タイプ、ローカルファイルのパスまたはデータベース接続情報を指定してください。',
      restart:
        'ファイルを保存し、アプリケーションを再起動して設定を反映します。',
      enable:
        '索引設定を開き直し、索引を有効にして追加したインスタンスと埋め込みモデルを選択し、保存します。',
    },
    agentHandoff:
      '設定ファイルに不慣れな場合は、以下のプロンプトをコピーして開発 Agent に依頼できます。',
    global: 'すべてのナレッジ空間に適用',
    back: 'ナレッジに戻る',
    configuration: 'インデックス設定',
    typeHint:
      'インスタンスは type ごとに分類されます。フォームとモデルの要否は各型が決定します。',
    typeForm: 'この型が提供する動的フォーム',
    openPage: '独立した設定ページを開く',
    emptyTitle: 'まずベクトルデータベースを設定',
    emptyDescription:
      'ナレッジベース索引には、文書ベクトルを保存・検索するベクトルデータベースが必要です。次から選び、アプリケーションの config.yaml に設定を追加してください。',
    agentTitle: '設定用プロンプト',
    copyPrompt: '設定プロンプトをコピー',
    promptCopied: 'プロンプトをコピーしました。操作は実行していません。',
    promptCopyFallback:
      '自動コピーできません。選択されたプロンプトを手動でコピーしてください。',
    promptLabel: '開発 Agent 用の設定プロンプト',
    rebuildHint: '変更には再構築が必要です',
    editHint: '変更後に保存できます',
    confirmRetryEmbedding:
      'すべての空間の失敗した文書のみ再試行します。完了分は再構築しません。Embedding 料金が発生する場合があります。',
    confirmRetry:
      'すべての空間の失敗した文書のみ再試行します。完了分は再構築しませんが、サービス資源を使用します。',
    confirmResources:
      'すべての空間のインデックスを再構築します。この型は Embedding を呼び出しませんが、ストレージとサービス資源を使用します。新しいインデックスの準備まで公開済みのものを使用します。',
    deploymentPg: '接続、Schema、テーブル接頭辞はデプロイ設定で管理します。',
    deploymentFile: 'インデックスファイルのパスはデプロイ設定で管理します。',
    errors: {
      configurationChanged:
        'インデックスまたはモデルの設定が変更されました。新しい設定で古い世代を再試行できません。設定を確認し、必要に応じてすべてのスペースを再構築してください（Embedding の費用が発生する場合があります）。',
      modelAuth:
        'Embedding サービスの認証に失敗しました。API キー、アクセス権限、接続先リージョンを確認してください。',
      modelQuota:
        'Embedding の利用枠または残高が不足しています。再試行前にモデルのアカウントを確認してください。',
      modelRateLimit:
        'Embedding サービスのレート制限に達しました。しばらく待ってから再試行してください。',
      modelConfig:
        '保存された Embedding モデルは利用不可、変更済み、または未対応です。サービスとモデルを確認してください。',
      modelInput:
        'Embedding の入力が長すぎます。文書のチャンクサイズを確認してください。',
      modelPolicy:
        'Embedding サービスがコンテンツポリシーにより入力を拒否しました。該当する内容を確認してください。',
      modelResponse:
        'Embedding サービスが無効なベクトルを返しました。モデルの互換性と次元数を確認してください。',
      modelUnavailable:
        'Embedding サービスに接続できないか、一時的に利用できません。接続先とネットワークを確認してください。',
      storageAuth:
        'インデックスストレージの認証に失敗しました。データベースのユーザー、パスワード、接続設定を確認してください。',
      storagePermission:
        'インデックスストレージが操作を拒否したか、読み取り専用です。スキーマとテーブルの権限を確認してください。',
      storageSchema:
        'インデックスのデータベース、スキーマ、または必要なテーブルを利用できません。配置とスキーマを確認してください。',
      storageUnavailable:
        'インデックスストレージに接続できないか、接続が切断されました。アドレス、ポート、ネットワークを確認してください。',
      storageBusy:
        'インデックスストレージが使用中か、トランザクションが競合しました。ホストの再試行ポリシーに従ってお待ちください。',
      timeout:
        'インデックス処理がタイムアウトしました。再試行前にストレージとモデルサービスを確認してください。',
      vectorExtension:
        'PostgreSQL の vector 拡張機能がありません。データベース管理者にインストールを依頼してください。',
      ownership:
        'インデックス対象の所有者または構造が一致しません。リソースを確認し、無関係なテーブルは削除しないでください。',
      dependencies:
        'インスタンス、拡張機能、またはホストの jobs 設定を利用できません。配置設定を確認し、必要に応じて再起動してください。',
    },
    invalidValue: 'この値を確認してください。',
    title: 'ナレッジ索引設定',
    description: 'すべてのナレッジスペースの検索インデックスを設定します。',
    progress: '索引作成の進捗',
    instance: '索引インスタンス',
    off: '無効 — テキスト検索のみ',
    missingForm:
      'このインスタンスの設定フォームは利用できません。保存済みの設定は保持されます。',
    statusFailed: '索引状態を更新できませんでした。',
    loadFailed:
      '索引設定を読み込めませんでした。権限を確認して再試行してください。',
    saveFailed: 'リクエストは受理されませんでした。下書きは保持されています。',
    conflict:
      '設定が別の場所で変更されました。下書きを保持したまま最新の版を読み込み、確認して再度保存してください。',
    saved:
      'リクエストを受け付けました。索引作成はバックグラウンドで続行します。',
    workFailed:
      '一部の索引処理が失敗しました。インスタンスとモデルサービスを確認して再試行してください。',
    rebuild: '全スペースを再構築',
    retry: '失敗した処理を再試行',
    confirmTitle: '全体の索引変更を確認',
    confirmRebuild:
      'すべてのスペースに影響し、全文書のベクトル再計算、モデル料金、追加ストレージが必要になる場合があります。新しい索引の準備が整うまで既存の索引を利用します。',
    confirmDisable:
      '全スペースの索引検索を無効にします。テキスト検索は引き続き利用できます。クリーンアップはバックグラウンドで実行します。',
    discardTitle: '未保存の変更を破棄しますか？',
    discardDescription: '保存していない索引設定は失われます。',
    discard: '変更を破棄',
    confirm: '確認',
    documents:
      'ドキュメント：{{done}} / {{total}} · 待機中：{{pending}} · 失敗：{{failed}}',
    chunks: '準備済みチャンク：{{prepared}} · 確定済み：{{committed}}',
    availability: {
      disabled: '無効 — テキスト検索のみ',
      unavailable: '索引は利用不可 — テキスト検索は利用可能',
      building: '索引を構築中',
      ready: '索引の準備完了',
      degraded: '索引は縮退中 — テキスト検索は利用可能',
    },
    table: 'テーブル名',
    modelService: 'モデルサービス',
    model: '埋め込みモデル',
    chooseService: 'モデルサービスを選択',
    chooseModel: 'モデルを選択するか名前を入力',
    loadingModels: '埋め込みモデルを読み込み中…',
    modelsUnavailable:
      '埋め込みモデルを利用できません。モデルサービスを確認して再試行してください。',
  },
  access: {
    businessSection: '知識',
    businesses: {
      knowledge: {
        title: '知識',
        description: '各知識空間のドキュメント。',
        actions: {
          read: {
            title: '知識を読む',
            description: 'システム知識とそれに関連する空間の知識を読む',
            related: '知識を読む（それに関連するスペース）',
            relatedLabel: '私に関係のあるスペース',
            relatedHint:
              'どのスペースが誰に関係するかはアプリケーションが決定します',
            all: '知識を読む(全て)',
          },
          propose: {
            title: '知識の提案',
            description:
              '編集者が決定できるように変更を提案します。どのようなエージェントが与えられるか',
            related: '知識の提案（それに関わる空間）',
            relatedLabel: '私に関係のあるスペース',
            relatedHint:
              'どのスペースが誰に関係するかはアプリケーションが決定します',
            all: '提案知識(全て)',
          },
          edit: {
            title: '編集知識',
            description:
              '提案を編集、アーカイブ、検証済みとしてマークし、決定します。システム知識はすべて必要です',
            related: 'ナレッジの編集（関連するスペース）',
            relatedLabel: '私に関係のあるスペース',
            relatedHint:
              'どのスペースが誰に関係するかはアプリケーションが決定します',
            all: '編集知識(全て)',
          },
          manage: {
            title: 'ナレッジアクセスを管理する',
            description:
              '各フォルダーと記事にアクセスできるユーザーを変更し、すべてのフォルダーと記事へのアクセスを維持します。システム知識はすべて必要です',
            related: 'ナレッジアクセス（それに関連するスペース）を管理する',
            relatedLabel: '私に関係のあるスペース',
            relatedHint:
              'どのスペースが誰に関係するかはアプリケーションが決定します',
            all: 'ナレッジアクセスの管理(すべて)',
          },
        },
      },
    },
  },
  knowledge: {
    directory: {
      title: '知識',
      system: 'システム知識',
      count_one: '{{count}}ドキュメント',
      count_other: '{{count}}ドキュメント',
      archivedCount_one: '{{count}} アーカイブされたドキュメント',
      archivedCount_other: '{{count}} アーカイブされたドキュメント',
      selectTarget: '{{title}}を開く',
      target: '{{title}}で作成',
      chooseTarget:
        'で作成するプロジェクトまたはシステム ナレッジを選択してください',
      expandAll: 'すべて展開',
      collapseAll: 'すべて折りたたむ',
      retry: '再試行',
      allProposals: 'すべての提案',
      reviewPage: '{{pages}}・{{total}}合計ページ{{page}}',
      previous: '前へ',
      next: '次へ',
      empty: 'アクセス可能な知識空間がない',
      emptyAccessHint:
        '管理者にプロジェクトまたはシステムの知識へのアクセスを依頼してください。',
      noAccess: 'この知識は利用できないか、もうアクセスできません。',
      emptyHint:
        'このスペースを開いてドキュメントを作成するか、編集者にドキュメントの追加を依頼します。',
      createFailed:
        'このエントリを作成できませんでした。ターゲットを確認して再試行してください。',
      showResults: '「{{q}}」の上位の結果を表示',
      topResults:
        'すべてのプロジェクトとシステム知識にわたってトップランクのセクション。',
      welcome:
        'プロジェクトまたは共有システムの知識を展開してドキュメントを参照します。そこに作成するスペースを選択するか、承認された知識をすべて検索します。',
    },
    title: '知識',
    someone: '誰か',
    loading: '読み込み中',
    index: {
      states: {
        pending: '待っています',
        done: 'インデックス付き',
        failed: '失敗しました',
      },
      done: 'インデックス付き',
      pending: '{{indexed}}/{{total}}のインデックス作成',
      failed: 'インデックス作成に失敗しました',
      failedHint: '一部のセクションは、埋め込みを試みるたびに失敗しました。',
      reason: '理由: {{reason}}',
      retry: 'インデックスを再度作成',
      refreshFailed: 'インデックス作成ステータスを更新できません',
      retryRefresh: 'リフレッシュの再試行',
      queued: 'インデックス作成のために再びキューに入れられました',
    },
    chunks: {
      open: 'セクションを表示',
      title: 'セクション',
      description:
        '現在のバージョンの「{{title}}」がカットされている {{count}} セクション。検索と引用はセクションごとに行われます。文書内で検索するには 1 つ選択してください。',
      lead: '(最初の見出しの前)',
      lines: '{{start}}～{{end}}行',
      chars_one: '{{count}} キャラクター',
      chars_other: '{{count}}文字',
      empty: 'このドキュメントにはまだセクションがありません。',
      showing: '{{start}} ～ {{end}} の行を強調表示します。',
      clear: 'ハイライトをクリア',
    },
    chunking: {
      title: 'セクションの設定',
      description:
        '{{space}} の記事とファイル (抽出されたテキスト) は、検索と引用のために見出しでセクションに分割されます。Word は独自の見出しを保持し、各 PDF またはスライド ページと各シートはレベル 2 の見出しで、見出しのないテキストは長さに応じて切り取られます。このスペースはデフォルトとは異なる方法でカットできます。',
      own: 'このスペースに設定します',
      defaults:
        'デフォルト: レベル {{depth}} まで、{{target}} 文字、最大 {{max}} を目指します。',
      depth: '見出しでカット',
      depths: {
        '1': 'レベル 1 のみ (#)',
        '2': 'レベル 2 までダウン (##)',
        '3': 'レベル 3 まで (###)',
      },
      depthHint:
        'より深い見出しはそのセクション内に残ります。レベル 1 のみでは、ファイルはページまたはシートごとにカットされません。',
      target: '目標長(文字数)',
      max: '制限（文字数）',
      sizesHint:
        '制限を超えたセクションは、ターゲット付近で段落間で分割されます。コードブロックとテーブルが切り取られることはありません。',
      invalid: '長さは {{min}} ～ {{max}} で、上限までが対象です。',
      effect:
        '保存すると、バックグラウンドでドキュメントが再度カットされ、セマンティック検索がオンになっているときにセクションのインデックスが再作成されます。',
      rechunking: 'バックグラウンドで再度書類をカットしています…',
      save: '保存',
      saved: 'セクション設定が保存されました',
    },
    loadFailed: 'ナレッジをロードできません',
    kinds: {
      folder: 'フォルダー',
      article: '記事',
      file: 'ファイル',
    },
    folder: {
      empty: 'このフォルダーは空です。',
    },
    new: {
      label: '新しい',
      article: '新品',
      folder: '新しいフォルダー',
      childArticle: '新品内部',
      childFolder: '内部の新しいフォルダー',
    },
    files: {
      upload: 'ファイルをアップロードする',
      uploadHere: 'ここにファイルをアップロードします',
      dropHint:
        'ファイルをここまたはフォルダーにドロップしてアップロードします。',
      uploaded_one:
        '{{count}} ファイルをアップロードしました。そのテキストが抽出されています。',
      uploaded_other:
        '{{count}} ファイルをアップロードしました。彼らのテキストは抽出されています。',
      download: 'ダウンロード',
      version: 'バージョン {{version}}',
      statusHint: {
        parsing: 'テキストは抽出中です。準備ができたら、ファイルを検索します。',
        ready:
          'そのテキストが抽出されるため、検索とエージェントはそれを読み取ります。',
        failed: 'テキストを抽出できませんでした。',
        unsupported:
          'このタイプのファイルからはテキストが抽出されません。そのまま保管されています。',
      },
      replace: '交換',
      replaced: '置き換え: バージョン {{version}}。',
      reparse: '再抽出',
      file: 'ファイル',
      propose: 'プロポーズする',
      proposeNew: 'ファイルを提案する',
      proposeNewHint:
        'この知識を編集できる人が決定します。それを受け入れるとファイルが追加されます。',
      proposeReplace: '代替品の提案',
      proposeReplaceHint:
        'この知識を編集できる人が決定します。これを受け入れると、ファイルが {{title}} の次のバージョンになります。',
      proposeReasonHint: 'なぜそれがここに属するのか、誰が決めるのか。',
      proposed: '提案;編集できる人が決定します。',
      preview: 'プレビュー',
      text: '抽出されたテキスト',
      failed: 'テキストを抽出できませんでした: {{reason}}',
      status: {
        parsing: 'テキストの抽出',
        ready: '抽出されたテキスト',
        failed: '抽出に失敗しました',
        unsupported: '保管のみ',
      },
      noText: {
        parsing: 'テキストは抽出中です。準備が整うとここに表示されます。',
        ready: 'ファイルにはテキストが含まれていません。',
        failed: 'テキストを抽出できませんでした。',
        unsupported:
          'このタイプのファイルからはテキストが抽出されません。ファイルはそのまま保存されます。',
      },
    },
    spaces: {
      actions: 'スペースアクション',
      access: '宇宙アクセス',
      proposeOnly: '提案のみ',
      inherited: '継承',
      inheritedHint: '別の空間から継承。ここでは読み取り専用です。',
      default: '知識',
      readOnly: '読み取り専用',
      empty: 'まだ文書がありません。',
    },
    tree: {
      actions: '操作',
      expand: '拡大する',
      collapse: '崩壊',
      label: '文書',
      newDoc: '新しい文書',
      archived: 'アーカイブされた番組',
      archivedBadge: 'アーカイブ済み',
      pending: '{{count}} 待機中',
      back: '全ての書類',
      restricted: '制限付き: リストされている人のみがアクセスできます',
    },
    doc: {
      permissions: '権限',
      restricted: '制限付き・{{count}}',
      restrictedHint:
        'リストされている人、およびスペースを管理している人のみがアクセスできます。',
      verifiedLabel: '確認済み',
      versionBy: 'v{{version}}・{{name}}',
      proposeChanges: '変更の提案',
      more: 'その他のアクション',
      pending_one: '{{count}} 保留中',
      pending_other: '{{count}} 保留中',
      updatedAgo: '{{time}}を更新しました',
      updatedDetail: '{{name}} · v{{version}}',
      renameTitle: '「{{title}}」に名前を変更',
      renamedToast: '名前が変更されました。',
      notFound:
        'このドキュメントはもう存在しないか、表示されない可能性があります。',
      notVerified: 'まだ検証されていません',
      contents: '内容',
      edit: '編集',
      rename: '名前を変更する',
      history: '歴史',
      verify: 'マークが確認されました',
      verifiedToast: '検証済みとマークされました。',
      archive: 'アーカイブ',
      archiveTitle: 'アーカイブ「{{title}}」？',
      archiveDescription:
        'ツリーからもエージェントからも消える。後で復元できます。そのバージョンは保持されます。',
      archivedToast: 'アーカイブされました。',
      restore: '復元',
      restoredToast: '復元されました。',
      move: '移動',
      moveTitle: '移動「{{title}}」',
      moveTo: '未満',
      root: 'トップレベルで',
      movedToast: '移転しました。',
      archivedNotice: 'この文書はアーカイブされてお​​り、読み取り専用です。',
      oldVersion: 'バージョン {{version}} を読んでいます。',
      backToCurrent: '現在のバージョンに戻る',
      proposals: 'プロポーズ待ち',
      empty: 'この文書は空です。',
    },
    editor: {
      editing: '編集',
      proposing: '変更の提案',
      properties: 'プロパティ',
      propertiesHint: 'エージェントとリンクがこの文書について読んだ内容。',
      nothingToPreview: 'プレビューするものはまだありません。',
      reasonPlaceholder: '誰が決めるのか、なぜこれを変更する必要があるのか',
      submitProposal: '提案を提出する',
      proposed: '提案;編集できる人が決定します。',
      title: 'タイトル',
      slug: 'ナメクジ',
      slugHint:
        '小文字、数字、ハイフン。エージェントとリンクがどのように名前を付けるか。空白のままにすると、タイトルから作成されます。',
      summary: '概要',
      summaryHint: 'エージェントは 1 行でインデックスを読み取ります。',
      content: 'コンテンツ',
      contentPlaceholder: 'Markdown',
      write: '書き込み',
      preview: 'プレビュー',
      note: '変更メモ',
      notePlaceholder: '何が変わったのか、歴史のために（オプション）',
      parent: '親',
      save: '保存',
      saved: 'バージョン {{version}} として保存されました。',
      unchanged: '何も変わりませんでした。',
      create: '作成',
      created: 'ドキュメントが作成されました。',
      cancel: 'キャンセル',
      conflict:
        'あなたが編集中に誰かがバージョン {{version}} を保存しました。テキストをコピーし、リロードして、変更を再度適用します。',
      reload: 'リロード',
    },
    history: {
      by: '{{name}} による',
      title: '歴史',
      current: '現在',
      fromProposal: '提案書より',
      compare: '比較する',
      with: '付き',
      previous: '以前のバージョン',
      noChanges: '違いはありません。',
      view: '表示',
      unchangedLines: '{{count}} 変更されていない行',
      approvedBy: '{{name}} によって承認されました',
    },
    search: {
      description:
        'このスペースとそれが継承するスペースのドキュメントを検索します。',
      hint: 'タイトルと本文を入力して検索します。',
      emptyHint: '他の単語を試すか、単語の数を減らしてください。',
      all: '「{{q}}」の結果をすべて表示',
      resultsFor: '「{{q}}」の検索結果',
      placeholder: '知識の検索',
      label: '知識の検索',
      empty: '「{{q}}」は見つかりませんでした。',
      results: '結果',
      inherited: '継承',
    },
    home: {
      emptyTitle: '{{space}} にはまだ文書がありません',
      emptyEdit:
        '最初の記事を書くか、ファイルをアップロードして始めてください。',
      emptyPropose:
        'ファイルを提案し、編集できる人が追加するかどうかを決定します。',
      emptyRead: 'ここにはまだ何も書かれていません。',
      count_one: '{{count}}ドキュメント',
      count_other: '{{count}}ドキュメント',
      pending_one: 'レビュー待ち ({{count}})',
      pending_other: 'レビュー待ち ({{count}})',
      all: '全て見る',
      recent: '最近更新されました',
      updated: '{{time}}・{{name}}',
      unindexed: '完全にインデックス化されていません',
      unindexedFailed: '{{failed}} が失敗しました · {{pending}} が待機中です',
      unindexedPending_one: '{{count}} セクション待機中',
      unindexedPending_other: '{{count}} セクションが待機中です',
      unverified: '最近未確認',
      verifiedAgo: '{{time}} に検証済み',
    },
    diff: {
      changes_one: '{{count}}変更',
      changes_other: '{{count}}の変更',
      previous: '前回の変更点',
      next: '次の変更',
      layout: '差分レイアウト',
      inline: 'インライン',
      split: 'スプリット',
    },
    access: {
      you: {
        manage: '管理できます',
        edit: '編集できます',
        propose: 'プロポーズできます',
        read: 'が読めます',
        none: 'アクセス不可',
      },
      title: '宇宙アクセス',
      description: '{{space}} にアクセスできるユーザー。',
      yours: 'あなたのアクセス',
      actions: {
        read: '文書を読んで検索する',
        propose: '編集者が決定するために変更を提案する',
        edit: '文書の編集、整理、確認',
        manage: '各フォルダーと記事にアクセスできるユーザーを変更する',
      },
      allowed: '許可される',
      notAllowed: '許可されません',
      matrix: '役割別',
      role: 'ロール',
      columns: {
        read: '読み取り',
        propose: 'プロポーズする',
        edit: '編集',
        manage: '管理する',
      },
      from: '出典: {{source}}',
      source: {
        space: '{{space}} へのアクセス',
        manager: 'あなたは{{space}}を管理しています',
        entry: '{{subject}}、「{{title}}」に設定',
      },
      restrictedAt:
        '「{{title}}」で制限されています。そこにリストされている人のみがアクセスできます。',
      viewOnly: 'アクセスできる人を変更できるのは、管理者のみです。',
      mine: '(あなたの)',
      howTitle: 'ここでのアクセスの仕組み',
      agents:
        '誰かの代わりに行動するエージェントは、せいぜい読んで提案するだけです。彼らは決して編集したり決定したりしません。',
      manage: '役割の変更',
    },
    permissions: {
      title: '「{{title}}」の権限',
      description: {
        folder:
          'このフォルダーとその内容を読み取り、提案、編集、管理できる人。',
        article: 'この記事を閲覧、提案、編集、管理できる人。',
        file: 'このファイルを読み、提案、編集、管理できる人。',
      },
      modeLabel: 'アクセス',
      modes: {
        inherit: '親から継承',
        custom: '記載されている人物のみ',
      },
      inheritHint:
        'その親にアクセスできる人は誰でもその親にもアクセスでき、下に追加された人は少なくともそのレベルを取得します。',
      customHint:
        '親が許可するものに関係なく、以下にリストされている人だけがアクセスできます。それ自体が制限されない限り、その下にあるものは続きます。',
      inherited: '継承',
      fromSpace: '役割ごとに {{space}} にアクセスできる全員',
      fromDoc: '「{{title}}」より',
      fromRestricted: '記載者のみがアクセスできる「{{title}}」より',
      added: 'アクセスも可能',
      listed: '人物リスト',
      add: '人物を追加する',
      addPlaceholder: '人物、役割を追加…',
      noMatches: '一致しませんでした。',
      noneAdded: '受け継がれたものを超える者はいない。',
      noneListed:
        '誰もリストされていません。スペースを管理している人だけがアクセスできます。',
      managers:
        'スペースを管理する人は常にアクセスを維持します。エージェントが読んで提案するのは、せいぜいエージェントとエージェントの両方ができることだけです。',
      levelOf: '{{subject}}のレベル',
      levels: {
        read: '読める',
        propose: 'プロポーズできる',
        edit: '編集可能',
        manage: '管理できる',
      },
      remove: '削除',
      removedSubject: '削除されました ({{id}})',
      save: '保存',
      close: '閉じる',
      saved: '権限が保存されました。',
      loadFailed: '権限をロードできません。',
    },
    searchTest: {
      title: '検索テスト',
      description:
        '通常と同じように検索を実行し、各ヒットがどのようにランク付けされたかを表示します。関連性、キーワード別および意味別のランク、再ランク付けスコア、およびドキュメント内の位置を示します。',
      keyword: 'キーワード',
      semantic: '意味',
      relevance: '関連性 {{score}}',
      rank: '{{name}} #{{rank}} · {{score}}',
      unranked: '{{name}}: 見つかりません',
      lines: '{{start}}～{{end}}行',
      notExplained:
        'ランキングの詳細は、スペースまたは検索設定を管理している人にのみ表示されます。',
      query: '検索する言葉',
      run: '検索',
      fused: '融合{{score}}',
      provider: '{{name}} #{{rank}} · {{score}}',
      reranked: '{{score}} 再ランク付け',
      notReranked: '再ランキングなし',
    },
    proposals: {
      listTitle: '提案',
      statuses: {
        pending: '保留中',
        accepted: '承認されました',
        rejected: '却下済み',
        withdrawn: '取り下げ済み',
      },
      none: {
        pending: 'レビューを待っているものはありません。',
        accepted: 'まだ承認された提案はありません。',
        rejected: '拒否された提案はありません。',
      },
      about: '「{{title}}」について',
      clearAbout: 'すべての提案を表示',
      onBehalf: '{{person}} を代表して {{proposer}}',
      overview: '概要',
      changes: '変更点',
      staleTitle: 'ドキュメントは次のように変更されました',
      decision: '決定',
      commentLabel: 'コメント',
      pendingEntry: 'レビュー保留中 · {{count}}',
      kinds: {
        update: '変更',
        create: '新しい文書',
        verify: 'まだ保持されています',
      },
      by: '{{proposer}} {{person}}用',
      from: '{{source}}より',
      reason: '理由',
      summary: '概要',
      stale:
        'これが書かれてからドキュメントが変更されました (v{{base}} → v{{current}})。承認すると、現在のバージョンが提案全体に置き換えられます。',
      diffProposed: '変更提案 (v{{base}} → 提案)',
      diffCurrent: '現行バージョンに対する反対 (v{{current}} → 提案)',
      newContent: '提案内容',
      newFile: '提案ファイル',
      replacementFile: 'バージョン {{base}} の置き換え',
      fileNote: '受け入れられると、そのテキストが抽出されます。',
      verifyNote:
        '文書の内容は何も変更されていません。今日は検証済みとマークされています。',
      accept: '受け入れる',
      acceptAnyway: 'とにかく受け入れる',
      reject: '却下',
      comment: 'コメント（任意）',
      accepted: '承認されました。',
      rejected: '拒否されました。',
      decided: '{{name}} による {{outcome}}',
      open: '開く',
      readOnly: 'この知識を編集できる人が決定します。',
    },
  },
  errors: {
    KNOWLEDGE_PROPOSAL_PENDING:
      'この文書に対するあなたの以前の提案はまだ待機中です。それを最初に決めなければなりません。',
    KNOWLEDGE_PROPOSAL_REJECTED:
      '同じ変更は以前に拒否されました。何か違うものを提案する。',
    EMPTY_CONTENT: '提案されたコンテンツは空です。',
    INVALID_REASON: '変更する必要がある理由を述べてください (最大 500 文字)。',
    KNOWLEDGE_VERSION_CONFLICT:
      'その間、誰かが新しいバージョンを保存しました。リロードして変更を再度適用します。',
    KNOWLEDGE_SLUG_TAKEN: 'このスペースの別の文書にそのスラッグがあります。',
    KNOWLEDGE_HAS_CHILDREN:
      '最初にそのサブドキュメントをアーカイブまたは移動します。',
    KNOWLEDGE_ARCHIVED: '文書はアーカイブされています。まずそれを復元します。',
    KNOWLEDGE_DEPTH_EXCEEDED: 'ドキュメントのネストの深さは最大 4 レベルです。',
    KNOWLEDGE_INVALID_MOVE:
      '文書はそれ自体またはそれ自身の下に入ることができません。',
    KNOWLEDGE_PROPOSAL_STALE: '提案書が作成されてから文書が変更されました。',
    KNOWLEDGE_PROPOSAL_DECIDED: 'この提案はすでに決定されています。',
    INVALID_SLUG: 'スラッグは小文字、数字、ハイフンを使用します。',
    INVALID_TITLE: 'タイトルは必須です (最大 200 文字)。',
    FILE_TOO_LARGE: 'ファイルが大きすぎます。',
    FILES_UNAVAILABLE: 'このアプリケーションはファイルを保存しません。',
    INVALID_FILE: 'ファイルを 1 つ送信します。',
    INVALID_PARENT: 'ファイルの下には何も入りません。',
    KNOWLEDGE_NOT_FAILED:
      'テキストを抽出できなかったファイルのみを再抽出します。',
  },
  ui: {
    nav: {
      knowledge: '知識',
    },
  },
  common: {
    forbidden: 'これを行う権限がありません。',
    requestFailed: 'リクエストは失敗しました。もう一度試してください。',
  },
};

export default jaJP;
