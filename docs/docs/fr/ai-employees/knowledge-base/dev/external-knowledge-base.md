---
title: "Plugin External Knowledge Base"
description: "Développement de plugin de base de connaissances NocoBase : enregistrer un Provider externe, implémenter VectorStoreService, retourner les résultats RAG et configurer les paramètres."
keywords: "plugin de base de connaissances,External Knowledge Base,VectorStoreProvider,VectorStoreService,RAG,AI employees,NocoBase"
---

# Plugin External Knowledge Base

Dans NocoBase, un **plugin de base de connaissances (External Knowledge Base Plugin)** permet d'étendre les sources de récupération RAG utilisées par les AI employees. Dans la plupart des cas, une base Local suffit. Un plugin de base externe n'est nécessaire que lorsque les documents, les données vectorielles ou la logique de récupération sont déjà maintenus par un système externe.

Un plugin de base externe ne participe pas au téléversement, à la segmentation, à la vectorisation ni à la suppression des documents dans NocoBase. Il reçoit uniquement les requêtes de récupération pendant les conversations des AI employees et retourne les segments de documents correspondants.

:::tip Lecture préalable

- [Vue d'ensemble de la base de connaissances](../knowledge-base/) - Comprendre les limites de Local, Readonly et External
- [Plugin](../../../plugin-development/server/plugin.md) - Comprendre le cycle de vie du plugin serveur et `this.app.pm`
- [i18n](../../../plugin-development/server/i18n.md) - Préparer les traductions si le plugin fournit un formulaire de configuration

:::

## Cas d'utilisation

Les bases de connaissances externes conviennent lorsque :

- Un service RAG indépendant existe déjà, par exemple un service interne de base de connaissances ou une API de récupération tierce
- Vous devez connecter une base vectorielle que NocoBase ne prend pas encore en charge nativement
- Vous devez appliquer des règles métier avant ou après la récupération, comme le filtrage des permissions, l'isolation des tenants, le reranking ou la déduplication
- Le cycle de vie des documents est entièrement géré par un système externe, et NocoBase ne fait que lire les résultats pendant les conversations

Si vous voulez seulement téléverser des fichiers dans NocoBase, découper les documents automatiquement et générer des index vectoriels, utilisez une base Local par défaut.

## Point d'extension

Les bases externes sont enregistrées via le point d'extension `vectorStoreProvider` fourni par `@nocobase/plugin-ai`. Côté serveur, deux objets sont nécessaires :

| Objet | Rôle |
| --- | --- |
| `VectorStoreProvider` | Déclare l'identifiant du Provider externe et crée le service de récupération |
| `VectorStoreService` | Exécute la récupération et retourne les segments utilisables par les AI employees |

`providerName` est l'identifiant unique du Provider. Le Provider sélectionné ou saisi lors de la création d'une base External doit correspondre au `providerName` enregistré côté serveur.

## Enregistrer le Provider

Dans `src/server/plugin.ts`, récupérez l'instance du plugin AI et enregistrez votre `VectorStoreProvider` :

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

La phase `load()` convient à l'enregistrement des points d'extension. Il n'est pas nécessaire d'y connecter la base vectorielle externe ni d'y exécuter des requêtes de récupération. Placez la connexion et la requête réelles dans `VectorStoreService`.

Les plugins de base externe dépendent toujours de `@nocobase/plugin-ai-knowledge-base`. Il est recommandé de vérifier cette dépendance dans `beforeEnable()` :

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

Ainsi, si le plugin requis n'est pas activé, l'utilisateur obtient un message clair.

## Implémenter le Provider

Le Provider fournit `providerName` et crée un service à partir de la configuration de la base.

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

`vectorStoreProps` provient du formulaire de configuration de la base externe, par exemple endpoint API, API key, modèle Embedding ou identifiant de tenant. NocoBase transmet ces valeurs au Provider pendant la récupération.

## Implémenter le Service

Le Service contient la logique de récupération. Pour une base External, il suffit généralement de convertir les résultats externes au format `DocumentSegmentedWithScore[]` requis par NocoBase.

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

    // Ici, vous pouvez connecter directement une base vectorielle ou appeler un service RAG externe.
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
    // Remplacez ceci par l'appel à votre service externe.
    return [];
  }
}
```

Points clés :

- **`query`** - La question utilisée pour la récupération
- **`topK`** - Le nombre attendu de segments retournés
- **`score`** - Le seuil de score configuré dans les paramètres de base de connaissances de l'AI employee
- **`vectorStoreProps`** - Les paramètres renseignés dans le formulaire de configuration de la base externe

:::tip À propos de `getVectorStore()`

L'interface `VectorStoreService` contient `getVectorStore()`. Une base External ne fait que la récupération et ne laisse pas NocoBase gérer le vector store sous-jacent, donc l'exemple lève directement une erreur.

:::

## Retourner les résultats

`search()` doit retourner `DocumentSegmentedWithScore[]` :

```ts
type DocumentSegmentedWithScore = {
  id?: string;
  content: string;
  metadata: Record<string, unknown>;
  score: number;
};
```

Où :

- `content` est le segment transmis au modèle
- `metadata` stocke la source, le titre, l'URL, les informations de permission et d'autres métadonnées
- `score` est le score de récupération. Il est recommandé de le normaliser pour qu'une valeur plus grande signifie une meilleure pertinence
- `id` identifie le segment externe et facilite le diagnostic et la déduplication

Si le service externe utilise une autre signification du score, par exemple une distance plus petite signifie une meilleure pertinence, convertissez-la avant de la retourner à NocoBase.

## Configurer les paramètres

Le serveur peut lire directement `vectorStoreProps`, mais ces paramètres doivent généralement être renseignés par l'utilisateur lors de la création d'une base External. Le formulaire de configuration doit donc être enregistré dans l'entrée frontend du plugin. Une fois enregistré, NocoBase affiche les champs correspondants dans le formulaire de création et transmet les valeurs au serveur pendant la récupération.

:::tip Remarque

Le formulaire frontend est facultatif. Si votre base externe n'a pas besoin de paramètres personnalisés, vous n'avez pas besoin d'enregistrer `vectorStorePropForm`.

:::

Pour les cas simples, utilisez `defaultVectorStorePropForm()` par défaut. Il reçoit une liste de champs, crée un item de formulaire pour chaque champ et utilise une saisie qui prend en charge la sélection de variables NocoBase :

| Paramètre | Rôle |
| --- | --- |
| `key` | Nom utilisé pour enregistrer le paramètre et le transmettre au serveur |
| `label` | Libellé du champ |
| `tooltip` | Info-bulle du champ |
| `required` | Indique si le champ est obligatoire |
| `password` | Affiche le champ comme un mot de passe, adapté aux API keys et secrets |

Enregistrez le formulaire dans l'entrée frontend du plugin :

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

`name` doit correspondre au `providerName` côté serveur. `key` est le nom utilisé pour enregistrer le paramètre et le transmettre au serveur ; le serveur peut lire la valeur dans `vectorStoreProps` avec la même key.

### Formulaire personnalisé

En plus de `defaultVectorStorePropForm()`, vous pouvez passer un composant React personnalisé à `vectorStorePropForm` :

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

## Structure d'exemple

Un plugin de base externe peut être organisé ainsi :

```text
src/server/plugin.ts
src/server/vector-store/provider.ts
src/server/vector-store/service.ts
src/client/index.tsx
```

Où :

- `plugin.ts` enregistre `VectorStoreProvider`
- `provider.ts` déclare `providerName` et crée le service
- `service.ts` implémente `search()` et convertit les résultats externes en `DocumentSegmentedWithScore[]`
- `client/index.tsx` enregistre le formulaire de configuration

À ce stade, le plugin peut être appelé par les AI employees. Après la création d'une base External et la sélection du Provider correspondant, les conversations peuvent récupérer des segments via votre `search()`.

## Liens associés

- [Vue d'ensemble de la base de connaissances](../knowledge-base/) - Limites de Local, Readonly et External
- [Plugin](../../../plugin-development/server/plugin.md) - Cycle de vie du plugin serveur et `this.app.pm`
- [i18n](../../../plugin-development/server/i18n.md) - Traductions frontend et serveur du plugin
- [Vue d'ensemble du développement client](../../../plugin-development/client/index.md) - Entrée client, composants et capacités de contexte
