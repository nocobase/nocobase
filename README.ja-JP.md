[English](./README.md) | [Español](./README.es-ES.md) | [Français](./README.fr-FR.md) | [Deutsch](./README.de-DE.md) | [Português](./README.pt-BR.md) | [Русский](./README.ru-RU.md) | [Bahasa Indonesia](./README.id-ID.md) | [Tiếng Việt](./README.vi-VN.md) | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-TW.md) | 日本語 | [한국어](./README.ko-KR.md)

[▶ デモを見る](https://static-docs.nocobase.com/nocobase-3-ja.mp4)

<p align="center">
<a href="https://trendshift.io/repositories/4112" target="_blank"><img src="https://trendshift.io/api/badge/repositories/4112" alt="nocobase%2Fnocobase | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
<a href="https://www.producthunt.com/posts/nocobase?embed=true&utm_source=badge-top-post-topic-badge&utm_medium=badge&utm_souce=badge-nocobase" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/top-post-topic-badge.svg?post_id=456520&theme=light&period=weekly&topic_id=267" alt="NocoBase - Scalability&#0045;first&#0044;&#0032;open&#0045;source&#0032;no&#0045;code&#0032;platform | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>
</p>

## NocoBase とは

NocoBase は、AI で業務システムを継続的に開発・運用するためのオープンソースプラットフォームです。エージェントがコードを書いて実行し、NocoBase が基盤とガバナンスを提供し、人が意思決定を行います。

[公式サイト](https://www.nocobase.com/ja-JP/) · [ドキュメント](https://docs.nocobase.com/) · [クイックスタート](#quick-start) · [コミュニティ](https://forum.nocobase.com/)

## なぜ NocoBase なのか

**AI でコードはすぐに書ける。 それでも、信頼できる業務システムをつくるのは簡単ではない。**

すでに AI による開発やバイブコーディングを取り入れ、コードは速く書けるようになりました。しかし、新たな課題も生まれています。

- **基盤をゼロから作ることになる**

  AI に任せても、権限、ワークフローエンジン、承認といった基盤モジュールをゼロから開発するのは設計が難しく、例外ケースも多く、保守の負担も大きくなります。

- **アーキテクチャが場当たり的に崩れていく**

  担当者やモデル、さらには会話が変わるたびに、AI はその場しのぎの実装をしがちです。システムはどんどん保守しにくくなります。

- **並行作業が増え、人の確認が追いつかない**

  複数のプロジェクトとタスクを同時に抱え、いくつものターミナルや会話を行き来するうちに、エージェントから届く変更も増えていきます。すべてを確認しきれず、かといって任せきることもできません。

- **知識やノウハウが蓄積・共有されない**

  要件の背景、業務資料、プロジェクトの経験が、別々の PC の別々の会話に散らばり、担当者やエージェントが変わると見つけられなくなります。

<a id="quick-start"></a>

## クイックスタート

Node.js 24 以降と pnpm 11 が必要です。Windows では WSL を使用してください。以下の例では SQLite を使用するため、別途データベースサーバーを用意する必要はありません。

### コーディングエージェントを使う

空のディレクトリで Skills 対応のコーディングエージェントを開き、アプリ作成用の Skill をインストールします。

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

インストール時に使用するエージェントを選択してください。新しい Skill が認識されない場合は、新しいセッションを開始します。その後、次の指示を送信します。

```text
nocobase-create-app Skill に従い、現在の空のディレクトリに、デフォルトのテンプレートと SQLite を使用して NocoBase 3 アプリを作成し、起動してください。
```

### ターミナルを使う

プロジェクトを保存する親ディレクトリで、次のコマンドを実行します。

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app@beta my-app --template-tag=beta
cd my-app
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

詳しいセットアップ手順と開発ガイドは[ドキュメント](https://docs.nocobase.com/)をご覧ください。

## NocoBase エコシステム

- **[NocoBase Core](https://www.nocobase.com/ja-JP/core/)**

  **エージェントは業務の開発に専念。 基盤はもう整っている。**

  NocoBase Core は、AI で業務システムを開発・運用するためのオープンソースのアプリケーション基盤です。権限、ワークフロー、ファイルなどの共通機能がそろっているため、エージェントは統一されたアーキテクチャの上で、自社の業務部分だけを開発します。

- **[NocoBase Studio](https://www.nocobase.com/ja-JP/studio/)**

  **エージェントが自律的に推進し、 チームが全体を掌握する。**

  NocoBase Studio は、人とエージェントが協働開発するためのガバナンスプラットフォームです。Claude Code、Codex、OpenCode をひとつのエージェントチームにまとめ、タスクを自律的に進めます。進捗はひと目でわかり、重要な判断は人が下します。

- **[NocoBase Solution](https://www.nocobase.com/ja-JP/solutions/)**

  **オープンソースの業務アプリ。 AI 駆動で、すぐに使える。**

  NocoBase Solution は、Core 上に構築された、エージェントが動かす業務アプリのシリーズです。実務の大部分はエージェントが担い、人は重要な判断だけを行います。

## コミュニティと貢献

- [コミュニティフォーラム](https://forum.nocobase.com/)で質問や経験を共有できます。
- 再現可能な不具合の報告や改善の提案は [GitHub Issues](https://github.com/nocobase/nocobase/issues) へお寄せください。
- フレームワークとプラグインについては[ドキュメント](https://docs.nocobase.com/)をご覧ください。

貢献を歓迎します。このリポジトリを変更する前に、[AGENTS.md](./AGENTS.md) と変更内容に関連する開発ガイドをお読みください。
