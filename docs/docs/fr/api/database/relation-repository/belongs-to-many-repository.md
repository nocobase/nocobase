:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# BelongsToManyRepository

`BelongsToManyRepository` est un `Relation Repository` utilisé pour gérer les relations `BelongsToMany`.

Contrairement aux autres types de relations, les relations `BelongsToMany` nécessitent l'utilisation d'une table de jonction pour être enregistrées.
Lorsque vous définissez une relation d'association dans NocoBase, une table de jonction peut être créée automatiquement ou spécifiée explicitement.

## Méthodes de classe

### `find()`

Trouve les objets associés.

**Signature**

- `async find(options?: FindOptions): Promise<M[]>`

**Détails**

Les paramètres de requête sont identiques à ceux de [`Repository.find()`](../repository.md#find).

### `findOne()`

Trouve un objet associé, ne renvoyant qu'un seul enregistrement.

**Signature**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

Renvoie le nombre d'enregistrements correspondant aux conditions de la requête.

**Signature**

- `async count(options?: CountOptions)`

**Type**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

### `findAndCount()`

Interroge la base de données pour obtenir un ensemble de données et le nombre total d'enregistrements sous des conditions spécifiques.

**Signature**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Type**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Crée un objet associé.

**Signature**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Met à jour les objets associés qui remplissent les conditions.

**Signature**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Supprime les objets associés qui remplissent les conditions.

**Signature**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<Boolean>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Ajoute de nouveaux objets associés.

**Signature**

- `async add(
options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions
): Promise<void>`

**Type**

```typescript
type PrimaryKeyWithThroughValues = [TargetKey, Values];

interface AssociatedOptions extends Transactionable {
  tk?:
    | TargetKey
    | TargetKey[]
    | PrimaryKeyWithThroughValues
    | PrimaryKeyWithThroughValues[];
}
```

**Détails**

Vous pouvez passer directement le `targetKey` de l'objet associé, ou passer le `targetKey` avec les valeurs des champs de la table de jonction.

**Exemple**

```typescript
const t1 = await Tag.repository.create({
  values: { name: 't1' },
});

const t2 = await Tag.repository.create({
  values: { name: 't2' },
});

const p1 = await Post.repository.create({
  values: { title: 'p1' },
});

const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

// Passe le targetKey
PostTagRepository.add([t1.id, t2.id]);

// Passe les champs de la table de jonction
PostTagRepository.add([
  [t1.id, { tagged_at: '123' }],
  [t2.id, { tagged_at: '456' }],
]);
```

### `set()`

Définit les objets associés.

**Signature**

- async set(
  options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ): Promise<void>

**Détails**

Les paramètres sont les mêmes que pour [add()](#add).

### `remove()`

Supprime l'association avec les objets donnés.

**Signature**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Type**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

### `toggle()`

Bascule les objets associés.

Dans certains scénarios métier, il est souvent nécessaire de basculer les objets associés. Par exemple, un utilisateur peut ajouter un produit à ses favoris, le retirer, puis l'ajouter à nouveau. La méthode `toggle` permet d'implémenter rapidement une telle fonctionnalité.

**Signature**

- `async toggle(options: TargetKey | { tk?: TargetKey; transaction?: Transaction }): Promise<void>`

**Détails**

La méthode `toggle` vérifie automatiquement si l'objet associé existe déjà. S'il existe, il est supprimé ; sinon, il est ajouté.