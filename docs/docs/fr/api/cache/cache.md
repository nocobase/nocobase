:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Cache

## Méthodes de base

Veuillez consulter la documentation de <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a>.

- `get()`
- `set()`
- `del()`
- `reset()`
- `wrap()`
- `mset()`
- `mget()`
- `mdel()`
- `keys()`
- `ttl()`

## Autres méthodes

### `wrapWithCondition()`

Cette méthode est similaire à `wrap()`, mais elle vous permet de décider de manière conditionnelle si vous souhaitez utiliser le cache.

```ts
async wrapWithCondition<T>(
  key: string,
  fn: () => T | Promise<T>,
  options?: {
    // Paramètre externe pour contrôler l'utilisation du résultat mis en cache
    useCache?: boolean;
    // Décide si la mise en cache est possible en fonction du résultat des données
    isCacheable?: (val: unknown) => boolean | Promise<boolean>;
    ttl?: Milliseconds;
  },
): Promise<T> {
```

### `setValueInObject()`

Lorsque le contenu mis en cache est un objet, modifiez la valeur d'une clé spécifique.

```ts
async setValueInObject(key: string, objectKey: string, value: unknown)
```

### `getValueInObject()`

Lorsque le contenu mis en cache est un objet, récupérez la valeur d'une clé spécifique.

```ts
async getValueInObject(key: string, objectKey: string)
```

### `delValueInObject()`

Lorsque le contenu mis en cache est un objet, supprimez une clé spécifique.

```ts
async delValueInObject(key: string, objectKey: string)
```