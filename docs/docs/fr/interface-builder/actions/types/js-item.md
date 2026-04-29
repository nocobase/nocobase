---
title: "JSItem JS Item"
description: "JSItem JS Item : utilisez JavaScript/JSX pour rendre des éléments d'action personnalisés dans la barre d'actions, avec prise en charge de React, ctx, et la liaison avec les contextes de collection/enregistrement/formulaire."
keywords: "JSItem,JS Item,élément d'action personnalisé,JavaScript,interface builder,NocoBase"
---

# JS Item

## Introduction

JS Item est utilisé pour rendre un «élément d'action personnalisé» dans la barre d'actions. Vous pouvez écrire directement du JavaScript / JSX et produire n'importe quelle interface utilisateur, par exemple un bouton, un groupe de boutons, un menu déroulant, un texte d'aide, une étiquette d'état ou un petit composant interactif. À l'intérieur du composant, vous pouvez appeler des interfaces, ouvrir des popups, lire l'enregistrement courant ou rafraîchir les données du bloc.

Il peut être utilisé dans la barre d'outils de formulaire, la barre d'outils de tableau (niveau collection), les actions de ligne de tableau (niveau enregistrement) et d'autres emplacements. Il est adapté aux scénarios suivants :

- Vous devez personnaliser la structure d'un bouton, et pas uniquement lui attacher un événement de clic ;
- Vous devez combiner plusieurs actions en un groupe de boutons ou un menu déroulant ;
- Vous devez afficher un état en temps réel, des informations statistiques ou un contenu explicatif dans la barre d'actions ;
- Vous devez rendre un contenu différent dynamiquement en fonction de l'enregistrement courant, des données sélectionnées ou des valeurs du formulaire.

![](https://static-docs.nocobase.com/JS-Item-03-27-2026_03_35_PM%20(1).png)

## Différence avec JS Action

- `JS Action` : plus adapté pour «exécuter un script lors du clic d'un bouton», l'accent est mis sur la logique de comportement.
- `JS Item` : plus adapté pour «rendre soi-même un élément d'action», en contrôlant à la fois l'interface et la logique d'interaction.

Si vous souhaitez simplement ajouter une logique de clic à un bouton existant, privilégiez `JS Action` ; si vous souhaitez personnaliser la structure de l'interface d'un élément d'action ou rendre plusieurs contrôles, privilégiez `JS Item`.

## API de contexte d'exécution (courante)

L'environnement d'exécution de JS Item injecte des capacités courantes que vous pouvez utiliser directement dans votre script :

- `ctx.render(vnode)` : rend un élément React, une chaîne HTML ou un nœud DOM dans le conteneur de l'élément d'action courant ;
- `ctx.element` : conteneur DOM de l'élément d'action courant (ElementProxy) ;
- `ctx.api.request(options)` : effectue une requête HTTP ;
- `ctx.openView(viewUid, options)` : ouvre une vue déjà configurée (tiroir / boîte de dialogue / page) ;
- `ctx.message` / `ctx.notification` : messages et notifications globaux ;
- `ctx.t()` / `ctx.i18n.t()` : internationalisation ;
- `ctx.resource` : ressource de données du contexte de niveau collection, par exemple lire les enregistrements sélectionnés, rafraîchir la liste ;
- `ctx.record` : enregistrement de la ligne courante du contexte de niveau enregistrement ;
- `ctx.form` : instance AntD Form du contexte de niveau formulaire ;
- `ctx.blockModel` / `ctx.collection` : méta-informations sur le bloc et la collection ;
- `ctx.requireAsync(url)` : charge de manière asynchrone une bibliothèque AMD / UMD à partir d'une URL ;
- `ctx.importAsync(url)` : importe dynamiquement un module ESM à partir d'une URL ;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula` : bibliothèques courantes intégrées, utilisables directement pour le rendu JSX, la gestion du temps, le traitement des données et les calculs mathématiques.

> Les variables réellement disponibles varient selon l'emplacement de l'élément d'action. Par exemple, les actions de ligne de tableau peuvent généralement accéder à `ctx.record`, la barre d'outils de formulaire à `ctx.form`, et la barre d'outils de tableau à `ctx.resource`.

## Éditeur et extraits

- `Snippets` : ouvre la liste intégrée d'extraits de code. Vous pouvez les rechercher et les insérer en un clic à la position du curseur.
- `Run` : exécute directement le code courant et affiche les journaux d'exécution dans le panneau `Logs` en bas. Prend en charge `console.log/info/warn/error` et la mise en évidence de la position des erreurs.

![](https://static-docs.nocobase.com/JS-Item-03-27-2026_03_35_PM.png)

- Vous pouvez combiner avec un employé IA pour générer / modifier des scripts : [Employés IA · Nathan : ingénieur frontend](/ai-employees/features/built-in-employee)

## Cas d'usage courants (exemples simplifiés)

### 1) Rendre un bouton classique

```js
const { Button } = ctx.libs.antd;

function JsItem() {
  return (
    <Button
      type="primary"
      onClick={() => ctx.message.success(ctx.t('Click from JS item'))}
    >
      {ctx.t('JS item')}
    </Button>
  );
}

ctx.render(<JsItem />);
```

### 2) Action de collection : combiner un bouton et un menu déroulant

```js
const { Space, Button, Dropdown } = ctx.libs.antd;
const { EllipsisOutlined } = ctx.libs.antdIcons;

function JsItem() {
  const items = [
    { key: 'export', label: ctx.t('Export selected') },
    { key: 'refresh', label: ctx.t('Refresh data') },
  ];

  const onMenuClick = async ({ key }) => {
    if (key === 'export') {
      const rows = ctx.resource?.getSelectedRows?.() || [];
      if (!rows.length) {
        ctx.message.warning(ctx.t('Please select records'));
        return;
      }
      ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
      return;
    }

    if (key === 'refresh') {
      await ctx.resource?.refresh?.();
      ctx.message.success(ctx.t('Refreshed'));
    }
  };

  return (
    <Space.Compact>
      <Button>{ctx.t('Actions')}</Button>
      <Dropdown menu={{ items, onClick: onMenuClick }} placement="bottomRight">
        <Button icon={<EllipsisOutlined />} />
      </Dropdown>
    </Space.Compact>
  );
}

ctx.render(<JsItem />);
```

### 3) Action d'enregistrement : ouvrir une vue à partir de la ligne courante

```js
const { Button } = ctx.libs.antd;

function JsItem() {
  return (
    <Button
      onClick={async () => {
        // Ouvrir une vue en tiroir et passer les arguments au niveau supérieur
        const popupUid = `${ctx.model.uid}-details`;
        await ctx.openView(popupUid, {
          mode: 'drawer',
          title: ctx.t('Details'),
          size: 'large',
        });
      }}
    >
      {ctx.t('Open')}
    </Button>
  );
}

ctx.render(<JsItem />);
```

### 4) Rendre un contenu d'état personnalisé

```js
const { Tag } = ctx.libs.antd;

function JsItem() {
  const count = ctx.resource?.getSelectedRows?.()?.length || 0;

  return (
    <Tag color={count ? 'processing' : 'default'}>
      Selected: {count}
    </Tag>
  );
}

ctx.render(<JsItem />);
```

## Points d'attention

- Si vous avez seulement besoin d'«exécuter une logique au clic», privilégiez `JS Action`, l'implémentation est plus directe.
- Ajoutez `try/catch` et des messages utilisateur pour les appels d'interface, afin d'éviter les échecs silencieux.
- Lors d'interactions impliquant des tableaux, des listes ou des popups, après une soumission réussie, vous pouvez rafraîchir les données activement via `ctx.resource?.refresh?.()` ou via la ressource du bloc concerné.
- Lors de l'utilisation de bibliothèques externes, il est recommandé de les charger via un CDN de confiance et de prévoir une gestion en cas d'échec de chargement.

## Documentation associée

- [Variables et contexte](/interface-builder/variables)
- [Règles de liaison](/interface-builder/linkage-rule)
- [Vues et popups](/interface-builder/actions/types/view)
- [JS Action](/interface-builder/actions/types/js-action)
