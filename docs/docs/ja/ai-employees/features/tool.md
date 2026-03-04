:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/ai-employees/features/tool)をご参照ください。
:::

# スキルの使用

スキル（Tools）は、AI従業員が「何ができるか」を定義します。

## スキルの構成

スキルページは以下の3つのセクションに分かれています：

1. `General skills`：すべてのAI従業員で共有される、読み取り専用のスキルです。
2. `Employee-specific skills`：現在の従業員専用のスキルで、通常は読み取り専用です。
3. `Custom skills`：カスタムスキルです。追加・削除が可能で、デフォルトの権限を設定できます。

![skills-three-sections-general-specific-custom.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/skills-three-sections-general-specific-custom.png)

## スキルの権限

スキルの権限は以下のように統一されています：

- `Ask`：実行前に確認を求めます。
- `Allow`：直接の実行を許可します。

推奨事項：データの変更を伴うスキルについては、デフォルトで `Ask` を使用することをお勧めします。

![skills-permission-ask-allow-segmented.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/skills-permission-ask-allow-segmented.png)

## 追加とメンテナンス

`Custom skills` セクションで `Add skill` をクリックしてスキルを追加し、ビジネスリスクに応じて権限を設定します。