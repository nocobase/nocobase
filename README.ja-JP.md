[English](./README.md) | [简体中文](./README.zh-CN.md) | 日本語

https://github.com/user-attachments/assets/cf08bfe5-e6e6-453c-8b96-350a6a8bed17

<p align="center">
<a href="https://trendshift.io/repositories/4112" target="_blank"><img src="https://trendshift.io/api/badge/repositories/4112" alt="nocobase%2Fnocobase | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
<a href="https://www.producthunt.com/posts/nocobase?embed=true&utm_source=badge-top-post-topic-badge&utm_medium=badge&utm_souce=badge-nocobase" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/top-post-topic-badge.svg?post_id=456520&theme=light&period=weekly&topic_id=267" alt="NocoBase - Scalability&#0045;first&#0044;&#0032;open&#0045;source&#0032;no&#0045;code&#0032;platform | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>
</p>

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

チュートリアル：  
https://www.nocobase.com/ja/tutorials

顧客のストーリー：  
https://www.nocobase.com/ja/blog/tags/customer-stories

## クイックスタート

Gitpodを使用すると、すぐに使える開発環境を構築できます。

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/nocobase/nocobase)

## リリースノート

リリースノートは[ブログ](https://www.nocobase.com/ja/blog/timeline)で随時更新され、週ごとにまとめて公開しています。

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
