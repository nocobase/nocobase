:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# HasManyRepository

`HasManyRepository` est un dépôt de relation utilisé pour gérer les relations `HasMany`.

## Méthodes de classe

### `find()`

Rechercher des objets associés

**Signature**

- `async find(options?: FindOptions): Promise<M[]>`

**Détails**

Les paramètres de requête sont identiques à ceux de [`Repository.find()`](../repository.md#find).

### `findOne()`

Rechercher un objet associé, en ne renvoyant qu'un seul enregistrement.

**Signature**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

Renvoie le nombre d'enregistrements correspondant aux conditions de requête.

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

Interroge la base de données pour obtenir un ensemble de données et le nombre de résultats correspondant à des conditions spécifiques.

**Signature**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Type**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Créer des objets associés

**Signature**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Mettre à jour les objets associés qui remplissent les conditions.

**Signature**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Supprimer les objets associés qui remplissent les conditions.

**Signature**

- `async destroy(options?: TK | DestroyOptions): Promise<M>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Ajouter des associations d'objets.

**Signature**

- `async add(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Type**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

**Détails**

- `tk` - La valeur `targetKey` de l'objet associé, qui peut être une valeur unique ou un tableau.
  <embed src="../shared/transaction.md"></embed>

### `remove()`

Supprimer l'association avec les objets donnés.

**Signature**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Détails**

Les paramètres sont identiques à ceux de la méthode [`add()`](#add).

### `set()`

Définir les objets associés pour la relation actuelle.

**Signature**

- `async set(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Détails**

Les paramètres sont identiques à ceux de la méthode [`add()`](#add).