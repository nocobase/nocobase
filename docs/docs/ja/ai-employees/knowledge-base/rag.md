---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "RAG 検索拡張生成"
description: "AI 従業員で RAG を有効にし、Knowledge Base、Retrieval strategy、Top K、Score を設定して、ユーザーロールに基づく知識ベースのアクセス権限を管理します。"
keywords: "RAG,検索拡張生成,知識ベース検索,Retrieval strategy,知識ベース権限,Top K,NocoBase"
---

# RAG 検索

## はじめに

NocoBase の **RAG（検索拡張生成）** を使用すると、AI 従業員は質問に回答する前に、知識ベースから関連する内容を取得できます。

AI 従業員が実際に利用できる知識ベースは、AI 従業員の `Knowledge Base` 設定と、現在のユーザーが所属するロールの知識ベース権限の両方で決まります。両方の範囲に含まれる知識ベースだけが検索対象になります。

## AI 従業員の知識ベースを設定する

`AI employees` 設定ページを開き、RAG を有効にする AI 従業員を選択して `Edit` をクリックします。編集ドロワーで `Knowledge Base` タブを開き、`Enable` をオンにします。

![](https://static-docs.nocobase.com/ai-employee-knowledge-base-settings-202608171620.png)

各設定項目の内容は次のとおりです。

- `Knowledge Base` — 任意項目です。空のままにすると、現在のユーザーのロールがアクセスできる、有効なすべての知識ベースから検索します。知識ベースを選択した場合は、選択済みかつアクセス権限のある知識ベースだけを検索します
- `Retrieval strategy` — 知識ベースを検索するタイミングを設定します：
  - `Retrieve on demand` — 現在の質問に知識ベースの内容が必要だと AI 従業員が判断した場合だけ検索します。新しい AI 従業員ではこの方式がデフォルトであり、通常はこちらを推奨します
  - `Automatically retrieve for every question` — ユーザーの各質問を AI 従業員に送信する前に検索します。すべての対話で知識ベースの内容が必要な場合に使用します
- `Knowledge Base Prompt` — 取得した内容を AI 従業員に渡す方法を設定します。`{knowledgeBaseData}` は固定のプレースホルダーなので、削除または変更しないでください
- `Top K` — 1 回の検索で返す知識ベース結果の最大数です。1～100 の範囲で設定でき、デフォルトは 3 です
- `Score` — 検索結果に必要な最小類似度です。0～1 の範囲で設定でき、デフォルトは 0.6 です。値を高くすると結果の関連性は高くなりますが、返される件数が少なくなる場合があります

設定が完了したら、`Submit` をクリックして保存します。

## 知識ベースの権限を設定する

AI 従業員で知識ベースを選択しても、すべてのユーザーにアクセス権限が付与されるわけではありません。`Users & Permissions / Roles & Permissions` を開いてユーザーが所属するロールを選択し、`Permissions / Knowledge bases` を開きます。

ロールにアクセスを許可する知識ベースの `Available` を選択します。今後作成される知識ベースへのアクセスも自動的に許可する場合は、`New knowledge bases are allowed by default` を選択します。

![](https://static-docs.nocobase.com/knowledge-base-role-permissions-202608171620.png)

:::warning 注意

AI 従業員が検索できる知識ベースの範囲は、`Knowledge Base` 設定と現在のユーザーのロール権限の共通部分です。権限のない知識ベースは自動的に除外されます。

:::

## 知識ベースへのアクセス権限がない場合

AI 従業員で知識ベースが有効でも、設定された範囲と現在のユーザーのロール権限に共通する知識ベースがない場合、AI 従業員はまず知識ベースに依存しない情報で回答します。その後、知識ベースへのアクセス権限がないため知識ベースの内容を使用していないことと、必要な場合は管理者に権限を申請するよう促す目立つ通知を回答の末尾に表示します。

![](https://static-docs.nocobase.com/ai-employee-no-knowledge-base-access-side-panel-202608171653.png)

アクセス可能な知識ベースが 1 つ以上あり、現在の質問に関連する内容が見つからなかっただけの場合は、権限がないことを示す通知は表示されません。

## 関連リンク

- [知識ベース](./knowledge-base/index.md) — RAG 検索で使用する知識ベースの作成と管理
- [ロールと権限](../../users-permissions/acl/permissions.md) — ロールのシステム、メニュー、データアクセス権限の設定
