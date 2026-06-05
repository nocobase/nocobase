:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# プラグイン開発

## 背景にある課題

シングルノード環境では、プラグインは通常、プロセス内の状態、イベント、またはタスクを通じて要件を満たすことができます。しかし、クラスターモードでは、同じプラグインが複数のインスタンスで同時に実行される可能性があり、以下のような典型的な課題に直面します。

- **状態の一貫性**：設定や実行時のデータがメモリにのみ保存されている場合、インスタンス間で同期するのが難しく、ダーティリードや重複実行が発生しやすくなります。
- **タスクスケジューリング**：明確なキューイングと確認メカニズムがない場合、時間のかかるタスクが複数のインスタンスによって同時に実行されてしまう可能性があります。
- **競合状態**：スキーマ変更やリソース割り当てに関わる操作では、並行書き込みによる競合を避けるために、操作をシーケンシャルに処理する必要があります。

NocoBase のコアは、アプリケーション層に様々なミドルウェアインターフェースをプリセットしています。これにより、プラグインがクラスター環境で共通の機能を再利用できるようになります。以下では、キャッシュ、同期メッセージ、メッセージキュー、分散ロックの利用方法とベストプラクティスを、ソースコードと合わせてご紹介します。

## 解決策

### キャッシュコンポーネント（Cache）

メモリに保存する必要があるデータには、システムに組み込まれているキャッシュコンポーネントを使用することをお勧めします。

- `app.cache` を介してデフォルトのキャッシュインスタンスを取得します。
- `Cache` は `set/get/del/reset` といった基本的な操作を提供します。また、キャッシュロジックをカプセル化するための `wrap` や `wrapWithCondition`、そして `mset/mget/mdel` のようなバッチメソッドもサポートしています。
- クラスターデプロイ時には、共有データを永続化機能を持つストレージ（Redisなど）に配置し、インスタンスの再起動によるキャッシュの損失を防ぐために、適切な `ttl` を設定することをお勧めします。

例：[`plugin-auth` におけるキャッシュの初期化と使用](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts#L11-L72)

```ts title="プラグインでのキャッシュの作成と使用"
// packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts
async load() {
  this.cache = await this.app.cacheManager.createCache({
    name: 'auth',
    prefix: 'auth',
    store: 'redis',
  });

  await this.cache.wrap('token:config', async () => {
    const repo = this.app.db.getRepository('tokenPolicies');
    return repo.findOne({ filterByTk: 'default' });
  }, 60 * 1000);
}
```

### 同期メッセージマネージャー（SyncMessageManager）

メモリ内の状態が分散キャッシュで管理できない場合（例えば、シリアライズできない場合）、ユーザー操作によって状態が変化した際には、その変化を同期シグナルを通じて他のインスタンスに通知し、状態の一貫性を保つ必要があります。

- プラグインの基底クラスには `sendSyncMessage` が実装されており、内部で `app.syncMessageManager.publish` を呼び出し、チャネルにアプリケーションレベルのプレフィックスを自動で追加することで、チャネルの衝突を防ぎます。
- `publish` では `transaction` を指定でき、メッセージはデータベーストランザクションがコミットされた後に送信されるため、状態とメッセージの同期が保証されます。
- `handleSyncMessage` を通じて他のインスタンスから送信されたメッセージを処理します。`beforeLoad` フェーズで購読することができ、設定変更やスキーマ同期などのシナリオに非常に適しています。

例：[`plugin-data-source-main` が同期メッセージを使用して複数ノード間のスキーマ一貫性を維持する](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L20-L220)

```ts title="プラグイン内でのスキーマ更新の同期"
export class PluginDataSourceMainServer extends Plugin {
  async handleSyncMessage(message) {
    if (message.type === 'syncCollection') {
      await this.app.db.getRepository('collections').load(message.collectionName);
    }
  }

  private sendSchemaChange(data, options) {
    this.sendSyncMessage(data, options); // 自動的に app.syncMessageManager.publish を呼び出します
  }
}
```

### メッセージブロードキャストマネージャー（PubSubManager）

メッセージブロードキャストは同期シグナルの基盤となるコンポーネントであり、直接使用することも可能です。インスタンス間でメッセージをブロードキャストする必要がある場合に、このコンポーネントを利用できます。

- `app.pubSubManager.subscribe(channel, handler, { debounce })` を使用してインスタンス間でチャネルを購読できます。`debounce` オプションは、重複ブロードキャストによる頻繁なコールバックを防ぐためのデバウンス処理に使用されます。
- `publish` は `skipSelf`（デフォルトは true）と `onlySelf` をサポートしており、メッセージが現在のインスタンスに送り返されるかどうかを制御します。
- アプリケーション起動前にアダプター（Redis、RabbitMQなど）を設定する必要があります。設定しない場合、デフォルトでは外部メッセージシステムには接続されません。

例：[`plugin-async-task-manager` が PubSub を使用してタスクキャンセルイベントをブロードキャストする](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L194-L258)

```ts title="タスクキャンセルシグナルのブロードキャスト"
const channel = `${plugin.name}.task.cancel`;

await this.app.pubSubManager.subscribe(channel, async ({ id }) => {
  this.logger.info(`Task ${id} cancelled on other node`);
  await this.stopLocalTask(id);
});

await this.app.pubSubManager.publish(channel, { id: taskId }, { skipSelf: true });
```

### イベントキューコンポーネント（EventQueue）

メッセージキューは非同期タスクのスケジューリングに使用され、時間のかかる操作や再試行可能な操作の処理に適しています。

- `app.eventQueue.subscribe(channel, { idle, process, concurrency })` を介してコンシューマーを宣言します。`process` は `Promise` を返し、`AbortSignal.timeout` を使用してタイムアウトを制御できます。
- `publish` はアプリケーション名のプレフィックスを自動で補完し、`timeout` や `maxRetries` などのオプションをサポートしています。デフォルトではインメモリキューアダプターが使用されますが、必要に応じて RabbitMQ などの拡張アダプターに切り替えることができます。
- クラスターでは、タスクがノード間で分断されるのを避けるため、すべてのノードが同じアダプターを使用していることを確認してください。

例：[`plugin-async-task-manager` が EventQueue を使用してタスクをスケジューリングする](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L199-L240)

```ts title="キューでの非同期タスクのディスパッチ"
this.app.eventQueue.subscribe(`${plugin.name}.task`, {
  concurrency: this.concurrency,
  idle: this.idle,
  process: async (payload, { signal }) => {
    await this.runTask(payload.id, { signal });
  },
});

await this.app.eventQueue.publish(`${plugin.name}.task`, { id: taskId }, { maxRetries: 3 });
```

### 分散ロックマネージャー（LockManager）

競合操作を避ける必要がある場合、分散ロックを使用してリソースへのアクセスをシーケンシャルに処理できます。

- デフォルトではプロセスベースの `local` アダプターが提供されており、Redisなどの分散実装を登録できます。`app.lockManager.runExclusive(key, fn, ttl)` または `acquire`/`tryAcquire` を介して並行処理を制御します。
- `ttl` は、異常な状況でロックが永久に保持されるのを防ぐためのフォールバックとして、ロックを解放するために使用されます。
- 一般的なシナリオとしては、スキーマ変更、重複タスクの防止、レート制限などがあります。

例：[`plugin-data-source-main` が分散ロックを使用してフィールド削除プロセスを保護する](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L320-L360)

```ts title="フィールド削除操作のシーケンシャル処理"
const lockKey = `${this.name}:fields.beforeDestroy:${collectionName}`;
await this.app.lockManager.runExclusive(lockKey, async () => {
  await fieldModel.remove(options);
  this.sendSyncMessage({ type: 'removeField', collectionName, fieldName });
});
```

## 開発のヒント

- **メモリ内状態の一貫性**：開発時にはメモリ内状態の使用をできるだけ避け、代わりにキャッシュや同期メッセージを使用して状態の一貫性を保つようにしてください。
- **組み込みインターフェースの優先的な再利用**：`app.cache` や `app.syncMessageManager` などの機能を統一的に使用し、プラグイン内でノード間通信ロジックを重複して実装するのを避けてください。
- **トランザクション境界への注意**：トランザクションを伴う操作では、データとメッセージの一貫性を保証するために `transaction.afterCommit`（`syncMessageManager.publish` には組み込み済み）を使用すべきです。
- **バックオフ戦略の策定**：キューやブロードキャストタスクでは、異常な状況で新たなトラフィックの急増が発生するのを防ぐため、`timeout`、`maxRetries`、`debounce` を適切に設定してください。
- **モニタリングとログの活用**：アプリケーションログを有効活用し、チャネル名、メッセージペイロード、ロックキーなどの情報を記録することで、クラスター環境で発生する偶発的な問題のトラブルシューティングを容易にします。

これらの機能を利用することで、プラグインは異なるインスタンス間で安全に状態を共有し、設定を同期し、タスクをスケジューリングできるようになり、クラスターデプロイメントシナリオにおける安定性と一貫性の要件を満たします。