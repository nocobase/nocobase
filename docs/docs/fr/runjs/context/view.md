:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/view).
:::

# ctx.view

Le contrôleur de la vue actuellement active (fenêtre de dialogue, tiroir, popover, zone intégrée, etc.), utilisé pour accéder aux informations et aux opérations au niveau de la vue. Fourni par `FlowViewContext`, il est uniquement disponible dans le contenu des vues ouvertes via `ctx.viewer` ou `ctx.openView`.

## Scénarios d'utilisation

| Scénario | Description |
|------|------|
| **Contenu de dialogue/tiroir** | Utilisez `ctx.view.close()` dans le `content` pour fermer la vue actuelle, ou utilisez `Header` et `Footer` pour afficher les titres et les pieds de page. |
| **Après la soumission d'un formulaire** | Appelez `ctx.view.close(result)` après une soumission réussie pour fermer la vue et renvoyer le résultat. |
| **JSBlock / Action** | Déterminez le type de vue actuel via `ctx.view.type`, ou lisez les paramètres d'ouverture dans `ctx.view.inputArgs`. |
| **Sélection d'association, sous-tableaux** | Lisez `collectionName`, `filterByTk`, `parentId`, etc., depuis `inputArgs` pour le chargement des données. |

> **Note :** `ctx.view` est uniquement disponible dans les environnements RunJS disposant d'un contexte de vue (par exemple, à l'intérieur du `content` de `ctx.viewer.dialog()`, dans les formulaires de dialogue ou à l'intérieur des sélecteurs d'association). Dans les pages standard ou les contextes backend, il est `undefined`. Il est recommandé d'utiliser le chaînage optionnel (`ctx.view?.close?.()`).

## Définition du type

```ts
type FlowView = {
  type: 'drawer' | 'popover' | 'dialog' | 'embed';
  inputArgs: Record<string, any>;
  Header: React.FC<{ title?: React.ReactNode; extra?: React.ReactNode }> | null;
  Footer: React.FC<{ children?: React.ReactNode }> | null;
  close: (result?: any, force?: boolean) => void;
  update: (newConfig: any) => void;
  navigation?: ViewNavigation;
  destroy?: () => void;
  submit?: () => Promise<any>;  // Disponible dans les vues de configuration de flux de travail
};
```

## Propriétés et méthodes communes

| Propriété/Méthode | Type | Description |
|-----------|------|------|
| `type` | `'drawer' \| 'popover' \| 'dialog' \| 'embed'` | Type de vue actuel |
| `inputArgs` | `Record<string, any>` | Paramètres transmis lors de l'ouverture de la vue (voir ci-dessous) |
| `Header` | `React.FC \| null` | Composant d'en-tête, utilisé pour afficher les titres et les zones d'action |
| `Footer` | `React.FC \| null` | Composant de pied de page, utilisé pour afficher des boutons, etc. |
| `close(result?, force?)` | `void` | Ferme la vue actuelle ; `result` peut être renvoyé à l'appelant |
| `update(newConfig)` | `void` | Met à jour la configuration de la vue (ex : largeur, titre) |
| `navigation` | `ViewNavigation \| undefined` | Navigation de vue interne à la page, incluant le changement d'onglet (Tab), etc. |

> Actuellement, seuls `dialog` et `drawer` prennent en charge `Header` et `Footer`.

## Champs communs de inputArgs

Les champs de `inputArgs` varient selon le scénario d'ouverture. Les champs courants incluent :

| Champ | Description |
|------|------|
| `viewUid` | UID de la vue |
| `collectionName` | Nom de la collection |
| `filterByTk` | Filtre par clé primaire (pour les détails d'un enregistrement unique) |
| `parentId` | ID parent (pour les scénarios d'association) |
| `sourceId` | ID de l'enregistrement source |
| `parentItem` | Données de l'élément parent |
| `scene` | Scène (ex : `create`, `edit`, `select`) |
| `onChange` | Rappel (callback) après sélection ou modification |
| `tabUid` | UID de l'onglet actuel (au sein d'une page) |

Accédez à ces champs via `ctx.getVar('ctx.view.inputArgs.xxx')` ou `ctx.view.inputArgs.xxx`.

## Exemples

### Fermer la vue actuelle

```ts
// Fermer le dialogue après une soumission réussie
await ctx.resource.runAction('create', { data: formData });
ctx.view?.close();

// Fermer et renvoyer les résultats
ctx.view?.close({ id: newRecord.id, name: newRecord.name });
```

### Utiliser Header / Footer dans le contenu

```tsx
function DialogContent() {
  const ctx = useFlowViewContext();
  const { Header, Footer, close } = ctx.view;
  return (
    <div>
      <Header title="Modifier" extra={<Button size="small">Aide</Button>} />
      <div>Contenu du formulaire...</div>
      <Footer>
        <Button onClick={() => close()}>Annuler</Button>
        <Button type="primary" onClick={handleSubmit}>Envoyer</Button>
      </Footer>
    </div>
  );
}
```

### Branchement basé sur le type de vue ou inputArgs

```ts
if (ctx.view?.type === 'embed') {
  // Masquer l'en-tête dans les vues intégrées
  ctx.model.setProps('headerStyle', { display: 'none' });
}

const collectionName = ctx.view?.inputArgs?.collectionName;
if (collectionName === 'users') {
  // Scénario du sélecteur d'utilisateurs
}
```

## Relation avec ctx.viewer et ctx.openView

| Usage | Utilisation recommandée |
|------|----------|
| **Ouvrir une nouvelle vue** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` ou `ctx.openView()` |
| **Manipuler la vue actuelle** | `ctx.view.close()`, `ctx.view.update()` |
| **Obtenir les paramètres d'ouverture** | `ctx.view.inputArgs` |

`ctx.viewer` est responsable de l'ouverture d'une vue, tandis que `ctx.view` représente l'instance de la vue "actuelle" ; `ctx.openView` est utilisé pour ouvrir des vues de flux de travail préconfigurées.

## Précautions

- `ctx.view` est uniquement disponible à l'intérieur d'une vue ; il est `undefined` sur les pages standard.
- Utilisez le chaînage optionnel : `ctx.view?.close?.()` pour éviter les erreurs lorsqu'aucun contexte de vue n'existe.
- Le `result` de `close(result)` est transmis à la Promise renvoyée par `ctx.viewer.open()`.

## Voir aussi

- [ctx.openView()](./open-view.md) : Ouvrir une vue de flux de travail préconfigurée
- [ctx.modal](./modal.md) : Fenêtres contextuelles légères (informations, confirmation, etc.)

> `ctx.viewer` fournit des méthodes telles que `dialog()`, `drawer()`, `popover()` et `embed()` pour ouvrir des vues. Le contenu (`content`) ouvert par ces méthodes peut accéder à `ctx.view`.