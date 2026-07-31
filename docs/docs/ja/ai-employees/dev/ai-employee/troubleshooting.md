---
title: "AI 従業員プラグイン開発のよくある問題"
description: "NocoBase AI従業員のTool、Skill、組み込み従業員、およびフロントエンドToolカードが登録されていない、または実行されない問題のトラブルシューティング。"
keywords: "NocoBase, AI従業員 FAQ, Tool未登録, Skill未ロード, フロントエンドカード"
---

# AI 従業員プラグイン開発のよくある問題

## Tool が登録されない

以下の順序で確認してください：

- ファイルがプラグインのビルド範囲内の `src/ai/**/tools/` に配置されているか
- `.ts` または `.js` ファイルを使用しているか
- `export default defineTools(...)` が記述されているか
- Toolファイルが誤って `.d.ts` と命名されていないか
- 同名のToolが存在し、後から登録された項目が無視されていないか
- プラグインが再ビルドされ、ロードされているか

## Skill が表示されない

まずファイル名を確認してください。現在は以下である必要があります：

```text
SKILLS.md
```

また、frontmatterに安定した `name` と `description` が含まれており、ファイルが `src/ai/**/skills/<skill-name>/SKILLS.md` に配置されていることを確認してください。

## Skill はロードされるが、Tool を呼び出せない

以下の項目を確認してください：

- Skillの `tools` リストにTool名が含まれているか
- Toolが現在のSkillの `tools/` ディレクトリに配置されているか
- Toolのファイル名、`definition.name`、およびSkillでの参照が一致しているか
- `scope` が現在のバインド方法に適しているか
- 名前の重複によりToolが登録されていないか

Toolをバインドすることは、モデルがそれを使用できることを意味するだけです。ToolがSkillに表示されているにもかかわらずモデルが呼び出さない場合は、`SKILLS.md` のワークフロー内で、呼び出しのタイミング、パラメータの要件、および結果を待機するステップを明確に記述する必要があります。

## フロントエンドカードが表示されない

フロントエンドの登録名は、サーバー側の最終的なTool名と完全に一致している必要があります：

```ts
this.ai.toolsManager.registerTools('developerChoice', options);
```

また、以下を確認してください：

- カスタムプラグインで `src/client-v2/` ランタイムを使用しているか
- カードがクライアントプラグインの `load()` 内で登録されているか
- ToolCallがカード対応の状態に移行しているか
- `invokeStatus` の判定によってカードが無効になっていないか
- クライアントプラグインが再ビルドされ、ロードされているか

## カードをクリックしても Tool の実行が再開されない

`approve()`、`edit()`、`reject()` のいずれかが呼び出されているか確認してください。ユーザーの選択をパラメータに書き戻す必要がある場合は、以下を使用します：

```ts
await decisions.edit({
  ...toolCall.args,
  option: selectedOption,
});
```

同時に、サーバー側のスキーマでこのフィールドが許可されており、`invoke()` で読み取られることを確認してください。

## `definition.name` を変更しても反映されない

自動ロードされるTool名は、ファイル名またはディレクトリ名によって決定されます。例えば：

```text
src/ai/tools/developerChoice.ts
```

最終的な名称は `developerChoice` となります。名前を変更したい場合は、ファイル名、Skillでの参照、AI従業員の設定、およびフロントエンドの登録名を同期して変更する必要があります。

## 関連リンク

- [AI従業員プラグイン開発](./index.md) — 開発ガイドの概要に戻る
- [サーバー側Toolの定義](./define-tool.md) — Toolの命名と登録方法を確認する
- [Skillの定義](./define-skill.md) — SkillとToolのバインドを確認する
- [Tool にフロントエンドインタラクションを追加する](./frontend-tool-ui.md) — ToolCallとフロントエンドの登録を確認する
