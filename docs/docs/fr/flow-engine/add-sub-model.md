---
title: "AddSubModelButton"
description: "AddSubModelButton : ajoute un subModel à un FlowModel donné, avec prise en charge des menus asynchrones, groupes, sous-menus, filtrage par classe d'héritage et mode interrupteur."
keywords: "AddSubModelButton,subModel,sous-modèle,FlowModel,FlowEngine,menu asynchrone,menu de groupe"
---

# AddSubModelButton

Permet d'ajouter un sous-modèle (subModel) dans un `FlowModel` donné. Prend en charge le chargement asynchrone, les groupes, les sous-menus, les règles d'héritage de modèles personnalisées et bien d'autres modes de configuration.

## Props

```ts pure
interface AddSubModelButtonProps {
  model: FlowModel;
  subModelKey: string;
  subModelType?: 'object' | 'array';
  items?: SubModelItemsType;
  subModelBaseClass?: string | ModelConstructor;
  subModelBaseClasses?: Array<string | ModelConstructor>;
  afterSubModelInit?: (subModel: FlowModel) => Promise<void>;
  afterSubModelAdd?: (subModel: FlowModel) => Promise<void>;
  afterSubModelRemove?: (subModel: FlowModel) => Promise<void>;
  children?: React.ReactNode;
  keepDropdownOpen?: boolean;
}
```

| Paramètre | Type | Description |
| --- | --- | --- |
| `model` | `FlowModel` | **Obligatoire**. Modèle cible auquel ajouter le sous-modèle. |
| `subModelKey` | `string` | **Obligatoire**. Clé du sous-modèle dans `model.subModels`. |
| `subModelType` | `'object' \| 'array'` | Type de structure de données du sous-modèle, par défaut `'array'`. |
| `items` | `SubModelItem[]` \| `(ctx) => SubModelItem[] \| Promise<...>` | Définition des éléments de menu, prend en charge la génération statique ou asynchrone. |
| `subModelBaseClass` | `string` \| `ModelConstructor` | Spécifie une classe de base. Liste tous les modèles qui en héritent comme éléments de menu. |
| `subModelBaseClasses` | `(string \| ModelConstructor)[]` | Spécifie plusieurs classes de base. Liste automatiquement les modèles hérités par groupe. |
| `afterSubModelInit` | `(subModel) => Promise<void>` | Callback après l'initialisation du sous-modèle. |
| `afterSubModelAdd` | `(subModel) => Promise<void>` | Callback après l'ajout du sous-modèle. |
| `afterSubModelRemove` | `(subModel) => Promise<void>` | Callback après la suppression du sous-modèle. |
| `children` | `React.ReactNode` | Contenu du bouton, personnalisable en texte ou icône. |
| `keepDropdownOpen` | `boolean` | Indique si le menu déroulant reste ouvert après l'ajout. Fermé automatiquement par défaut. |

## Définition du type SubModelItem

```ts pure
interface SubModelItem {
  key?: string;
  label?: string;
  type?: 'group' | 'divider';
  disabled?: boolean;
  hide?: boolean | ((ctx: FlowModelContext) => boolean | Promise<boolean>);
  icon?: React.ReactNode;
  children?: SubModelItemsType;
  useModel?: string;
  createModelOptions?: {
    props?: Record<string, any>;
    stepParams?: Record<string, any>;
  };
  toggleable?: boolean | ((model: FlowModel) => boolean);
}
```

| Champ | Type | Description |
| --- | --- | --- |
| `key` | `string` | Identifiant unique. |
| `label` | `string` | Texte d'affichage. |
| `type` | `'group' \| 'divider'` | Groupe ou séparateur. Si omis, c'est un élément normal ou un sous-menu. |
| `disabled` | `boolean` | Indique si l'élément courant est désactivé. |
| `hide` | `boolean` \| `(ctx) => boolean \| Promise<boolean>` | Masquage dynamique (retourner `true` pour masquer). |
| `icon` | `React.ReactNode` | Contenu de l'icône. |
| `children` | `SubModelItemsType` | Sous-éléments de menu, pour les groupes ou sous-menus imbriqués. |
| `useModel` | `string` | Spécifie le type de Model à utiliser (nom enregistré). |
| `createModelOptions` | `object` | Paramètres lors de l'initialisation du modèle. |
| `toggleable` | `boolean` \| `(model: FlowModel) => boolean` | Mode interrupteur : si déjà ajouté, le supprime ; sinon l'ajoute (un seul autorisé). |

## Exemples

### Ajouter des subModels avec `<AddSubModelButton />`

```tsx file="./_demos/add-sub-model/add-sub-model-basic.tsx" preview
```

- Utilisez `<AddSubModelButton />` pour ajouter des subModels. Le bouton doit être placé dans un FlowModel pour fonctionner.
- Utilisez `model.mapSubModels()` pour parcourir les subModels. La méthode `mapSubModels` gère les éléments manquants, le tri, etc.
- Utilisez `<FlowModelRenderer />` pour rendre les subModels.

### Différentes formes du AddSubModelButton

```tsx file="./_demos/add-sub-model/add-sub-model-icon.tsx" preview
```

- Vous pouvez utiliser le composant bouton `<Button>Add block</Button>` et le placer où bon vous semble.
- Vous pouvez également utiliser une icône `<PlusOutlined />`.
- Vous pouvez aussi le placer en haut à droite à l'emplacement Flow Settings.

### Prise en charge du mode interrupteur

```tsx file="./_demos/add-sub-model/add-sub-model-toggleable.tsx" preview
```

- Pour les scénarios simples, `toggleable: true` suffit. Par défaut, la recherche se fait par nom de classe : une seule instance d'une même classe est autorisée.
- Règle de recherche personnalisée : `toggleable: (model: FlowModel) => boolean`.

### Items asynchrones

```tsx file="./_demos/add-sub-model/add-sub-model-async-items.tsx" preview
```

Vous pouvez obtenir des items dynamiques depuis le contexte, par exemple :

- Une requête distante `ctx.api.request()`.
- Les données nécessaires depuis l'API fournie par `ctx.dataSourceManager`.
- Des propriétés ou méthodes contextuelles personnalisées.
- `items` et `children` prennent tous deux en charge les appels async.

### Masquer dynamiquement les éléments de menu (hide)

```tsx file="./_demos/add-sub-model/add-sub-model-hide.tsx" preview
```

- `hide` accepte un `boolean` ou une fonction (async possible). Retourner `true` pour masquer.
- S'applique récursivement aux groupes et children.

### Utiliser des groupes, sous-menus et séparateurs

```tsx file="./_demos/add-sub-model/add-sub-model-basic-children.tsx" preview
```

- `type: divider` pour un séparateur.
- `type: group` avec `children` pour un groupe de menu.
- `children` sans `type` pour un sous-menu.

### Génération automatique des items via héritage de classe

```tsx file="./_demos/add-sub-model/add-sub-model-base-class.tsx" preview
```

- Tous les FlowModel qui héritent de `subModelBaseClass` seront listés.
- `Model.define()` permet de définir les métadonnées associées.
- Les éléments marqués `hide: true` seront masqués automatiquement.

### Implémenter des groupes via l'héritage de classe

```tsx file="./_demos/add-sub-model/add-sub-model-base-class-group.tsx" preview
```

- Tous les FlowModel qui héritent de `subModelBaseClasses` seront listés.
- Regroupés et dédupliqués automatiquement selon `subModelBaseClasses`.

### Implémenter un menu à deux niveaux via héritage de classe + `menuType=submenu`

```tsx file="./_demos/add-sub-model/add-sub-model-submenu-base-class.tsx" preview
```

- Spécifiez la forme d'affichage de la classe de base avec `Model.define({ menuType: 'submenu' })`.
- Apparaît comme élément de premier niveau, se déploie en sous-menu de second niveau. Peut être trié avec d'autres groupes selon `meta.sort`.

### Personnaliser les sous-menus avec `Model.defineChildren()`

```tsx file="./_demos/add-sub-model/add-sub-model-define-children.tsx" preview
```

### Personnaliser les children de groupe avec `Model.defineChildren()`

```tsx file="./_demos/add-sub-model/add-sub-model-group-children.tsx" preview
```

### Activer la recherche dans un sous-menu

```tsx file="./_demos/add-sub-model/add-sub-model-submenu-search.tsx" preview
```

- Tout élément de menu contenant `children` affichera une zone de recherche à ce niveau dès lors que `searchable: true` est défini.
- Prend en charge une structure mixte de groupes et non-groupes au même niveau. La recherche ne s'applique qu'au niveau courant.
