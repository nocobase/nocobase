---
title: "External 知识库插件"
description: "NocoBase External 知识库插件开发：注册外部知识库 Provider、实现 VectorStoreService、返回 RAG 检索结果、配置外部知识库参数表单。"
keywords: "External 知识库插件,External Knowledge Base,VectorStoreProvider,VectorStoreService,RAG,AI 员工,NocoBase"
---

# External 知识库插件

在 NocoBase 中，**External 知识库插件（External Knowledge Base Plugin）** 主要用于扩展 AI 员工的 RAG 检索来源。大部分业务直接使用 Local 知识库就够了；只有当文档、向量数据或检索逻辑已经由外部系统维护时，才需要开发 External 知识库插件。

External 知识库插件不参与 NocoBase 的文档上传、分段、向量化和删除流程。它只在 AI 员工问答时接收检索请求，然后返回召回的文档片段。

:::tip 前置阅读

- [知识库概述](../knowledge-base/) — 了解 Local、Readonly 和 External 知识库的能力边界
- [Plugin 插件](../../../plugin-development/server/plugin.md) — 了解服务端插件生命周期和 `this.app.pm`
- [i18n 国际化](../../../plugin-development/server/i18n.md) — 如果插件提供配置表单，需要为界面文案准备翻译

:::

## 适用场景

外部知识库适合这些情况：

- 已经有独立的 RAG 服务，比如企业内部知识库服务或第三方检索 API
- 需要连接 NocoBase 暂未内置支持的向量数据库
- 检索前后需要做业务规则处理，比如权限过滤、租户隔离、重排、去重
- 文档生命周期完全由外部系统维护，NocoBase 只负责在问答时读取召回结果

如果只是希望在 NocoBase 里上传文件、自动分段并生成向量索引，默认用 Local 知识库就行。

## 扩展点

外部知识库通过 `@nocobase/plugin-ai` 提供的 `vectorStoreProvider` 扩展点注册。服务端需要实现两个对象：

| 对象                  | 作用                                   |
| --------------------- | -------------------------------------- |
| `VectorStoreProvider` | 声明 External 知识库插件标识，并创建检索服务 |
| `VectorStoreService`  | 执行检索，返回 AI 员工可使用的文档片段 |

其中，`providerName` 是外部知识库类型的唯一标识。用户在创建 External 知识库时选择或填写的插件标识，需要和服务端注册的 `providerName` 保持一致。

## 注册 Provider

在 `src/server/plugin.ts` 中获取 AI 插件实例，然后注册你的 `VectorStoreProvider`：

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

`load()` 阶段适合注册扩展点。此时不需要连接外部向量库，也不建议在这里执行检索请求；真正的连接和查询逻辑放到 `VectorStoreService` 中按需执行。

External 知识库插件一定依赖 `@nocobase/plugin-ai-knowledge-base`。建议在 `beforeEnable()` 中做启用前检查：

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

这样用户启用插件时，如果依赖插件还没有启用，会直接得到明确的错误提示。

## 实现 Provider

Provider 只负责两件事：提供 `providerName`，并基于知识库配置创建 service。

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

`vectorStoreProps` 来自外部知识库的配置表单，比如 API endpoint、API key、Embedding 模型、租户标识等。NocoBase 会在执行检索时把这些配置传给 Provider。

## 实现 Service

Service 是检索逻辑的核心。External 知识库通常只需要把外部检索结果转换成 NocoBase 需要的 `DocumentSegmentedWithScore[]`。

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

    // 这里可以直连向量数据库，也可以调用第三方 RAG 服务。
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
    // 换成你的外部服务调用逻辑。
    return [];
  }
}
```

几个关键点：

- **`query`** — AI 员工当前要检索的问题
- **`topK`** — 希望返回的片段数量
- **`score`** — AI 员工知识库设置里的命中分数阈值
- **`vectorStoreProps`** — 用户在外部知识库配置表单里填写的参数

:::tip 关于 `getVectorStore()`

`VectorStoreService` 接口包含 `getVectorStore()`。External 知识库只负责检索，不负责让 NocoBase 管理底层向量存储，所以示例里直接抛出错误。

:::

## 返回检索结果

`search()` 必须返回 `DocumentSegmentedWithScore[]`：

```ts
type DocumentSegmentedWithScore = {
  id?: string;
  content: string;
  metadata: Record<string, unknown>;
  score: number;
};
```

其中：

- `content` 是会交给大模型的文档片段内容
- `metadata` 用于保存来源、文档标题、URL、权限信息等附加数据
- `score` 是检索命中分数，建议统一成越大越相关的数值
- `id` 用于标识外部文档片段，方便排查和去重

如果外部服务返回的分数含义不同，比如距离越小越相关，需要先在插件里转换成一致的相关性分数，再返回给 NocoBase。

## 配置外部知识库参数

服务端可以直接读取 `vectorStoreProps`，不过这些参数通常需要让用户在创建 External 知识库时填写。因此，配置表单需要在插件的前端入口注册。注册后，NocoBase 会在知识库创建表单中展示对应字段，并在检索时把这些值传给服务端。

:::tip 提示

前端表单配置不是必须的。如果你的外部知识库不需要用户填写自定义参数，可以不注册 `vectorStorePropForm`。

:::

简单场景默认推荐使用 `defaultVectorStorePropForm()` 生成配置表单。它接收一个字段数组，每个字段会生成一个表单项，并使用支持选择 NocoBase 变量的输入框：

| 参数       | 作用                                                  |
| ---------- | ----------------------------------------------------- |
| `key`      | 参数保存和传给服务端时使用的字段名                    |
| `label`    | 表单项标题                                            |
| `tooltip`  | 表单项提示说明                                        |
| `required` | 是否必填，设置后会生成必填校验                        |
| `password` | 是否按密码类字段展示，适合 API key、secret 等敏感信息 |

在插件的前端入口中注册配置表单：

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

这里的 `name` 要和服务端 `providerName` 一致。`key` 则是参数保存和传递到服务端时使用的字段名，服务端可以用同一个 key 从 `vectorStoreProps` 中读取。

### 自定义配置表单

除了使用 `defaultVectorStorePropForm()`，也可以直接给 `vectorStorePropForm` 传入自定义 React 组件：

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

## 示例插件结构

一个 External 知识库插件可以按下面的结构组织：

```text
src/server/plugin.ts
src/server/vector-store/provider.ts
src/server/vector-store/service.ts
src/client/index.tsx
```

其中：

- `plugin.ts` 注册 `VectorStoreProvider`
- `provider.ts` 声明 `providerName`，并创建 service
- `service.ts` 实现 `search()`，把外部检索结果转换成 `DocumentSegmentedWithScore[]`
- `client/index.tsx` 注册外部知识库配置表单

至此，一个 External 知识库插件已经能被 AI 员工调用。用户创建 External 知识库并选择对应 Provider 后，AI 员工问答时就会通过你的 `search()` 获取召回片段。

## 相关链接

- [知识库概述](../knowledge-base/) — Local、Readonly 和 External 知识库的使用边界
- [Plugin 插件](../../../plugin-development/server/plugin.md) — 服务端插件生命周期和 `this.app.pm`
- [i18n 国际化](../../../plugin-development/server/i18n.md) — 插件前后端多语言配置
- [客户端插件开发概述](../../../plugin-development/client/index.md) — 客户端入口、组件和上下文能力
