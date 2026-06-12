---
title: "KnowledgeBase-Plugin"
description: "Entwicklung eines NocoBase-Wissensdatenbank-Plugins: externen Provider registrieren, VectorStoreService implementieren, RAG-Ergebnisse zurückgeben und Parameter konfigurieren."
keywords: "Wissensdatenbank-Plugin,External Knowledge Base,VectorStoreProvider,VectorStoreService,RAG,AI employees,NocoBase"
---

# KnowledgeBase-Plugin

In NocoBase erweitert ein **KnowledgeBase-Plugin** die RAG-Abrufquellen für AI employees. In den meisten Fällen reicht eine Local knowledge base aus. Ein externes Wissensdatenbank-Plugin wird nur benötigt, wenn Dokumente, Vektordaten oder die Abruflogik bereits in einem externen System verwaltet werden.

Ein externes Wissensdatenbank-Plugin nimmt nicht am Hochladen, Segmentieren, Vektorisieren oder Löschen von Dokumenten in NocoBase teil. Es empfängt nur Abrufanfragen während Gesprächen von AI employees und gibt passende Dokumentsegmente zurück.

:::tip Vorab lesen

- [Überblick über Wissensdatenbanken](../../ai-employees/knowledge-base/knowledge-base/) - Grenzen von Local, Readonly und External verstehen
- [Plugin](./plugin.md) - Lebenszyklus serverseitiger Plugins und `this.app.pm`
- [i18n](./i18n.md) - Übersetzungen vorbereiten, wenn das Plugin ein Konfigurationsformular bereitstellt

:::

## Einsatzfälle

Externe Wissensdatenbanken eignen sich, wenn:

- bereits ein unabhängiger RAG-Dienst existiert, etwa ein interner Wissensdienst oder eine externe Retrieval-API
- eine Vektordatenbank angebunden werden muss, die NocoBase nicht direkt unterstützt
- Geschäftsregeln vor oder nach dem Abruf verarbeitet werden müssen, etwa Berechtigungsprüfungen, Tenant-Isolation, Reranking oder Deduplizierung
- der Dokumentlebenszyklus vollständig von einem externen System verwaltet wird und NocoBase nur Abrufresultate liest

Wenn Dateien nur in NocoBase hochgeladen, automatisch segmentiert und vektorisiert werden sollen, verwenden Sie standardmäßig eine Local knowledge base.

## Erweiterungspunkt

Externe Wissensdatenbanken werden über den von `@nocobase/plugin-ai` bereitgestellten Erweiterungspunkt `vectorStoreProvider` registriert. Serverseitig werden zwei Objekte implementiert:

| Objekt | Zweck |
| --- | --- |
| `VectorStoreProvider` | Deklariert den externen Provider-Namen und erstellt den Abruf-Service |
| `VectorStoreService` | Führt den Abruf aus und gibt Dokumentsegmente für AI employees zurück |

`providerName` ist die eindeutige Kennung des Providers. Der beim Erstellen einer External knowledge base ausgewählte oder eingegebene Provider muss mit dem serverseitig registrierten `providerName` übereinstimmen.

## Provider registrieren

In `src/server/plugin.ts` wird die AI-Plugin-Instanz geholt und der `VectorStoreProvider` registriert:

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

Die Phase `load()` eignet sich zum Registrieren von Erweiterungspunkten. Die Verbindung zur externen Vektordatenbank und die eigentlichen Abfragen gehören in `VectorStoreService`.

Externe Wissensdatenbank-Plugins hängen immer von `@nocobase/plugin-ai-knowledge-base` ab. Es wird empfohlen, diese Abhängigkeit in `beforeEnable()` zu prüfen:

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

So erhält der Benutzer eine klare Meldung, wenn das benötigte Plugin nicht aktiviert ist.

## Provider implementieren

Der Provider stellt `providerName` bereit und erstellt anhand der Konfiguration einen Service.

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

`vectorStoreProps` stammt aus dem Konfigurationsformular, zum Beispiel API endpoint, API key, Embedding-Modell oder Tenant-Kennung. NocoBase übergibt diese Werte beim Abruf an den Provider.

## Service implementieren

Der Service enthält die zentrale Abruflogik. Bei einer External knowledge base reicht es normalerweise, externe Abrufresultate in das von NocoBase benötigte Format `DocumentSegmentedWithScore[]` umzuwandeln.

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

    // Hier können Sie direkt eine Vektordatenbank anbinden oder einen externen RAG-Dienst aufrufen.
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
    // Ersetzen Sie dies durch den Aufruf Ihres externen Dienstes.
    return [];
  }
}
```

Wichtige Punkte:

- **`query`** - Die Frage, gegen die der AI employee abrufen soll
- **`topK`** - Die erwartete Anzahl zurückgegebener Segmente
- **`score`** - Der Score-Schwellenwert aus den Knowledge-Base-Einstellungen
- **`vectorStoreProps`** - Parameter aus dem Konfigurationsformular

:::tip Zu `getVectorStore()`

Das Interface `VectorStoreService` enthält `getVectorStore()`. Eine External knowledge base ist nur für den Abruf zuständig und lässt NocoBase den darunterliegenden Vector Store nicht verwalten; deshalb wirft das Beispiel direkt einen Fehler.

:::

## Abrufresultate zurückgeben

`search()` muss `DocumentSegmentedWithScore[]` zurückgeben:

```ts
type DocumentSegmentedWithScore = {
  id?: string;
  content: string;
  metadata: Record<string, unknown>;
  score: number;
};
```

Dabei gilt:

- `content` ist der Dokumentabschnitt, der an das Modell übergeben wird
- `metadata` speichert Quelle, Dokumenttitel, URL, Berechtigungsinformationen und weitere Metadaten
- `score` ist der Relevanzwert; größere Werte sollten höhere Relevanz bedeuten
- `id` identifiziert externe Dokumentsegmente und hilft bei Diagnose und Deduplizierung

Wenn der externe Dienst Scores anders interpretiert, etwa kleinere Distanz bedeutet höhere Relevanz, konvertieren Sie den Wert vor der Rückgabe an NocoBase.

## Parameter konfigurieren

Der Server kann `vectorStoreProps` direkt lesen, diese Parameter müssen aber meist beim Erstellen einer External knowledge base eingegeben werden. Daher wird das Konfigurationsformular im Frontend-Einstieg des Plugins registriert. Danach zeigt NocoBase die Felder im Erstellungsformular an und übergibt die Werte beim Abruf an den Server.

:::tip Hinweis

Ein Frontend-Formular ist optional. Wenn keine benutzerdefinierten Parameter benötigt werden, muss `vectorStorePropForm` nicht registriert werden.

:::

Für einfache Fälle verwenden Sie standardmäßig `defaultVectorStorePropForm()`. Die Funktion erhält eine Feldliste, erzeugt pro Feld ein Formularelement und verwendet ein Eingabefeld, das NocoBase-Variablen auswählen kann:

| Parameter | Zweck |
| --- | --- |
| `key` | Feldname beim Speichern und bei der Übergabe an den Server |
| `label` | Label des Formularelements |
| `tooltip` | Tooltip des Formularelements |
| `required` | Ob das Feld erforderlich ist |
| `password` | Anzeige als Passwortfeld, geeignet für API keys und secrets |

Registrieren Sie das Formular im Frontend-Einstieg des Plugins:

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

`name` muss dem serverseitigen `providerName` entsprechen. `key` ist der Feldname, unter dem der Wert gespeichert und an den Server übergeben wird.

### Benutzerdefiniertes Formular

Neben `defaultVectorStorePropForm()` kann auch eine eigene React-Komponente an `vectorStorePropForm` übergeben werden:

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

## Beispielstruktur

Ein externes Wissensdatenbank-Plugin kann so organisiert werden:

```text
src/server/plugin.ts
src/server/vector-store/provider.ts
src/server/vector-store/service.ts
src/client/index.tsx
```

Dabei:

- `plugin.ts` registriert `VectorStoreProvider`
- `provider.ts` deklariert `providerName` und erstellt den Service
- `service.ts` implementiert `search()` und konvertiert externe Ergebnisse in `DocumentSegmentedWithScore[]`
- `client/index.tsx` registriert das Konfigurationsformular

Damit kann das externe Wissensdatenbank-Plugin von AI employees aufgerufen werden. Nach dem Erstellen einer External knowledge base und der Auswahl des Providers können Gespräche Segmente über `search()` abrufen.

## Verwandte Links

- [Überblick über Wissensdatenbanken](../../ai-employees/knowledge-base/knowledge-base/) - Grenzen von Local, Readonly und External
- [Plugin](./plugin.md) - Serverseitiger Plugin-Lebenszyklus und `this.app.pm`
- [i18n](./i18n.md) - Frontend- und serverseitige Übersetzungen
- [Überblick Client-Entwicklung](../client/index.md) - Client-Einstieg, Komponenten und Context-Funktionen
