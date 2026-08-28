---
title: "External Knowledge Base プラグイン"
description: "NocoBase のナレッジベースプラグイン開発：外部 Provider の登録、VectorStoreService の実装、RAG 検索結果の返却、パラメータ設定。"
keywords: "ナレッジベースプラグイン,External Knowledge Base,VectorStoreProvider,VectorStoreService,RAG,AI employees,NocoBase"
---

# External Knowledge Base プラグイン

NocoBase では、**ナレッジベースプラグイン（External Knowledge Base Plugin）** を使って AI employees の RAG 検索ソースを拡張できます。多くの場合は Local knowledge base で十分です。ドキュメント、ベクトルデータ、検索ロジックが外部システムで管理されている場合にだけ、外部ナレッジベースプラグインが必要になります。

外部ナレッジベースプラグインは、NocoBase のドキュメントアップロード、分割、ベクトル化、削除には参加しません。AI employee の会話中に検索リクエストを受け取り、該当するドキュメントセグメントを返します。

:::tip 事前に読むもの

- [ナレッジベース概要](../knowledge-base/) - Local、Readonly、External の境界を理解する
- [Plugin](../../../plugin-development/server/plugin.md) - サーバープラグインのライフサイクルと `this.app.pm`
- [i18n](../../../plugin-development/server/i18n.md) - 設定フォームを提供する場合の翻訳

:::

## 利用シーン

外部ナレッジベースは次のような場合に適しています：

- 社内ナレッジサービスや第三者の検索 API など、独立した RAG サービスがすでにある
- NocoBase が標準対応していないベクトルデータベースに接続したい
- 権限フィルタ、tenant 分離、reranking、重複排除など、検索前後に業務ルールを処理したい
- ドキュメントのライフサイクルを外部システムが完全に管理し、NocoBase は会話時に検索結果だけを読む

NocoBase でファイルをアップロードし、自動分割してベクトルインデックスを生成したいだけなら、通常は Local knowledge base を使用します。

## 拡張ポイント

外部ナレッジベースは `@nocobase/plugin-ai` が提供する `vectorStoreProvider` 拡張ポイントで登録します。サーバー側では次の 2 つを実装します：

| オブジェクト | 役割 |
| --- | --- |
| `VectorStoreProvider` | 外部 Provider の識別子を宣言し、検索 service を作成する |
| `VectorStoreService` | 検索を実行し、AI employees が利用できるドキュメントセグメントを返す |

`providerName` は Provider の一意な識別子です。External knowledge base 作成時に選択または入力する Provider は、サーバー側で登録した `providerName` と一致している必要があります。

## Provider を登録する

`src/server/plugin.ts` で AI プラグインのインスタンスを取得し、`VectorStoreProvider` を登録します：

```ts
import { Plugin } from '@nocobase/server';
import PluginAIServer from '@nocobase/plugin-ai';
import { MyExternalKnowledgeBaseProvider } from './vector-store/provider';

export class PluginMyKnowledgeBaseServer extends Plugin {
  async load() {
    const aiPlugin = this.app.pm.get('ai') as PluginAIServer;

    aiPlugin.features.vectorStoreProvider.register(new MyExternalKnowledgeBaseProvider());
  }
}

export default PluginMyKnowledgeBaseServer;
```

`load()` は拡張ポイントの登録に適しています。ここで外部ベクトルデータベースへ接続したり、検索リクエストを実行したりする必要はありません。実際の接続と検索は `VectorStoreService` に置きます。

外部ナレッジベースプラグインは必ず `@nocobase/plugin-ai-knowledge-base` に依存します。`beforeEnable()` で依存関係を確認することをおすすめします：

```ts
import { Plugin } from '@nocobase/server';

export class PluginMyKnowledgeBaseServer extends Plugin {
  async beforeEnable() {
    const knowledgeBasePlugin = this.app.pm.get('ai-knowledge-base');

    if (!knowledgeBasePlugin) {
      throw new Error('Please enable @nocobase/plugin-ai-knowledge-base first.');
    }
  }
}
```

これにより、依存プラグインが有効でない場合に明確なエラーメッセージを表示できます。

## Provider を実装する

Provider は `providerName` を提供し、ナレッジベース設定に基づいて service を作成します。

```ts
import type { VectorStoreProp, VectorStoreProvider, VectorStoreService } from '@nocobase/plugin-ai';
import { MyExternalKnowledgeBaseService } from './service';

export class MyExternalKnowledgeBaseProvider implements VectorStoreProvider {
  get providerName() {
    return 'MyExternalKnowledgeBase';
  }

  async createVectorStoreService(vectorStoreProps?: VectorStoreProp[]): Promise<VectorStoreService> {
    return new MyExternalKnowledgeBaseService(vectorStoreProps);
  }
}
```

`vectorStoreProps` は外部ナレッジベースの設定フォームから渡されます。たとえば API endpoint、API key、Embedding model、tenant identifier などです。NocoBase は検索時にこれらの値を Provider に渡します。

## Service を実装する

Service は検索ロジックの中心です。External knowledge base では、通常、外部検索結果を NocoBase が必要とする `DocumentSegmentedWithScore[]` 形式に変換します。

```ts
import type {
  DocumentSegmentedWithScore,
  VectorStoreProp,
  VectorStoreSearchOptions,
  VectorStoreService,
} from '@nocobase/plugin-ai';

export class MyExternalKnowledgeBaseService implements VectorStoreService<unknown> {
  constructor(private readonly vectorStoreProps?: VectorStoreProp[]) {}

  async getVectorStore(): Promise<unknown> {
    throw new Error('External knowledge base does not expose a NocoBase-managed vector store. Use search() instead.');
  }

  async search(query: string, options?: VectorStoreSearchOptions): Promise<DocumentSegmentedWithScore[]> {
    const { topK, score } = options ?? {};
    const endpoint = this.getPropValue('endpoint');
    const apiKey = this.getPropValue('apiKey');

    // ここでベクトルデータベースへ直接接続するか、外部 RAG サービスを呼び出します。
    const result = await this.searchExternalService({
      query,
      topK,
      score,
      endpoint,
      apiKey,
    });

    return result.map((item) => ({
      id: item.id,
      content: item.content,
      metadata: item.metadata,
      score: item.score,
    }));
  }

  private getPropValue(key: string): unknown {
    return this.vectorStoreProps?.find((prop) => prop.key === key)?.value;
  }

  private async searchExternalService(params: {
    query: string;
    topK?: number;
    score?: string;
    endpoint: unknown;
    apiKey: unknown;
  }): Promise<DocumentSegmentedWithScore[]> {
    // 外部サービス呼び出しに置き換えてください。
    return [];
  }
}
```

主なポイント：

- **`query`** - AI employee が検索する質問
- **`topK`** - 返すセグメント数
- **`score`** - AI employee のナレッジベース設定にあるスコア閾値
- **`vectorStoreProps`** - 外部ナレッジベース設定フォームで入力されたパラメータ

:::tip `getVectorStore()` について

`VectorStoreService` インターフェースには `getVectorStore()` が含まれます。External knowledge base は検索だけを担当し、NocoBase に基盤の vector store を管理させないため、例では直接エラーを投げています。

:::

## 検索結果を返す

`search()` は `DocumentSegmentedWithScore[]` を返す必要があります：

```ts
type DocumentSegmentedWithScore = {
  id?: string;
  content: string;
  metadata: Record<string, unknown>;
  score: number;
};
```

各フィールド：

- `content` はモデルに渡すドキュメントセグメントの内容です
- `metadata` は出典、タイトル、URL、権限情報などを保存します
- `score` は検索スコアです。値が大きいほど関連度が高い形に揃えることをおすすめします
- `id` は外部ドキュメントセグメントの識別子で、調査や重複排除に役立ちます

外部サービスのスコアの意味が異なる場合、たとえば距離が小さいほど関連度が高い場合は、NocoBase に返す前に変換してください。

## 外部ナレッジベースのパラメータを設定する

サーバー側は `vectorStoreProps` を直接読み取れますが、これらのパラメータは通常、External knowledge base 作成時にユーザーが入力します。そのため、設定フォームはプラグインのフロントエンド入口で登録します。登録後、NocoBase は作成フォームに対応するフィールドを表示し、検索時に値をサーバーへ渡します。

:::tip 補足

フロントエンドフォーム設定は必須ではありません。外部ナレッジベースにカスタムパラメータが不要な場合、`vectorStorePropForm` を登録しなくてもかまいません。

:::

簡単な場合は `defaultVectorStorePropForm()` を使います。この関数はフィールド配列を受け取り、各フィールドに対応するフォーム項目を作成し、NocoBase 変数を選択できる入力欄を使用します：

| パラメータ | 役割 |
| --- | --- |
| `key` | パラメータ保存とサーバーへの受け渡しに使うフィールド名 |
| `label` | フォーム項目のラベル |
| `tooltip` | フォーム項目のヒント |
| `required` | 必須かどうか |
| `password` | API key や secret に適したパスワード表示 |

プラグインのフロントエンド入口で設定フォームを登録します：

```tsx
import { Plugin } from '@nocobase/client';
import PluginAIClient, { defaultVectorStorePropForm } from '@nocobase/plugin-ai/client';

export class PluginMyKnowledgeBaseClient extends Plugin {
  async load() {
    const aiPlugin = this.app.pm.get('ai') as PluginAIClient;

    aiPlugin.features.vectorStoreProvider.register({
      name: 'MyExternalKnowledgeBase',
      title: String(this.t('My external knowledge base')),
      components: {
        vectorStorePropForm: defaultVectorStorePropForm([
          {
            key: 'endpoint',
            label: String(this.t('Endpoint')),
            required: true,
          },
          {
            key: 'apiKey',
            label: String(this.t('API key')),
            required: true,
            password: true,
          },
        ]),
      },
    });
  }
}
```

`name` はサーバー側の `providerName` と一致させます。`key` は保存時とサーバーへの受け渡しに使うフィールド名で、サーバー側は同じ key で `vectorStoreProps` から値を読み取れます。

### カスタム設定フォーム

`defaultVectorStorePropForm()` のほかに、`vectorStorePropForm` に独自の React コンポーネントを渡すこともできます：

```tsx
import { useFlowContext } from '@nocobase/flow-engine';
import type { VectorStorePropFormValues } from '@nocobase/plugin-ai/client';
import { Form, Input, Select } from 'antd';
import type { FormInstance } from 'antd';

const MyVectorStorePropForm = ({ form }: { form: FormInstance<VectorStorePropFormValues> }) => {
  const ctx = useFlowContext();

  return (
    <Form form={form} layout="vertical" validateMessages={{ required: ctx.t('defaults.form.required') }}>
      <Form.Item name="endpoint" label={String(ctx.t('Endpoint'))} rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="namespace" label={String(ctx.t('Namespace'))}>
        <Input />
      </Form.Item>
      <Form.Item name="metric" label={String(ctx.t('Metric'))} initialValue="cosine">
        <Select
          options={[
            { label: String(ctx.t('Cosine')), value: 'cosine' },
            { label: String(ctx.t('L2')), value: 'l2' },
          ]}
        />
      </Form.Item>
    </Form>
  );
};

aiPlugin.features.vectorStoreProvider.register({
  name: 'MyExternalKnowledgeBase',
  components: {
    vectorStorePropForm: MyVectorStorePropForm,
  },
});
```

## プラグイン構成例

外部ナレッジベースプラグインは次のように構成できます：

```text
src/server/plugin.ts
src/server/vector-store/provider.ts
src/server/vector-store/service.ts
src/client/index.tsx
```

各ファイルの役割：

- `plugin.ts` は `VectorStoreProvider` を登録します
- `provider.ts` は `providerName` を宣言し、service を作成します
- `service.ts` は `search()` を実装し、外部検索結果を `DocumentSegmentedWithScore[]` に変換します
- `client/index.tsx` は外部ナレッジベース設定フォームを登録します

ここまでで、外部ナレッジベースプラグインは AI employees から呼び出せるようになります。ユーザーが External knowledge base を作成して対応する Provider を選択すると、会話中に `search()` 経由でドキュメントセグメントを取得できます。

## 関連リンク

- [ナレッジベース概要](../knowledge-base/) - Local、Readonly、External の境界
- [Plugin](../../../plugin-development/server/plugin.md) - サーバープラグインのライフサイクルと `this.app.pm`
- [i18n](../../../plugin-development/server/i18n.md) - プラグインのフロントエンドとサーバー翻訳
- [クライアント開発概要](../../../plugin-development/client/index.md) - クライアント入口、コンポーネント、context 能力
