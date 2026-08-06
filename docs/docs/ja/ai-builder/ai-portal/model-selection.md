---
title: "LLM の選択"
description: "データモデリング、ページ、権限、ワークフローを対象とする標準化された評価体系に基づき、主要なフラッグシップモデルを使用して NocoBase アプリケーションを構築したテスト結果と選択の指針を紹介します。"
keywords: "NocoBase AI Builder,LLM 選択,GPT,DeepSeek,Qwen,AI Agent,モデル評価"
---

# LLM の選択

:::tip 重要なポイント

**現在市場で提供されている主要なフラッグシップモデルは、いずれも NocoBase アプリケーションの中核部分を構築できます。**

モデルによって、初回出力の完成度、構築時間、問題数に違いがあります。利用可能なモデルサービス、地域のネットワーク状況、コスト、チームの好みに応じて選択してください。

:::

この評価では、標準化された CRM 要件一式（営業案件・顧客フォローアップシステム）を使用し、各モデルが構築したアプリケーションを検証しました。

| 評価ディメンション | 標準化された評価項目 |
| :---: | :---: |
| 14 | 61 |

## 評価ディメンション

この評価は、NocoBase の中核機能、設定機能、基盤コンポーネントを対象としています。また、各モデルが要件を理解し、対応する構築タスクを実行できるかどうかも確認します。

| 機能 | 評価の観点 |
| --- | --- |
| データモデリング | コレクション、フィールド型、リレーション、必須・一意制約、デフォルト値 |
| ページと機能 | ナビゲーション、一覧、フォーム、詳細、検索、フィルター、ダッシュボード |
| ビジネスロジック | ステータス遷移、業務バリデーション、計算ルール、関連データの整合性 |
| 権限とセキュリティ | ロール、メニュー権限、操作権限、データスコープ、フィールド権限 |
| ワークフロー自動化 | トリガー、ノード、条件分岐、通知、データへの副作用、失敗時のリトライ |
| ユーザー体験 | 情報アーキテクチャ、フォームの操作性、操作フィードバック、レスポンシブレイアウト |
| 堅牢性 | 不正な入力、重複送信、失敗時の整合性、データ量、ネットワーク復旧 |
| 要件カバレッジ | 明示された要件と中核となる業務フローがすべて実装されているか |
| 妥当な拡張 | モデルが自発的に追加した機能に明確な業務上の目的があるか |
| スコープ制御 | 重複、未使用、またはスコープ外の業務モジュールが含まれていないか |

## 評価結果

| 評価ディメンション | GPT-5.6 Sol | DeepSeek-V4-Flash | Qwen3.8-Max | GPT-5.6 Luna |
| --- | :---: | :---: | :---: | :---: |
| データモデリング | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#15803d;font-weight:600">✓ 合格</span> |
| 機能の完成度 | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#d97706;font-weight:600">◐ 一部合格</span> |
| ビジネスロジック | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#15803d;font-weight:600">✓ 合格</span> |
| 権限とセキュリティ | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#15803d;font-weight:600">✓ 合格</span> |
| ワークフロー自動化 | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#15803d;font-weight:600">✓ 合格</span> |
| ユーザー体験 | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#d97706;font-weight:600">◐ 一部合格</span> |
| 堅牢性 | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#15803d;font-weight:600">✓ 合格</span> |
| 要件カバレッジ | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#d97706;font-weight:600">◐ 一部合格</span> |
| 妥当な拡張 | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#15803d;font-weight:600">✓ 合格</span> |
| スコープ制御 | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#15803d;font-weight:600">✓ 合格</span> | <span style="color:#15803d;font-weight:600">✓ 合格</span> |
| **構築速度** | <span style="color:#2563eb;font-weight:700">比較的速い</span> | <span style="color:#2563eb;font-weight:700">比較的速い</span> | <span style="color:#d97706;font-weight:700">遅い</span> | <span style="color:#15803d;font-weight:700">最速</span> |
| **単回実行の品質スコア** | <span style="display:inline-block;min-width:42px;padding:2px 10px;border-radius:6px;color:#1d4ed8;background:#eff6ff;font-weight:800">90</span> | <span style="display:inline-block;min-width:42px;padding:2px 10px;border-radius:6px;color:#1d4ed8;background:#eff6ff;font-weight:800">91</span> | <span style="display:inline-block;min-width:42px;padding:2px 10px;border-radius:6px;color:#1d4ed8;background:#eff6ff;font-weight:800">90</span> | <span style="display:inline-block;min-width:42px;padding:2px 10px;border-radius:6px;color:#c2410c;background:#fff7ed;font-weight:800">77</span> |

:::tip 単回実行の品質スコア

単回実行の品質スコアは 100 点満点です。最初の完全な受け入れ検査で見つかったバグ 1 件につき 1 点を減点し、モデルによる初回構築の品質を示します。その後、フィードバックと修正を重ねることで、モデルはこれらの問題を解決できます。

:::

:::info 構築時間に関する注意

構築時間は、コンピューターのハードウェア性能、依存関係のインストールと Build コンパイル、モデルサービスの応答速度、ネットワーク状況などの影響を受けます。

:::

## 評価項目の詳細

61 個の標準化された評価項目は、構築結果の品質 46 項目、要件理解と妥当な拡張 7 項目、構築プロセスの効率 8 項目という 3 つのレイヤーで構成されています。すべての項目に一貫した検査方法と合格基準を適用します。

### レイヤー 1：構築結果の品質（46 項目）

<table style="table-layout: fixed; width: 100%;">
  <colgroup><col style="width: 32%;" /><col style="width: 68%;" /></colgroup>
  <thead><tr><th>評価ディメンション</th><th>標準化された評価項目</th></tr></thead>
  <tbody>
    <tr><td>データモデリング（8 項目）</td><td><code>DM-01</code> 必要なコレクションがすべて作成されているか<br /><code>DM-02</code> 必要なフィールドがすべて存在するか<br /><code>DM-03</code> フィールド型が正しいか<br /><code>DM-04</code> 1 対 1 のリレーションを作成して使用できるか<br /><code>DM-05</code> 1 対多のリレーションを作成して使用できるか<br /><code>DM-06</code> 多対多のリレーションを作成して使用できるか<br /><code>DM-07</code> 必須、一意、デフォルト値のルールが有効になるか<br /><code>DM-08</code> 関連データを表示してフィルタリングできるか</td></tr>
    <tr><td>機能の完成度（6 項目）</td><td><code>FC-01</code> 必要なページとナビゲーションエントリがすべて存在するか<br /><code>FC-02</code> レコードを作成、表示、編集、削除できるか<br /><code>FC-03</code> 中核となるユーザージャーニーを最初から最後まで完了できるか<br /><code>FC-04</code> 主要な業務操作を実行できるか<br /><code>FC-05</code> 検索、フィルタリング、並べ替えを利用できるか<br /><code>FC-06</code> ダッシュボードに必要な内容が含まれているか</td></tr>
    <tr><td>ビジネスロジック（6 項目）</td><td><code>BL-01</code> 営業案件のステータス遷移ルールが正しいか<br /><code>BL-02</code> 業務バリデーションルールが有効になるか<br /><code>BL-03</code> 計算フィールドと集計定義が正しいか<br /><code>BL-04</code> リード変換後にデータが正しくマッピングされるか<br /><code>BL-05</code> 関連レコードの更新時に整合性が維持されるか<br /><code>BL-06</code> 削除とアーカイブのルールが正しいか</td></tr>
    <tr><td>権限とセキュリティ（7 項目）</td><td><code>ACL-01</code> 必要なロールがすべて作成されているか<br /><code>ACL-02</code> テストユーザーとロールの割り当てが正しいか<br /><code>ACL-03</code> ページとメニューへのアクセス権限が正しいか<br /><code>ACL-04</code> データ操作権限が正しいか<br /><code>ACL-05</code> レコードレベルのデータスコープが正しいか<br /><code>ACL-06</code> フィールドレベルの表示・編集権限が正しいか<br /><code>ACL-07</code> ロールの変更とロールの組み合わせが正しく機能するか</td></tr>
    <tr><td>ワークフロー自動化（7 項目）</td><td><code>WF-01</code> 必要なワークフローがすべて作成され、有効化されているか<br /><code>WF-02</code> ワークフローのトリガーが正しく設計されているか<br /><code>WF-03</code> ノードの順序とデータ転送が正しいか<br /><code>WF-04</code> 条件と分岐結果が正しいか<br /><code>WF-05</code> レコードの読み書きによる副作用が正しいか<br /><code>WF-06</code> 通知の受信者と内容が正しいか<br /><code>WF-07</code> 失敗ログとリトライ動作を追跡できるか</td></tr>
    <tr><td>ユーザー体験（7 項目）</td><td><code>UX-01</code> ナビゲーションと情報アーキテクチャが明確か<br /><code>UX-02</code> 一覧の情報とよく使う操作が使いやすいか<br /><code>UX-03</code> フォームのグループ分け、順序、ガイダンスが明確か<br /><code>UX-04</code> 詳細ページが内容の把握と後続の操作に対応しているか<br /><code>UX-05</code> 操作フィードバックとステータス変化が明確か<br /><code>UX-06</code> 異なる画面幅でもアプリケーションを使用できるか<br /><code>UX-07</code> 空、読み込み中、エラーの各状態が適切に用意されているか</td></tr>
    <tr><td>堅牢性（5 項目）</td><td><code>ROB-01</code> 不正な入力と境界値入力が安全に処理されるか<br /><code>ROB-02</code> 重複送信によって副作用が重複して発生しないか<br /><code>ROB-03</code> 実行に失敗した場合もデータの整合性が維持されるか<br /><code>ROB-04</code> データが空の場合や大量の場合でもアプリケーションを使用できるか<br /><code>ROB-05</code> セッションまたはネットワークの中断後にアプリケーションを復旧できるか</td></tr>
  </tbody>
</table>

### レイヤー 2：要件理解と妥当な拡張（7 項目）

<table style="table-layout: fixed; width: 100%;">
  <colgroup><col style="width: 32%;" /><col style="width: 68%;" /></colgroup>
  <thead><tr><th>評価ディメンション</th><th>標準化された評価項目</th></tr></thead>
  <tbody>
    <tr><td>要件カバレッジ（3 項目）</td><td><code>COV-01</code> プロンプトで要求されたすべてのページと操作が実装されているか<br /><code>COV-02</code> プロンプトで要求されたすべてのデータ、権限、ワークフローが実装されているか<br /><code>COV-03</code> メインプロセスに必要で、プロンプトでは個別に指定されていない機能が備わっているか</td></tr>
    <tr><td>妥当な拡張（2 項目）</td><td><code>EXT-01</code> 自発的に追加されたフィールド、リレーション、ルールが必要なものか<br /><code>EXT-02</code> 自発的に追加されたページ、操作、集計に明確な目的があるか</td></tr>
    <tr><td>スコープ制御（2 項目）</td><td><code>SCOPE-01</code> 重複または未使用の機能や設定が生成されていないか<br /><code>SCOPE-02</code> タスクのスコープと無関係な業務モジュールが追加されていないか</td></tr>
  </tbody>
</table>

### レイヤー 3：構築プロセスの効率（8 項目）

<table style="table-layout: fixed; width: 100%;">
  <colgroup><col style="width: 32%;" /><col style="width: 68%;" /></colgroup>
  <thead><tr><th>評価ディメンション</th><th>標準化された評価項目</th></tr></thead>
  <tbody>
    <tr><td>初回利用可能までの時間（1 項目）</td><td><code>EFF-FIRST-01</code> 最初に利用可能な結果へ到達するまでに必要な時間</td></tr>
    <tr><td>収束効率（3 項目）</td><td><code>EFF-FINAL-01</code> 最終受け入れまでに必要な反復回数<br /><code>EFF-FINAL-02</code> 最終状態へ到達するまでに必要な合計時間<br /><code>EFF-FINAL-03</code> 最終状態へ到達するまでに消費したトークン数</td></tr>
    <tr><td>人による介入（1 項目）</td><td><code>EFF-HUMAN-01</code> 評価中に人が介入した回数</td></tr>
    <tr><td>再現性（3 項目）</td><td><code>EFF-STABLE-01</code> 同じタスクを繰り返し実行したとき、一貫した受け入れ結果が得られるか<br /><code>EFF-STABLE-02</code> 3 回の実行を通じてコレクション、リレーション、ロール、ワークフローが一貫しているか<br /><code>EFF-STABLE-03</code> 反復回数と所要時間のばらつきが制御された範囲に収まっているか</td></tr>
  </tbody>
</table>

## 次のステップ

- [AI Agent と共同で構築する](./agent-workflow.md) — ページとインタラクションを自然言語で記述し、AI Agent と継続的に改善する
- [AI Portal クイックスタート](./index.md) — 最初の AI Portal を作成して実行する
- [データモデリング](../data-modeling.md) — 自然言語でコレクション、フィールド、リレーションを作成する
- [ワークフロー管理](../workflow.md) — ワークフローを作成、編集、有効化、診断する
- [権限設定](../acl.md) — ロール、権限ポリシー、ユーザー割り当て、リスク評価を管理する
