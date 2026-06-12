---
title: "Plugin KnowledgeBase"
description: "Desenvolvimento de plugin de base de conhecimento no NocoBase: registrar Provider externo, implementar VectorStoreService, retornar resultados RAG e configurar parâmetros."
keywords: "plugin de base de conhecimento,External Knowledge Base,VectorStoreProvider,VectorStoreService,RAG,AI employees,NocoBase"
---

# Plugin KnowledgeBase

No NocoBase, um **plugin de base de conhecimento (KnowledgeBase Plugin)** amplia as fontes de recuperação RAG usadas por AI employees. Na maioria dos casos, uma base Local é suficiente. Você só precisa de um plugin de base externa quando documentos, dados vetoriais ou a lógica de recuperação já são mantidos por um sistema externo.

Um plugin de base externa não participa do upload, segmentação, vetorização ou exclusão de documentos no NocoBase. Ele apenas recebe solicitações de recuperação durante conversas de AI employees e retorna segmentos de documentos.

:::tip Leitura prévia

- [Visão geral da base de conhecimento](../../ai-employees/knowledge-base/knowledge-base/) - Entenda os limites de Local, Readonly e External
- [Plugin](./plugin.md) - Entenda o ciclo de vida do plugin do servidor e `this.app.pm`
- [i18n](./i18n.md) - Prepare traduções se o plugin fornecer formulário de configuração

:::

## Casos de uso

Bases de conhecimento externas são adequadas quando:

- Já existe um serviço RAG independente, como um serviço interno de conhecimento ou uma API de recuperação de terceiros
- É necessário conectar uma base vetorial que o NocoBase ainda não suporta nativamente
- É necessário aplicar regras de negócio antes ou depois da recuperação, como filtro de permissões, isolamento de tenant, reranking ou deduplicação
- O ciclo de vida dos documentos é totalmente mantido por um sistema externo, e o NocoBase apenas lê os resultados durante conversas

Se você só quer fazer upload de arquivos no NocoBase, dividir documentos automaticamente e gerar índices vetoriais, use uma base Local por padrão.

## Ponto de extensão

Bases externas são registradas pelo ponto de extensão `vectorStoreProvider` fornecido por `@nocobase/plugin-ai`. No servidor, implemente dois objetos:

| Objeto | Função |
| --- | --- |
| `VectorStoreProvider` | Declara o identificador do provedor externo e cria o serviço de recuperação |
| `VectorStoreService` | Executa a recuperação e retorna segmentos de documentos para AI employees |

`providerName` é o identificador único do provedor. O Provider selecionado ou informado ao criar uma base External deve ser igual ao `providerName` registrado no servidor.

## Registrar o Provider

Em `src/server/plugin.ts`, obtenha a instância do plugin AI e registre seu `VectorStoreProvider`:

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

A fase `load()` é adequada para registrar pontos de extensão. Não é necessário conectar a base vetorial externa aqui, nem executar solicitações de recuperação. Coloque a conexão e a consulta reais em `VectorStoreService`.

Plugins de base externa sempre dependem de `@nocobase/plugin-ai-knowledge-base`. Recomenda-se verificar a dependência em `beforeEnable()`:

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

Assim, se o plugin dependente não estiver habilitado, o usuário verá uma mensagem clara.

## Implementar o Provider

O Provider só precisa fornecer `providerName` e criar um service com base na configuração da base de conhecimento.

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

`vectorStoreProps` vem do formulário de configuração da base externa, como endpoint de API, API key, modelo de Embedding ou identificador de tenant. O NocoBase passa esses valores ao Provider durante a recuperação.

## Implementar o Service

O Service contém a lógica principal de recuperação. Para uma base External, normalmente basta converter os resultados externos para o formato `DocumentSegmentedWithScore[]` exigido pelo NocoBase.

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

    // Aqui você pode conectar diretamente uma base vetorial ou chamar um serviço RAG externo.
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
    // Substitua pela chamada ao seu serviço externo.
    return [];
  }
}
```

Pontos principais:

- **`query`** - A pergunta que o AI employee precisa recuperar
- **`topK`** - O número esperado de segmentos retornados
- **`score`** - O limiar de pontuação configurado nas definições da base do AI employee
- **`vectorStoreProps`** - Parâmetros preenchidos no formulário da base externa

:::tip Sobre `getVectorStore()`

A interface `VectorStoreService` inclui `getVectorStore()`. Uma base External só é responsável pela recuperação e não permite que o NocoBase gerencie o vector store subjacente, por isso o exemplo lança um erro diretamente.

:::

## Retornar resultados de recuperação

`search()` deve retornar `DocumentSegmentedWithScore[]`:

```ts
type DocumentSegmentedWithScore = {
  id?: string;
  content: string;
  metadata: Record<string, unknown>;
  score: number;
};
```

Onde:

- `content` é o segmento de documento passado ao modelo
- `metadata` armazena origem, título, URL, permissões e outros metadados
- `score` é a pontuação de recuperação. Recomenda-se normalizar para que valores maiores indiquem maior relevância
- `id` identifica o segmento externo e ajuda na depuração e deduplicação

Se o serviço externo usa outro significado de pontuação, como distância menor significando maior relevância, converta para uma pontuação consistente antes de retornar ao NocoBase.

## Configurar parâmetros da base externa

O servidor pode ler `vectorStoreProps` diretamente, mas esses parâmetros normalmente precisam ser preenchidos pelo usuário ao criar uma base External. Por isso, o formulário de configuração deve ser registrado na entrada frontend do plugin. Depois disso, o NocoBase mostra os campos correspondentes no formulário de criação e passa os valores ao servidor durante a recuperação.

:::tip Observação

A configuração de formulário frontend não é obrigatória. Se sua base externa não precisa de parâmetros personalizados, não é necessário registrar `vectorStorePropForm`.

:::

Para casos simples, use `defaultVectorStorePropForm()` por padrão. Ele recebe uma lista de campos, cria um item de formulário para cada campo e usa um input que permite selecionar variáveis do NocoBase:

| Parâmetro | Função |
| --- | --- |
| `key` | Nome usado para salvar o parâmetro e passá-lo ao servidor |
| `label` | Rótulo do item do formulário |
| `tooltip` | Tooltip do item do formulário |
| `required` | Se o campo é obrigatório; ao ativar, cria validação obrigatória |
| `password` | Se deve ser exibido como campo de senha, adequado para API keys e secrets |

Registre o formulário na entrada frontend do plugin:

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

`name` deve coincidir com o `providerName` do servidor. `key` é o nome usado ao salvar o parâmetro e passá-lo ao servidor; o servidor pode ler o valor em `vectorStoreProps` usando a mesma key.

### Formulário personalizado

Além de `defaultVectorStorePropForm()`, você também pode passar um componente React personalizado para `vectorStorePropForm`:

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

## Estrutura de exemplo

Um plugin de base externa pode ser organizado assim:

```text
src/server/plugin.ts
src/server/vector-store/provider.ts
src/server/vector-store/service.ts
src/client/index.tsx
```

Onde:

- `plugin.ts` registra `VectorStoreProvider`
- `provider.ts` declara `providerName` e cria o service
- `service.ts` implementa `search()` e converte resultados externos para `DocumentSegmentedWithScore[]`
- `client/index.tsx` registra o formulário de configuração da base externa

Com isso, o plugin de base externa já pode ser chamado por AI employees. Depois que o usuário criar uma base External e selecionar o Provider correspondente, as conversas podem recuperar segmentos por meio do seu `search()`.

## Links relacionados

- [Visão geral da base de conhecimento](../../ai-employees/knowledge-base/knowledge-base/) - Limites de Local, Readonly e External
- [Plugin](./plugin.md) - Ciclo de vida do plugin do servidor e `this.app.pm`
- [i18n](./i18n.md) - Traduções frontend e servidor do plugin
- [Visão geral do desenvolvimento client](../client/index.md) - Entrada client, componentes e capacidades de contexto
