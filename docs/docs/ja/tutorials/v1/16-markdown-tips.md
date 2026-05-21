# Markdown ブロックのテクニック

Markdown ブロックは、最もよく使われる強力なブロックの一つです。軽量なテキスト表示からシンプルな HTML スタイル、さらにはビジネスロジックの処理まで、多様で柔軟な機能を備えています。

## 一、Markdown ブロックの基本機能

Markdown ブロックは柔軟で、公開可能で、いつでも変更できるという特徴があるため、システムのお知らせ表示によく使われます。ビジネスモジュール、機能、ブロック、フィールドのいずれにも、付箋のようにちょっとしたヒントを貼り付けることができます。

Markdown ブロックを使用する前に、Markdown のレイアウトと構文に慣れておくことをおすすめします。[Vditor サンプル](https://docs.nocobase.com/api/field/markdown-vditor)を参考にしてください。

> 注意：ページ内の Markdown ブロックは比較的軽量なため、一部の機能（数式やマインドマップなど）はまだレンダリングに対応していません。ただし、HTML を使って実現できます。システムには Vditor のフィールドコンポーネントも用意されていますので、ぜひ試してみてください。

### 1.1 ページの例

システムの「オンラインデモ」ページで Markdown の使用例を確認できます。トップページ、注文ページ、「その他の例」をご覧ください。

たとえばトップページの警告やヒント：
![20250227085425](https://static-docs.nocobase.com/20250227085425.png)

注文モジュールの計算ロジック：
![20250227085536](https://static-docs.nocobase.com/20250227085536.png)

その他の例にあるガイドと画像：
![20250227085730](https://static-docs.nocobase.com/20250227085730.png)

編集モードに切り替えることで、Markdown の内容をいつでも変更し、ページの変化を確認できます。
![20250227085855](https://static-docs.nocobase.com/20250227085855.png)

### 1.2 Markdown ブロックの作成

ページ、ポップアップ、フォームの中で、柔軟に Markdown ブロックを作成できます。

#### 作成方法

- **ポップアップ / ページ内で作成：**

  ![ポップアップ / ページ内の Markdown ブロック](https://static-docs.nocobase.com/20250227091156.png)
- **フォームブロック内で作成：**

  ![フォーム内の Markdown ブロック](https://static-docs.nocobase.com/20250227091309.png)

#### 使用例

Markdown 構文で `---` を入力すると、グループ区切り線をシミュレートでき、シンプルなコンテンツ分割効果を実現できます：

![区切り線の例1](https://static-docs.nocobase.com/20250227092156.png)
![区切り線の例2](https://static-docs.nocobase.com/20250227092236.png)

---

## 二、パーソナライズされたコンテンツ表示

Markdown ブロックのもう一つの大きな利点は、システム変数の埋め込みに対応していることです。パーソナライズされたタイトルやヒント情報を生成でき、各ユーザーがそれぞれのフォームで固有の情報を見られるようになります。

![パーソナライズ表示1](https://static-docs.nocobase.com/20250227092400.png)
![パーソナライズ表示2](https://static-docs.nocobase.com/20250227092430.png)

さらに、フォームデータと組み合わせてシンプルなコンテンツレイアウトも可能です：

**タイトル強調の例：**

```markdown
# #{{$nRecord.id}} {{$nPopupRecord.task_name}}

---
```

![タイトル強調の効果](https://static-docs.nocobase.com/20250227164055.png)

**中央寄せ区切りの例：**

![中央寄せフィールドの効果](https://static-docs.nocobase.com/20250227164456.png)

## 三、リッチコンテンツの挿入

Markdown 構文と変数に慣れてきたら、Markdown ブロックにさらにリッチなコンテンツ——たとえば HTML を挿入することもできます。

### 3.1 HTML の例

HTML 構文に触れたことがなくても、DeepSeek に代わりに書いてもらうことができます（`script` タグには対応していないため、すべてのスタイルはローカルの `div` 内に記述することをおすすめします）。

以下は華やかなお知らせの例です：

```html
<div style="font-family: 'Arial', sans-serif; background-color: #e9f5ff; margin: 20px; padding: 20px; border: 2px solid #007bff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
    <h1 style="color: #007bff; text-align: center; font-size: 2em; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);">Join Us for a Fun Getaway!</h1>
    <p style="font-size: 1.2em; line-height: 1.6; color: #333;">Hi Everyone,</p>
    <p style="font-size: 1.2em; line-height: 1.6;">We're excited to invite you to an awesome group outing filled with laughter, adventure, and great vibes!</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Mark your calendars for <span style="color: red; font-weight: bold; font-size: 1.5em;">November 10, 2025</span>, and get ready to explore, relax, and enjoy some quality time together.</p>
    <p style="font-size: 1.2em; line-height: 1.6;">We'll share more details about the itinerary and meeting spot soon—stay tuned!</p>
    <p style="font-size: 1.2em; line-height: 1.6; font-style: italic;">Can't wait to see you there!</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Cheers,</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Your Event Team</p>
</div>

```

![20250227092832](https://static-docs.nocobase.com/20250227092832.png)

![20250227093003](https://static-docs.nocobase.com/20250227093003.png)

### 3.2 アニメーション効果の例

CSS を組み合わせて、スライドショーのような表示・非表示のアニメーション効果を実現することもできます（以下のコードを Markdown に貼り付けて試してみてください）：

```html
<div style="background-color: #f8e1e1; border: 2px solid #d14; border-radius: 10px; padding: 20px; text-align: center; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); animation: fadeInOut 3s infinite;">
    <h2 style="color: #d14; font-family: 'Arial', sans-serif;">🎉 Special Announcement 🎉</h2>
    <p style="color: #333; font-size: 18px; font-family: 'Georgia', serif;">Thank you for your support and attention! We will hold a special event next Monday, stay tuned!</p>
    <button style="background-color: #d14; color: white; border: none; border-radius: 5px; padding: 10px 20px; cursor: pointer;">Click to Learn More</button>
</div>

<style>
@keyframes fadeInOut {
    0%, 100% { opacity: 0; transform: translateY(-20px); }
    10%, 90% { opacity: 1; transform: translateY(0); }
}
</style>

```

![](https://static-docs.nocobase.com/202502270933fade-out.gif)
