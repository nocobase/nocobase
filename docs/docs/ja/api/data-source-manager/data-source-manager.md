:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# DataSourceManager

`DataSourceManager` は、複数の `dataSource` インスタンスを管理するクラスです。

## API

### add()
`dataSource` インスタンスを追加します。

#### シグネチャ

- `add(dataSource: DataSource, options: any = {}): Promise<void>`

### use()

`dataSource` インスタンスにグローバルミドルウェアを追加します。

### middleware()

現在の `DataSourceManager` インスタンスのミドルウェアを取得します。これは HTTP リクエストへの応答に使用できます。

### afterAddDataSource()

新しい `dataSource` が追加された後に呼び出されるフック関数です。

#### シグネチャ

- `afterAddDataSource(hook: DataSourceHook)`

```typescript
type DataSourceHook = (dataSource: DataSource) => void;
```

### registerDataSourceType()

データソースのタイプとそのクラスを登録します。

#### シグネチャ

- `registerDataSourceType(type: string, dataSourceClass: typeof DataSource)`

### getDataSourceType()

データソースクラスを取得します。

#### シグネチャ

- `getDataSourceType(type: string): typeof DataSource`

### buildDataSourceByType()

登録されているデータソースのタイプとインスタンスのオプションに基づいて、データソースインスタンスを作成します。

#### シグネチャ

- `buildDataSourceByType(type: string, options: any): DataSource`