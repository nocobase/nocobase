---
pkg: '@nocobase/plugin-ai'
title: 'AI Chat box ブロック'
description: 'NocoBase 管理者とページ作成者向けの AI Chat box ブロック操作ガイドです。ブロックの追加、会話機能、Work context、会話履歴、Actions の設定方法を説明します。'
keywords: 'AI Chat box,AI 従業員,ページブロック,Work context,Scope,Actions,NocoBase'
---

# AI Chat box ブロック

NocoBase の **AI Chat box** は、ページに直接追加できる AI 会話ブロックです。業務ページに配置して、そのページ専用の AI アシスタント入口として利用できます。

各 AI Chat box ブロックは、現在の会話と入力状態を個別に保持します。ページ作成者は、利用できる AI 従業員、モデル、ファイルアップロード、Web 検索、作業コンテキストを制限し、業務シーンに合わせて設定できます。

:::tip 使用前の準備

最初に [LLM サービスを設定](../features/llm-service.md)し、[少なくとも 1 人の AI 従業員を有効化](../features/enable-ai-employee.md)してください。

:::

## AI Chat box ブロックを追加する

1. 設定するページを開きます。
2. 右上の `UI Editor` をクリックして、ページ編集モードに入ります。
3. `Add block` をクリックします。
4. `Other blocks` から `AI chat box` を選択します。

![Add block メニューで AI chat box を選択](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/add-ai-chat-box-block-3.png)

## ブロックの構成

![AI Chat box ブロック](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/ai-chat-box-overview-2.png)

AI Chat box は上から順に 3 つの領域で構成されます。

- **上部操作領域** — 会話一覧、Actions、カスタムアクション、新しい会話ボタン。メッセージ領域を非表示にするとメッセージボタンも表示されます
- **メッセージ領域** — 現在の下書きまたは会話内のメッセージを表示します
- **送信領域** — 入力欄、コンテキスト選択、ファイルアップロード、Web 検索、AI 従業員選択、モデル選択、送信ボタン、免責事項を表示します

### ブロック body に表示コンテンツを追加する

ページ編集モードで AI Chat box 内の `Add block` をクリックすると、チャット領域の上に次のブロックを追加できます。

- JS block
- Iframe
- Markdown

これらのブロックは、説明、外部ページ、補助情報の表示に適しています。AI Chat box 内の追加メニューではこの 3 種類のみ利用でき、AI Chat box をさらにネストすることはできません。

## AI Chat box を設定する

ブロックにポインターを合わせて、ブロック設定メニューを開きます。`Edit chat box` をクリックすると、会話範囲、デフォルトメッセージ、Work context、AI 従業員、モデルを設定できます。

![Edit chat box 設定ダイアログ](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/edit-chat-box-settings-2.png)

### Edit chat box の設定

| 設定項目 | 説明 |
| --- | --- |
| `Scope` | 会話一覧を共有する AI Chat box を制御します。新しいブロックでは、会話を分離するためにデフォルトで自身のブロック UID が使用されます。 |
| `Background` | AI 従業員の定義の後にシステムプロンプトを追加し、現在のページの役割、目的、回答要件を補足します。 |
| `Default user message` | 新しい会話を開始したときに、送信欄へデフォルトのユーザーメッセージを入力します。 |
| `Work context` | 新しい下書きにデフォルトで追加するページブロックを選択します。 |
| `AI employees` | このブロックで選択できる業務用 AI 従業員を制限します。空欄の場合は、利用可能なすべての業務用 AI 従業員を使用できます。 |
| `Models` | このブロックで選択できるモデルを制限します。空欄の場合は、利用可能なすべてのモデルを使用できます。 |

### その他のブロック設定

| 設定項目 | 説明 |
| --- | --- |
| `Show messages` | メッセージ領域をブロック内に直接表示するかどうかを設定します。無効にすると、上部のメッセージボタンから右側パネルを開きます。 |
| `Sender placeholder` | 送信欄に表示するプレースホルダーを変更します。 |
| `Enable add context` | 送信欄のコンテキスト選択入口を表示または非表示にします。 |
| `Enable upload files` | ファイルアップロード入口を表示または非表示にします。無効にすると、ファイルを貼り付けてもアップロードされません。 |
| `Enable web search` | Web 検索スイッチを表示または非表示にします。無効にすると、現在の下書きの Web 検索もオフになります。 |
| `Enable employee select` | AI 従業員セレクターを表示または非表示にします。 |
| `Enable model select` | モデルセレクターを表示または非表示にします。 |
| `Show disclaimer` | 送信欄の下にある AI 免責事項を表示または非表示にします。 |

## Work context を設定する

`Edit chat box` の `Work context` でコンテキスト追加ボタンをクリックし、`Pick block` を選択してから、AI に提供するページブロックを選びます。保存すると、選択したブロックが新しい会話のデフォルト作業コンテキストになり、送信前に送信領域から削除することもできます。

## メッセージ領域を非表示にして右側パネルを使用する

`Show messages` を無効にすると、ブロック本体には送信領域だけが残ります。上部に表示されるメッセージボタンをクリックすると、右側からメッセージパネルが開きます。

![メッセージ領域を非表示にした右側メッセージパネル](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/messages-side-panel-2.png)

パネルを開くと、ブロックの残りの領域にオーバーレイが表示されます。オーバーレイまたはメッセージボタンをもう一度クリックすると、パネルを閉じられます。

このレイアウトは、AI Chat box をページ上の軽量な入力入口として使用する場合に適しています。通常は送信欄だけを表示し、メッセージを確認するときにパネルを開きます。

## 会話履歴を管理する

ブロック左上の会話一覧ボタンをクリックすると、現在の Scope に属する会話履歴を確認できます。

次のルールがあります。

- 同じ Scope を使用する複数の AI Chat box は、同じ会話一覧を表示できます
- 各ブロックの現在の会話、送信欄の下書き、AI 従業員、モデル、添付ファイル、コンテキスト状態は個別に保持されます
- グローバルフローティング chatbox はブロックの Scope でフィルタリングしないため、Scope を持つ会話も表示します
- Scope を空にすると、会話一覧は Scope でフィルタリングされず、Scope がない会話と別の Scope を使用する会話の両方を表示します

通常は、新しいブロックに自動生成された Scope をそのまま使用すれば、ページアシスタントごとの会話履歴を分離できます。複数のブロックで同じ会話一覧を共有する場合のみ、同じ Scope を設定してください。

## Actions を追加する

ページ編集モードで、ブロック上部の `Actions` をクリックすると、次の操作を追加できます。

- JS Action
- AI employee

AI employee を追加した後、その従業員のショートカットタスクを設定できます。

ショートカットタスクの `Chat box uid` では、タスクを実行する AI Chat box を指定できます。AI Chat box 内に直接追加した AI employee は、デフォルトで現在のブロック UID を参照します。

指定した AI Chat box がマウントされていない場合、NocoBase は対象ブロックが見つからないことを通知し、グローバルフローティング chatbox にはフォールバックしません。詳しい設定は [AI 従業員のショートカットタスク](../features/task.md)を参照してください。

## ページ専用アシスタントを設定する

次の手順で、ページ専用の軽量 AI アシスタントを作成できます。

1. AI Chat box ブロックを追加し、ページ内の適切な位置へ移動します。
2. `Edit chat box` でページ専用の Background を入力します。
3. 1 つ以上の Work context を選択します。
4. `AI employees` と `Models` で利用できる従業員とモデルを制限します。
5. 編集モードを終了し、質問を入力して送信します。

## 注意事項

- AI Chat box ブロックと右下のグローバルフローティング chatbox は別の入口です。現在の会話と入力状態は自動的に同期されません
- AI Chat box 内の `Add block` では、JS block、Iframe、Markdown のみ追加できます
- Scope を変更すると会話一覧の検索範囲が変わりますが、別のブロックで開いている会話や下書きはコピーされません
