# 変更履歴

このファイルには NocoBase 3 の主な変更を、リリースごとに 1 セクションずつ記録します。`nocobase-v3-beta/<日付>.<連番>` はベータ版、`nocobase-v3/<日付>.<連番>` は正式版です。各リリースで公開されたパッケージのバージョンは対応する GitHub Release を、各パッケージ自体の変更はパッケージ内の CHANGELOG.md を参照してください。

## [nocobase-v3-beta/2026-11-27.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-27.1)

### 🎉 新機能

- **[Agent]** スキルが `SKILL.md` のメタデータを返し、アプリケーションは指定したスキルの編集・削除・割り当てを禁止できます。 ([#11675](https://github.com/nocobase/nocobase/pull/11675))
- **[サーバー]** 重要な API 操作を記録し、ログファイルなどの設定済みの送信先に監査イベントを送信できます。 ([#11694](https://github.com/nocobase/nocobase/pull/11694))
- **[メッセージブローカー]** プラグインは設定可能なメッセージミドルウェアを通じてアプリケーション内外でメッセージを発行・消費でき、データベーストランザクション内で発行したメッセージはコミット後にのみ送信され、消費側はデータベース書き込みと同じトランザクションで重複メッセージをスキップできます。 ([#11695](https://github.com/nocobase/nocobase/pull/11695))
- **[クライアント]** サインインが必要なページで、アクセス権の確認を維持したままアプリのヘッダーとサイドバーを非表示にできます。 ([#11720](https://github.com/nocobase/nocobase/pull/11720))
- **[通知]** 阿里雲またはテンセントクラウドから SMS を送信し、ワンタイムコードで電話番号や機密性の高い操作を確認できるようにしました。 ([#11722](https://github.com/nocobase/nocobase/pull/11722))
- **[認証コード]** 型安全なリクエストと React フックで、認証コード、電話番号の登録、追加認証を組み込めるようになりました。 ([#11738](https://github.com/nocobase/nocobase/pull/11738))
- **[Skills]** コミュニティ版アプリを Professional または Enterprise へアップグレードする手順と、旧シナリオテンプレートのアプリを Enterprise へ移行する手順を案内します。 ([#11739](https://github.com/nocobase/nocobase/pull/11739))

### 🚀 改善

- **[クライアント]** システム設定がアバターの左に常時表示され、設定と受信トレイのアイコンにツールチップが付き、認証設定の英語・中国語表記が短くなりました。 ([#11715](https://github.com/nocobase/nocobase/pull/11715))
- **[Agent]** 実行履歴が多い環境で Agent の稼働状況をより速く確認できます。 ([#11717](https://github.com/nocobase/nocobase/pull/11717))
- **[メール]** メール関連ページのタイトルの文字サイズを、ほかの設定ページと同じにしました。 ([#11721](https://github.com/nocobase/nocobase/pull/11721))
- **[データベース]** PostgreSQL と SQLite の繰り返しトランザクションでスキーマ照会を削減します。 ([#11741](https://github.com/nocobase/nocobase/pull/11741))

### 🐛 不具合修正

- **[Agent]**
  - 使用量ページで、停止や失敗の前に報告された分も含め、オンライン会話のトークン使用量と費用をエージェント別に確認できます。 ([#11719](https://github.com/nocobase/nocobase/pull/11719))
  - Runner が処理を取得する際のロック時間を短縮し、割り当ての確定前に接続が切れた場合は処理をキューに残します。 ([#11735](https://github.com/nocobase/nocobase/pull/11735))
- **[権限]** すでに存在しないデフォルトアクセスルールを編集または削除すると、タイムアウトせずにルールが見つからないことを通知します。 ([#11724](https://github.com/nocobase/nocobase/pull/11724))
- **[Agent ランナー]**
  - Runner は dsh の Web 設定に保存された DeepSeek API キーを認識し、dsh のログインが必要と誤って表示しなくなりました。 ([#11726](https://github.com/nocobase/nocobase/pull/11726))
  - OpenCode 2.4 の起動直後にランナーがモデルを検出できない問題を修正しました。 ([#11728](https://github.com/nocobase/nocobase/pull/11728))
- **[データベース]** どのデプロイでもサンプルデータを有効にすると、新規および以前にスキップされたサンプルデータを読み込みます。 ([#11744](https://github.com/nocobase/nocobase/pull/11744))

## [nocobase-v3-beta/2026-11-25.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-25.1)

### 🚀 改善

- **[アプリ作成]** マルチアプリ、子アプリ、マルチポータルの既存の作成エイリアスで、Enterprise アプリの各機能を有効にできます。 ([#11702](https://github.com/nocobase/nocobase/pull/11702))
- **[インターフェース]** ライフサイクル図をコンパクトなプロセス表示デフォルトにし、複数ステージ共通の早期終了ステータスをホバー詳細と実行結果バッジに集約できるようになりました。 ([#11707](https://github.com/nocobase/nocobase/pull/11707))

### 🐛 不具合修正

- **[アプリ基盤]** デプロイ済みのアプリケーションで、開発用依存関係のプラグインがシステム設定の未有効一覧に表示されるようになりました。 ([#11704](https://github.com/nocobase/nocobase/pull/11704))

## [nocobase-v3-beta/2026-11-24.2](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-24.2)

### 🎉 新機能

- **[アプリホスティング]** マネージド App Host が、各アプリ自身のバックアップコマンドでアプリ（プロセス内と Docker の両方）をバックアップ・復元できるようになり、アプリのイメージ（amd64 と arm64）に必要な PostgreSQL・MySQL・MariaDB のクライアントツールが含まれるようになりました。 ([#11668](https://github.com/nocobase/nocobase/pull/11668))

### 🚀 改善

- **[API キー]** アプリケーションで個人キーとシステムキーの管理を維持したまま、メンバーキーとルールの管理 API を無効にできます。 ([#11696](https://github.com/nocobase/nocobase/pull/11696))

### 🐛 不具合修正

- **[メール]** 既に使っている名前でメールテンプレートを保存すると、サーバーエラーではなく名前が使用中であることが表示されるようになりました。 ([#11682](https://github.com/nocobase/nocobase/pull/11682))
- **[権限]** ユーザーが既に持っている権限セットを割り当てると、サーバーエラーではなく競合として報告されるようになりました。 ([#11683](https://github.com/nocobase/nocobase/pull/11683))
- **[サーバー]** Host がインプロセスで読み込むアプリは、standalone・Docker・CLI と同じくアプリ自身のパッケージ名でマイグレーションを記録するようになり、起動方法をまたいだバージョン検査とバックアップの復元が正しく動作します。 ([#11692](https://github.com/nocobase/nocobase/pull/11692))
- **[Agent ランナー]** サブモジュール内に残った正常な linked worktree メタデータによるチェックアウト拒否を修正し、有効なサブモジュールの `core.worktree` 検証と簡潔な Git エラー出力を追加するとともに、所有する実行一時ディレクトリの権限ずれの自動修復と詳細な診断エラーに対応しました。 ([#11701](https://github.com/nocobase/nocobase/pull/11701))

## [nocobase-v3-beta/2026-11-24.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-24.1)

### 🎉 新機能

- **[バックアップ]** 組み込みのバックアップコマンドで、アプリのデータベースとアップロードファイルのバックアップを作成、確認、検証、復元できます。 ([#11642](https://github.com/nocobase/nocobase/pull/11642))
- **[クライアント]**
  - アプリケーションはプラグインのページを ID で除外し、そのページを開くツールバーのショートカットも自動的に非表示にできます。 ([#11670](https://github.com/nocobase/nocobase/pull/11670))
  - アプリケーションで組み込みの設定、チャット、受信トレイ、メールのページを個別に無効化できます。 ([#11679](https://github.com/nocobase/nocobase/pull/11679))
- **[認証]** サーバー側の認証拡張は、実行中のトランザクションを使って、データベースの変更を認証処理と一緒にコミットまたはロールバックできます。 ([#11681](https://github.com/nocobase/nocobase/pull/11681))
- **[ファイル]** アプリケーションは添付ファイル機能を維持したまま、ファイルストレージ管理 API を無効にできます。 ([#11685](https://github.com/nocobase/nocobase/pull/11685))
- **[Agent]** アプリケーションは Runner のモデルと利用状況レポートを維持したまま、ホスト型モデルサービスを無効にできます。 ([#11686](https://github.com/nocobase/nocobase/pull/11686))
- **[API キー]** 既存のキーを維持したまま、システム API キーの管理エンドポイントを無効にできます。 ([#11687](https://github.com/nocobase/nocobase/pull/11687))

### 🚀 改善

- **[クラスターと分散]** Default と Examples テンプレートから分散プラグインが外れ、既存のアプリは Pro のクラスタ準備状況プラグインに移行できます。 ([#11678](https://github.com/nocobase/nocobase/pull/11678))

### 🐛 不具合修正

- **[Agent]** モデルサービスが無効でもデモデータを利用できるようになり、エージェントと受信トレイの操作項目に全対応言語の翻訳が揃いました。 ([#11690](https://github.com/nocobase/nocobase/pull/11690))

## [nocobase-v3-beta/2026-11-23.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-23.1)

### 🎉 新機能

- **[インターフェース]** UI Library の権限エディターは「メニュー」「業務オブジェクト」「システム設定」の 3 つのタブで設定するようになりました。メニューはサイドバーの表示だけを決め、各業務オブジェクトの操作とデータ範囲は一か所で設定して他の操作は閲覧に従うか狭め、システム設定のページはデータ範囲なしで個別に設定します。 ([#11603](https://github.com/nocobase/nocobase/pull/11603))
- **[メール]**
  - メールアカウントごとに同期するフォルダーを選べるようになりました。外したフォルダーのメールは確認後にローカルから削除され、サーバー上のメールには影響しません。 ([#11605](https://github.com/nocobase/nocobase/pull/11605))
  - 添付ファイルを含む個別のメールを元の .eml ファイルとしてダウンロードできます。 ([#11623](https://github.com/nocobase/nocobase/pull/11623))
- **[プラグインライフサイクル]** ライフサイクル定義で、インスタンスの再開と同じトランザクション内で関連レコードを更新できるようになりました。 ([#11659](https://github.com/nocobase/nocobase/pull/11659))
- **[アプリテンプレート]** デフォルトテンプレートで作成したアプリでは、最初のワークフローを追加する前から、管理者がシステム設定でワークフロー管理を開けます。 ([#11660](https://github.com/nocobase/nocobase/pull/11660))
- **[クライアント]** メンバーは個人設定でアカウントのセキュリティと個人 API キーを管理でき、管理者はシステム設定でユーザー、ロール、ファイルストレージ、スケジュールを管理できます。 ([#11663](https://github.com/nocobase/nocobase/pull/11663))
- **[Agent]** ランタイムで Antigravity CLI を Agent ツールとして利用でき、ツール一覧では Pi の次に表示されます。 ([#11664](https://github.com/nocobase/nocobase/pull/11664))

### 🚀 改善

- **[Agent]**
  - 同じモデルを別のプロバイダーが提供している場合、新しいエージェント名の末尾に半角括弧でプロバイダー名を付けます（例：「OpenCode · Qwen3.8 Flash (example-provider)」）。 ([#11632](https://github.com/nocobase/nocobase/pull/11632))
  - Skill ページから「オンライン Agent はスクリプトを読むだけで実行しない」という表示を削除し、ファイルツリーでは各ファイルのバッジの代わりに scripts フォルダーにアイコンを 1 つ表示します。 ([#11635](https://github.com/nocobase/nocobase/pull/11635))
- **[Skills]** アプリ開発 Skill に、レコード単位の権限と監査履歴を備えたライフサイクルインスタンスの一時停止、再開、リセット、再起動の操作を追加するためのガイドが加わりました。 ([#11641](https://github.com/nocobase/nocobase/pull/11641))
- **[Agent ランナー]** Codex、OpenCode、Pi で GPT-6.2 Sol と Astra が推奨され、標準の使用料金が既定で設定されます。 ([#11645](https://github.com/nocobase/nocobase/pull/11645))
- **[プラグインライフサイクル]** 拡張機能は、指定した履歴以降にインスタンスがその状態を離れたかを確認できます。 ([#11661](https://github.com/nocobase/nocobase/pull/11661))
- **[アプリテンプレート]** フロー定義と実行履歴が空のときの余白を統一し、定義画面にプロジェクトのリポジトリで Agent にフローの管理を依頼する方法を表示します。 ([#11667](https://github.com/nocobase/nocobase/pull/11667))

## [nocobase-v3-beta/2026-11-20.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-20.1)

### 🎉 新機能

- **[Agent]** オンライン Agent のチャットで、どのオンラインモデルでもモデルの横から思考レベル（デフォルト、オフ、または最小から超高まで）を選べます。モデルがそのレベルに対応していない場合は会話に通知が表示されます。 ([#11555](https://github.com/nocobase/nocobase/pull/11555))
- **[Agent ランナー]** ランナーは、デプロイキーと確認済みのホスト鍵フィンガープリントを使って、SSH でリポジトリのチェックアウト、プッシュ、ビルドを実行できます。 ([#11614](https://github.com/nocobase/nocobase/pull/11614))
- **[プラグインライフサイクル]** 管理者はライフサイクルインスタンスを一時停止、再開、リセット、再始動し、チケットのサンプルで操作履歴を確認できます。 ([#11628](https://github.com/nocobase/nocobase/pull/11628))

### 🚀 改善

- **[Agent]** OpenCode と Pi のモデルをプロバイダー付きで表示し、実行が失敗したときにコーディングツールのメッセージを表示します。 ([#11622](https://github.com/nocobase/nocobase/pull/11622))

### 🐛 不具合修正

- **[CLI]** ゲートウェイが同一オリジンにリダイレクトする環境で CLI とランナーのインストールに失敗する問題を修正 ([#11616](https://github.com/nocobase/nocobase/pull/11616))
- **[Agent ランナー]** 読み取り専用の実行では管理対象の SSH 接続で取得でき、プッシュはランナーによって拒否されます。 ([#11627](https://github.com/nocobase/nocobase/pull/11627))

## [nocobase-v3-beta/2026-11-19.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-19.1)

### 🎉 新機能

- **[CLI]** プラグインとその Skills を事前にインストールし、必要に応じてデプロイ対象に追加したり、登録解除やアンインストールを選択したりできます。 ([#11612](https://github.com/nocobase/nocobase/pull/11612))

### 🚀 改善

- **[CLI]** `logs export` から `--issue` フィルターを削除しました。選択した日付の、選択したランナーのログをすべてエクスポートします。 ([#11594](https://github.com/nocobase/nocobase/pull/11594))
- **[データベース]** 適用済みマイグレーションのソース欠落を既定で警告し、最新バッチのロールバック前に欠落または不可逆な対象をすべて表示します。 ([#11595](https://github.com/nocobase/nocobase/pull/11595))
- **[ナレッジベース]**
  - ナレッジ文書内のリンクは新しいタブで開くようになりました（同じページ内の見出しへのリンクを除く）。幅の広い表は列を詰めずに横スクロールします。 ([#11598](https://github.com/nocobase/nocobase/pull/11598))
  - ナレッジベースのファイル項目で、置換・ダウンロード・履歴をヘッダーにまとめ、Markdown を記事と同じ見た目でプレビューし、抽出テキストを行番号付きで表示して引用行を強調し、プレビューを全画面で開けるようにしました。 ([#11601](https://github.com/nocobase/nocobase/pull/11601))
- **[プロジェクト]** プロジェクトのタスクとサブタスクの作成は手動フォームに統一され、操作プラン、要件整理ツール、それらのコマンドが廃止されます。 ([#11604](https://github.com/nocobase/nocobase/pull/11604))
- **[アプリテンプレート]** 同じバージョンの Default または Examples テンプレートから作成したアプリは、直接依存する NocoBase パッケージに同じバージョンを使用します。 ([#11613](https://github.com/nocobase/nocobase/pull/11613))

### 🐛 不具合修正

- **[Agent ランナー]** 非公開パッケージレジストリの認証エラー時に実行中の認証情報で再試行し、アプリ作成とテンプレートのダウンロードに対応します。 ([#11584](https://github.com/nocobase/nocobase/pull/11584))
- **[データベース]** 空の日付・時刻の値はすべてのデータベースで空として読み込まれ、Oracle 互換モードの KingbaseES で不正な値 "Z" として失敗しなくなります。 ([#11597](https://github.com/nocobase/nocobase/pull/11597))
- **[CLI]** 開発環境の実行時設定をデプロイ用アーカイブに含めず、パッケージ化に失敗した場合は以前のアーカイブを保持します。 ([#11600](https://github.com/nocobase/nocobase/pull/11600))
- **[サーバー]** 埋め込みアプリの画面と API ドキュメントに正しいアプリ名とバージョンを表示します。 ([#11608](https://github.com/nocobase/nocobase/pull/11608))
- **[Agent]** Codex が最新の使用状況を報告すると、実行環境に表示される使用枠から廃止された枠が消えます ([#11609](https://github.com/nocobase/nocobase/pull/11609))

## [nocobase-v3-beta/2026-11-17.2](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-17.2)

### 🎉 新機能

- **[Agent]**
  - 収集状況とサーバー設定の日付範囲に対応し、機密情報を除去した実行環境ログをエクスポートしてローカルで時系列に統合できます。 ([#11563](https://github.com/nocobase/nocobase/pull/11563))
  - 履歴を保持したまま、待機中の Runner 会話の実行環境を選択できます。 ([#11577](https://github.com/nocobase/nocobase/pull/11577))

### 🚀 改善

- **[インターフェース]** 分類タグと統一したメニューでワークフローのバージョンを表示し、UI Library のバージョン選択コンポーネントを再利用できます。 ([#11569](https://github.com/nocobase/nocobase/pull/11569))
- **[アプリホスティング]** プレビュー配布物のチェックサム検証と展開のタイムアウトを設定できるようになりました。 ([#11578](https://github.com/nocobase/nocobase/pull/11578))
- **[Skills]** アップグレード Skill は既定で `latest` リリースにアップグレードするようになり、beta から作成したアプリケーションも正式版リリース後に引き続き更新できます。 ([#11589](https://github.com/nocobase/nocobase/pull/11589))

## [nocobase-v3-beta/2026-11-17.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-17.1)

### 🚀 改善

- **[アプリホスティング]** 管理対象の Host は内部ポートを自動割り当てし、再起動後に接続を復元でき、固定ポートの競合は明確なエラーになります。 ([#11576](https://github.com/nocobase/nocobase/pull/11576))

### 🐛 不具合修正

- **[Agent]** 低速な接続で会話を開く際に、会話一覧が重複して読み込まれる問題を修正しました。 ([#11571](https://github.com/nocobase/nocobase/pull/11571))
- **[認証]** ログイン後に元のページへ戻り、クエリとフラグメントを保持します。 ([#11573](https://github.com/nocobase/nocobase/pull/11573))

## [nocobase-v3-beta/2026-11-16.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-16.1)

### 🎉 新機能

- **[プラグインライフサイクル]** Lifecycle は独立したバージョンをサポートし、下書きを含むレコード作成時に全パラメーターを固定して、設定と状態ごとの期限を保護します。 ([#11507](https://github.com/nocobase/nocobase/pull/11507))
- **[CLI]** 子アプリの作成とデプロイコマンド拡張をサポートし、リクエストごとに独立した App Host へルーティングします。 ([#11557](https://github.com/nocobase/nocobase/pull/11557))
- **[ファイル]** 同じストレージバケットを共有するファイルリポジトリごとに、アップロード先ディレクトリを設定できるようになりました。 ([#11565](https://github.com/nocobase/nocobase/pull/11565))

### 🚀 改善

- **[権限]** アプリの設定、保護された環境へのデプロイ、ナレッジ編集を開始ユーザーの権限でエージェントに許可できます。 ([#11554](https://github.com/nocobase/nocobase/pull/11554))

### 🐛 不具合修正

- **[API キー]** 既定で最大 100 文字の名前の API キーを作成・ローテーションでき、名前の検証失敗はクライアントエラーとして返します。 ([#11558](https://github.com/nocobase/nocobase/pull/11558))
- **[サーバー]** サーバーで環境プロキシを使用している場合でも、子アプリケーションのページと WebSocket 接続にアクセスできるようにしました。 ([#11564](https://github.com/nocobase/nocobase/pull/11564))
- **[メール]** メール接続の失敗をプロトコルと原因別に表示し、認証情報を含まない診断ログを記録します。 ([#11566](https://github.com/nocobase/nocobase/pull/11566))

## [nocobase-v3-beta/2026-11-13.2](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-13.2)

### 🎉 新機能

- **[CLI]** CLI で宣言された操作キーを安全に再利用し、大容量ファイルをストリーミング送信して、既存の更新と保護されたインストール動作を維持した独立の公開インストーラーを提供します。 ([#11535](https://github.com/nocobase/nocobase/pull/11535))
- **[Agent]** 設定済みのサービス認証情報を使い、DeepSeek モデルのネイティブエージェントでウェブ検索を利用できるようになりました。 ([#11551](https://github.com/nocobase/nocobase/pull/11551))

### 🚀 改善

- **[リリース管理]** 環境内のアプリが増えても一覧の応答性を保ち、検索文字列をそのまま照合します。 ([#11553](https://github.com/nocobase/nocobase/pull/11553))

### 🐛 不具合修正

- **[リリース管理]** 停滞したリリースのダウンロードをタイムアウトし、キャンセル可能にして後続のデプロイを継続します。 ([#11547](https://github.com/nocobase/nocobase/pull/11547))

## [nocobase-v3-beta/2026-11-13.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-13.1)

### 🎉 新機能

- **[Agent]** アプリケーションは Agents から独立して CLI を配布でき、既存の Agents 環境のダウンロードと更新プロトコルも維持されます。 ([#11539](https://github.com/nocobase/nocobase/pull/11539))

### 🚀 改善

- **[Agent]** 実行環境の一覧で、各コーディングツールの横に同時実行数の上限と現在の実行数を表示します。 ([#11530](https://github.com/nocobase/nocobase/pull/11530))
- **[アプリテンプレート]** 新しいアプリケーションのテストファイルを並列で実行し、`pnpm test` が数倍速く完了するようにします。 ([#11543](https://github.com/nocobase/nocobase/pull/11543))

### 🐛 不具合修正

- **[認証]** 認証依存関係を更新し、ログインの安全性を高めながらパスワード再設定を引き続き利用できるようにします。 ([#11526](https://github.com/nocobase/nocobase/pull/11526))
- **[メール]**
  - メールボックスの照合中や同期の合間にも新しい IMAP メールをすばやく取り込み、大きなメールボックスの同期を安全に再開します。 ([#11529](https://github.com/nocobase/nocobase/pull/11529))
  - メールプラグインは、IMAP 同期に必要な imapflow 2.2.9 以降を必須とするようになりました。 ([#11550](https://github.com/nocobase/nocobase/pull/11550))
- **[Agent]** 会話中の Runner がアップロードしたファイルを返信に表示し、会話とともに保持します。 ([#11532](https://github.com/nocobase/nocobase/pull/11532))
- **[リリース管理]** アプリホストがメモリ不足で拒否したデプロイを再試行すると展開済みのリリースを再利用し、各アプリには分かりやすい状態が 1 つだけ表示され、容量に関するメッセージも読みやすくなりました。 ([#11544](https://github.com/nocobase/nocobase/pull/11544))

## [nocobase-v3-beta/2026-11-12.1](https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-12.1)

### 🎉 新機能

- **[サーバー]** Plugins can provide application-local ID generation without replacing the application's ID provider, while keeping synchronous generation and previously resolved service references. ([#11489](https://github.com/nocobase/nocobase/pull/11489))
- **[アプリ作成]** Create multi-app projects with a root Main application, independently deployed children, and synchronized development, migration and deployment Skills. ([#11497](https://github.com/nocobase/nocobase/pull/11497))

### 🚀 改善

- **[ユーザー]** Invitation emails are now written in one language chosen when inviting, with a localized subject and expiry time, and the sign-up page opens in that language. ([#11482](https://github.com/nocobase/nocobase/pull/11482))
- **[Skills]** Table row actions in new and template pages now sit in one consistent "⋮" menu at the end of the row, with no actions column header and no pinned column. ([#11484](https://github.com/nocobase/nocobase/pull/11484))
- **[Agent]** The runtime list shows each coding tool's quota usage and when an exhausted quota resets, and its version column shows only Latest or Upgradable. ([#11494](https://github.com/nocobase/nocobase/pull/11494))
- **[プロジェクト]**
  - Refresh task reminders faster for people responsible for a small part of a large project backlog. ([#11502](https://github.com/nocobase/nocobase/pull/11502))
  - Reduce project task grouping work while preserving visible parent context and dependency counts. ([#11503](https://github.com/nocobase/nocobase/pull/11503))
- **[ナレッジベース]** Load knowledge-space directories with fewer queries while preserving document visibility and archived counts. ([#11506](https://github.com/nocobase/nocobase/pull/11506))
- **[アプリテンプレート]** Move the Main-only multi-app template and scenario Skills to Pro, delivering child applications through deployment archives. ([#11511](https://github.com/nocobase/nocobase/pull/11511))

### 🐛 不具合修正

- **[デモモード]** Fix a blank application when Demo Mode is registered in an application whose System settings nest categories and modules under the same path. ([#11455](https://github.com/nocobase/nocobase/pull/11455))
- **[メール]** Speed up IMAP synchronization and attachment downloads, and tolerate mailbox changes during verification. ([#11490](https://github.com/nocobase/nocobase/pull/11490))
- **[Agent]** Clarified runtime quota settings and empty states, kept thresholds visible to viewers, and displayed quota windows in readable units ([#11493](https://github.com/nocobase/nocobase/pull/11493))
- **[ユーザー]** After registering with automatic sign-in turned off, the register page now shows that the request was submitted instead of an empty form. ([#11495](https://github.com/nocobase/nocobase/pull/11495))
- **[CLI]** Build applications without compiling unrelated example applications, with a larger default compiler heap. ([#11508](https://github.com/nocobase/nocobase/pull/11508))
- **[アプリ作成]** Add scoped NocoBase registry selection while preserving the legacy --registry option with migration guidance. ([#11512](https://github.com/nocobase/nocobase/pull/11512))
