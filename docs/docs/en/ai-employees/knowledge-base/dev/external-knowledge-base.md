---
title: "External Knowledge Base plugin"
description: "NocoBase knowledge base plugin development: register an external knowledge base provider, implement VectorStoreService, return RAG retrieval results, and configure external knowledge base parameters."
keywords: "knowledge base plugin,External Knowledge Base,VectorStoreProvider,VectorStoreService,RAG,AI employees,NocoBase"
---

# External Knowledge Base plugin

In NocoBase, a **External Knowledge Base plugin** extends the RAG retrieval sources available to AI employees. For most use cases, a Local knowledge base is enough. You only need an external knowledge base plugin when documents, vector data, or retrieval logic are already maintained by an external system.

An external knowledge base plugin does not participate in document upload, segmentation, vectorization, or deletion in NocoBase. It only receives retrieval requests during AI employee conversations and returns matching document segments.

:::tip Prereading

- [Knowledge base overview](../knowledge-base/) - Understand the boundaries of Local, Readonly, and External knowledge bases
- [Plugin](../../../plugin-development/server/plugin.md) - Understand server-side plugin lifecycle and `this.app.pm`
- [i18n](../../../plugin-development/server/i18n.md) - Prepare translations if the plugin provides a configuration form

:::

## Use cases

External knowledge bases are suitable for these cases:

- You already have an independent RAG service, such as an internal knowledge base service or a third-party retrieval API
- You need to connect to a vector database that NocoBase does not support out of the box
- You need to process business rules before or after retrieval, such as permission checks, tenant isolation, reranking, or deduplication
- The document lifecycle is fully maintained by an external system, and NocoBase only reads retrieval results during conversations

If you only want to upload files in NocoBase, split documents automatically, and generate vector indexes, use a Local knowledge base by default.

## Extension point

External knowledge bases are registered through the `vectorStoreProvider` extension point provided by `@nocobase/plugin-ai`. The server side needs to implement two objects:

| Object | Purpose |
| --- | --- |
| `VectorStoreProvider` | Declares the external knowledge base provider name and creates the retrieval service |
| `VectorStoreService` | Performs retrieval and returns document segments that AI employees can use |

`providerName` is the unique identifier of an external knowledge base provider. The provider selected or entered when creating an External knowledge base must match the `providerName` registered on the server side.

## Register the Provider

In `src/server/plugin.ts`, get the AI plugin instance and register your `VectorStoreProvider`:

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

The `load()` stage is suitable for registering extension points. You do not need to connect to the external vector database here, and retrieval requests should not be executed here. Put the actual connection and query logic in `VectorStoreService`.

External knowledge base plugins always depend on `@nocobase/plugin-ai-knowledge-base`. It is recommended to check the dependency in `beforeEnable()`:

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

This gives users a clear error message if the required plugin has not been enabled.

## Implement the Provider

The Provider only needs to provide `providerName` and create a service based on the knowledge base configuration.

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

`vectorStoreProps` comes from the external knowledge base configuration form, such as API endpoint, API key, Embedding model, tenant identifier, and similar parameters. NocoBase passes these values to the Provider when running retrieval.

## Implement the Service

The Service is the core retrieval logic. For an External knowledge base, it usually only needs to convert external retrieval results into the `DocumentSegmentedWithScore[]` format required by NocoBase.

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

    // You can connect to a vector database directly or call a third-party RAG service here.
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
    // Replace this with your external service call.
    return [];
  }
}
```

Key points:

- **`query`** - The question that the AI employee needs to retrieve against
- **`topK`** - The expected number of returned segments
- **`score`** - The score threshold configured in the AI employee knowledge base settings
- **`vectorStoreProps`** - Parameters filled in through the external knowledge base configuration form

:::tip About `getVectorStore()`

The `VectorStoreService` interface includes `getVectorStore()`. An External knowledge base is only responsible for retrieval and does not let NocoBase manage the underlying vector store, so the example throws an error directly.

:::

## Return retrieval results

`search()` must return `DocumentSegmentedWithScore[]`:

```ts
type DocumentSegmentedWithScore = {
  id?: string;
  content: string;
  metadata: Record<string, unknown>;
  score: number;
};
```

Where:

- `content` is the document segment content passed to the large language model
- `metadata` stores source, document title, URL, permission information, and other metadata
- `score` is the retrieval score. It is recommended to normalize it so that a larger value means higher relevance
- `id` identifies the external document segment, which helps with troubleshooting and deduplication

If the external service uses a different score meaning, such as smaller distance meaning higher relevance, convert it to a consistent relevance score before returning it to NocoBase.

## Configure external knowledge base parameters

The server side can read `vectorStoreProps` directly, but these parameters usually need to be filled in when users create an External knowledge base. Therefore, the configuration form needs to be registered in the plugin frontend entry. After registration, NocoBase displays the corresponding fields in the knowledge base creation form and passes the values to the server side during retrieval.

:::tip Note

Frontend form configuration is optional. If your external knowledge base does not require custom parameters from users, you do not need to register `vectorStorePropForm`.

:::

For simple cases, use `defaultVectorStorePropForm()` by default. It receives an array of fields, creates one form item for each field, and uses an input that supports selecting NocoBase variables:

| Parameter | Purpose |
| --- | --- |
| `key` | Field name used when saving the parameter and passing it to the server side |
| `label` | Form item label |
| `tooltip` | Form item tooltip |
| `required` | Whether the field is required. If set, required validation is generated |
| `password` | Whether to display the field as a password input, suitable for API keys and secrets |

Register the configuration form in the plugin frontend entry:

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

The `name` here must match the server-side `providerName`. The `key` is the field name used when saving the parameter and passing it to the server side. The server side can read the value from `vectorStoreProps` with the same key.

### Custom configuration form

Besides using `defaultVectorStorePropForm()`, you can also pass a custom React component to `vectorStorePropForm`:

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

## Example plugin structure

An external knowledge base plugin can be organized as follows:

```text
src/server/plugin.ts
src/server/vector-store/provider.ts
src/server/vector-store/service.ts
src/client/index.tsx
```

Where:

- `plugin.ts` registers `VectorStoreProvider`
- `provider.ts` declares `providerName` and creates the service
- `service.ts` implements `search()` and converts external retrieval results to `DocumentSegmentedWithScore[]`
- `client/index.tsx` registers the external knowledge base configuration form

At this point, the external knowledge base plugin can be called by AI employees. After users create an External knowledge base and select the corresponding Provider, AI employee conversations can retrieve document segments through your `search()`.

## Related links

- [Knowledge base overview](../knowledge-base/) - Boundaries of Local, Readonly, and External knowledge bases
- [Plugin](../../../plugin-development/server/plugin.md) - Server-side plugin lifecycle and `this.app.pm`
- [i18n](../../../plugin-development/server/i18n.md) - Plugin frontend and server-side translations
- [Client plugin development overview](../../../plugin-development/client/index.md) - Client entry, components, and context capabilities
