---
title: "Nginx による静的リソースプロキシ"
description: "NocoBase の静的リソースに対して Nginx をプロキシとして使い、本番環境での性能と安定性を高めます。"
keywords: "Nginx,静的リソースプロキシ,リバースプロキシ,本番デプロイ,NocoBase"
---

# Nginx

現在 NocoBase アプリケーション向けに本番用プロキシを設定したい場合は、まず [本番環境のリバースプロキシ](../../../quickstart/production/reverse-proxy/index.md) を読み、その後に [Nginx](../../../quickstart/production/reverse-proxy/nginx.md) のページへ進むのがおすすめです。

この古いセクションは、主に静的リソースプロキシの入口として使われていました。現在のドキュメントは `nb proxy nginx` を中心に再構成されており、設定生成、ローカルまたは Docker での実行、そして `uploads`、`dist`、`api`、`ws`、SPA の各ルートをまとめて扱います。
