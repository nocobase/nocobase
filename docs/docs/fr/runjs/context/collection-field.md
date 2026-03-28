:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/collection-field).
:::

# ctx.collectionField

L'instance `CollectionField` associée au contexte d'exécution RunJS actuel, utilisée pour accéder aux métadonnées du champ, à son type, aux règles de validation et aux informations d'association. Elle n'existe que lorsque le champ est lié à une définition de collection ; les champs personnalisés ou virtuels peuvent être `null`.

## Cas d'utilisation

| Scénario | Description |
|------|------|
| **JSField** | Effectuer une liaison ou une validation dans les champs de formulaire en fonction de l'interface (`interface`), de l'énumération (`enum`), de la collection cible (`targetCollection`), etc. |
| **JSItem** | Accéder aux métadonnées du champ correspondant à la colonne actuelle dans les éléments d'un sous-tableau. |
| **JSColumn** | Sélectionner les méthodes de rendu basées sur `collectionField.interface` ou accéder à `targetCollection` dans les colonnes d'un tableau. |

> **Note :** `ctx.collectionField` est uniquement disponible lorsque le champ est lié à une définition de collection. Il est généralement `undefined` dans des scénarios tels que les blocs indépendants JSBlock ou les événements d'action sans liaison de champ. Il est recommandé de vérifier la présence de valeurs nulles avant utilisation.

## Définition du type

```ts
collectionField: CollectionField | null | undefined;
```

## Propriétés courantes

| Propriété | Type | Description |
|------|------|------|
| `name` | `string` | Nom du champ (ex: `status`, `userId`) |
| `title` | `string` | Titre du champ (incluant l'internationalisation) |
| `type` | `string` | Type de données du champ (`string`, `integer`, `belongsTo`, etc.) |
| `interface` | `string` | Type d'interface du champ (`input`, `select`, `m2o`, `o2m`, `m2m`, etc.) |
| `collection` | `Collection` | La collection à laquelle appartient le champ |
| `targetCollection` | `Collection` | La collection cible du champ d'association (uniquement pour les types d'association) |
| `target` | `string` | Nom de la collection cible (pour les champs d'association) |
| `enum` | `array` | Options d'énumération (select, radio, etc.) |
| `defaultValue` | `any` | Valeur par défaut |
| `collectionName` | `string` | Nom de la collection d'appartenance |
| `foreignKey` | `string` | Nom du champ de clé étrangère (belongsTo, etc.) |
| `sourceKey` | `string` | Clé source de l'association (hasMany, etc.) |
| `targetKey` | `string` | Clé cible de l'association |
| `fullpath` | `string` | Chemin complet (ex: `main.users.status`), utilisé pour l'API ou les références de variables |
| `resourceName` | `string` | Nom de la ressource (ex: `users.status`) |
| `readonly` | `boolean` | Indique si le champ est en lecture seule |
| `titleable` | `boolean` | Indique si le champ peut être affiché comme titre |
| `validation` | `object` | Configuration des règles de validation |
| `uiSchema` | `object` | Configuration de l'interface utilisateur (UI) |
| `targetCollectionTitleField` | `CollectionField` | Le champ de titre de la collection cible (pour les champs d'association) |

## Méthodes courantes

| Méthode | Description |
|------|------|
| `isAssociationField(): boolean` | Indique s'il s'agit d'un champ d'association (belongsTo, hasMany, hasOne, belongsToMany, etc.) |
| `isRelationshipField(): boolean` | Indique s'il s'agit d'un champ de relation (incluant o2o, m2o, o2m, m2m, etc.) |
| `getComponentProps(): object` | Récupère les propriétés (`props`) par défaut du composant du champ |
| `getFields(): CollectionField[]` | Récupère la liste des champs de la collection cible (champs d'association uniquement) |
| `getFilterOperators(): object[]` | Récupère les opérateurs de filtrage supportés par ce champ (ex: `$eq`, `$ne`, etc.) |

## Exemples

### Rendu conditionnel basé sur le type de champ

```ts
if (!ctx.collectionField) return null;
const { interface: iface } = ctx.collectionField;
if (['m2o', 'o2m', 'm2m'].includes(iface)) {
  // Champ d'association : afficher les enregistrements associés
  const target = ctx.collectionField.targetCollection;
  // ...
} else if (iface === 'select' || iface === 'radioGroup') {
  const options = ctx.collectionField.enum || [];
  // ...
}
```

### Déterminer s'il s'agit d'un champ d'association et accéder à la collection cible

```ts
if (ctx.collectionField?.isAssociationField()) {
  const targetCol = ctx.collectionField.targetCollection;
  const titleField = targetCol?.titleCollectionField?.name;
  // Traiter selon la structure de la collection cible
}
```

### Récupérer les options d'énumération

```ts
const options = ctx.collectionField?.enum ?? [];
const labels = options.map((o) => (typeof o === 'object' ? o.label : o));
```

### Rendu conditionnel basé sur le mode lecture seule / affichage

```ts
const { Input } = ctx.libs.antd;
if (ctx.collectionField?.readonly) {
  ctx.render(<span>{ctx.getValue?.() ?? '-'}</span>);
} else {
  ctx.render(<Input onChange={(e) => ctx.setValue?.(e.target.value)} />);
}
```

### Obtenir le champ de titre de la collection cible

```ts
// Lors de l'affichage d'un champ d'association, utilisez targetCollectionTitleField pour obtenir le nom du champ de titre
const titleField = ctx.collectionField?.targetCollectionTitleField;
const titleKey = titleField?.name ?? 'title';
const assocValue = ctx.getValue?.() ?? ctx.record?.[ctx.collectionField?.name];
const label = assocValue?.[titleKey];
```

## Relation avec ctx.collection

| Besoin | Utilisation recommandée |
|------|----------|
| **Collection du champ actuel** | `ctx.collectionField?.collection` ou `ctx.collection` |
| **Métadonnées du champ (nom, type, interface, énumération, etc.)** | `ctx.collectionField` |
| **Collection cible** | `ctx.collectionField?.targetCollection` |

`ctx.collection` représente généralement la collection liée au bloc actuel ; `ctx.collectionField` représente la définition du champ actuel dans la collection. Dans des scénarios comme les sous-tableaux ou les champs d'association, les deux peuvent différer.

## Remarques

- Dans des scénarios tels que **JSBlock** ou **JSAction (sans liaison de champ)**, `ctx.collectionField` est généralement `undefined`. Il est recommandé d'utiliser le chaînage optionnel avant d'y accéder.
- Si un champ JS personnalisé n'est pas lié à un champ de collection, `ctx.collectionField` peut être `null`.
- `targetCollection` existe uniquement pour les champs de type association (ex: m2o, o2m, m2m) ; `enum` existe uniquement pour les champs avec des options comme select ou radioGroup.

## Voir aussi

- [ctx.collection](./collection.md) : Collection associée au contexte actuel
- [ctx.model](./model.md) : Modèle où se trouve le contexte d'exécution actuel
- [ctx.blockModel](./block-model.md) : Bloc parent portant le JS actuel
- [ctx.getValue()](./get-value.md), [ctx.setValue()](./set-value.md) : Lire et écrire la valeur du champ actuel