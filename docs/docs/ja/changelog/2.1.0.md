# NocoBase 2.1.0 リリースノート

これは、**AI 関連機能を中心とした**重要なアップグレードです。本バージョンでは、AI Agent を NocoBase に接続できるようになりました。CLI 接続、AI による構築、AI 社員の機能強化、AI 開発プラグインなど、環境接続からシステム構築、業務上の協働まで一連の流れを網羅しています。あわせて、2.0 ページとコア機能の整備も大幅に進め、より多くのブロック、フィールド、アクション、プラグインが 2.0 に対応しました。

## 新機能

### NocoBase CLI を新たに追加

このバージョンでは、NocoBase CLI（`nb`）が一般ユーザーと AI Agent の両方から NocoBase に接続するための中核的な入口となります。

CLI は、ローカルワークスペースで NocoBase アプリの初期化・接続・管理に使用し、次のようなシナリオに対応します。

- Docker、npm、または Git で新しい NocoBase アプリをインストールし、CLI env として保存する
- 既存の NocoBase アプリに接続し、CLI env として保存する
- プラグインのインストール、作成、有効化
- NocoBase アプリの運用、バックアップ、管理

![NocoBase CLI のビジュアルウィザード](https://static-docs.nocobase.com/2026-04-29-15-55-19.png)

既存のシステムに AI を組み込む場合でも、ゼロから新しいアプリを立ち上げる場合でも、CLI から初期化と継続的な管理を行えます。

チームにとって CLI は、AI Agent が理解し操作できる標準的な入口を提供します。環境の初期化、接続設定、実行管理がすべて同じフローに沿って行えます。

正式版では、次のような運用関連コマンドも整備されました。

- `nb api`: CLI 経由で NocoBase API を呼び出します。
- `nb app`: アプリの実行状態（起動、停止、再起動、ログ、アップグレード）を管理します。
- `nb backup`: バックアップを作成してローカルにダウンロードする、またはローカルのバックアップファイルを対象 env にリストアします。
- `nb config`: CLI の既定設定を管理します。
- `nb db`: 選択した env の組み込みデータベースを管理します。
- `nb env`: NocoBase プロジェクトの環境、現在の env、状態、詳細、ランタイムコマンドを管理します。
- `nb license`: 商用ライセンスとライセンスプラグインを管理します。
- `nb plugin`: 選択した NocoBase env のプラグインを管理します。
- `nb scaffold`: NocoBase プラグイン開発用のスキャフォールドを生成します。
- `nb self`: NocoBase CLI 自体の確認または更新を行います。
- `nb source`: ローカルソースプロジェクト（ダウンロード、開発、ビルド、テスト）を管理します。

関連ドキュメント：

- [CLI で NocoBase アプリをインストール](https://docs.nocobase.com/ja/quickstart/installation/cli)
- [AI Agent 接続ガイド](https://docs.nocobase.com/ja/ai/quick-start)
- [NocoBase CLI コマンドリファレンス](https://docs.nocobase.com/ja/api/cli/)

### AI による構築：手作業の設定を対話で置き換える

AI による構築は、本バージョンで体験できる中核機能の 1 つです。自然言語で業務要件を伝えるだけで、AI がデータモデリング、ページ設定、権限設定、ワークフロー編成までを支援します。

従来のローコード構築と比較して、AI による構築には次のような明確な利点があります。

- 利用開始のハードルが下がり、すべての設定概念に事前に習熟しなくても始められる
- 要件記述からプロトタイプ完成までの経路が短くなる
- データ、UI、ワークフロー設定を AI が連続して仕上げられる

たとえば「CRM のデータモデルを設計して」「顧客管理ページを作って」「注文作成後に在庫を自動で減らすワークフローを組んで」といった指示は、いずれも NocoBase の機能範囲内で AI が支援できます。

関連ドキュメント：

- [AI による構築クイックスタート](https://docs.nocobase.com/ja/ai-builder/)

### NocoBase Skills が構築フロー全体をカバー

AI が NocoBase の設定体系を本質的に理解できるよう、本バージョンでは AI Agent にインストールできるドメイン知識パッケージ群「NocoBase Skills」を提供します。

Skills は、NocoBase の主要な機能領域ごとに整理された標準化された知識と操作のラッパーであり、AI がオブジェクトモデル、設定構造、実行範囲をより正確に理解するのに役立ちます。

現在、構築フロー全体をカバーする 8 つの Skills を提供しています。

- [環境管理](https://docs.nocobase.com/ja/ai-builder/env-bootstrap) — 環境チェック、インストール／デプロイ、アップグレード、障害診断
- [データモデリング](https://docs.nocobase.com/ja/ai-builder/data-modeling) — テーブル、フィールド、リレーションの作成と管理
- [UI 構築](https://docs.nocobase.com/ja/ai-builder/ui-builder) — ページ、ブロック、ポップアップ、インタラクション連動の作成と編集
- [ワークフロー管理](https://docs.nocobase.com/ja/ai-builder/workflow) — ワークフローの作成、編集、有効化、診断
- [権限設定](https://docs.nocobase.com/ja/ai-builder/acl) — ロール、権限ポリシー、ユーザーバインディング、リスク評価の管理
- [ソリューション](https://docs.nocobase.com/ja/ai-builder/dsl-reconciler) — YAML から業務システム一式を一括構築（テスト中で安定性は限定的）
- [プラグイン管理](https://docs.nocobase.com/ja/ai-builder/plugin-manage) — プラグインの確認、有効化、無効化
- [パブリッシュ管理](https://docs.nocobase.com/ja/ai-builder/publish) — 環境間の公開、バックアップ／リストア、マイグレーション

Skills を導入することで、AI は NocoBase の設定体系をより正確に把握し、システムの構築・管理においてより高度な支援を提供できます。

**注意**：NocoBase Skills は現在も継続的に改善中です。NocoBase CLI をインストールして初期化すると NocoBase Skills も自動的にインストールされるため、通常は個別にインストールする必要はありません。

関連ドキュメント：

- [NocoBase Skills](https://github.com/nocobase/skills)

### AI 開発プラグイン

本バージョンでは、AI によるプラグイン開発に必要な基盤を整備し、AI がアプリの構築だけでなくカスタムプラグインの開発にも参加できるようにしました。

主に次の 3 点に表れています。

- `rsbuild/rspack` によるビルドに統一し、プラグイン開発とフロントエンドビルドの体系を集約
- AI 開発を見据えた `client-v2` 機能と `/v/` ルーティング体系を提供し、次世代クライアントプラグイン開発に備える
- プラグイン構造、コード構成、実装方法を AI がより正確に理解するための、AI プラグイン開発関連 Skill を提供

`client-v2` 周りの準備内容は次のとおりです。

- `@nocobase/app` が `client-v2` のエントリーを提供
- 内核から `@nocobase/client-v2` パッケージを提供し、基本コンポーネント、ユーティリティ関数、型定義を含む
- 各プラグインに `/src/client-v2` ディレクトリを追加
- `/v/` ルートを新規追加。現在も継続的に改善中で、お試し利用が可能
- 内核を段階的に V2 へ移行
- プラグインを段階的に V2 へ移行

統一されたビルド経路によりフロントエンドのプラグイン開発とデバッグのコストが下がり、`client-v2` の段階的な導入は、AI がプラグインコードを生成・保守するためのより安定したターゲット構造を提供します。

実際のところ、自然言語でプラグイン要件を伝えれば、AI がフロントエンド／バックエンドコード、データテーブル、API、権限設定、国際化コンテンツの生成までを支援します。

**注意**：AI 開発プラグインの機能は `client-v2` ベースの新しいプラグインのみを対象としています。今後、`client-v1` プラグインから `client-v2` プラグインへのマイグレーションドキュメントと Skills を提供し、既存プラグインを新体系へ移行できるよう支援していきます。

関連ドキュメント：

- [AI 開発プラグインクイックスタート](https://docs.nocobase.com/ja/ai-dev/)
- [プラグイン開発](https://docs.nocobase.com/ja/plugin-development/)

### AI 社員の機能強化

AI による構築が「AI を使ってどうシステムを組み立てるか」を解決するのに対し、AI 社員は「具体的な業務課題を解決するために、AI をシステムの中でどう働かせるか」を解決します。

AI 社員自体はこれまでのバージョンにも存在していましたが、このバージョンでは関連機能が強化され、AI 内核も整備されました。

- [MCP への接続をサポート](https://docs.nocobase.com/ja/ai-employees/features/mcp)
- [AI 社員 Atlas を新設](https://docs.nocobase.com/ja/ai-employees/features/built-in-employee#default-ai-employee-atlas)。チームリーダーの役割を担い、ユーザー意図に応じて他の AI 社員を呼び出してタスクを完了させる
- [AI 社員ノードを提供](https://docs.nocobase.com/ja/ai-employees/workflow/nodes/employee/configuration)
- [LLM ベースの Web 検索ツールを提供](https://docs.nocobase.com/ja/ai-employees/features/web-search)
- [集計クエリツール、レポート生成ツールを新規追加](https://docs.nocobase.com/ja/ai-employees/scenarios/business-report)し、業務分析レポートの生成に対応
- [ローカライゼーションエンジニア Lina を新設](https://docs.nocobase.com/ja/ai-employees/built-in/lina)。ローカライゼーションプラグインに組み込まれた AI 社員で、システムのローカライゼーション翻訳に使用し、増分・選択項目・全件の 3 つの翻訳範囲に対応

これらの改善により、業務システムにおける AI 社員の拡張性、編成性、実行能力が一段階引き上げられました。AI 社員は現在の業務コンテキストを理解し、Skill を呼び出して特定タスクを実行し、自動化フローに参加し、外部情報と組み合わせて分析と出力を行えます。

正式版ではさらに、AI 社員がワークフローの添付ファイルフィールドからファイルを読み込む機能や、複数の会話を並行して処理する機能も追加され、実際の業務プロセスにおける AI 社員の実用性がさらに高まりました。

関連ドキュメント：

- [AI 社員](https://docs.nocobase.com/ja/ai-employees/)
- [Lina：ローカライゼーションエンジニア](https://docs.nocobase.com/ja/ai-employees/built-in/lina)
- [Lina とローカルの HY-MT1.5-1.8B でローカライゼーション項目を翻訳する](https://docs.nocobase.com/ja/ai-employees/scenarios/localization-hy-mt)

### マルチアプリ機能の強化

このバージョンでは、マルチアプリ向けにいくつかの重要な機能強化を行いました。主に次の 3 点です。

- [アプリブロックとアプリ切り替えを新規追加](https://docs.nocobase.com/ja/multi-app/multi-app/app-block-and-switcher)。ページ上に他のサブアプリへの入口を表示でき、メインアプリとサブアプリの間をスムーズに切り替えられます。

![](https://static-docs.nocobase.com/202605271403304.png)

- [アプリシングルサインオンを新規追加](https://docs.nocobase.com/ja/multi-app/multi-app/app-sso)。ユーザーがメインアプリの入口からサブアプリに入るとき、またはサブアプリ間を切り替えるとき、システムは現在ログイン中のユーザーで対象サブアプリへの自動ログインを試みます。各サブアプリで認証情報を再入力する必要はありません。

![](https://static-docs.nocobase.com/202605271406542.png)

- [サブアプリ API の呼び出し](https://docs.nocobase.com/ja/multi-app/multi-app/sub-app-api)。マルチアプリのシナリオでは、各サブアプリが独自の API を持ち、パスのプレフィックスやパラメーターなどで区別され、サブアプリの API を簡単に呼び出せます。

これらの強化は、マルチアプリ構成を運用するユーザーにとって非常に実用的であり、複数のアプリ間でのデータのやり取りや操作がより容易になり、マルチアプリシステム全体の協働効率が向上します。

関連ドキュメント：

- [アプリブロックとアプリ切り替え](https://docs.nocobase.com/ja/multi-app/multi-app/app-block-and-switcher)
- [アプリシングルサインオン](https://docs.nocobase.com/ja/multi-app/multi-app/app-sso)
- [サブアプリ API の呼び出し](https://docs.nocobase.com/ja/multi-app/multi-app/sub-app-api)

### ワークフローの強化

本バージョンでは、ワークフローの**制御性と可観測性**を強化しました。

- タイムアウト制御を追加。実行時間が長すぎるワークフローは自動的に終了します（サブフローもタイムアウト設定に対応）
- 作成者・更新者フィールドを追加
- ノードジョブにログフィールドを追加し、デバッグ時にノードのログを確認しやすくしました
- Webhook トリガー（同期モード）はタイムアウト時に 408 レスポンスステータスを返します

関連ドキュメント：

- [ワークフロー](https://docs.nocobase.com/ja/workflow/)

### 手書き署名フィールド

手書き署名フィールドを追加しました。フォーム上で署名を手書きして保存でき、承認、確認書、受領書などのシーンに適しています。

関連ドキュメント：

- [手書き署名フィールド](https://docs.nocobase.com/ja/data-sources/field-signature/)

### JS Item アクション

JS Item アクションを追加しました。JS を記述してアクション内でカスタムロジックを実行でき、イベントフローと組み合わせてより柔軟なインタラクションに対応します。

関連ドキュメント：

- [JS Item アクション](https://docs.nocobase.com/ja/interface-builder/actions/types/js-item)

### 2.0 対応と新機能

AI 以外でも、このバージョンは重要な機能モジュールの 2.0 への移行を継続しつつ、実際の業務シーンに向けた新機能の提供も続けています。

新機能

- [手書き署名フィールド](https://docs.nocobase.com/ja/data-sources/field-signature/)
- [JS Item アクション](https://docs.nocobase.com/ja/interface-builder/actions/types/js-item)

2.0 対応

- [カスタムリクエスト](https://docs.nocobase.com/ja/interface-builder/actions/types/custom-request)
- [ツリーフィルターブロック](https://docs.nocobase.com/ja/interface-builder/blocks/filter-blocks/tree)
- [カレンダーブロック](https://docs.nocobase.com/ja/data-sources/calendar/)
- [カンバンブロック](https://docs.nocobase.com/ja/interface-builder/blocks/data-blocks/kanban)
- [ガントチャートブロック](https://docs.nocobase.com/ja/plugins/@nocobase/plugin-gantt)
- [リストブロック](https://docs.nocobase.com/ja/interface-builder/blocks/data-blocks/list)
- [グリッドカードブロック](https://docs.nocobase.com/ja/interface-builder/blocks/data-blocks/grid-card)
- [マップブロック](https://docs.nocobase.com/ja/plugins/@nocobase/plugin-map)
- [Markdown ブロック](https://docs.nocobase.com/ja/interface-builder/blocks/other-blocks/markdown)
- [iframe ブロック](https://docs.nocobase.com/ja/integration/embed)
- [チャートブロック / データビジュアライゼーション](https://docs.nocobase.com/ja/data-visualization)

## 多言語ドキュメント

- インドネシア語とベトナム語のドキュメントを追加
