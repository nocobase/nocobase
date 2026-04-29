---
title: "Développement de composants Component"
description: "Développement de composants côté client NocoBase : utilisation de React/Antd pour les pages de plugin, gestion d'état avec observable, accès aux capacités du contexte NocoBase via useFlowContext()."
keywords: "Component,développement de composants,React,Antd,observable,observer,useFlowContext,ctx,NocoBase"
---

# Développement de composants Component

Dans NocoBase, les composants de page montés sur des routes sont de simples composants React. Vous pouvez les écrire directement avec React + [Antd](https://5x.ant.design/), comme en développement front-end ordinaire.

NocoBase fournit en plus :

- **`observable` + `observer`** — la gestion d'état recommandée, plus adaptée à l'écosystème NocoBase que `useState`
- **`useFlowContext()`** — récupère les capacités du contexte NocoBase (envoi de requêtes, internationalisation, navigation entre routes, etc.)

## Écriture de base

Un composant de page minimal :

```tsx
// pages/HelloPage.tsx
export default function HelloPage() {
  return <h1>Hello, NocoBase!</h1>;
}
```

Une fois écrit, enregistrez-le avec `this.router.add()` dans le `load()` du plugin. Voir [Router](../router) pour les détails.

## Gestion d'état : observable

NocoBase recommande `observable` + `observer` pour gérer l'état des composants plutôt que `useState`. Avantages :

- Modifier directement les propriétés de l'objet déclenche la mise à jour, sans `setState`
- Collection automatique des dépendances : le composant ne re-rend que lorsque les propriétés utilisées changent
- Cohérent avec le mécanisme réactif de la couche basse de NocoBase (FlowModel, FlowContext, etc.)

Utilisation de base : créez un objet réactif avec `observable.deep()` et enveloppez le composant avec `observer()`. `observable` et `observer` s'importent depuis `@nocobase/flow-engine` :

```tsx
import React from 'react';
import { Input } from 'antd';
import { observable, observer } from '@nocobase/flow-engine';

// Crée un objet d'état réactif
const state = observable.deep({
  text: '',
});

// Enveloppe le composant avec observer pour mise à jour automatique
const DemoPage = observer(() => {
  return (
    <div>
      <Input
        placeholder="Saisissez quelque chose..."
        value={state.text}
        onChange={(e) => {
          state.text = e.target.value;
        }}
      />
      {state.text && <div style={{ marginTop: 8 }}>Vous avez saisi : {state.text}</div>}
    </div>
  );
});

export default DemoPage;
```

Aperçu :

```tsx file="./_demos/observable-basic.tsx" preview
```

Voir [Mécanisme réactif Observable](../../../flow-engine/observable) pour plus de détails.

## Utilisation de useFlowContext

`useFlowContext()` est le point d'entrée pour accéder aux capacités de NocoBase. Importez-le depuis `@nocobase/flow-engine` ; il renvoie un objet `ctx` :

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();
  // ctx.api — envoyer des requêtes
  // ctx.t — internationalisation
  // ctx.router — navigation entre routes
  // ctx.logger — logs
  // ...
}
```

Voici quelques exemples d'utilisations courantes.

### Envoyer une requête

`ctx.api.request()` appelle les API back-end, avec la même utilisation qu'[Axios](https://axios-http.com/) :

```tsx
const response = await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
console.log(response.data);
```

### Internationalisation

`ctx.t()` renvoie le texte traduit :

```tsx
const label = ctx.t('Hello');
// Spécifier le namespace
const msg = ctx.t('Save success', { ns: '@my-project/plugin-hello' });
```

### Navigation entre routes

`ctx.router.navigate()` permet de naviguer vers une autre page :

```tsx
ctx.router.navigate('/some-page'); // -> /v2/some-page
```

Récupérer les paramètres de la route courante :

```tsx
// par exemple route définie comme /users/:id
const { id } = ctx.route.params; // récupère le paramètre dynamique
```

Récupérer le nom de la route courante :

```tsx
const { name } = ctx.route; // récupère le nom de la route
```

<!-- ### Messages, modales et notifications

NocoBase encapsule via ctx les composants de feedback d'Antd, utilisables directement dans la logique :

```tsx
// Message (léger, disparaît automatiquement)
ctx.message.success('Sauvegardé avec succès');

// Confirmation modale (bloquant, attend l'action de l'utilisateur)
const confirmed = await ctx.modal.confirm({
  title: 'Confirmer la suppression ?',
  content: 'La suppression est irréversible',
});

// Notification (apparaît à droite, pour des messages plus longs)
ctx.notification.open({
  message: 'Import terminé',
  description: '42 enregistrements importés au total',
});
```

### Logs

`ctx.logger` produit des logs structurés :

```tsx
ctx.logger.info('Page chargée', { page: 'UserList' });
ctx.logger.error('Échec du chargement des données', { error });
``` -->

Voir [Context → Capacités courantes](../ctx/common-capabilities) pour plus de niveaux et d'utilisations de logs.

## Exemple complet

En combinant observable, useFlowContext et Antd, voici un composant de page qui récupère et affiche des données du back-end :

```tsx
// pages/PostListPage.tsx
import React, { useEffect } from 'react';
import { Button, Card, List, Spin } from 'antd';
import { observable, observer, FlowContext, useFlowContext } from '@nocobase/flow-engine';

interface Post {
  id: number;
  title: string;
}

// État de la page géré par observable
const state = observable.deep({
  posts: [] as Post[],
  loading: true,
});

const PostListPage = observer(() => {
  const ctx = useFlowContext();

  useEffect(() => {
    loadPosts(ctx);
  }, []);

  return (
    <Card title={ctx.t('Post list')}>
      <Spin spinning={state.loading}>
        <List
          dataSource={state.posts}
          renderItem={(post: Post) => (
            <List.Item
              actions={[
                <Button danger onClick={() => handleDelete(ctx, post.id)}>
                  {ctx.t('Delete')}
                </Button>,
              ]}
            >
              {post.title}
            </List.Item>
          )}
        />
      </Spin>
    </Card>
  );
});

async function loadPosts(ctx: FlowContext) {
  state.loading = true;
  try {
    const response = await ctx.api.request({
      url: 'posts:list',
      method: 'get',
    });
    state.posts = response.data?.data || [];
  } catch (error) {
    ctx.logger.error('Échec du chargement de la liste des articles', { error });
  } finally {
    state.loading = false;
  }
}

async function handleDelete(ctx: FlowContext, id: number) {
  await ctx.api.request({
    url: `posts:destroy/${id}`,
    method: 'post',
  });
  loadPosts(ctx); // rafraîchit la liste
}

export default PostListPage;
```

## Et ensuite ?

- Capacités complètes fournies par `useFlowContext` — voir [Context](../ctx/index.md)
- Styles et personnalisation du thème — voir [Styles & Thèmes](./styles-themes)
- Si votre composant doit apparaître dans le menu « Ajouter un bloc / champ / action » et supporter la configuration visuelle, il faut l'encapsuler avec FlowModel — voir [FlowEngine](../flow-engine/index.md)
- Vous hésitez entre Component et FlowModel ? — voir [Component vs FlowModel](../component-vs-flow-model)

## Liens connexes

- [Router](../router) — enregistrement de routes de page, monter un composant sur une URL
- [Context](../ctx/index.md) — présentation complète des capacités de useFlowContext
- [Styles & Thèmes](./styles-themes) — createStyles, tokens de thème, etc.
- [FlowEngine](../flow-engine/index.md) — utilisez FlowModel quand la configuration visuelle est nécessaire
- [Mécanisme réactif Observable](../../../flow-engine/observable) — gestion d'état réactive de FlowEngine
- [Context → Capacités courantes](../ctx/common-capabilities) — capacités intégrées comme ctx.api, ctx.t, etc.
- [Component vs FlowModel](../component-vs-flow-model) — choisir entre composant et FlowModel
