:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Requêtes

NocoBase met à votre disposition un `APIClient` basé sur [Axios](https://axios-http.com/). Vous pouvez l'utiliser pour effectuer des requêtes HTTP depuis n'importe quel endroit où vous avez accès à un `Context`.

Voici les emplacements courants où vous pouvez obtenir un `Context` :

- `app.context`
- `engine.context`
- `plugin.context`
- `model.context`

## ctx.api.request()

La méthode `ctx.api.request()` est la plus couramment utilisée pour envoyer des requêtes. Ses paramètres et ses valeurs de retour sont strictement identiques à ceux de [axios.request()](https://axios-http.com/docs/req_config).

```ts
request<T = any, R = AxiosResponse<T>, D = any>(
  config: AxiosRequestConfig<D>,
): Promise<R>;
```

Utilisation de base

```ts
await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
```

Vous pouvez utiliser directement les configurations de requête Axios standard :

```ts
await ctx.api.request({
  url: 'users:create',
  method: 'post',
  data: {
    name: 'Tao Tao',
  },
});
```

## ctx.api.axios

`ctx.api.axios` est une instance de type `AxiosInstance`. Elle vous permet de modifier les configurations globales par défaut ou d'ajouter des intercepteurs de requêtes.

Modification de la configuration par défaut

```ts
axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
```

Pour plus de configurations disponibles, consultez la [configuration par défaut d'Axios](https://axios-http.com/docs/config_defaults).

## Intercepteurs de requêtes et de réponses

Les intercepteurs permettent de traiter les requêtes avant leur envoi ou les réponses après leur réception. Par exemple, vous pouvez les utiliser pour ajouter des en-têtes de requête de manière uniforme, sérialiser des paramètres ou afficher des messages d'erreur centralisés.

### Exemple d'intercepteur de requête

```ts
// Utilise qs pour sérialiser les paramètres
axios.interceptors.request.use((config) => {
  config.paramsSerializer = (params) =>
    qs.stringify(params, {
      strictNullHandling: true,
      arrayFormat: 'brackets',
    });
  return config;
});

// En-têtes de requête personnalisés
axios.interceptors.request.use((config) => {
  config.headers['Authorization'] = `Bearer token123`;
  config.headers['X-Hostname'] = 'localhost';
  config.headers['X-Timezone'] = '+08:00';
  config.headers['X-Locale'] = 'zh-CN';
  config.headers['X-Role'] = 'admin';
  config.headers['X-Authenticator'] = 'basic';
  config.headers['X-App'] = 'sub1';
  return config;
});
```

### Exemple d'intercepteur de réponse

```ts
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // En cas d'erreur de requête, afficher une notification unifiée
    ctx.notification.error({
      message: 'Erreur de réponse de la requête',
    });
    return Promise.reject(error);
  },
);
```

## En-têtes de requête personnalisés du serveur NocoBase

Voici les en-têtes de requête personnalisés pris en charge par le serveur NocoBase. Ils sont utiles dans les scénarios multi-applications, d'internationalisation, multi-rôles ou multi-authentification.

| En-tête | Description |
|--------|------|
| `X-App` | Spécifie l'application actuellement accédée dans les scénarios multi-applications |
| `X-Locale` | Langue actuelle (par exemple : `zh-CN`, `en-US`) |
| `X-Hostname` | Nom d'hôte du client |
| `X-Timezone` | Fuseau horaire du client (par exemple : `+08:00`) |
| `X-Role` | Rôle actuel |
| `X-Authenticator` | Méthode d'authentification de l'utilisateur actuel |

> 💡 **Conseil**  
> Ces en-têtes de requête sont généralement injectés automatiquement par les intercepteurs et n'ont pas besoin d'être définis manuellement. Vous ne devrez les ajouter manuellement que dans des scénarios spécifiques (comme les environnements de test ou les configurations multi-instances).

## Utilisation dans les composants

Dans les composants React, vous pouvez obtenir l'objet de contexte via `useFlowContext()` et ensuite appeler `ctx.api` pour envoyer des requêtes.

```ts
import { useFlowContext } from '@nocobase/client';

const MyComponent = () => {
  const ctx = useFlowContext();

  const fetchData = async () => {
    const response = await ctx.api.request({
      url: '/api/posts',
      method: 'get',
    });
    console.log(response.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return <div>Chargement...</div>;
};
```

### Utilisation avec useRequest d'ahooks

En développement, vous pouvez utiliser le Hook `useRequest` fourni par [ahooks](https://ahooks.js.org/hooks/use-request/index) pour gérer plus facilement le cycle de vie et l'état de vos requêtes.

```ts
import { useFlowContext } from '@nocobase/client';
import { useRequest } from 'ahooks';

const MyComponent = () => {
  const ctx = useFlowContext();

  const { data, loading, error, refresh } = useRequest(() =>
    ctx.api.request({
      url: 'posts:list',
      method: 'get',
    }),
  );

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur de requête : {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>Actualiser</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
};
```

Cette approche rend la logique de requête plus déclarative, gérant automatiquement les états de chargement, la gestion des erreurs et la logique de rafraîchissement. Elle est donc parfaitement adaptée à une utilisation dans les composants.