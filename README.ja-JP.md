[English](./README.md) | [简体中文](./README.zh-CN.md) | 日本語

https://github.com/user-attachments/assets/b11cbb68-76bc-4e8b-a2aa-2a1feed0ab77

## ご協力ありがとうございます！
<a href="https://trendshift.io/repositories/4112" target="_blank"><img src="https://trendshift.io/api/badge/repositories/4112" alt="nocobase%2Fnocobase | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>

<a href="https://www.producthunt.com/posts/nocobase?embed=true&utm_source=badge-top-post-topic-badge&utm_medium=badge&utm_souce=badge-nocobase" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/top-post-topic-badge.svg?post_id=456520&theme=light&period=weekly&topic_id=267" alt="NocoBase - Scalability&#0045;first&#0044;&#0032;open&#0045;source&#0032;no&#0045;code&#0032;platform | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>

## 最近の重要なリリース
- [v1.0.1-alpha.1：ブロックの高さ設定をサポート - 2024/06/07](https://docs-cn.nocobase.com/welcome/changelog/20240607)
- [v1.0.0-alpha.15：新しいプラグインの追加、「設定操作」インターフェースの改善 - 2024/05/19](https://docs-cn.nocobase.com/welcome/changelog/20240519)
- [v1.0：新しいマイルストーン - 2024/04/28](https://docs-cn.nocobase.com/welcome/release/v1001-changelog)
- [v0.21：ブロックのパフォーマンスの最適化 - 2024/03/29](https://docs-cn.nocobase.com/welcome/release/v0210-changelog)
- [v0.20：複数のデータソースをサポート - 2024/03/03](https://docs-cn.nocobase.com/welcome/release/v0200-changelog)
- [v0.19：アプリケーションフローの最適化 - 2024/01/08](https://blog-cn.nocobase.com/posts/release-v019/)
- [v0.18：完全なテストシステムの確立 - 2023/12/21](https://blog-cn.nocobase.com/posts/release-v018/)
- [v0.17：新しいSchemaInitializerおよびSchemaSettings - 2023/12/11](https://blog-cn.nocobase.com/posts/release-v017/)
- [v0.16：新しいキャッシュモジュール - 2023/11/20](https://blog-cn.nocobase.com/posts/release-v016/)
- [v0.15：新しいプラグイン設定センター - 2023/11/13](https://blog-cn.nocobase.com/posts/release-v015/)
- [v0.14：新しいプラグインマネージャー、インターフェースを通じたプラグインの追加をサポート - 2023/09/11](https://blog-cn.nocobase.com/posts/release-v014/)
- [v0.13: 新しいアプリケーションステートフロー - 2023/08/24](https://blog-cn.nocobase.com/posts/release-v013/)

## NocoBaseはなに？

NocoBaseは非常に拡張性の高いオープンソースのノーコード開発プラットフォームです。
大量のお時間と資金を投入して開発する必要がなく、NocoBaseをデプロイすることですぐにでもプライベートで制御可能かつ非常に拡張性の高いノーコード開発プラットフォームを構築することができます。

ホームページ：  
https://www.nocobase.com/

オンライン体験：  
https://demo-cn.nocobase.com/new

ドキュメント：  
https://docs-cn.nocobase.com/

コミュニティ：  
https://forum.nocobase.com/

## 他の製品との違い

### 1. データモデル駆動 

多くのノーコード製品はフォーム、表、またはプロセス駆動型であり、表に項目を追加することでフィールドを新しく作成するなど、ユーザーインターフェース上で直接データ構造を作成します。この方法のメリットは使いやすさですが、機能と柔軟性が制限されており、複雑なシナリオには対応しにくいという欠点があります。

NocoBaseはデータ構造とユーザーインターフェースを分離する設計理念を採用しており、データテーブルに任意の数や形態のブロック（データビュー）を作成できます。各ブロックには異なるスタイル、テキスト、操作を定義できるため、ノーコードの簡単な操作性とネイティブ開発の柔軟性を両立しています。
![model](https://static-docs.nocobase.com/model.png)

### 2. リアルタイムエディタ
NocoBaseは複雑で特徴的な業務システムを開発できますが、複雑で専門的な知識は必要としません。ワンクリックで設定オプションをユーザーインターフェースに表示でき、システム設定権限を持つ管理者は、見たままの操作方法でユーザーインターフェースを直接設定できます。
![wysiwyg](https://static-docs.nocobase.com/wysiwyg.gif)

### 3. プラグインによる高拡張性

NocoBaseはプラグイン化されたアーキテクチャを採用しており、新しい機能はすべてプラグインの開発とインストールによって実現できます。機能の拡張は、スマートフォンにアプリをインストールするのと同じくらい簡単です。

![plugins](https://static-docs.nocobase.com/plugins.png)

## インストール

NocoBaseは3つのインストール方法をサポートしています：

- <a target="_blank" href="https://docs-cn.nocobase.com/welcome/getting-started/installation/docker-compose">Dockerインストール（推奨）</a >

   コードを書く必要がないノーコードシナリオに適しています。アップグレード時は最新のイメージをダウンロードして再起動するだけです。

- <a target="_blank" href="https://docs-cn.nocobase.com/welcome/getting-started/installation/create-nocobase-app">create-nocobase-appインストール</a >

   プロジェクトのビジネスコードが完全に独立しており、ローコード開発をサポートします。

- <a target="_blank" href="https://docs-cn.nocobase.com/welcome/getting-started/installation/git-clone">Gitソースコードインストール</a >

   最新の未公開バージョンを体験したい場合や、貢献したい場合、ソースコードを変更、デバッグする必要がある場合にこの方法を選択することをお勧めします。この方法は高度な開発技術が必要です。コードが更新された場合、gitフローを使用して最新のコードを取得できます。
