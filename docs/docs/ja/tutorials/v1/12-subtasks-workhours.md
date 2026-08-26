# 第 11 章：サブタスクと工数計算

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114042521847248&bvid=BV13jPcedEic&cid=28510064142&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

いよいよ新しい章を迎えました！ビジネスの拡大に伴い、タスクはますます増え、複雑になっています。シンプルなタスク管理だけでは不十分だと気づく頃でしょう。タスクをより細かく管理し、複数の階層に分解することで、より効率的にタスクを完了できるようにしていきましょう！

### 11.1 タスクの計画：全体から詳細へ

複雑なタスクを管理可能な小さなタスクに分解し、進捗追跡によってタスクの完了状況を明確に把握します。多階層管理により、複数レベルのサブタスクの整理をサポートします。それでは、計画を始めましょう！

---

### 11.2 サブタスクテーブルの新規作成

#### 11.2.1 サブタスク構造の設計

まず、「サブタスクテーブル」（Sub Tasks [**ツリーテーブル**](https://docs-cn.nocobase.com/handbook/collection-tree)）を作成し、ツリー構造に設計します。サブタスクの属性はメインタスクと似ており、「タスク名」「ステータス」「担当者」「進捗」などがあります。必要に応じて、コメントやドキュメントなどの関連コンテンツも追加できます。

サブタスクとメインタスクの関連付けを実現するため、多対一のリレーションを作成し、各サブタスクが 1 つのメインタスクに所属するようにします。同時に逆リレーションも設定し、メインタスクからサブタスクの内容を直接確認・管理できるようにします。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210038668.png)

> ヒント：メインタスクページの関連ブロックで作成すると、操作がより便利です！

#### 11.2.2 タスク管理画面でのサブタスク表示

タスク管理画面で、「タスクテーブル」の表示方法を[**ページ**モード](https://docs-cn.nocobase.com/handbook/ui/pop-up#%E9%A1%B5%E9%9D%A2)に設定します。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210038281.png)

ページ内に新しい「サブタスク管理」タブを作成し、先ほど作成したサブタスクテーブルを追加して、ツリー構造で表示します。これにより、同じページ内でサブタスクを管理・閲覧できます。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039360.png)

---

### 11.3 工数比較チャート：全体の工数と進捗の見積もり（オプション）

次に、タスクの工数詳細と工数比較チャートを作成し、全体の工数とタスクの進捗を見積もりましょう。

#### 11.3.1 サブタスクの時間・工数情報の追加

サブタスクテーブルに以下のフィールドを追加します：

- **開始日**
- **終了日**
- **総工数**
- **残り工数**

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039376.png)

これらのフィールドにより、タスクの所要日数と工数を動的に計算できます。

#### 11.3.2 タスク所要日数の計算

サブタスクテーブルに「日数」[数式フィールド](https://docs-cn.nocobase.com/handbook/field-formula)を新規作成し、タスクの所要日数を計算します。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039534.png)

数式の計算方法は以下の 3 種類です：

- Math.js

  > [math.js](https://mathjs.org/) ライブラリを使用し、複雑な数値計算が可能です。
  >
- Formula.js

  > [Formula.js](https://formulajs.info/functions/) ライブラリを使用し、一般的な数式を計算します。Excel の数式に慣れていれば、簡単に使えるはずです！
  >
- 文字列テンプレート

  > 文字通り、文字列を結合する手段です。動的な説明や番号などが必要な場合に使用できます。
  >

ここでは `Formula.js` ライブラリを使用します。Excel の数式に似ており、一般的な数式を簡単に計算できます。

日数フィールドの数式は以下の通りです：

```html
DAYS(終了日,開始日)
```

エラーを避けるため、必ず英語の小文字を使用してください。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039721.png)

完了したら、ページで試してみましょう。日数が開始日と終了日に応じて動的に変化しています！

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040540.png)

---

### 11.4 日次工数報告：実際の進捗追跡（オプション）

#### 11.4.1 日次工数報告テーブルの新規作成

日次の工数報告テーブルを作成し、毎日のタスク完了状況を記録します。以下のフィールドを追加します：

- **当日工数**（hours 整数推奨）
- **日付**
- **理想工数**（ideal_hours 整数推奨）
- **所属サブタスク**：サブタスクとの[多対一](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2o)リレーション。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040220.png)

#### 11.4.2 サブタスクページでの日次工数表示

サブタスクの編集ページに戻り、日次工数テーブルを[サブテーブル](https://docs-cn.nocobase.com/handbook/ui/fields/specific/sub-table)形式で表示し、他のいくつかのフィールドをドラッグしてレイアウトします。これにより、サブタスクページ内で日次工数データを簡単に入力・閲覧できます。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040223.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040658.png)

---

### 11.5 重要な計算と連動ルール（オプション）

タスクの進捗と残り工数をより正確に見積もるため、いくつかの重要な設定を行います。

#### 11.5.1 サブタスクフィールドの[必須項目](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/required)設定

**開始日**、**終了日**、**見積もり工数**を[必須項目](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/required)に設定し、後続の計算に必要なデータを確保します。

#### 11.5.2 完了率と残り工数の[連動ルール](https://docs-cn.nocobase.com/handbook/ui/actions/action-settings/linkage-rule)設定

サブタスクテーブルに以下の計算ルールを追加します：

- **完了率**：日次工数の合計 / 見積もり工数

```html
SUM(【現在のフォーム / 日次工数 / 当日工数】)  /  【現在のフォーム / 見積もり工数】
```

- **残り工数**：見積もり工数 - 日次工数の合計

```html
【現在のフォーム / 見積もり工数】 - SUM(【現在のフォーム / 日次工数 / 当日工数】)
```

![202411170353551731786835.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041551.png)

- 同様に、日次工数の連動ルールで理想工数も設定します。

```html
  【現在のフォーム / 見積もり工数】 / 【現在のフォーム / タスク所要日数】
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041181.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041066.png)

これで、タスクの完了進捗と残り工数をリアルタイムで計算できるようになりました。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041018.png)

### 11.6 タスク進捗チャートの作成（オプション）

#### 11.6.1 タスク進捗[チャート](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block)の作成

チャートブロックを新規作成し、**日次工数の合計**と**理想工数の合計**の変化を統計し、日付のディメンションでタスクの進捗を表示します。

【関連タスク/ID】が【現在のポップアップレコード/ID】と等しいように制限し、進捗チャートが現在のタスクの実際の状況を反映するようにします。

![202411170417341731788254.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210042680.png)

![202411170418231731788303.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210042027.png)

#### 11.6.2 基本情報と進捗変化の表示

最後に、[Markdown ブロック](https://docs-cn.nocobase.com/handbook/ui/blocks/other-blocks/markdown)を覚えていますか。`markdown` ブロックを使用してタスクの基本情報と進捗変化を表示します。

[`Handlebars.js`](https://docs-cn.nocobase.com/handbook/template-handlebars) テンプレートで進捗のパーセンテージをレンダリングします：

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210043291.png)

```html
Progress of Last Update:
<p style="font-size: 54px; font-weight: bold; color: green;">
{{floor (multiply $nRecord.complete_percent 100)}}
 %
</p>
```

動的レンダリングの構文には [Handlebars.js](https://docs-cn.nocobase.com/handbook/template-handlebars) を選択します。構文の詳細は公式ドキュメントを参照して学習できます。

---

### 11.7 まとめ

おめでとうございます！サブタスクの分解が完了しました。多階層管理、日次工数報告、チャート表示を通じて、タスクの完了進捗をより明確に把握でき、チームの効率的な業務をサポートします。お読みいただきありがとうございました。引き続き頑張りましょう。[次の章](https://www.nocobase.com/cn/tutorials/project-tutorial-meeting-room-booking)の精彩な内容にご期待ください！

---

引き続き探索し、創造力を存分に発揮してください！問題が発生した場合は、いつでも [NocoBase 公式ドキュメント](https://docs-cn.nocobase.com/) を参照するか、[NocoBase コミュニティ](https://forum.nocobase.com/) に参加してディスカッションできます。
