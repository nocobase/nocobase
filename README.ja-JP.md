[English](./README.md) | [简体中文](./README.zh-CN.md) | 日本語 | [Français](./README.fr.md) | [Español](./README.es.md) | [Português](./README.pt.md) | [Bahasa Indonesia](./README.id.md) | [Tiếng Việt](./README.vi.md) | [Deutsch](./README.de.md)

https://github.com/user-attachments/assets/3b89d965-f60f-48e0-8110-24186c2911d2

<p align="center">
<a href="https://trendshift.io/repositories/4112" target="_blank"><img src="https://trendshift.io/api/badge/repositories/4112" alt="nocobase%2Fnocobase | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
<a href="https://www.producthunt.com/posts/nocobase?embed=true&utm_source=badge-top-post-topic-badge&utm_medium=badge&utm_souce=badge-nocobase" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/top-post-topic-badge.svg?post_id=456520&theme=light&period=weekly&topic_id=267" alt="NocoBase | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>
</p>

## 目次

- [NocoBase とは](#nocobase-とは)
- [リリースノート](#リリースノート)
- [主な特長](#主な特長)
- [AI Agent 接続](#ai-agent-接続)
- [インストール](#インストール)

## NocoBase とは

NocoBase は、企業向け業務システムをすばやく構築するためのオープンソース AI + ノーコード開発プラットフォームです。AI にゼロからコードを生成させるのとは異なり、NocoBase は本番環境で検証済みの基盤機能と、見たまま操作できるノーコード UI を提供します。これにより、AI と人が効率よく協働し、開発スピードとシステムの信頼性を両立できます。

公式サイト:  
https://www.nocobase.com/ja

オンラインデモ:  
https://demo.nocobase.com/new

ドキュメント:  
https://docs.nocobase.com/ja/

フォーラム:  
https://forum.nocobase.com/

ユーザーストーリー:  
https://www.nocobase.com/ja/blog/tags/customer-stories

## リリースノート

[リリースノート](https://www.nocobase.com/ja/blog/timeline) では、更新内容を継続的に公開しています。

## 主な特長

### 1. 協働: AI と人が一緒に構築

Coding Agent には CLI と Skills を、人には見たまま使えるノーコード UI を提供し、両者が効率よく協働できます。

#### 使い慣れた AI Coding Agent で開発

主要な Coding Agent を使えば、デプロイから構築まで短時間で進められます。

- Claude Code、Cursor、Codex、OpenCode、TRAE など主要 Agent に対応
- セットアップ、構築、移行、公開まで Agent が一通り担えます

![coding-agent](https://static-docs.nocobase.com/coding-agent.png)

#### 見たまま操作できる ノーコード UI で人が構築

見たまま操作できる UI で、人が直接構築・修正できます。AI なしでも進められます。

- 利用モードと設定モードをワンクリックで切り替え
- データモデル、ページ、ワークフロー、権限を可視化して確認・設定できます
- 一般ユーザー向けで、開発者だけのものではありません

![wysiwyg](https://static-docs.nocobase.com/wysiwyg.gif)

#### AI 開発と手動構築 を自由に組み合わせ

必要に応じて分担でき、人が AI の成果を調整し、AI も人の設定を引き継げます。

- AI はデータモデル、ページ、ワークフローをすばやく作れます
- 人は UI や操作性をすばやく調整できます
- 必要に応じて協働し、継続的に改善

![ai-no-coding](https://static-docs.nocobase.com/ai-no-coding.png)

### 2. インテリジェント: AI は開発だけでなく業務も担う

NocoBase には AI 社員が組み込まれており、AI がシステム内で直接働けます。

#### AI 社員 が業務フローに組み込まれる

AI 社員は業務コンテキストを自動取得し、システム内で直接タスクを実行します。

- フロント側: 分析、質問応答、フォーム入力などを支援
- バックエンド側: 文書認識、リスク監視、タスク振り分けを自動処理
- ワークフローに統合され、判断や実行にも参加できます

![AI-employee](https://static-docs.nocobase.com/ai-employee-home.png)

#### オープンな接続口 で Agent エコシステムと連携

MCP、HTTP API、CLI、Skills により、外部 Agent が安全に接続できます。

- OpenClaw、Hermes、Dify、Coze、n8n などが標準プロトコルで接続できます
- Telegram、WhatsApp、Slack、Gmail と連携し、データ参照、操作実行、業務フロー起動が行えます
- 統一されたインターフェースで、内部と外部の Agent が同じ境界で動作します

![agents](https://static-docs.nocobase.com/f-agents-logos.jpeg)

#### 権限制御 により、振る舞いを管理できる

AI のすべての操作は、人と同じ細かな権限制御に従います。

- 各 AI 社員は独立ロールを持ち、権限はフィールド単位まで設定できます
- 監査ログで、各データ変更やフロー起動を追跡できます
- 管理者は AI の権限をいつでも調整し、境界を明確に保てます

![permission](https://static-docs.nocobase.com/f-permission.png)

### 3. 信頼性: 基盤は整っているので、業務に集中できる

データモデル、権限制御、ワークフロー編成といった機能は複雑で、ミスが許されません。  
NocoBase はそれらを組み込みの基盤機能として提供し、厳格なテストと多数の本番利用で検証されています。

#### 充実した基盤機能 があり、毎回ゼロから始めなくてよい

数十の基盤モジュールで、よくある業務要件を広くカバーします。

- データモデリング、権限、ワークフロー、監査ログをすぐに使えます
- AI が毎回作り直すブラックボックスなコードではなく、本番で検証済みです
- 組み込みのガードレールで、AI の出力をアーキテクチャに沿わせます

![core](https://static-docs.nocobase.com/f-core.png)

#### データモデル駆動 で、データと UI を分離

業務データは標準的なリレーショナル構造で保持され、UI から分離されます。

- メイン DB、外部 DB、サードパーティ API をデータソースにできます
- AI も人も同じデータモデルで作業するため、結果が透明です
- データは常に自分のデータベースに保存され、プラットフォームにロックインされません

![model](https://static-docs.nocobase.com/model.png)

#### プラグインアーキテクチャ で、システムを持続的に進化できる

マイクロカーネル設計により、すべての機能がプラグインとして成長できます。

- 新機能は共通ルールに沿った組み合わせ可能なプラグインで拡張できます
- 自社製と公式プラグインを組み合わせて業務に合わせられます
- AI 生成でも手動開発でも、同じアーキテクチャで統一されます

![plugins](https://static-docs.nocobase.com/plugins.png)

## AI Agent 接続

最も簡単な方法は、NocoBase CLI をインストールして初期化し、その作業ディレクトリ内で AI Agent のセッションを開始または再起動することです。

- NocoBase CLI は NocoBase アプリケーションのインストール、接続、管理を担います
- 初期化時に NocoBase Skills が自動で導入され、AI Agent がデータモデル、ページ、ワークフロー、権限、プラグインを理解できるようになります
- 初期化後は、そのディレクトリをワークスペースにして AI Agent を起動すればすぐに作業できます

```bash
npm install -g @nocobase/cli@beta
mkdir my-nocobase && cd my-nocobase
nb init --ui
cd my-nocobase && codex
```

詳細:  
https://docs.nocobase.com/ja/ai/quick-start

## インストール

NocoBase には 3 つのインストール方法があります。

- <a target="_blank" href="https://docs.nocobase.com/ja/welcome/getting-started/installation/docker-compose">Docker でインストール（推奨）</a>

  ノーコード中心の利用に向いており、コードを書く必要はありません。アップグレード時は最新イメージを取得して再起動するだけです。

- <a target="_blank" href="https://docs.nocobase.com/ja/welcome/getting-started/installation/create-nocobase-app">create-nocobase-app でインストール</a>

  プロジェクトの業務コードを独立して保てるため、ローコード開発に適しています。

- <a target="_blank" href="https://docs.nocobase.com/ja/welcome/getting-started/installation/git-clone">Git ソースコードからインストール</a>

  未リリースの最新バージョンを試したい場合や、ソースコードを直接修正・デバッグして貢献したい場合におすすめです。より高い開発スキルが必要ですが、コード更新後は Git で最新状態を取得できます。
