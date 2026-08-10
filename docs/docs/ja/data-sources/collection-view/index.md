---
pkg: "@nocobase/plugin-data-source-main"
title: "データベースビュー"
description: "データベースに既に存在するビューをデータソースとして接続し、NocoBase でフィールドと表示を設定します。複雑なクエリ結果の可視化管理に適しています。"
keywords: "データベースビュー,Collection View,ビュー"
---
# データベースビューを接続する

## 概要

データベース内のビューを接続します。たとえば、DBA が管理する財務レポートビュー、フィルタリング済みの顧客ビュー、複数システム間で同期された集約ビューなどです。データベースに既に定義されているクエリロジックを再利用する場合に適しています。

:::tip ヒント

メインデータベースの接続アカウントが所有する範囲内の通常のビューに対応しています。マテリアライズドビューには対応していません。アカウントに他の所有者のビューを参照する権限がある場合でも、それらのビューは接続可能な一覧には表示されません。接続する前に、ビューのフィールドに安定した列名が設定されていること、およびフィールドタイプが NocoBase で認識可能であることを確認してください。

:::

## データベースビューを接続する

1. システム機能のデータソースメニューをクリックして、データソースのホームページにアクセスします。
2. データソース一覧から **Main** データソースを選択し、「Configure」操作をクリックしてメインデータベースにアクセスします。
3. メインデータベースの管理画面で「Create collection」をクリックし、「Connect to database view」を選択します。

![configure_main_datasource](https://static-docs.nocobase.com/configure_main_datasource.png)
![connect_view](https://static-docs.nocobase.com/connect_view.png)
![connect_view_configure](https://static-docs.nocobase.com/connect_view_configure.png)

| 設定 | 説明 |
| --- | --- |
| Collection display name | データベースビューを画面上に表示する名称です。たとえば「財務レポートビュー」「顧客統計ビュー」などです。ビューの用途が分かる名称を使用することをおすすめします。 |
| Collection name | NocoBase におけるデータベースビューの識別名です。API、リレーションフィールド、権限、ワークフローなどで内部参照する際に使用します。自動生成されますが、手動で変更することもできます。使用できるのは英字、数字、アンダースコアのみで、先頭は英字である必要があります。 |
| Database view | 接続するデータベースビューを選択します。ビューからフィールド構造とクエリ結果を読み取ります。編集時には現在接続されている view を確認できますが、別の view に切り替えることはできません。 |
| Categories | データテーブルのカテゴリです。データテーブル管理画面での整理方法にのみ影響し、データベースビュー自体は変更しません。 |
| Description | データテーブルの説明です。この view を誰が管理しているか、どのデータをクエリしているか、どのページやレポートで使用するかを明記することをおすすめします。 |
| Use simple pagination mode | シンプルページネーションモードです。有効にすると、テーブルブロックのページネーション時に総レコード数の集計をスキップします。データ量の多いビューに適しており、クエリ負荷を軽減できます。 |
| Record unique key | レコードの一意識別子です。データベースビューには通常、主キーがないため、レコードを一意に特定できるフィールドを選択する必要があります。選択しない場合、ブロック内でレコードを正しく表示または編集できないことがあります。 |
| Source collections | データベースビューのフィールドのソースです。ビューのフィールドと既存のデータテーブルのフィールドを関連付け、NocoBase がフィールドタイプとインターフェースタイプを認識できるようにします。 |
| Fields | フィールドマッピングの設定です。ビュー内の各フィールドの名称、タイトル、データタイプ、インターフェースタイプを確認するために使用します。 |
| Preview | データベースビューの結果をプレビューします。送信前に、フィールドマッピングと表示結果が想定どおりか確認できます。 |
| Allow add new, update and delete actions | データベースビューに対する追加、更新、削除操作を許可するかどうかを設定します。有効にすると、NocoBase はページ上に対応する操作入口を表示します。ただし、書き込みが成功するかどうかは、データベースの view 自体が書き込み可能かどうか、およびデータベースアカウントに insert、update、delete 権限があるかどうかによって決まります。 |

:::tip ヒント

`Source collections` は、データベースビューから推測されたソースデータテーブルです。view 内のフィールドが主にどの既存データテーブルに由来するかを特定し、フィールドマッピング時に選択可能な `Field source` を限定します。

推測結果は設定を迅速に行うための補助情報です。view にフィールド名の変更、計算、集計、複雑な join が含まれる場合、結果が完全に正確でない、または推測できないことがあります。その場合は `Fields` で手動確認してください。

:::

### フィールドマッピング

フィールドマッピングは、データベースビューを接続した後に必ず確認する必要がある設定です。view を接続すると、NocoBase はまず各ビューフィールドのソースとデータベースタイプを推測します。ソースフィールドまで推測できる場合は、既存フィールドの Field type、Field interface、Field display name が自動的に引き継がれます。推測できない場合は、データベースフィールドのタイプに基づいて初期 Field type が設定されるため、フィールドタイプとインターフェース設定を手動で確認する必要があります。
[フィールド設定の詳細](../data-modeling/collection-fields/index.md)

![connect_view_configure_field_source](https://static-docs.nocobase.com/connect_view_configure_field_source.png)
![connect_view_configure_field_interface](https://static-docs.nocobase.com/connect_view_configure_field_interface.png)

| 設定 | 説明 |
| --- | --- |
| Field source | ビューフィールドがどの既存データテーブルのどのフィールドに由来するかを選択します。ソースを選択すると、NocoBase は元のフィールドの Field type と Field interface を再利用できます。 |
| Field type | ビューフィールドの明確なソースがない場合に、フィールドのデータタイプを手動で確認します。 |
| Field interface | ページ上でフィールドをどのように表示・入力するかを確認します。たとえば、単行テキスト、数値、日付、ドロップダウン項目などです。 |
| Field display name | 画面上に表示するフィールド名です。業務担当者が理解しやすい名称を使用することをおすすめします。 |

たとえば、ビューが `customer_name` を返し、それが顧客テーブルの「顧客名」フィールドに由来する場合、顧客テーブルの対応するフィールドにマッピングできます。これにより、NocoBase は元のフィールドのタイトル、タイプ、インターフェース設定を引き継げます。

ビューフィールドが集計または計算結果に由来する場合、たとえば `count(*) as total`、`sum(amount) as amount_total` などは、通常、Field type と適切な Field interface を手動で選択する必要があります。

:::tip ヒント

`Field source` は、NocoBase がデータベースビューから推測した情報で、あるビューフィールドがどの既存フィールドに対応する可能性があるかを示します。フィールドに `Field source` が設定されている場合、NocoBase はソースフィールドの Field type と Field interface を優先的に再利用します。

ソースフィールドを推測できない場合、または推測結果が業務上の意味と一致しない場合は、`Field source` を削除し、`Field type` と `Field interface`、`Field display name` を手動で選択してください。

:::

### レコードの一意識別子

データベースビューには Record unique key を設定する必要があります。設定しない場合、ページ上でブロックを作成できず、レコードを正しく表示または編集できません。1つのフィールド、または複数のフィールドの組み合わせを一意識別子として選択できます。Record unique key に適したフィールドは、通常、次の条件を満たします。

- フィールド値が一意である
- フィールド値が安定しており、並べ替え、ページネーション、集計基準の変更によって変化しない
- フィールドが空でない
- view で常に返される

view が単一テーブルのクエリに由来する場合は、元テーブルの主キーを優先的に返すことをおすすめします。view が複数テーブルの join や集計に由来する場合は、データベースビュー内に安定した業務 ID を保持するか、データベース側で安定した一意フィールドを生成してください。

### 追加・更新・削除操作を許可する

データベース view が書き込みに対応している場合は、「Allow add new, update and delete actions」を有効にできます。NocoBase はページ上で、このビューに対する追加、更新、削除操作を許可します。

データベースビューはクエリ結果として使用するのに適しており、デフォルトでは読み取り専用のデータテーブルとして扱われます。データベース view が対応する書き込み操作をサポートし、かつデータベース権限でも書き込みが許可されていることを確認できた場合にのみ、有効にすることをおすすめします。

### ビュー結果をプレビューする

送信前に Preview を使用して、ビューのクエリ結果を確認してください。プレビューでは、次の点を重点的に確認します。

- view を正常にクエリできるか
- フィールドが揃っているか
- フィールドタイプとインターフェースタイプが業務上の意味に合っているか
- Record unique key が存在し、データが一意であるか
- 対応していないフィールドタイプをデータベース側で調整する必要があるか

![connect_view_configure_preview](https://static-docs.nocobase.com/connect_view_configure_preview.png)

## フィールドを設定する

データベースビューの作成後、データテーブル一覧でビュー右側の「Configure fields」をクリックすると、フィールド設定ページに移動できます。フィールド設定では、ビューに含まれるフィールド、画面上での表示方法、およびデータベース view のフィールドを NocoBase の Field type と Field interface にマッピングする方法を管理します。

データベースビューの通常のフィールドはデータベース view に由来します。NocoBase は view に実際の列を直接追加、変更、削除しません。フィールド設定ページでは、NocoBase 内の業務上の関連付けを補足するために、多対一リレーションフィールドのみ追加できます。データベースビューをリレーションフィールドの対象データテーブルとして使用することはできません。また、タイトルフィールドは通常設定する必要がありません。

[フィールド設定の詳細](../data-modeling/collection-fields/index.md)

![configure_view](https://static-docs.nocobase.com/configure_view.png)

### リレーションフィールドを追加する

データベースビューに追加できるのは多対一リレーションフィールドのみです。多対一リレーションフィールドでは、view 内の既存フィールドを対象データテーブルの主キーまたは一意フィールドにマッピングし、ページ上で関連レコードを表示できます。ただし、データベース view に実際のフィールドや外部キー制約が作成されることはありません。

「Add field」をクリックすると、多対一リレーションフィールドを追加できます。

[フィールド設定の詳細](../data-modeling/collection-fields/index.md)

![add_view_field](https://static-docs.nocobase.com/add_view_field.png)
![add_view_field_configure](https://static-docs.nocobase.com/add_view_field_configure.png)

| 設定 | 説明 |
| --- | --- |
| Field display name | 多対一リレーションフィールドを画面上に表示する名称です。たとえば「所属顧客」「関連注文」など、業務担当者が理解しやすい名称を使用することをおすすめします。 |
| Field name | NocoBase に保存される多対一リレーションフィールドの識別名です。API、権限、ワークフローなどで内部参照する際に使用します。 |
| Source collection | ソースデータテーブル、つまり現在のデータベースビューのデータテーブルです。`Foreign key` をどのデータテーブルのフィールドから選択するかを決定します。データベースビューに多対一リレーションフィールドを追加する場合は、通常、現在の view のままにします。 |
| Target collection | 関連付ける対象データテーブルです。通常は、通常のデータテーブルや外部データベーステーブルなどの実データテーブルを選択します。データベースビューは選択できません。 |
| Foreign key | 現在のデータベースビューで対象レコードの識別子を保存するために使用するフィールドです。このフィールドは view のクエリ結果で安定して返される必要があります。 |
| Target key | 対象データテーブルで `Foreign key` と照合されるフィールドです。通常は主キーまたは一意フィールドを選択します。 |
| Description | フィールドの説明です。リレーションの意味、データソース、メンテナンス方法、注意事項などを記載するのに適しています。 |

### フィールドマッピング

データベースビューを接続すると、NocoBase は view フィールドとソースフィールドに基づいて Field type を推測し、デフォルトの Field interface を割り当てます。フィールドのソース、表示方法、または業務上の意味が想定と異なる場合は、フィールド設定でマッピングを調整できます。

[フィールド設定の詳細](../data-modeling/collection-fields/index.md)

![edit_view_field_configure](https://static-docs.nocobase.com/edit_view_field_configure.png)

:::tip ヒント

- Field interface（インターフェースタイプ / UI タイプ）：フロントエンドでのフィールドの表示方法と操作方法を決定します。たとえば「単行テキスト」「数値」「ドロップダウンメニュー」「日時」などで、ユーザー視点でのフィールド分類です
- Field type（データタイプ）：NocoBase がフィールドのデータタイプをどのように認識するかを決定します。ソースフィールドのない view フィールドは通常、データベースフィールドのタイプから推測されます。たとえば `string`、`integer`、`decimal`、`boolean`、`datetime` などです

:::

:::warning 注意

Field source、Field type、または Field interface を変更しても、データベース view のフィールドタイプが変更されるわけではありません。主にページ上の表示方法、バリデーションルール、および NocoBase によるフィールドの認識方法に影響します。

:::

### データベースから同期する

データベース側で view のフィールド構造を変更した場合は、「Configure fields」に移動し、「Sync from database」をクリックしてフィールド構造を再読み込みできます。同期後、NocoBase はフィールドを更新します。view に追加された新しいフィールドを追加し、view から削除されたフィールドを削除し、フィールドタイプとフィールドソースを再確認します。

![edit_view_sync_from_database](https://static-docs.nocobase.com/edit_view_sync_from_database.png)
![edit_view_sync_from_database_configure](https://static-docs.nocobase.com/edit_view_sync_from_database_configure.png)

:::warning 注意

同期時、フィールド名の変更は通常、「古いフィールドの削除 + 新しいフィールドの追加」として処理されます。同期前に、古いフィールドがページ、権限、ワークフロー、外部 API で使用されていないか確認し、同期後に設定が無効になるのを避けてください。同期後は、Field type と Field interface も再確認する必要があります。

:::

### フィールドを編集する

フィールド右側の「Edit」をクリックすると、フィールド設定を編集できます。フィールドの編集は、表示名、説明、バリデーションルール、フィールド固有の設定など、NocoBase におけるフィールドの表示方法や使用方法を調整する場合に適しています。
[フィールド設定の詳細](../data-modeling/collection-fields/index.md)

![edit_field](https://static-docs.nocobase.com/edit_field.png)
![edit_field_configure](https://static-docs.nocobase.com/edit_field_configure.png)

:::warning 注意

フィールド設定を編集しても、データベース view の実際の列名、フィールドタイプ、SQL 式、インデックスは変更されません。view の実際の構造を変更する必要がある場合は、まずデータベース側で view を変更し、その後「Sync from database」を使用して同期してください。

:::

### フィールドを削除する

フィールド右側の「Delete」をクリックすると、個別のフィールドを削除できます。フィールドを削除すると、NocoBase に保存されているフィールドのみが削除され、データベース view の実際の列は削除されません。

[フィールド設定の詳細](../data-modeling/collection-fields/index.md)

![delete_field](https://static-docs.nocobase.com/delete_field.png)

:::warning 注意

フィールドを削除すると、ページブロック、フィルタ条件、並べ替え、権限、ワークフロー、API、既存の設定に影響する可能性があります。削除前に、そのフィールドがまだ使用されていないか確認してください。データベース view が引き続きこの列を返す場合、後で「Sync from database」を実行した際に、NocoBase がこのフィールドを再度認識する可能性があります。

:::

## ビューを編集する

データベースビューの SQL 定義はデータベース側で管理されます。データテーブル一覧でデータベースビュー右側の「Edit」をクリックすると、NocoBase におけるデータベースビューのメタデータと実行設定を調整できます。データベース内の view は変更されません。別のデータベース view に接続する必要がある場合は、新しいデータベースビューデータテーブルを作成することをおすすめします。

![edit_view](https://static-docs.nocobase.com/edit_view.png)
![edit_view_configure](https://static-docs.nocobase.com/edit_view_configure.png)

| 設定 | 説明 |
| --- | --- |
| Collection display name | データベースビューを画面上に表示する名称です。「財務レポートビュー」「顧客統計ビュー」など、業務担当者が理解しやすい名称に変更できます。 |
| Collection name | NocoBase におけるデータベースビューの識別名です。編集時には変更できません。 |
| Database view | 現在接続されているデータベース view です。編集時は読み取り専用で、別の view に切り替えることはできません。 |
| Categories | データテーブルのカテゴリです。データソース管理画面での整理方法にのみ影響し、データベース view は変更しません。 |
| Description | データテーブルの説明です。view の管理者、クエリソース、使用するページやレポートの用途などを記載するのに適しています。 |
| Use simple pagination mode | シンプルページネーションモードです。有効にすると、テーブルブロックのページネーション時に総レコード数の集計をスキップします。データ量の多い view に適しています。 |
| Record unique key | レコードの一意識別子です。1件のレコードを特定するために使用します。通常は、view 内で安定して一意となるフィールドまたはフィールドの組み合わせを選択します。 |
| Allow add new, update and delete actions | 追加、更新、削除を許可するかどうかを設定します。データベース view 自体が書き込みに対応し、データベースアカウントに対応する権限がある場合にのみ、有効にすることをおすすめします。 |

:::warning 注意

Record unique key または Allow add new, update and delete actions を変更した後は、ページブロック、権限、ワークフローが引き続き想定どおりに動作するか再確認してください。

:::

## ビューを削除する

データテーブル一覧でデータベースビュー右側の「Delete」をクリックすると、データベースビューデータテーブルを削除できます。データベースビューデータテーブルを削除しても、NocoBase 内の接続設定とフィールドのみが削除され、データベース内の view は削除されません。

メインデータベース内のデータベースビューは、複数選択して一括削除することもできます。削除前に、ページブロック、チャート、権限、ワークフロー、外部 API でこのデータベースビューデータテーブルが使用されていないか確認してください。
![delete_view](https://static-docs.nocobase.com/delete_view.png)
![delete_view_second_confirmation](https://static-docs.nocobase.com/delete_view_second_confirmation.png)
