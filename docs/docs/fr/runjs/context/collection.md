:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/collection).
:::

# ctx.collection

L'instance de collection associée au contexte d'exécution RunJS actuel, utilisée pour accéder aux métadonnées de la collection, aux définitions de champs, aux clés primaires et à d'autres configurations. Elle provient généralement de `ctx.blockModel.collection` ou `ctx.collectionField?.collection`.

## Cas d'utilisation

| Scénario | Description |
|------|------|
| **JSBlock** | La collection liée au bloc ; permet d'accéder à `name`, `getFields`, `filterTargetKey`, etc. |
| **JSField / JSItem / JSColumn** | La collection à laquelle appartient le champ actuel (ou la collection du bloc parent), utilisée pour récupérer les listes de champs, les clés primaires, etc. |
| **Colonne de tableau / Bloc de détails** | Utilisé pour le rendu basé sur la structure de la collection ou pour passer `filterByTk` lors de l'ouverture de fenêtres contextuelles. |

> Remarque : `ctx.collection` est disponible dans les scénarios où un bloc de données, un bloc de formulaire ou un bloc de tableau est lié à une collection. Dans un JSBlock indépendant non lié à une collection, il peut être `null`. Il est recommandé d'effectuer une vérification de valeur nulle avant utilisation.

## Définition du type

```ts
collection: Collection | null | undefined;
```

## Propriétés courantes

| Propriété | Type | Description |
|------|------|------|
| `name` | `string` | Nom de la collection (ex: `users`, `orders`) |
| `title` | `string` | Titre de la collection (inclut l'internationalisation) |
| `filterTargetKey` | `string \| string[]` | Nom du champ de la clé primaire, utilisé pour `filterByTk` et `getFilterByTK` |
| `dataSourceKey` | `string` | Clé de la source de données (ex: `main`) |
| `dataSource` | `DataSource` | L'instance de la source de données à laquelle elle appartient |
| `template` | `string` | Modèle de collection (ex: `general`, `file`, `tree`) |
| `titleableFields` | `CollectionField[]` | Liste des champs pouvant être affichés comme titres |
| `titleCollectionField` | `CollectionField` | L'instance du champ de titre |

## Méthodes courantes

| Méthode | Description |
|------|------|
| `getFields(): CollectionField[]` | Récupérer tous les champs (y compris ceux hérités) |
| `getField(name: string): CollectionField \| undefined` | Récupérer un seul champ par son nom |
| `getFieldByPath(path: string): CollectionField \| undefined` | Récupérer un champ par son chemin (prend en charge les associations, ex: `user.name`) |
| `getAssociationFields(types?): CollectionField[]` | Récupérer les champs d'association ; `types` peut être `['one']`, `['many']`, etc. |
| `getFilterByTK(record): any` | Extraire la valeur de la clé primaire d'un enregistrement, utilisé pour le `filterByTk` de l'API |

## Relation avec ctx.collectionField et ctx.blockModel

| Besoin | Usage recommandé |
|------|----------|
| **Collection associée au contexte actuel** | `ctx.collection` (équivalent à `ctx.blockModel?.collection` ou `ctx.collectionField?.collection`) |
| **Définition de la collection du champ actuel** | `ctx.collectionField?.collection` (la collection à laquelle appartient le champ) |
| **Collection cible de l'association** | `ctx.collectionField?.targetCollection` (la collection cible d'un champ d'association) |

Dans des scénarios tels que les sous-tableaux, `ctx.collection` peut être la collection cible de l'association ; dans les formulaires ou tableaux standards, il s'agit généralement de la collection liée au bloc.

## Exemples

### Obtenir la clé primaire et ouvrir une fenêtre contextuelle

```ts
const primaryKey = ctx.collection?.filterTargetKey ?? 'id';
await ctx.openView(popupUid, {
  mode: 'dialog',
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### Parcourir les champs pour la validation ou la liaison

```ts
const fields = ctx.collection?.getFields() ?? [];
const requiredFields = fields.filter((f) => f.options?.required);
for (const f of requiredFields) {
  const v = ctx.form?.getFieldValue(f.name);
  if (v == null || v === '') {
    ctx.message.warning(`${f.title} est requis`);
    return;
  }
}
```

### Obtenir les champs d'association

```ts
const oneToMany = ctx.collection?.getAssociationFields(['many']) ?? [];
// Utilisé pour construire des sous-tableaux, des ressources associées, etc.
```

## Remarques

- `filterTargetKey` est le nom du champ de la clé primaire de la collection. Certaines collections peuvent utiliser une clé primaire composée `string[]`. Si elle n'est pas configurée, `'id'` est couramment utilisé par défaut.
- Dans les scénarios tels que les **sous-tableaux ou les champs d'association**, `ctx.collection` peut pointer vers la collection cible de l'association, ce qui diffère de `ctx.blockModel.collection`.
- `getFields()` fusionne les champs des collections héritées ; les champs locaux remplacent les champs hérités portant le même nom.

## Voir aussi

- [ctx.collectionField](./collection-field.md) : Définition du champ de collection du champ actuel
- [ctx.blockModel](./block-model.md) : Le bloc parent hébergeant le JS actuel, contenant `collection`
- [ctx.model](./model.md) : Le modèle actuel, qui peut contenir `collection`