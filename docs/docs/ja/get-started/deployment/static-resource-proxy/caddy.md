---
title: "Caddy による静的リソースプロキシ"
description: "NocoBase の静的リソースに対して Caddy をプロキシとして使い、HTTPS と本番向け入口設定を簡単にします。"
keywords: "Caddy,静的リソースプロキシ,リバースプロキシ,自動 HTTPS,本番環境,NocoBase"
---

# Caddy

現在 NocoBase アプリケーション向けに本番用プロキシを設定したい場合は、まず [本番環境のリバースプロキシ](../../../quickstart/production/reverse-proxy/index.md) を読み、その後に [Caddy](../../../quickstart/production/reverse-proxy/caddy.md) のページへ進むのがおすすめです。

この古いセクションは、主に静的リソースプロキシの入口として使われていました。現在のドキュメントは `nb proxy caddy` を中心に再構成されており、設定生成、ローカルまたは Docker での実行、HTTPS の入口、そして `uploads`、`dist`、`api`、`ws`、SPA の各ルートをまとめて扱います。
