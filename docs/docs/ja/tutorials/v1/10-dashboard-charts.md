# 第 9 章：タスクダッシュボードとチャート

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113821700067176&bvid=BV1XVcUeHEDR&cid=27851621217&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

いよいよ待ちに待ったビジュアライゼーションの章に入ります！この章では、膨大な情報の中から本当に必要な内容に素早くフォーカスする方法を探っていきます。管理者として、複雑なタスクの中で方向を見失わないようにしましょう！一緒にタスク統計と情報表示を楽に仕上げていきましょう。

### 9.1 重要な情報にフォーカスする

チームのタスク状況をひと目で把握し、自分が担当するタスクや気になるタスクを見つけたいですよね。煩雑な情報に振り回されるのではなく、的確にフォーカスしましょう。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200001054.gif)

まずは、チームタスク統計の[チャート](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block)の作成方法を見てみましょう。

#### 9.1.1 [チャートデータブロック](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block)の作成

新しいページ（例：パーソナルパネル）を作成します：

1. チャートデータブロックを新規作成します。（この大きなブロックの中に、複数のデータチャートを作成できます。）
2. チャートブロック内で、対象となるタスクテーブルを選択します。チャート設定に入りましょう。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200001737.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200002850.png)

#### 9.1.2 ステータス別統計の設定

異なるステータスのタスク数を集計するにはどうすればよいでしょうか？まずデータの処理から始めます：

- メジャー：一意のフィールド（例：ID フィールド）を選択してカウントします。
- ディメンション：ステータスでグループ化します。

次に、チャートの設定を行います：

1. [棒グラフ](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/column)または[横棒グラフ](https://docs-cn.nocobase.com/handbook/data-visualization/antd-charts/bar)を選択します。
2. X 軸にステータス、Y 軸に ID を選択します。カテゴリフィールド「ステータス」を忘れずに選択してください！（選択しないと、チャートの色が区別できず、見分けにくくなります。）

   ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200002203.gif)

#### 9.1.3 多次元統計：各担当者のタスク数

各担当者のステータスごとのタスク数を集計したい場合は、2 つのディメンションで統計を取りましょう！「担当者/ニックネーム」のディメンションを追加できます。

1. 左上の「クエリ実行」をクリックします。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200003904.png)

2. チャートが少し変に見えるかもしれませんが、心配いりません。「グループ」を選択すると、異なる担当者の比較が展開されます。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200003355.gif)

3. また、全体数量を積み上げて表示したい場合は、「スタック」を選択できます。これで、各担当者のタスク数の割合と全体のタスク状況が一目でわかります！

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200004277.gif)

### 9.2 データフィルターと動的表示

#### 9.2.1 データフィルターの設定

さらに「キャンセル済み」と「アーカイブ済み」のデータを除外することもできます。左側のフィルター条件からこの 2 つの選択肢を外すだけです。これらの条件設定にはもう慣れているはずです！

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200004306.png)

フィルターの設定が完了したら、「確定」をクリックして設定画面を閉じます。ページに最初のチャートが完成しました。

#### 9.2.2 [チャートのコピー](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block#%E5%8C%BA%E5%9D%97%E8%AE%BE%E7%BD%AE)

「グループ」と「スタック」の両方のチャートを同時に表示したいけど、再設定したくない場合はどうすればよいでしょうか？

- 最初のチャートブロックの右上角で「コピー」をクリックします。
- スクロールして下に移動すると、2 番目のチャートが表示されています。右側にドラッグして、「スタック」設定を外し、「グループ」に変更します。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200005923.png)

#### 9.2.3 動的[フィルター](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter)

異なる条件でタスクデータを動的に[フィルター](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter)することはできるでしょうか？

もちろんです！チャートデータブロックの下方で「フィルター」を開きます。上部にフィルターボックスが表示されるので、表示したいフィールドを展開し、フィルター条件を設定します。（例：日付フィールドを「範囲指定」に変更します。）

![202412200005784.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200005784.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200006733.gif)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200006599.gif)

#### 9.2.4 カスタムフィルターフィールドの作成

特別な場合に「キャンセル済み」や「アーカイブ済み」のデータも含めたい場合はどうすればよいでしょうか。さらに動的フィルターやフィルターのデフォルト条件設定もサポートしたい場合は？

[カスタムフィルターフィールド](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter#%E8%87%AA%E5%AE%9A%E4%B9%89%E5%AD%97%E6%AE%B5)を一緒に作成しましょう！

> カスタムフィルターフィールド：関連データテーブルのフィールドやカスタムフィールド（チャートでのみ使用可能）を選択できます。
>
> フィールドタイトル、説明、フィルター演算子の編集や、デフォルト値（現在のユーザーや日付など）の設定がサポートされており、実際のニーズに合わせたフィルターが可能です。

1. タイトルに「ステータス」と入力します。
2. ソースフィールドは空のままにします。
3. コンポーネントは「チェックボックス」を選択します。
4. オプションはデータベース作成時のステータス属性値に従って入力します（ここでの属性の順序は オプションラベル - オプション値 です）。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200007629.gif)

作成が完了したら、「デフォルト値の設定」をクリックし、必要なオプションを選択します。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200007565.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200008813.gif)

デフォルト値の設定後、チャート設定に戻り、フィルター条件を「ステータス - いずれかを含む - 現在のフィルター/ステータス」に変更し、確認します！（両方のチャートを変更してください。）

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200008453.png)

完了です。フィルターをテストしてみましょう。データが完璧に表示されています。

![202411162003151731758595.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200008517.png)

### 9.3 動的リンクとタスクフィルター

次に、非常に実用的な機能を実装します：統計数字をクリックすることで、対応するタスクのフィルターに直接ジャンプする機能です。まず、各ステータスの数量統計チャートを追加し、一番上に配置しましょう。

#### 9.3.1 「未着手」を例に、[統計チャート](https://docs-cn.nocobase.com/handbook/data-visualization/antd/statistic)を作成

1. メジャーを ID カウントに設定します。
2. フィルター条件を設定します：ステータスが「未着手」に等しい。
3. コンテナ名を「未着手」、タイプを「統計」に設定し、チャート名は空のままにします。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200009179.png)

「未着手」の統計が正常に表示されました。ステータスごとに 5 つコピーし、一番上にドラッグしましょう。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200009609.png)

#### 9.3.2 リンクフィルターの設定

1. タスク管理テーブルブロックのあるページに戻り、ブラウザ上部のリンク形式を確認します（通常 `http://xxxxxxxxx/admin/0z9e0um1vcn` のような形式です）。
   ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200011236.png)

   ここで `xxxxxxxxx` はウェブサイトのドメイン、`/admin/0z9e0um1vcn` はパスです。（最後の /admin を探せば大丈夫です。）
2. リンクの一部をコピーします。

   - リンクジャンプを行うために、まずリンクから特定の部分を抽出する必要があります。
   - `admin/` から始まります（`admin/` 自体は含めないでください）。リンクの末尾までコピーします。例えば、この例ではコピーする部分は `0z9e0um1vcn` です。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200015179.png)

マウスを「未着手」に移動すると、カーソルが指のマークに変わります。クリックすると、ジャンプに成功します。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200016385.gif)

3. チャートのリンクを設定します。
   次に、リンクにフィルターパラメータを追加しましょう。タスクステータスのデータベース識別子を覚えていますか？リンクの末尾にこのパラメータを追加することで、タスクのフィルターが可能になります。
   - リンクの末尾に `?task_status=Not started` を追加すると、リンクは `0z9e0um1vcn?task_status=Not started` のようになります。
     ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200021168.png)

> URL パラメータの形式を理解しましょう：
> リンクにパラメータを追加する際、いくつかの形式ルールがあります：
>
> - **クエスチョンマーク（?）**：パラメータの開始を示します。
> - **パラメータ名とパラメータ値**：`パラメータ名=パラメータ値` の形式です。
> - **複数のパラメータ**：複数のパラメータを追加する場合は、`&` 記号でつなげます。例：
>   `http://xxxxxxxxx/admin/hliu6s5tp9x?status=todo&user=123`
>   この例では、`user` が別のパラメータ名、`123` がその値です。

4. ページに戻り、クリックしてジャンプします。成功です。URL の末尾に期待したパラメータが追加されています。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200034337.png)

#### 9.3.3 [URL フィルター条件との関連付け](https://docs-cn.nocobase.com/handbook/ui/variables#url-%E6%9F%A5%E8%AF%A2%E5%8F%82%E6%95%B0)

テーブルがまだ連動して変わらないのはなぜでしょう？心配しないでください。最後のステップを一緒に完了させましょう！

- テーブルブロックの設定に戻り、「データ範囲の設定」をクリックします。
- 「ステータス」が「URL クエリパラメータ/status」に等しいを選択します。

「確認」をクリックすると、フィルターが成功します！

![2c588303ad88561cd072852ae0e93ab3.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200035431.png)
![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200035362.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200036841.png)

![202411162111151731762675.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200036320.png)

### 9.4 [データビジュアライゼーション](https://docs-cn.nocobase.com/handbook/data-visualization)：クールなチャート

> データビジュアライゼーション：[ECharts](https://docs-cn.nocobase.com/handbook/data-visualization-echarts)（商用プラグイン、有料）
> ECharts は、「[折れ線グラフ](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/line)（多次元）」、「[レーダーチャート](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/radar)」、「[ワードクラウド](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/wordcloud)」など、より多くのカスタマイズ可能な設定項目を提供します。

より多くのチャート設定を利用したい場合は、「データビジュアライゼーション：ECharts」ブロックを有効にしましょう！

#### 9.4.1 クールな[レーダーチャート](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/radar)を素早く設定する

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200037284.png)

データが重なって見にくい場合は、サイズや半径を調整して、すべての情報が明確に表示されるようにしましょう！

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200037077.png)

![202411162121201731763280.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200037464.png)

設定が完了したら、ドラッグして表示方法を調整して完了です！

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200038221.gif)

#### 9.4.2 その他のチャートコンテナ

ここにはまだまだ探索できるチャートがあります。

##### [ワードクラウド](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/wordcloud)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200038880.gif)

##### [ファネルチャート](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/funnel)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200039012.gif)

##### [複数指標（デュアルアクシス、ECharts 折れ線グラフ）](https://docs-cn.nocobase.com/handbook/data-visualization/antd-charts/dual-axes)

デュアルアクシスチャートでは、より多くの指標を追加できます。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200039494.gif)

##### [対比横棒グラフ](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/diverging-bar)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200039203.gif)

### 9.5 チャレンジ

この章を終える前に、小さなチャレンジを出題します：

1. 残りの**進行中、レビュー待ち、完了、キャンセル済み、アーカイブ済み**の URL パラメータもすべて追加し、正しくジャンプ・フィルターできるようにしましょう。
2. 「担当者」の複数選択フィールドを設定し、先ほど完成した「ステータス」の複数選択と同様に、デフォルト値を現在のユーザーのニックネームに設定しましょう。

[次の章](https://www.nocobase.com/cn/tutorials/project-tutorial-task-dashboard-part-2)では、ダッシュボードの続きを展開していきます。次回もお楽しみに！

---

引き続き探索し、創造力を存分に発揮してください！問題が発生した場合は、いつでも [NocoBase 公式ドキュメント](https://docs-cn.nocobase.com/) を参照するか、[NocoBase コミュニティ](https://forum.nocobase.com/) に参加してディスカッションできます。
