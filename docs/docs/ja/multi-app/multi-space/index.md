---
pkg: "@nocobase/plugin-multi-space"
---

# マルチスペース

<PluginInfo name="multi-space" licenseBundled="professional"></PluginInfo>

## 紹介

**マルチスペースプラグイン**は、単一アプリインスタンス内で論理分離により複数の独立データスペースを実現します。

#### 適用シナリオ
- **複数店舗・工場**: 在庫管理、生産計画、販売戦略、帳票テンプレートなど業務プロセスとシステム設定は高い共通性を持つが、各事業単位のデータは相互干渉させたくない場合。
- **複数組織・子会社管理**: グループ配下の複数組織／子会社が同一プラットフォームを共有しつつ、ブランドごとに顧客、商品、注文データを独立管理したい場合。

## インストール

プラグイン管理で **Multi-Space** プラグインを有効化します。

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)

## 利用ガイド

### マルチスペース管理

プラグイン有効化後、**Users & Permissions** 設定ページで **Spaces** パネルに切り替えるとスペースを管理できます。

> 初期状態では組み込みの **Unassigned Space** が存在し、スペース未関連の既存データ確認に利用されます。

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### スペース作成

「Add space」をクリックして新しいスペースを作成します。

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### ユーザー割り当て

作成済みスペースを選択後、右側でそのスペース所属ユーザーを設定できます。

> **注意:** スペースにユーザーを割り当てた後は、右上のスペース切替リストに最新内容を反映するため、**手動でページ更新** が必要です。

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)

### スペース切替と閲覧

右上で現在スペースを切り替えられます。右側の **目アイコン**（ハイライト状態）をクリックすると、複数スペースのデータを同時表示できます。

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### マルチスペースデータ管理

プラグイン有効化後、コレクション作成時にシステムが **Space フィールド** を自動追加します。**このフィールドを含むコレクションのみ** がスペース管理ロジックの対象になります。

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

既存コレクションでは、Space フィールドを手動追加することでスペース管理を有効化できます。

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### デフォルト動作

Space フィールドを含むコレクションでは、次のロジックが自動適用されます。

1. データ作成時に、現在選択中スペースへ自動関連付け。
2. データ絞り込み時に、現在選択中スペースのデータに自動限定。

### 既存データのスペース分類

マルチスペースプラグイン有効化前に存在していたデータは、次の手順でスペース分類できます。

#### 1. Space フィールド追加

既存テーブルに Space フィールドを手動追加します。

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. 未割り当てスペースへユーザー割り当て

既存データ管理ユーザーを全スペースに関連付けます。未分類データ閲覧のため、**Unassigned Space** を含める必要があります。

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. 全スペースデータを表示

画面上部で全スペースのデータ表示を選択します。

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. 既存データ割り当てページ作成

既存データ割り当て用の新規ページを作成し、**一覧ページ** と **編集ページ** の両方で Space フィールドを表示して、手動で所属スペースを調整できるようにします。

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Space フィールドを編集可能に設定します。

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. データのスペース手動割り当て

上記ページからデータを手動編集し、既存データへ正しいスペースを段階的に割り当てます（必要に応じて一括編集も可能）。
