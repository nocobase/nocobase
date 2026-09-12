---
title: "Плагин External Knowledge Base"
description: "Разработка плагина базы знаний NocoBase: регистрация внешнего Provider, реализация VectorStoreService, возврат результатов RAG и настройка параметров."
keywords: "плагин базы знаний,External Knowledge Base,VectorStoreProvider,VectorStoreService,RAG,AI employees,NocoBase"
---

# Плагин External Knowledge Base

В NocoBase **плагин базы знаний (External Knowledge Base Plugin)** расширяет источники RAG-поиска для AI employees. В большинстве случаев достаточно Local knowledge base. Внешний плагин нужен только тогда, когда документы, векторные данные или логика поиска уже поддерживаются внешней системой.

Плагин внешней базы знаний не участвует в загрузке, сегментации, векторизации и удалении документов в NocoBase. Он только получает поисковые запросы во время диалогов AI employees и возвращает подходящие фрагменты документов.

:::tip Предварительное чтение

- [Обзор базы знаний](../knowledge-base/) - границы Local, Readonly и External
- [Plugin](../../../plugin-development/server/plugin.md) - жизненный цикл серверного плагина и `this.app.pm`
- [i18n](../../../plugin-development/server/i18n.md) - переводы, если плагин предоставляет форму настройки

:::

## Сценарии использования

Внешняя база знаний подходит, если:

- уже есть независимый RAG-сервис, например внутренняя база знаний или сторонний API поиска
- нужно подключить векторную базу данных, которую NocoBase не поддерживает из коробки
- нужно обработать бизнес-правила до или после поиска, например фильтрацию прав, изоляцию tenant, reranking или дедупликацию
- жизненный цикл документов полностью поддерживается внешней системой, а NocoBase только читает результаты поиска во время диалогов

Если нужно только загружать файлы в NocoBase, автоматически разбивать документы и строить векторные индексы, по умолчанию используйте Local knowledge base.

## Точка расширения

Внешние базы знаний регистрируются через точку расширения `vectorStoreProvider`, предоставляемую `@nocobase/plugin-ai`. На стороне сервера нужно реализовать два объекта:

| Объект | Назначение |
| --- | --- |
| `VectorStoreProvider` | Объявляет идентификатор внешнего Provider и создает сервис поиска |
| `VectorStoreService` | Выполняет поиск и возвращает фрагменты документов для AI employees |

`providerName` — уникальный идентификатор Provider. Provider, выбранный или введенный при создании External knowledge base, должен совпадать с `providerName`, зарегистрированным на сервере.

## Регистрация Provider

В `src/server/plugin.ts` получите экземпляр AI-плагина и зарегистрируйте `VectorStoreProvider`:

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

Этап `load()` подходит для регистрации точек расширения. Подключение к внешней векторной базе и реальные запросы поиска лучше разместить в `VectorStoreService`.

Плагины внешней базы знаний всегда зависят от `@nocobase/plugin-ai-knowledge-base`. Рекомендуется проверить эту зависимость в `beforeEnable()`:

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

Так пользователь получит понятное сообщение, если обязательный плагин еще не включен.

## Реализация Provider

Provider предоставляет `providerName` и создает service на основе конфигурации базы знаний.

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

`vectorStoreProps` поступает из формы настройки внешней базы знаний, например API endpoint, API key, модель Embedding или идентификатор tenant. NocoBase передает эти значения Provider во время поиска.

## Реализация Service

Service содержит основную логику поиска. Для External knowledge base обычно достаточно преобразовать внешние результаты в формат `DocumentSegmentedWithScore[]`, который нужен NocoBase.

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

    // Здесь можно напрямую подключиться к векторной базе или вызвать внешний RAG-сервис.
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
    // Замените это вызовом вашего внешнего сервиса.
    return [];
  }
}
```

Ключевые моменты:

- **`query`** - вопрос, по которому AI employee выполняет поиск
- **`topK`** - ожидаемое количество возвращаемых фрагментов
- **`score`** - порог score в настройках базы знаний AI employee
- **`vectorStoreProps`** - параметры, заполненные в форме настройки внешней базы

:::tip О `getVectorStore()`

Интерфейс `VectorStoreService` содержит `getVectorStore()`. External knowledge base отвечает только за поиск и не передает NocoBase управление нижележащим vector store, поэтому пример сразу выбрасывает ошибку.

:::

## Возврат результатов поиска

`search()` должен возвращать `DocumentSegmentedWithScore[]`:

```ts
type DocumentSegmentedWithScore = {
  id?: string;
  content: string;
  metadata: Record<string, unknown>;
  score: number;
};
```

Где:

- `content` — содержимое фрагмента документа, передаваемое модели
- `metadata` — источник, заголовок документа, URL, сведения о правах и другие метаданные
- `score` — оценка поиска; рекомендуется нормализовать ее так, чтобы большее значение означало большую релевантность
- `id` — идентификатор внешнего фрагмента, полезный для диагностики и дедупликации

Если внешний сервис использует другое значение score, например меньшая дистанция означает большую релевантность, преобразуйте его перед возвратом в NocoBase.

## Настройка параметров внешней базы

Сервер может напрямую читать `vectorStoreProps`, но обычно пользователь заполняет эти параметры при создании External knowledge base. Поэтому форму настройки нужно зарегистрировать во frontend-входе плагина. После регистрации NocoBase покажет соответствующие поля в форме создания базы и передаст значения серверу во время поиска.

:::tip Примечание

Frontend-форма не обязательна. Если внешней базе не нужны пользовательские параметры, `vectorStorePropForm` можно не регистрировать.

:::

Для простых случаев по умолчанию используйте `defaultVectorStorePropForm()`. Функция принимает список полей, создает элемент формы для каждого поля и использует input с поддержкой выбора переменных NocoBase:

| Параметр | Назначение |
| --- | --- |
| `key` | Имя поля для сохранения параметра и передачи на сервер |
| `label` | Подпись поля |
| `tooltip` | Подсказка поля |
| `required` | Обязательность поля |
| `password` | Отображение как password-поля, подходит для API keys и secrets |

Зарегистрируйте форму во frontend-входе плагина:

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

`name` должен совпадать с серверным `providerName`. `key` используется для сохранения параметра и передачи на сервер; сервер читает значение из `vectorStoreProps` по тому же key.

### Пользовательская форма

Кроме `defaultVectorStorePropForm()`, можно передать собственный React-компонент в `vectorStorePropForm`:

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

## Пример структуры

Плагин внешней базы знаний можно организовать так:

```text
src/server/plugin.ts
src/server/vector-store/provider.ts
src/server/vector-store/service.ts
src/client/index.tsx
```

Где:

- `plugin.ts` регистрирует `VectorStoreProvider`
- `provider.ts` объявляет `providerName` и создает service
- `service.ts` реализует `search()` и преобразует внешние результаты в `DocumentSegmentedWithScore[]`
- `client/index.tsx` регистрирует форму настройки внешней базы

После этого плагин внешней базы знаний может вызываться AI employees. Когда пользователь создаст External knowledge base и выберет соответствующий Provider, диалоги смогут получать фрагменты через ваш `search()`.

## Связанные ссылки

- [Обзор базы знаний](../knowledge-base/) - границы Local, Readonly и External
- [Plugin](../../../plugin-development/server/plugin.md) - жизненный цикл серверного плагина и `this.app.pm`
- [i18n](../../../plugin-development/server/i18n.md) - переводы frontend и сервера плагина
- [Обзор клиентской разработки](../../../plugin-development/client/index.md) - клиентский вход, компоненты и возможности context
