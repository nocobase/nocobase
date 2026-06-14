---
title: "Plugin KnowledgeBase"
description: "Desarrollo de plugins de base de conocimiento en NocoBase: registrar un Provider externo, implementar VectorStoreService, devolver resultados RAG y configurar parámetros."
keywords: "plugin de base de conocimiento,External Knowledge Base,VectorStoreProvider,VectorStoreService,RAG,AI employees,NocoBase"
---

# Plugin KnowledgeBase

En NocoBase, un **plugin de base de conocimiento (KnowledgeBase Plugin)** permite ampliar las fuentes de recuperación RAG usadas por los AI employees. En la mayoría de los casos basta con una base de conocimiento Local. Solo necesitas un plugin de base de conocimiento externa cuando los documentos, los vectores o la lógica de recuperación ya se mantienen fuera de NocoBase.

Un plugin de base de conocimiento externa no participa en la carga, segmentación, vectorización ni eliminación de documentos en NocoBase. Solo recibe solicitudes de recuperación durante las conversaciones de los AI employees y devuelve fragmentos de documentos.

:::tip Lectura previa

- [Visión general de la base de conocimiento](../../ai-employees/knowledge-base/knowledge-base/) - Límites de Local, Readonly y External
- [Plugin](./plugin.md) - Ciclo de vida del plugin de servidor y `this.app.pm`
- [i18n](./i18n.md) - Traducciones necesarias si el plugin proporciona un formulario de configuración

:::

## Casos de uso

Las bases de conocimiento externas son adecuadas cuando:

- Ya existe un servicio RAG independiente, como un servicio interno de conocimiento o una API de recuperación de terceros
- Necesitas conectar una base vectorial que NocoBase no soporta de forma integrada
- Necesitas aplicar reglas de negocio antes o después de la recuperación, como filtrado de permisos, aislamiento por tenant, reranking o deduplicación
- El ciclo de vida de los documentos lo mantiene por completo un sistema externo, y NocoBase solo lee los resultados durante las conversaciones

Si solo quieres cargar archivos en NocoBase, dividir documentos automáticamente y generar índices vectoriales, usa una base de conocimiento Local por defecto.

## Punto de extensión

Las bases de conocimiento externas se registran mediante el punto de extensión `vectorStoreProvider` proporcionado por `@nocobase/plugin-ai`. En el servidor necesitas implementar dos objetos:

| Objeto | Uso |
| --- | --- |
| `VectorStoreProvider` | Declara el identificador del proveedor externo y crea el servicio de recuperación |
| `VectorStoreService` | Ejecuta la recuperación y devuelve fragmentos utilizables por los AI employees |

`providerName` es el identificador único del proveedor. El Provider seleccionado o introducido al crear una base External debe coincidir con el `providerName` registrado en el servidor.

## Registrar el Provider

En `src/server/plugin.ts`, obtén la instancia del plugin AI y registra tu `VectorStoreProvider`:

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

La fase `load()` es adecuada para registrar puntos de extensión. No necesitas conectar la base vectorial externa aquí, ni ejecutar solicitudes de recuperación. La conexión y la consulta reales deben estar en `VectorStoreService`.

Los plugins de base de conocimiento externa siempre dependen de `@nocobase/plugin-ai-knowledge-base`. Se recomienda comprobar esta dependencia en `beforeEnable()`:

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

Así, si el plugin dependiente no está habilitado, el usuario recibirá un mensaje claro.

## Implementar el Provider

El Provider solo necesita proporcionar `providerName` y crear un service a partir de la configuración de la base de conocimiento.

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

`vectorStoreProps` proviene del formulario de configuración de la base externa, por ejemplo endpoint de API, API key, modelo de Embedding o identificador de tenant. NocoBase pasa estos valores al Provider al ejecutar la recuperación.

## Implementar el Service

El Service contiene la lógica de recuperación. Para una base External, normalmente basta con convertir los resultados externos al formato `DocumentSegmentedWithScore[]` requerido por NocoBase.

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

    // Aquí puedes conectar directamente una base vectorial o llamar a un servicio RAG externo.
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
    // Sustituye esto por la llamada a tu servicio externo.
    return [];
  }
}
```

Puntos clave:

- **`query`** - La pregunta que el AI employee necesita recuperar
- **`topK`** - Número esperado de fragmentos devueltos
- **`score`** - Umbral de puntuación configurado en la base de conocimiento del AI employee
- **`vectorStoreProps`** - Parámetros rellenados en el formulario de configuración de la base externa

:::tip Sobre `getVectorStore()`

La interfaz `VectorStoreService` incluye `getVectorStore()`. Una base External solo se encarga de recuperar datos y no permite que NocoBase gestione el vector store subyacente, por eso el ejemplo lanza un error directamente.

:::

## Devolver resultados de recuperación

`search()` debe devolver `DocumentSegmentedWithScore[]`:

```ts
type DocumentSegmentedWithScore = {
  id?: string;
  content: string;
  metadata: Record<string, unknown>;
  score: number;
};
```

Donde:

- `content` es el fragmento que se pasará al modelo
- `metadata` guarda origen, título, URL, información de permisos y otros metadatos
- `score` es la puntuación de recuperación. Se recomienda normalizarla para que un valor mayor signifique mayor relevancia
- `id` identifica el fragmento externo y ayuda a depurar o deduplicar

Si el servicio externo usa otro significado de puntuación, por ejemplo una distancia menor significa mayor relevancia, conviértelo antes de devolverlo a NocoBase.

## Configurar parámetros de la base externa

El servidor puede leer `vectorStoreProps` directamente, pero estos parámetros normalmente deben rellenarse al crear una base External. Por eso el formulario de configuración debe registrarse en la entrada frontend del plugin. Tras registrarlo, NocoBase mostrará los campos en el formulario de creación y pasará los valores al servidor durante la recuperación.

:::tip Nota

La configuración de formulario frontend no es obligatoria. Si tu base externa no necesita parámetros personalizados, no tienes que registrar `vectorStorePropForm`.

:::

Para casos simples, usa `defaultVectorStorePropForm()` por defecto. Recibe una lista de campos, genera un item de formulario por cada campo y usa un input que permite seleccionar variables de NocoBase:

| Parámetro | Uso |
| --- | --- |
| `key` | Nombre usado para guardar el parámetro y pasarlo al servidor |
| `label` | Etiqueta del campo |
| `tooltip` | Tooltip del campo |
| `required` | Si es obligatorio; al activarlo se genera validación requerida |
| `password` | Si se muestra como campo de contraseña, útil para API keys y secrets |

Registra el formulario en la entrada frontend del plugin:

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

`name` debe coincidir con el `providerName` del servidor. `key` es el nombre del campo usado al guardar el parámetro y pasarlo al servidor; el servidor puede leerlo desde `vectorStoreProps` con el mismo key.

### Formulario personalizado

Además de `defaultVectorStorePropForm()`, puedes pasar un componente React personalizado a `vectorStorePropForm`:

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

## Estructura de ejemplo

Un plugin de base de conocimiento externa puede organizarse así:

```text
src/server/plugin.ts
src/server/vector-store/provider.ts
src/server/vector-store/service.ts
src/client/index.tsx
```

Donde:

- `plugin.ts` registra `VectorStoreProvider`
- `provider.ts` declara `providerName` y crea el service
- `service.ts` implementa `search()` y convierte los resultados externos a `DocumentSegmentedWithScore[]`
- `client/index.tsx` registra el formulario de configuración

Con esto, el plugin de base externa ya puede ser llamado por los AI employees. Cuando el usuario cree una base External y seleccione el Provider correspondiente, las conversaciones podrán recuperar fragmentos mediante tu `search()`.

## Enlaces relacionados

- [Visión general de la base de conocimiento](../../ai-employees/knowledge-base/knowledge-base/) - Límites de Local, Readonly y External
- [Plugin](./plugin.md) - Ciclo de vida del plugin de servidor y `this.app.pm`
- [i18n](./i18n.md) - Traducciones frontend y servidor del plugin
- [Visión general del desarrollo del cliente](../client/index.md) - Entrada cliente, componentes y capacidades de contexto
