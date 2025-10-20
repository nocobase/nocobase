[English](./README.md) | [简体中文](./README.zh-CN.md) | 日本語

https://github.com/user-attachments/assets/8d183b44-9bb5-4792-b08f-bc08fe8dfaaf

<p align="center">
<a href="https://trendshift.io/repositories/4112" target="_blank"><img src="https://trendshift.io/api/badge/repositories/4112" alt="nocobase%2Fnocobase | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
<a href="https://www.producthunt.com/posts/nocobase?embed=true&utm_source=badge-top-post-topic-badge&utm_medium=badge&utm_souce=badge-nocobase" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/top-post-topic-badge.svg?post_id=456520&theme=light&period=weekly&topic_id=267" alt="NocoBase - Scalability&#0045;first&#0044;&#0032;open&#0045;source&#0032;no&#0045;code&#0032;platform | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>
</p>

## NocoBaseはなに？

超拡張可能な AIノーコード開発プラットフォーム。

完全なコントロール、無限の拡張性、AIの協働。  
チームが変化に素早く対応し、コストを大幅に削減。  
長年の開発も、数百万円規模の投資も不要。  
数分で NocoBase をデプロイすれば、すぐにすべてが手に入ります。  

ホームページ：  
https://www.nocobase.com/

オンライン体験：  
https://demo.nocobase.com/new

ドキュメント：  
https://docs.nocobase.com/

コミュニティ：  
https://forum.nocobase.com/

顧客のストーリー：  
https://www.nocobase.com/ja/blog/tags/customer-stories

## リリースノート

リリースノートは[ブログ](https://www.nocobase.com/ja/blog/timeline)で随時更新され、週ごとにまとめて公開しています。

## 他の製品との違い

### 1. データモデル駆動 ― フォーム／テーブル駆動ではありません
フォームやテーブルに縛られるのではなく、データモデル駆動のアプローチでデータ構造と UI を分離し、無限の可能性を切り開きます。

- UI とデータ構造が完全にデカップリングされている
- 同じテーブルやレコードでも、形式を問わず複数のブロックやアクションを作成できる
- メイン DB・外部 DB・サードパーティ API をデータソースとして利用できる

![model](https://static-docs.nocobase.com/model.png)

### 2. AI スタッフ を業務システムに統合
単体の AI デモとは異なり、NocoBase ならインターフェースやワークフロー、データの文脈に AI をシームレスに埋め込み、実践的な価値を生み出せます。

- 翻訳者・アナリスト・リサーチャー・アシスタントなど役割別に AI スタッフを定義
- インターフェースとワークフローで人と AI がシームレスに協働
- ビジネス要件に合わせて、安全・透明・カスタマイズ可能な AI 利用を実現

![AI-employee](https://static-docs.nocobase.com/ai-employee-home.png)

### 3. WYSIWYG ― 直感的で使いやすい
複雑な業務システムを構築できる一方で、NocoBase の体験は常にシンプルで直感的です。

- ワンクリックで利用モードと設定モードを切り替え
- ページは Notion のようにブロックとアクションを配置するキャンバス
- プログラマーだけでなく、一般ユーザーでも扱いやすい設定画面

![wysiwyg](https://static-docs.nocobase.com/wysiwyg.gif)

### 4. すべてが プラグイン ― 拡張のための設計
ノーコード機能を増やすだけでは、すべての業務シナリオをカバーできません。NocoBase はマイクロカーネル型のプラグインアーキテクチャで拡張を前提に設計されています。

- すべての機能が WordPress のようにプラグインとして提供
- インストールするだけですぐに利用可能
- ページ・ブロック・アクション・API・データソースをカスタムプラグインで拡張できる

![plugins](https://static-docs.nocobase.com/plugins.png)

## インストール

NocoBaseは3つのインストール方法をサポートしています：

- <a target="_blank" href="https://docs-cn.nocobase.com/welcome/getting-started/installation/docker-compose">Dockerインストール（推奨）</a >

   コードを書く必要がないノーコードシナリオに適しています。アップグレード時は最新のイメージをダウンロードして再起動するだけです。

- <a target="_blank" href="https://docs-cn.nocobase.com/welcome/getting-started/installation/create-nocobase-app">create-nocobase-appインストール</a >

   プロジェクトのビジネスコードが完全に独立しており、ローコード開発をサポートします。

- <a target="_blank" href="https://docs-cn.nocobase.com/welcome/getting-started/installation/git-clone">Gitソースコードインストール</a >

   最新の未公開バージョンを体験したい場合や、貢献したい場合、ソースコードを変更、デバッグする必要がある場合にこの方法を選択することをお勧めします。この方法は高度な開発技術が必要です。コードが更新された場合、gitフローを使用して最新のコードを取得できます。
