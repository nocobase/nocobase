# 第 10 章：ダッシュボードフィルターと条件

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114031331442969&bvid=BV1pnAreHEME&cid=28477164740&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

本章では、タスクダッシュボードの続きをステップバイステップで完成させていきます。疑問があればいつでもフォーラムでご質問ください。

前章の復習から始めて、一緒にこの探索の旅を進めましょう！

### 10.1 前章の答え合わせ

#### 10.1.1 ステータスとリンク

まず、異なるステータスのデータにリンクジャンプを追加し、素早いナビゲーションを可能にします。各ステータスのリンク構造は以下の通りです：

（リンクが `http://xxxxxxx/admin/hliu6s5tp9xhliu6s5tp9x` だと仮定します）

##### チャレンジの答え


| ステータス<br/> | リンク<br/>                                          |
| --------------- | ---------------------------------------------------- |
| 未着手<br/>     | hliu6s5tp9xhliu6s5tp9x?task_status=Not started</br>  |
| 進行中<br/>     | hliu6s5tp9xhliu6s5tp9x?task_status=In progress</br>  |
| レビュー待ち<br/> | hliu6s5tp9xhliu6s5tp9x?task_status=To be review</br> |
| 完了<br/>       | hliu6s5tp9xhliu6s5tp9x?task_status=Completed</br>    |
| キャンセル済み<br/> | hliu6s5tp9xhliu6s5tp9x?task_status=Cancelled</br>    |
| アーカイブ済み<br/> | hliu6s5tp9xhliu6s5tp9x?task_status=Archived</br>     |

#### 10.1.2 担当者の複数選択機能の追加

1. **[カスタムフィールド](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter#%E8%87%AA%E5%AE%9A%E4%B9%89%E5%AD%97%E6%AE%B5)の新規作成**：「担当者」フィールドを作成します。タイプは複数選択とし、メンバーのニックネーム（またはユーザー名）を入力して、タスク割り当て時に対応する人員を素早く選択できるようにします。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192339318.png)

2. **レポート設定で**：「担当者/ニックネームが現在のフィルター/担当者を含む」をフィルター条件として設定します。これで、現在の担当者に関連するタスクを素早く検索できます。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192339382.png)

何回かフィルターをテストして、機能が正常に動作していることを確認しましょう。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192359351.png)

---

### 10.2 ダッシュボードとユーザーの関連付け

異なるユーザーに応じて異なるコンテンツを表示できます。操作方法は以下の通りです：

1. **「担当者」フィールドのデフォルト値を「現在のユーザー/ニックネーム」に設定**：これにより、システムが自動的に現在のユーザーに関連するタスクを表示し、操作効率が向上します。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192340770.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192341604.png)

2. **ページを更新した後**：ダッシュボードが自動的に現在のログインユーザーに関連するデータを読み込みます。（必要なチャートにユーザーフィルター条件を追加することを忘れないでください。）

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192341915.png)

---

### 10.3 タスクフィルターの再構築

テーブルブロックの「データ範囲の設定」でジャンプした後、タスクが対応するステータスの範囲に事前に制限されてしまい、他のステータスでフィルターしようとするとデータが空になるという不合理な設計に気づいた方もいるかもしれません。

どうすればよいでしょうか？データフィルターを外して、別のフィルター方式に変更しましょう！

1. **データフィルター方式の除去**：ステータスデータが現在の範囲にロックされるのを避け、フィルターのニーズを柔軟に調整できるようにします。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192342837.png)

2. **フォームフィルターブロックのデフォルト値を設定します。**

[フィルターブロック](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/form)を覚えていますか？

タスクテーブルのフィルター用にフォームブロックを新規作成し、**ステータス**と必要なその他のフィールドを設定します。URL から渡される変数を反映させるために使用します。（フィルター対象のタスクテーブルブロックとの接続を忘れないでください。）

- ステータスフィールドのデフォルト値を `URL search params/task_status` に設定します。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192342708.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192343402.png)

3. **新しいフィルター機能のテスト**：いつでもステータスフィルター条件を変更し、自由に切り替えることができます。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192343943.gif)

- **オプション**：各ユーザーが自分のタスクに集中できるようにしたい場合は、「担当者」フィールドのデフォルト値を「現在のユーザー」に設定することもできます。

---

### 10.4 ニュース、通知、情報フォーカス

ドキュメントベースを改修して、必要な情報をダッシュボードに表示しましょう。

長期的なドキュメント管理を行っていると、資料やドキュメントが増えてきて、さまざまなニーズが出てきます：

- News：プロジェクトの動向、成果、マイルストーンにフォーカス
- 臨時の告知・リマインダー

#### 10.4.1 ホット情報（News）

1. **「ホット情報」フィールドの追加**：ドキュメントテーブルに「ホット情報」チェックボックスフィールドを追加し、そのドキュメントが重要なニュースかどうかをマークします。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192343408.png)

2. **ドキュメント情報の追加と選択**：任意の記事を選択し、編集フォームに「ホット情報」フィールドを追加してチェックを入れます。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192344181.png)

3. **「リスト」ブロックの新規作成**：ダッシュボードに戻り、[「リスト」ブロック](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/list) > ドキュメントテーブルを選択して新規作成します。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192344092.png)

右側にドラッグし、「作成日時」と「タイトル」を表示して、フィールド幅を調整し、「タイトルを表示」をオフにします。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192344920.png)

4. **ホット情報の表示**：

リアルタイム性を出すために、同時に時間も表示しましょう。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192345763.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192345055.png)

作成日時の降順で並べ替え、最新のホットニュースを表示します。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192345348.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192346268.png)

シンプルなホット情報が完成しました。メンバーはいつでもプロジェクト全体の重要な進捗を確認できます！

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192346930.png)

#### 10.4.2 告知通知

次に、シンプルな公開通知機能です。オンライン Demo でその姿を何度も目にしたことがあるかと思います。このような一時的な通知は、長期表示したくなく、プロジェクトの進捗を記録する必要もありません。一時的な事項のリマインダーや通知のためだけに使用します。

1. **[Markdown ブロック](https://docs-cn.nocobase.com/handbook/ui/blocks/other-blocks/markdown)の新規作成**：ダッシュボードの任意のエリアを選択し、Markdown 構文で告知内容を追加します。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192346846.png)

Markdown の実際の使い方については、公式 Demo、公式ドキュメント、または[「軽量ドキュメント」チュートリアル](https://www.nocobase.com/cn/tutorials)を参考にしてください。

簡単なサンプルとして、HTML で書いた「華やかな告知」を使って [Markdown ブロック](https://docs-cn.nocobase.com/handbook/ui/blocks/other-blocks/markdown)の強力な機能をデモします。

- サンプルコード：

```html
<div style="font-family: 'Arial', sans-serif; background-color: #e9f5ff; margin: 10px; padding: 10px; border: 2px solid #007bff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
    <h1 style="color: #007bff; text-align: center; font-size: 2em; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);">重要なお知らせ</h1>
    <p style="font-size: 1.2em; line-height: 1.6; color: #333;">皆さまへ：</p>
    <p style="font-size: 1.2em; line-height: 1.6;">業務効率向上のため、<span style="color: red; font-weight: bold; font-size: 1.5em;">11月10日</span>に全体研修を実施します。</p>
    <p style="font-size: 1.2em; line-height: 1.6; font-style: italic;">ご協力のほどよろしくお願いいたします！</p>
    <p style="font-size: 1.2em; line-height: 1.6;">よろしくお願いいたします、</p>
    <p style="font-size: 1.2em; line-height: 1.6;">管理チーム</p>
</div>
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192347259.png)

### 10.5 まとめ

以上の設定手順により、パーソナライズされたダッシュボードを作成し、チームメンバーがより効率的にタスクを管理し、プロジェクトの進捗を把握し、告知や通知をタイムリーに受け取れるようになりました。

ステータスフィルター、担当者設定からホット情報の表示まで、ユーザー体験の最適化とシステムの利便性・柔軟性の向上を目指しました。

これで、パーソナライズされたダッシュボードの準備が整いました。ぜひ実際に操作して体験し、実際のニーズに合わせて深く改修していきましょう。[次の章](https://www.nocobase.com/cn/tutorials/project-tutorial-subtasks-and-work-hours-calculation)に進みましょう！

---

引き続き探索し、創造力を存分に発揮してください！問題が発生した場合は、いつでも [NocoBase 公式ドキュメント](https://docs-cn.nocobase.com/) を参照するか、[NocoBase コミュニティ](https://forum.nocobase.com/) に参加してディスカッションできます。
