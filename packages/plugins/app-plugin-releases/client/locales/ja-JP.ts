import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  access: {
    section: 'リリース',
    pages: {
      'rel-apps': 'アプリ',
    },
    businessSection: 'リリース',
    businesses: {
      apps: {
        title: 'アプリ',
        description: 'アプリ、そのリリース、デプロイメント、およびランタイム。',
        actions: {
          view: {
            title: 'アプリを見る',
            description:
              'アプリ、そのリリース、デプロイメント、実行時のステータスを参照',
            related: 'アプリ（関連アプリ）を見る',
            relatedLabel: '私が作ったもの',
            relatedHint:
              '私が作成したアプリ、および私に関連するアプリケーション',
            all: 'アプリを見る(すべて)',
          },
          readLogs: {
            title: 'ログの読み取り',
            description: 'アプリと展開ログの読み取り',
            related: '読み取りログ（関連するもの）',
            relatedLabel: '私が作ったもの',
            relatedHint:
              '私が作成したアプリ、および私に関連するアプリケーション',
            all: '読み取りログ(すべて)',
          },
          create: {
            title: 'アプリの作成',
            description: '環境内でアプリを作成する',
            all: 'アプリの作成',
          },
          configure: {
            title: 'アプリの設定',
            description:
              '秘密が保持されている可能性があるアプリの設定の読み取りと変更',
            related: 'アプリの設定（アプリに関連するもの）',
            relatedLabel: '私が作ったもの',
            relatedHint:
              '私が作成したアプリ、および私に関連するアプリケーション',
            all: 'アプリの設定(すべて)',
          },
          upload: {
            title: 'リリースのアップロード',
            description: 'リリースのアップロードと宣伝',
            related: 'リリース（関連するもの）をアップロードします',
            relatedLabel: '私が作ったもの',
            relatedHint:
              '私が作成したアプリ、および私に関連するアプリケーション',
            all: 'リリースのアップロード (すべて)',
          },
          deploy: {
            title: 'デプロイ',
            description:
              '保護されていない環境での展開とロールバック、保護された環境への展開のリクエスト',
            related: 'デプロイ（それらに関連するもの）',
            relatedLabel: '私が作ったもの',
            relatedHint:
              '私が作成したアプリ、および私に関連するアプリケーション',
            all: 'デプロイ(すべて)',
          },
          deployProtected: {
            title: '保護された展開を承認する',
            description:
              '承認者を指定しない保護された環境への展開を承認します。人のみ',
            related:
              '保護されたデプロイメント (それらに関連するもの) を承認する',
            relatedLabel: '私が作ったもの',
            relatedHint:
              '私が作成したアプリ、および私に関連するアプリケーション',
            all: '保護された展開を承認する (すべて)',
          },
          operate: {
            title: 'スタートとストップ',
            description: 'アプリの開始、停止、再起動',
            related: 'スタートとストップ（それらに関連するもの）',
            relatedLabel: '私が作ったもの',
            relatedHint:
              '私が作成したアプリ、および私に関連するアプリケーション',
            all: 'スタートとストップ(すべて)',
          },
          delete: {
            title: 'アプリの削除',
            description: 'アプリとそのデータを削除する',
            related: 'アプリ（関連アプリ）の削除',
            relatedLabel: '私が作ったもの',
            relatedHint:
              '私が作成したアプリ、および私に関連するアプリケーション',
            all: 'アプリの削除(すべて)',
          },
        },
      },
    },
    recordAccess: {
      owned: '作成したアプリ',
    },
    settings: {
      rel: {
        environments: '環境の展開',
      },
    },
    keyScopes: {
      apps: {
        title: 'アプリと展開',
        description:
          '読み取り: アプリ、リリース、デプロイメント、およびログを参照します。読み取りと書き込み: リリースのアップロードも行います。管理者: アプリのデプロイと開始または停止も行います。',
        objects: 'アプリ',
      },
      environments: {
        title: '環境の展開',
        description:
          '読み取り: 環境のリスト。読み取りと書き込み: それらを管理します。',
      },
      presets: {
        ciDeploy: {
          title: 'CIのデプロイ',
          description:
            '選択したアプリにリリースをアップロードし、90 日間展開します。',
        },
        ciUpload: {
          title: 'CIアップロード',
          description:
            '90 日間、選択したアプリにリリースをデプロイせずにアップロードします。',
        },
      },
    },
    actions: {
      read: '表示',
      manage: '管理する',
      view: '表示',
      'read-logs': 'ログの読み取り',
      create: '作成',
      configure: '設定する',
      upload: 'リリースのアップロード',
      deploy: 'デプロイ',
      'deploy-protected': '保護された展開を承認する',
      operate: 'スタートとストップ',
      delete: '削除',
    },
  },
  drivers: {
    host: 'このサーバー',
  },
  ui: {
    nav: {
      apps: 'アプリ',
      environments: '環境の展開',
    },
    apps: {
      title: 'アプリ',
      description: 'アプリケーション、そのリリース、および展開場所。',
      search: 'IDまたは名前で検索',
      create: 'アプリの作成',
      id: 'アプリID',
      name: '名前',
      environment: '環境',
      version: 'バージョン',
      state: '状態',
      url: '住所',
      labels: 'ラベル',
      loadFailed: 'アプリを読み込めませんでした。',
      loadOneFailed: 'アプリを読み込めませんでした。',
      emptyTitle: 'アプリはまだありません',
      emptyNoAccess: '管理者にアプリの作成を依頼します。',
      emptyDescription:
        'アプリを作成し、リリースをアップロードして環境にデプロイします。',
      noResults: '検索に一致するアプリはありません。',
      created: '{{name}} を作成しました。',
      createDescription:
        'アプリは 1 つの環境にデプロイされます。そのリリースは後でアップロードされます。',
      idHint:
        '文字、数字、アンダースコア、ハイフン。その住所の一部。後から変更することはできません。',
      noEnvironment: 'まだ環境がありません',
      lastAccess: '最後の訪問',
    },
    advanced: 'アドバンスト (オプション)',
    labels: {
      name: '名前',
      value: '値',
      nameOf: 'レーベル名 {{index}}',
      valueOf: 'ラベル {{index}} の値',
      remove: 'ラベル {{index}} を削除します',
      add: 'ラベルを追加する',
      hint: 'ラベルを使用すると、ツールやユーザーがアプリやリリースを見つけてグループ化できるようになります。',
      count_one: '{{count}}ラベル',
      count_other: '{{count}} ラベル',
      system: 'システムによって追加されたラベル',
      systemHint: 'システムによって追加されました。ここでは変更できません。',
      errors: {
        keyRequired: 'この値の名前を入力します。',
        keyInvalid:
          '文字、数字、「.」、「_」、「/」または「-」を文字または数字で始めて使用してください（最大63個）。',
        keyDuplicate: 'この名前はすでに使用されています。',
        valueTooLong: '最大 {{max}} 文字。',
        tooMany: '多くても {{max}} ラベル。',
      },
    },
    policy: {
      title: '実行環境',
      activationLabel: '開始',
      activation: {
        eager: '常に実行中',
        onDemand: '訪問から開始',
      },
      activationHint: {
        eager: 'デプロイ時およびランタイムが再起動されるたびに開始されます。',
        onDemand:
          'デプロイメントまたはランタイムの再起動後の最初のアクセスによって開始されます。',
      },
      idleLabel: '未訪問時は停止',
      dormantLabel: '訪問者がいない場合は休止状態にします',
      minutes: '分',
      hours: '時間',
      neverIdle: '決して',
      neverDormant: '決して',
      idleSummary: 'アクセスがないまま {{minutes}} 分経過すると停止します',
      dormantSummary: '{{hours}} h 後に休止状態になります',
      timersHint:
        '停止したアプリはメモリを解放し、次回のアクセス時に再び起動します。休止状態のアプリでは、解凍されたファイルも削除されます。構成とデータは保持され、次回の訪問時に再度準備されますが、これにはさらに時間がかかります。',
      unsupported:
        'この環境は訪問時の開始をサポートしていません。アプリは実行し続けます。',
      errors: {
        idleInvalid:
          '1 から {{max}} までの整数分を入力するか、空のままにします。',
        dormantInvalid:
          '時間を 0.02 (1 分) から {{max}} まで入力するか、空のままにします。',
        dormantBeforeIdle: '冬眠は停止後に行われなければなりません。',
      },
    },
    state: {
      pending: 'スタート',
      starting: 'スタート',
      running: '実行中',
      stopped: '停止しました',
      stoppedOnDemand: '停止中（訪問時に開始）',
      dormant: '冬眠中（訪問時に準備）',
      failed: '失敗しました',
      unknown: '不明',
      deploying: '配備中',
    },
    operate: {
      refreshFailed:
        'アプリの状態を更新できませんでした。状態が更新されるまで操作は利用できません。接続とアクセスを確認してから、再試行してください。',
      disabled: {
        busy: '操作が進行中です。',
        unavailable:
          'アプリの状態は利用できません。アプリを操作する前に状態を更新してください。',
        deploying: '展開が進行中です。',
        starting: 'アプリを起動しています。',
        notDeployed: '最初にリリースをデプロイします。',
        alreadyRunning: 'アプリはすでに実行されています。',
        notRunning: 'アプリが起動していません。',
      },
      start: '開始',
      stop: '停止',
      restart: '再起動',
      done: {
        start: 'アプリを起動しています。',
        stop: 'アプリが停止しました。',
        restart: 'アプリを再起動しています。',
      },
    },
    releases: {
      title: 'リリース',
      upload: 'リリースをアップロードする',
      uploadAction: 'アップロード',
      commit: 'コミット',
      commitHint:
        'オプション: このアーカイブの構築元となったコミット。sha ラベルとして保存されます。',
      uploaded: 'リリースをアップロードしました。',
      checksum: 'チェックサム',
      size: 'サイズ',
      created: '作成しました',
      empty:
        'まだリリースされていません。このアプリ用に構築された .tar.gz パッケージをアップロードします。',
      loadFailed: 'リリースをロードできませんでした。',
    },
    deploy: {
      deploy: 'デプロイ',
      started: '{{version}}を配備しています。',
      confirmProtected:
        'この環境は保護されています。 「{{appId}}」と入力してデプロイします。',
    },
    deployments: {
      title: '展開',
      kind: '種類',
      status: '状態',
      by: 'によって',
      current: '現在',
      logs: '原木',
      rollback: 'ロールバック',
      rollbackStarted: 'ローリングバック。',
      confirmRollbackTitle: '{{name}}をロールバックしますか？',
      confirmRollback:
        'アプリはその展開のリリースに戻ります。それ以降に展開されたものは元に戻されます。',
      loadFailed: 'デプロイメントをロードできませんでした。',
      empty: 'まだ配備されていません。',
      hideLogs: 'ログを非表示にする',
      noLogs: 'ログ行はありません。',
      statuses: {
        queued: 'キューに登録されました',
        deploying: '配備中',
        succeeded: '成功しました',
        failed: '失敗しました',
      },
    },
    actors: {
      human: '人',
      agent: 'エージェント',
      key: 'キー',
      rule: 'ルール',
      system: 'システム',
    },
    requests: {
      title: '導入リクエスト',
      pendingApproval: '承認待ち',
      notice: {
        deploy:
          '{{version}} を {{environment}} に展開するようリクエストしました',
        rollback:
          '{{environment}} を {{version}} にロールバックするよう申請しました',
      },
      someone: '誰か',
      review: 'レビュー',
      view: '表示',
      comment: 'コメント（任意）',
      decideFailed: '決定は下されなかった',
      request: 'デプロイメントのリクエスト',
      created: '配備が要求されました。',
      approve: '承認',
      confirmApproveTitle: '{{appId}}の展開を承認しますか？',
      reject: '却下',
      cancel: '取り下げ',
      requestedBy: 'からのリクエスト',
      decidedBy: 'で決定',
      note: 'メモ',
      approvedToast: '{{appId}}の展開を承認しました。',
      rejectedToast: '{{appId}}の展開を拒否しました。',
      app: 'アプリ',
      commit: 'コミット',
      build: 'ビルド',
      ciLog: 'CIログ',
      requestedAt: 'リクエスト済み',
      decisionNote: '決定メモ',
      pinned: 'チェックサム {{checksum}};承認すると、まさにこれが展開されます',
      loadFailed: 'デプロイメントリクエストをロードできませんでした。',
      detailTitle: {
        deploy: '{{appId}}の展開リクエスト',
        rollback: '{{appId}}のロールバックリクエスト',
      },
      reviewTitle: {
        deploy: '{{appId}} の展開リクエストを確認してください',
        rollback: '{{appId}}のロールバックリクエストを確認してください',
      },
      done: {
        approve: 'リクエストが承認されました。',
        reject: 'リクエストは拒否されました。',
        cancel: 'リクエストは取り下げられました。',
      },
      kind: {
        deploy: 'デプロイ',
        rollback: 'ロールバック',
      },
      status: {
        pending: '保留中',
        approved: '承認済み',
        rejected: '却下済み',
        cancelled: '取り下げ済み',
        deployed: '配備されました',
        failed: '失敗しました',
      },
    },
    variables: {
      title: '変数',
      description:
        'このアプリが実行される環境変数。各変更は一度に保存され、次のデプロイメントでアプリに反映されます。',
      environmentDescription:
        'この環境内のすべてのアプリは、プル リクエストのプレビューを含め、独自に設定しない限り、これらを取得します。各アプリの最新ビルドが宣言する内容をリストします。変更はすぐに保存され、次回のデプロイ時にアプリに反映されます。',
      add: '変数の追加',
      name: '名前',
      value: '値',
      source: 'ソース',
      secret: 'シークレット',
      secretHint: 'シークレットは一度保存すると二度と表示されません。',
      nameHint: '文字で始まる大文字、数字、アンダースコア。',
      invalidName:
        '文字で始まる大文字、数字、アンダースコアを使用してください。',
      valueOf: '{{name}}の値',
      set: 'セット',
      notSet: '未設定',
      sources: {
        app: 'アプリ',
        environment: '環境から',
        configFile: 'config.yml',
        generated: '生成',
        default: 'デフォルト',
        unset: '未設定',
      },
      tags: {
        required: '必須',
        secret: 'シークレット',
        firstStartOnly: '初回起動時のみ',
        changed: '変更されました — 再起動が必要です',
        missing: '行方不明',
        undeclared: '未申告',
      },
      setValue: '設定値',
      replace: '交換',
      override: 'オーバーライド',
      overrideOf: '{{name}}をオーバーライドします',
      overrideTitle: '{{name}}をオーバーライドします',
      overrideHint:
        'このアプリは環境の値の代わりにこの値を受け取ります。一度に保存されました。アプリは次のデプロイメントでそれを取得します。',
      savedAtOnce: 'すぐに保存;アプリは次のデプロイメントでそれを取得します。',
      updated: '更新しました',
      clear: 'クリア',
      addTitle: '変数の追加',
      setTitle: '{{name}}を設定する',
      save: '保存',
      cancel: 'キャンセル',
      saved: '{{name}} が保存されました。',
      cleared: '{{name}}をクリアしました。',
      loadFailed: '変数をロードできませんでした。',
      emptyTitle: '変数なし',
      emptyDescription:
        'リリースでは何も宣言されておらず、何も設定されていません。アプリに渡すために 1 つ追加します。',
      emptyEnvironmentTitle: '変数はまだありません',
      emptyEnvironment: '1 つ追加して、この環境内のすべてのアプリに渡します。',
      emptyEnvironmentReadOnly: '管理者に追加を依頼してください。',
      noManifest:
        'このリリースでは変数が宣言されていないため、デプロイメント前には何もチェックされません。',
      basis:
        '最新のビルド ({{version}}) が宣言しているものとしてリストされています。アプリ自体の価値は環境の価値よりも優先されます。',
      noBuildTitle: 'まだビルドされていません',
      noBuildDescription:
        'アプリの最初のビルドがアップロードされると、変数がここに表示されます。今すぐ手動で追加できます。',
      noBuild: 'まだビルドされていません: これらは手動で設定された値です。',
      undeclaredTitle: '未申告',
      undeclaredDescription:
        '最新のビルドではこれらが宣言されていません。彼らは依然としてアプリにアクセスします。アプリ自体の値が不要になったらクリアしてください。',
      setOnEnvironment: '環境に設定',
      setOnApp: 'このアプリで設定',
      declaredBy: 'によって宣言されました',
      status: '状態',
      noApps: 'どのアプリもそれを宣言していません',
      moreApps: '+{{count}}',
      appGroup: '{{label}} ×{{count}}',
      missingIn_one: '{{count}} アプリで見つからない',
      missingIn_other: '{{count}} アプリで見つからない',
      missingInTitle: '必須ですが値はありません: {{apps}}',
      environmentSet: 'ここで設定します',
      environmentNotSet: 'ここでは設定されていません',
      missingTitle: '必要な変数が設定されていません',
      missingDescription:
        '最新のビルドをデプロイする前に、そこにあるすべてのアプリの環境、またはこのアプリのみに {{names}} を設定する必要があります。',
      review: '変数を確認する',
      changedTitle: '変数の変更は適用されません',
      changedDescription:
        'アプリのデプロイ後に変数が変更されました。アプリが再度デプロイされると有効になります。',
      apply: '適用して再起動する',
      applied: '新しい変数を使用して再度デプロイします。',
      needs_one: '{{count}}変数が必要です',
      needs_other: '{{count}}変数が必要です',
      missing: '{{count}}がありません',
      bulk: {
        edit: '一括編集',
        title: '変数の一括編集',
        reviewTitle: 'レビューの変更点',
        description:
          '.env ファイルと同様に、KEY=value 行を貼り付けるか編集します。 # で始まる行は無視されます。',
        appHint:
          'このアプリが自身で設定する値をリストします。環境とシークレットの値は表示されません。行を追加してオーバーライドまたは置換します。行を削除すると、その値がクリアされます。',
        environmentHint:
          'この環境の値をリストします。シークレットは表示されません。行を追加して置き換えます。行を削除すると、その値がクリアされます。',
        label: '変数 (.env)',
        review: 'レビューの変更点',
        back: '戻る',
        changes: '変更点',
        noChanges: 'テキストは、すでに存在するものを設定します。',
        nothing: '保存する変更はありません',
        unchanged_one: '{{count}}変数はそのままです。',
        unchanged_other: '{{count}} 変数はそのままです。',
        save_one: '{{count}} 件の変更を保存',
        save_other: '{{count}} 件の変更を保存',
        saved_one: '{{count}} の変更が保存されました。',
        saved_other: '{{count}} の変更が保存されました。',
        secretOf: '{{name}}は秘密です',
        failedTitle: '一部の変更が保存されませんでした',
        kinds: {
          add: '追加',
          change: '変更',
          remove: '削除',
        },
        problems: {
          syntax: '{{line}}行目：KEY=valueと書きます。',
          name: '{{line}} 行: {{name}} は有効な名前ではありません。文字で始まる大文字、数字、アンダースコアを使用してください。',
          reserved:
            '{{line}} 行: {{name}} はランタイムによって設定され、変数にすることはできません。',
          duplicate: '{{line}}行: {{name}}はすでに前の行に設定されています。',
          unterminated:
            '{{line}} 行: {{name}} の値の周囲の引用符が閉じられていません。',
        },
      },
    },
    tabs: {
      label: '{{name}}のセクション',
      overview: '概要',
      deployments: '展開',
      variables: '変数',
      settings: '設定',
    },
    overview: {
      currentRelease: '現在のリリース',
      recent: '最近の展開',
      viewAll: '全て見る',
    },
    initialAdmin: {
      title: '初代管理者',
      expires:
        '最初の展開用に生成されます。今すぐ保存してください。{{hours}} h で削除されます。',
      kept: '最初の展開用に生成されます。アプリが削除されるまで保持されます。',
      username: 'ユーザー名',
      email: 'メール',
      password: 'パスワード',
      show: 'パスワードを表示',
      hide: 'パスワードを隠す',
      copy: 'パスワードをコピーする',
      copied: 'パスワードがコピーされました。',
      dismiss: '保存しました',
      dismissed: '最初の管理者がリリースマネージャーから削除されました。',
    },
    config: {
      title: 'アドバンスト',
      description:
        'デプロイされたアプリの config.yml;保存するとアプリがリロードされます。環境ごとに異なる値やシークレットには変数を優先します。',
      loadFailed: '設定をロードできませんでした。',
      discard: '変更を破棄します',
      save: '保存してリロード',
      saved: '設定が保存されました。',
      external:
        'このアプリは外部のリリース管理から設定を読み取るため、ここで編集する config.yml はありません。環境ごとに異なる値を変数として設定します。',
      externalTitle: '編集する config.yml はありません',
      noFileTitle: 'config.yml はまだありません',
      noFile:
        'config.yml は最初のデプロイメントによって作成されます。それまでは、変数を使用してアプリを構成します。',
      toVariables: '変数に移動',
      maskedHint:
        'シークレット値は {{mask}} と表示されます。マスクをそのままにして保存された値を保持するか、その上に新しい値を入力します。',
      secrets: '秘密',
      secretsHint:
        '保存された値は表示されません。ここで 1 つを置き換えるかクリアします。保存すると有効になります。',
      newValue: '{{path}} の新しい値',
      replace: '{{path}}を置き換えます',
      clear: 'クリア{{path}}',
    },
    settings: {
      edit: 'ランタイムとラベル',
      editShort: '編集',
      editDescription:
        'アプリがいつ実行されるか、およびそのラベルがどのように付けられるか。変更は再起動しなくても適用されます。',
      save: '保存',
      saved: '設定が保存されました。',
      danger: 'アプリケーションを削除する',
      delete: 'データごと削除',
      deleteDescription:
        'アプリ、そのリリース、デプロイメント、およびデータを削除します。これを元に戻すことはできません。',
      deleted: '{{name}}を削除しました。',
      confirmDeleteTitle: '{{name}}を削除しますか？',
      confirmDelete:
        'これにより、{{appId}} とそのすべてのデータが削除されます。 {{appId}} と入力して確認します。',
    },
    common: {
      retry: '再試行',
      refresh: '更新',
      actions: '操作',
      rowActions: '{{name}}のアクション',
    },
    errors: {
      requestFailed: 'リクエストは失敗しました。',
      reasons: {
        IMAGE_REQUIRED:
          'この環境ではリリース イメージが実行されますが、リリースにはイメージがありません。 CI がプッシュしたイメージ (`release image`) を登録し、デプロイします。',
        ARCHIVE_REQUIRED:
          'この環境では、リリース アーカイブがプロセス内で実行されます。アーカイブ (`release upload`) をアップロードします。',
        IMAGE_CONFLICT:
          'リリースには、このプラットフォーム用の別のイメージがすでに含まれています。リリースのイメージは決して変わりません。',
        INVALID_IMAGE:
          'これは、sha256 ダイジェストを含む画像参照ではありません。',
        REGISTRY_EXISTS: 'この ID のレジストリはすでに存在します。',
        REGISTRY_IN_USE:
          '環境はこのレジストリから取得します。最初に別のレジストリを選択してください。',
        UNKNOWN_REGISTRY: 'そのレジストリは存在しません。',
        INVALID_REGISTRY_URL:
          'レジストリの起点（https://ghcr.io または localhost:5000 など）を入力します。',
        INVALID_REGISTRY_NAMESPACE:
          '名前空間は、acme などの小文字のパス コンポーネントです。',
        APP_EXISTS: 'この ID のアプリはすでに存在します。',
        APP_NOT_DEPLOYED: 'アプリはまだデプロイされていません。',
        APP_NOT_FOUND: 'アプリが存在しないか、表示されない可能性があります。',
        APPROVAL_REQUIRED:
          'この環境は保護されています。代わりに展開をリクエストしてください。',
        ARTIFACT_TOO_LARGE: 'リリースパッケージが大きすぎます。',
        BASE_PATH_MISMATCH:
          'このリリースは、別のベース パス用にビルドされました。',
        CHECKSUM_MISMATCH: 'パッケージのチェックサムが一致しません。',
        CONFIG_NOT_EDITABLE: 'このアプリの設定はここでは編集できません。',
        CONFIG_SECRET_NOT_STORED:
          'マスクされた値には、その場所に秘密が格納されていません。マスクの代わりにその値を入力します。',
        CONFIG_RELOAD_FAILED:
          '設定は保存されましたが、アプリは設定をリロードできませんでした。',
        CONFIG_TOO_LARGE: '構成が大きすぎます。',
        CONFIRMATION_REQUIRED: '確認のためアプリ ID を入力します。',
        DEPLOYMENT_IN_PROGRESS: 'このアプリの展開はすでに進行中です。',
        DEPLOYMENT_NOT_FOUND: 'デプロイメントが存在しません。',
        DRIVER_UNAVAILABLE: '環境のドライバーが利用できません。',
        ENVIRONMENT_DRIVER_FIXED: '環境のドライバーは変更できません。',
        ENVIRONMENT_VARIANT_FIXED:
          '環境の実行モードは変更できません。代わりに別の環境を作成してください。',
        ENVIRONMENT_EXISTS: 'この ID の環境はすでに存在します。',
        ENVIRONMENT_FULL: '環境内のアプリの制限に達しました。',
        ENVIRONMENT_IN_USE: 'アプリはまだこの環境にデプロイされています。',
        ENVIRONMENT_NOT_FOUND: '環境が存在しません。',
        FORBIDDEN: 'これを行う権限がありません。',
        IDEMPOTENCY_CONFLICT: '同じリクエストが異なる内容で送信されました。',
        INVALID_ACTIVATION_POLICY: 'アクティベーションポリシーが無効です。',
        INVALID_IDLE_STOP: 'アイドルストップが無効です。',
        INVALID_DORMANCY: 'ハイバネーション時間が無効です。',
        INVALID_APP_ID:
          'アプリ ID には文字、数字、アンダースコア、ハイフンを使用してください。「__」や「new」で始まるものは使用できません。',
        INVALID_APPROVERS: '承認者が無効です。',
        INVALID_ARTIFACT_SIZE: 'パッケージのサイズが無効です。',
        INVALID_ARTIFACT_VERSION: 'リリースバージョンが無効です。',
        INVALID_ARTIFACT: 'ファイルは有効なリリース パッケージではありません。',
        INVALID_CHECKSUM: 'チェックサムが無効です。',
        INVALID_CONFIG_FILE: '設定は有効な YAML ではありません。',
        INVALID_CONFIG_MODE: '設定モードが無効です。',
        INVALID_CONFIG_SECRET: 'シークレットの変更が無効です。',
        INVALID_CONTENT_TYPE: '.tar.gz パッケージをアップロードします。',
        INVALID_DEPLOYMENT_INPUT: 'デプロイメントリクエストが無効です。',
        INVALID_DRIVER: 'ドライバーが無効です。',
        INVALID_ENVIRONMENT_CONFIG: 'ドライバの環境設定が無効です。',
        INVALID_ENVIRONMENT_ID:
          '環境 ID には、小文字、数字、アンダースコア、ハイフンを使用してください。',
        INVALID_ENVIRONMENT_SETTINGS: '環境設定が不正です。',
        INVALID_IDEMPOTENCY_KEY: 'リクエストキーが無効です。',
        INVALID_INPUT: 'リクエストの一部のフィールドが無効です。',
        INVALID_LABELS: 'ラベルは key=value としてカンマで区切って記述します。',
        INVALID_LOG_CURSOR: 'ログの位置が無効です。',
        INVALID_LOG_ID: 'ログが存在しません。',
        INVALID_NOTE: 'メモが長すぎます。',
        INVALID_PUBLIC_URL: 'パブリック URL パターンは無効です。',
        INVALID_REQUEST: 'リクエストは無効です。',
        INVALID_ROLLBACK_TARGET:
          'このデプロイメントにロールバックすることはできません。',
        INVALID_SEARCH: '検索が無効です。',
        INVALID_TICKET: 'チケットは無効です。',
        RELEASE_EXISTS: 'このバージョンはすでにアップロードされています。',
        RELEASE_NOT_FOUND: 'リリースは存在しません。',
        REQUEST_DECIDED: 'リクエストは決まっております。',
        REQUEST_NOT_FOUND: 'リクエストは存在しません。',
        REQUEST_PENDING: 'このアプリのリクエストはすでに承認待ちです。',
        RESTART_FAILED: 'アプリを再起動できませんでした。',
        SESSION_REQUIRED: '続行するには、再度サインインしてください。',
        START_FAILED: 'アプリを起動できませんでした。',
        STOP_FAILED: 'アプリを停止できませんでした。',
        TICKET_DEPLOY_REFUSED: 'チケットではこの展開は許可されていません。',
        TICKET_FORBIDDEN: 'チケットではこれが許可されていません。',
        UNSAFE_ARTIFACT: 'パッケージには安全でないパスが含まれています。',
        VARIABLES_MISSING:
          '必要な変数が設定されていません: {{names}}。それらをアプリまたはその環境変数に設定して、再度デプロイします。',
        VARIABLE_RESERVED:
          'この名前はランタイムによって設定され、変数にすることはできません。',
        INVALID_VARIABLE_NAME:
          '変数名は、文字で始まる大文字、数字、アンダースコアです。',
        INVALID_VARIABLE_VALUE: '値が長すぎます。',
        VARIABLE_NOT_FOUND: '変数が設定されていません。',
        INVALID_VARIABLES_MANIFEST:
          'リリースの変数マニフェスト (dist/variables.json) が無効です。',
        INITIAL_ADMIN_UNAVAILABLE: '表示する最初の管理者がありません。',
      },
      messages: {
        hostExited: 'アプリのプロセスが準備が整う前に停止しました。',
        hostDisabled: 'アプリホストがオフになっています。',
        hostShutDown: 'アプリホストがシャットダウンしました。',
        hostEntryMissing: 'アプリホストのエントリファイルがありません。',
        cannotRestart: 'このホストはここから再起動できません。',
        selfDeploy:
          'ホストは、実行されているアプリケーションをデプロイできません。',
        noStatus: 'ホストは展開がどのように行われたかを報告しませんでした。',
        interrupted: '再起動によりデプロイメントが中断されました。',
        notReported: 'ランタイムがアプリを報告しませんでした。',
        notRunning: '再起動後、アプリが起動しません。',
        deploymentNotReported:
          'ランタイムがデプロイメントを報告しませんでした。',
        notReady:
          'まだ準備ができていません。しばらくしてからもう一度試してください。',
        checkTimeout: 'テストは 20 秒以内に終了しませんでした。',
        hostNoSettings: 'ローカル ランタイムは接続設定を必要としません。',
      },
      prefixed: {
        startFailed: '起動に失敗しました: {{detail}}',
        stopFailed: '停止に失敗しました: {{detail}}',
        restartFailed: '再起動に失敗しました: {{detail}}',
        outcomeUnreadable: '結果を読み取れませんでした: {{detail}}',
      },
    },
    confirm: {
      cancel: 'キャンセル',
      typeLabel: '{{text}} と入力して確認します',
    },
    environments: {
      title: '環境の展開',
      description:
        'アプリケーションが展開される場所、およびそこに展開できる人。',
      open: '開く',
      loadOneFailed: '環境をロードできませんでした。',
      settingsTitle: '環境設定',
      readOnly:
        'この環境の設定を表示することはできますが、変更することはできません。',
      danger: '環境の削除',
      deleteDescription:
        '環境とその変数を削除します。ここにデプロイされたアプリは最初に削除する必要があります。',
      discard: '変更を破棄します',
      anyone: '導入できる人',
      unlimited: '制限なし',
      apps: 'アプリ',
      appsDescription: 'この環境にデプロイされたアプリ。',
      appsEmpty: 'ここにはまだアプリが展開されていません。',
      sampleData: '最初のデプロイメントでサンプルデータをロードする',
      sampleDataHint:
        'ここでのアプリの最初のデプロイメントでは、サンプル データ (APP_SAMPLE_DATA=true) がインストールされます。本番環境ではなく、プレビューに使用してください。',
      add: '環境の追加',
      edit: '編集',
      delete: '削除',
      save: '保存',
      cancel: 'キャンセル',
      check: '小切手',
      reachable: '{{name}} に到達可能です。',
      unreachable: '{{name}} に到達できません。',
      deleted: '環境 {{name}} を削除しました。',
      saved: '環境 {{name}} が保存されました。',
      added: '環境{{name}}を追加しました。',
      loadFailed: '環境をロードできませんでした。',
      emptyTitle: 'まだ環境がありません',
      emptyNoAccess: '管理者に環境の追加を依頼してください。',
      emptyDescription: 'アプリを展開する環境を追加します。',
      editTitle: '{{name}}を編集',
      formDescription:
        'アプリが展開される場所、アプリへの到達方法、およびそこに展開される可能性のあるユーザー。',
      configHint: 'JSON オブジェクトとしてのドライバーの設定。',
      secretHint:
        '暗号化して保存され、二度と表示されることはありません。空のままにしておきます。',
      invalidJson: '{} などの JSON オブジェクトを入力します。',
      protectedHint:
        '個人または CI によるすべての展開は、承認者がアプリ ID を再度入力して承認するのを待ちます。',
      approversColumn: '承認者',
      approversPlaceholder: '承認者の選択',
      approversHint:
        '彼らの誰でも、彼ら自身の要求を含めて承認することができます。何も選択されていない場合は、保護された展開を承認できるユーザーが決定します。',
      confirmDelete: '環境{{id}}を削除しますか?',
      id: '環境ID',
      name: '名前',
      driver: 'ドライバー',
      runsOn: 'で実行します',
      policy: 'ポリシー',
      publicUrl: '公開 URL パターン',
      config: '設定(JSON)',
      secret: '認証情報 (JSON、書き込み専用)',
      secretStored:
        '資格情報が保存されます。新しいものを入力して置き換えます。',
      protected: '保護されています',
      approvers: '承認者',
      pickDriver:
        'この環境でのアプリの実行方法を選択します。環境はそのドライバーを維持します。',
      next: '続き',
      addWith: '{{driver}}環境を追加',
      changeDriver: '変更',
      basics: '環境',
      namePlaceholder: 'ステージング',
      idHint:
        '小文字、数字、アンダースコア、ダッシュ。後で変更することはできません。',
      policyDescription: 'ここに配置できるのは誰ですか。',
      appDefaults: 'アプリ',
      appDefaultsDescription:
        '最大でもこの数のアプリがあり、独自のランタイム ポリシーなしで作成されたアプリが停止して休止状態になる場合。空: 制限なし、決してありません。',
      maxApps: 'ほとんどのアプリ',
      defaultIdle: '停止時間 (未訪問分)',
      defaultDormant: '休止後（未訪問時間）',
      noForm:
        '設定フォームはありません。設定は JSON ({{kind}}) として入力されます。',
      imageSource: 'リリース画像',
      imageSourceDescription:
        'プル認証情報を使用して、ダイジェストによってレジストリから各リリースのイメージをプルするため、この環境では CI がプッシュしたイメージそのものが実行され、他の環境では実行されます。',
      registry: 'レジストリ',
      noRegistry: 'なし: 公開イメージを匿名でプルします',
      newRegistry: '新しい登録簿',
      editRegistry: '編集',
      cancelRegistryEdit: '編集をキャンセルする',
      registryShared:
        '変更は、このレジストリから取得するすべての環境に適用されます。',
    },
    registries: {
      check: 'テスト接続',
      url: '住所',
      urlHint:
        'https://ghcr.io; などの発信元のローカルホスト アドレスは、HTTP 経由で到達します。',
      namespace: '名前空間',
      namespaceHint: 'リリース用イメージを格納するパスです（例：acme）。',
      pull: '認証情報をプルする',
      pullHint:
        'このレジストリからイメージを取得する環境で使用します。匿名で取得できる環境では、これらの認証情報を省略してください。',
      username: 'ユーザー名',
      password: 'パスワードまたはトークン',
      checkOk: '接続されました',
      checkFailed: '接続テストに失敗しました。',
      checkFailedTitle: 'レジストリが使用できません',
      anonymous:
        'レジストリは認証情報なしで応答します。レジストリに到達した人は誰でもプルすることができます。',
      status: {
        ok: '承認されました',
        failed: '拒否されました',
        notSet: '未設定',
      },
    },
    artifacts: {
      title: 'アーティファクト',
      tarball: 'アーカイブ',
      image: '画像',
      ran: 'ラン',
      ranTarball: 'アーカイブ、進行中',
    },
    driverForm: {
      advanced: '詳細設定',
      advancedHint:
        'デフォルトはほとんどの環境に適しています。グループを開いて変更します。',
      on: 'オン',
      off: 'オフ',
      noLimit: '制限なし',
      writeOnly: '(書き込み専用)',
      secretSet: 'セット',
      secretCleared: '保存すると削除されます',
      replace: '交換',
      clear: '削除',
      undo: '元に戻す',
      keepStored: '保存したものは保管してください',
      jsonTitle: 'ドライバーの設定',
      jsonDescription:
        'このドライバーには設定フォームがありません。設定を JSON として入力します。',
      check: 'テスト接続',
      checkOk: '接続されました',
      checkFailed: '接続テストに失敗しました。',
      checkFailedTitle: '接続できませんでした',
      fixErrors: '一部の設定は修正が必要です。それらは上にマークされています。',
      errors: {
        required: '必須。',
        number: '数値を入力します。',
        integer: '整数を入力してください。',
        range: '許容範囲外です。',
        mapLine: '1 行に 1 つの NAME=value を記述します。',
        mapName:
          '名前は文字、数字、アンダースコアで構成されます。数字で始まることはできません。',
      },
    },
    driverForms: {
      host: {
        description:
          'このサーバー上でアプリを実行します。アプリ ホストの子プロセス内でこのアプリケーションが開始されるか、またはそれぞれの Docker コンテナー内で実行されます。',
        runtime: 'ランモード',
        backend: 'ランモード',
        backendInProcess: '処理中',
        backendInProcessHint:
          'このサーバーが起動するアプリホストの子プロセス内で実行され、そのようなすべてのアプリで共有されます。プレビューに適しています。',
        backendDocker: 'Docker',
        backendDockerHint:
          'アプリごとに 1 つのコンテナーがあり、互いに分離されています。テストおよび本番環境に適しています。',
        dockerConnection: 'Docker接続',
        dockerConnectionDescription:
          'DOCKER_HOST または現在の Docker コンテキストから見つかったこのサーバー上の Docker を、推奨されるコンテナー設定で使用します。接続をテストして、どの Docker が見つかったかを確認します。',
        access: 'アクセスアドレス',
        publicUrl: '公開 URL パターン',
        publicUrlHint:
          'パスまたはホスト名に {appId} が含まれるアプリを開く場所。 empty はサーバー自身のアドレスを使用します。',
        check: {
          url: '住所',
          apps: '実行中のアプリ',
          endpoint: 'Docker',
          version: 'Dockerバージョン',
          platform: 'プラットフォーム',
          errors: {
            unsupported:
              'このサーバーでは Docker のみがサポートされています: DOCKER_HOST は unix:// ソケットまたは tcp:// ソケット プロキシである必要があります。',
            socketMissing:
              'Docker ソケットがありません。 Docker はこのサーバーにインストールされ、実行されていますか?',
            permission:
              'Docker がアクセスを拒否しました。このアプリケーションを実行するユーザーは、Docker ソケットを使用できません。',
            refused:
              'そのアドレスでは接続を受け入れるものはありません。 Docker が実行されていることを確認します。',
            timeout: 'Docker は時間内に応答しませんでした。',
          },
        },
      },
    },
  },
  actions: {
    close: '閉じる',
  },
  status: {
    loading: '読み込み中',
  },
};

export default jaJP;
