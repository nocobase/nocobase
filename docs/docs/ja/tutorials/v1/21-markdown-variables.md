# Markdown テンプレート変数の使い方

皆さん、本チュートリアルへようこそ！このセクションでは、Markdown と Handlebars テンプレートエンジンを使って動的コンテンツを表示する方法をステップバイステップで学びます。前回の「Markdown ブロックの活用法」では基本構文、作成方法、変数の埋め込みについて学びました。ここではテンプレート変数のより高度な使い方を掘り下げていきます。

## 1 テンプレートエンジン [Handlebars](https://docs-cn.nocobase.com/handbook/template-handlebars) の紹介

Markdown ブロックを作成した後、右上の設定に「テンプレートエンジン」というオプションが表示されます。デフォルトでは Handlebars が設定されています。Handlebars を使えば、条件に基づいてページコンテンツを動的に切り替えることができ、Markdown にも動的な対応力を持たせることができます。

![テンプレートエンジンのイメージ](https://static-docs.nocobase.com/20250304011925.png)

### 1.1 Handlebars の役割

Markdown は本来、静的コンテンツの表示のみをサポートしていますが、Handlebars を使えば、条件（ステータス、数値、選択肢など）に応じて表示するテキストやスタイルを動的に切り替えることができます。これにより、変化の多いビジネスシーンでも、ページは常に正しい情報を表示し続けることができます。

## 2 実践的な活用シーン

ここからは、いくつかの実用的なシーンを見ながら、機能をステップバイステップで実装していきましょう。

### 2.1 注文ステータスの処理

オンライン Demo では、注文ステータスに応じて異なるヒント情報を表示する必要がよくあります。注文データテーブルにステータスフィールドがあり、ステータスが以下のようになっているとします：

![注文ステータスフィールド](https://static-docs.nocobase.com/20250304091420.png)

以下は 4 つのステータスに対応する表示内容です：


| オプションラベル | オプション値 | 表示内容                                                             |
| ---------------- | ------------ | -------------------------------------------------------------------- |
| Pending Approval | 1            | 注文が提出されました。内部審査を待っています。                       |
| Pending Payment  | 2            | 顧客の支払いを待っています。注文ステータスに注意してください。       |
| Paid             | 3            | 支払いが確認されました。後続の処理を行ってください。担当コンサルタントが 1 時間以内に顧客へ連絡します。 |
| Rejected         | 4            | 注文の承認が通りませんでした。必要に応じて再確認のうえ、再申請してください。 |

ページでは注文ステータスの値をキャプチャし、それに応じて異なる情報を動的に表示できます。ここでは if、else、else if の構文を使ってこの機能を実現する方法を詳しく説明します。

#### 2.1.1 if 構文

if 条件を使うと、条件に合致するコンテンツを表示できます。例：

```
{{#if 条件}}
  <p>表示結果</p>
{{/if}}
```

ここでの「条件」は Handlebars の構文（eq、gt、lt など）を使用する必要があります。簡単な例を試してみましょう：

```
{{#if (eq 1 1)}}
  <p>表示結果: 1 = 1</p>
{{/if}}
```

効果は以下の図を参照してください：

![if の例 1](https://static-docs.nocobase.com/20250305115416.png)
![if の例 2](https://static-docs.nocobase.com/20250305115434.png)

#### 2.1.2 else 構文

条件が満たされない場合、else で代替コンテンツを指定できます。例：

```
{{#if (eq 1 2)}}
  <p>表示結果: 1 = 2</p>
{{else}}
  <p>表示結果：1 ≠ 2</p>
{{/if}}
```

効果は以下の通りです：

![else の例](https://static-docs.nocobase.com/20250305115524.png)

#### 2.1.3 複数条件の判定

複数の条件で判定する場合は、else if を使用します。サンプルコード：

```
{{#if (eq 1 7)}}
  <p>表示結果: 1 = 7</p>
{{else if (eq 1 5)}}
  <p>表示結果: 1 = 5</p>
{{else if (eq 1 4)}}
  <p>表示結果: 1 = 4</p>
{{else}}
  <p>表示結果: 1 ≠ 7 ≠ 5 ≠ 3</p>
{{/if}}
```

対応する効果のイメージ：

![複数条件判定の例](https://static-docs.nocobase.com/20250305115719.png)

### 2.2 表示効果

注文ステータスの設定が完了すると、ページはステータスに応じて動的に表示を切り替えます。以下の図をご覧ください：

![注文ステータスの動的表示効果](https://static-docs.nocobase.com/202503040942-handlebar1.gif)

ページ内のコードは以下の通りです：

```
{{#if order.status}}
  <div>
    {{#if (eq order.status "1")}}
      <span style="color: orange;">⏳ Pending Approval</span>
      <p>注文が提出されました。内部審査を待っています。</p>
    {{else if (eq order.status "2")}}
      <span style="color: #1890ff;">💳 Pending Payment</span>
      <p>顧客の支払いを待っています。注文ステータスに注意してください。</p>
    {{else if (eq order.status "3")}}
      <span style="color: #52c41a;">✔ Paid</span>
      <p>支払いが確認されました。後続の処理を行ってください。担当コンサルタントが 1 時間以内に顧客へ連絡します。</p>
    {{else if (eq order.status "4")}}
      <span style="color: #f5222d;">✖ Rejected</span>
      <p>注文の承認が通りませんでした。必要に応じて再確認のうえ、再申請してください。</p>
    {{/if}}
  </div>
{{else}}
  <p class="empty-state">現在、処理待ちの注文はありません。</p>
{{/if}}
```

注文ステータスを切り替えて、ページのコンテンツが更新されるかどうか確認し、コードが正しく動作しているか検証してみてください。

### 2.3 注文明細の表示

注文ステータスの表示に加えて、注文明細（商品詳細リストなど）の表示もよくあるニーズです。ここでは each 構文を使ってこの機能を実装します。

#### 2.3.1 each 構文の基本紹介

each はリストをループ処理するために使用します。例えば、配列 [1,2,3] に対して以下のように書けます：

```
{{#each リスト}}
  <p>表示結果：{{this}}</p>
  <p>インデックス：{{@index}}</p>
{{/each}}
```

ループ内で、{{this}} は現在の要素を、{{@index}} は現在のインデックスを表します。

#### 2.3.2 商品明細の例

注文内のすべての商品情報を表示する場合、以下のコードを使用できます：

```
{{#each $nRecord.order_items}}
    <p>{{@index}}</p>
    <p>{{this.id}}</p>
    <p>{{this.price}}</p>
    <p>{{this.quantity}}</p>
    <p>{{this.product.name}}</p>
---
{{/each}}
```

ページにデータが表示されない場合は、注文明細フィールドが正しく表示設定されているか確認してください。設定されていないと、システムはこのデータを冗長と判断してクエリを実行しません。
![20250305122543_handlebar_each](https://static-docs.nocobase.com/20250305122543_handlebar_each.gif)

商品オブジェクトの名前（product.name）が表示されない場合も、同じ理由で、商品オブジェクト自体を表示設定に追加する必要があります。
![20250305122543_each2](https://static-docs.nocobase.com/20250305122543_each2.gif)

表示設定を追加した後、連動ルールでこの関連フィールドを非表示に設定します。
![20250305122543_hidden_each](https://static-docs.nocobase.com/20250305122543_hidden_each.gif)

### 2.4 最終成果物：注文商品リスト

上記のステップが完了すると、完全な注文商品リスト表示テンプレートが実現できます。以下のコードを参考にしてください：

```
### 注文商品リスト

{{#if $nRecord.order_items}}
  <div class="cart-summary">合計: {{$nRecord.order_items.length}} 点の商品、合計金額: ¥{{$nRecord.total}}</div>
  
  <table>
    <thead>
      <tr>
        <th>番号</th>
        <th>商品名</th>
        <th>単価</th>
        <th>数量</th>
        <th>小計</th>
      </tr>
    </thead>
    <tbody>
      {{#each $nRecord.order_items}}
        <tr style="{{#if this.out_of_stock}}color: red;{{/if}}">
          <td>{{@index}}</td>
          <td>{{this.product.name}}</td>
          <td>¥{{this.price}}</td>
          <td>{{this.quantity}}</td>
          <td>¥{{multiply this.price this.quantity}}</td>
          <td>
            {{#if this.out_of_stock}}
              <span>在庫切れ</span>
            {{else if this.low_stock}}
              <span style="color:orange;">在庫わずか</span>
            {{/if}}
          </td>
        </tr>
      {{/each}}
    </tbody>
  </table>
{{else}}
  <p>注文は空です</p>
{{/if}}
```

実行すると、以下のような効果が表示されます：

![注文商品リストの表示効果](https://static-docs.nocobase.com/20250305124125.png)

Handlebars の柔軟性をより分かりやすく示すために、注文詳細に「在庫切れ」（out_of_stock）と「在庫わずか」（low_stock）フィールドを追加しました：

- out_of_stock が true の場合、「在庫切れ」が表示され、商品行が赤色になります。
- low_stock が true の場合、右側に「在庫わずか」の表示がオレンジ色で表示されます。

![追加効果：在庫切れと在庫わずか](https://static-docs.nocobase.com/20250305130258.png)

## 3 まとめとアドバイス

以上の解説を通じて、Handlebars を使った Markdown テンプレートの動的レンダリング方法（if/else 条件、each ループなどのコア構文を含む）を学びました。実際の開発では、より複雑なロジックに対しては、連動ルール、計算フィールド、ワークフロー、または script ノードを組み合わせて柔軟性と拡張性を高めることをお勧めします。

練習を通じてこれらのテクニックをマスターし、プロジェクトで柔軟に活用していただければ幸いです。引き続き頑張って、さらなる可能性を探求していきましょう！

---

操作中に問題が発生した場合は、[NocoBase コミュニティ](https://forum.nocobase.com)で質問するか、[公式ドキュメント](https://docs-cn.nocobase.com)をご参照ください。このガイドが実際のニーズに応じた実装のお役に立てれば幸いです。スムーズな操作とプロジェクトの成功をお祈りしています！
