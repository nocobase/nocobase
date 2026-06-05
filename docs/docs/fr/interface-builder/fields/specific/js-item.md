:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Élément JS

## Introduction

L'Élément JS est utilisé pour les "éléments personnalisés" (non liés à un champ) dans un formulaire. Vous pouvez utiliser JavaScript/JSX pour afficher n'importe quel contenu (comme des astuces, des statistiques, des aperçus, des boutons, etc.) et interagir avec le formulaire et le contexte de l'enregistrement. Il est idéal pour des scénarios tels que les aperçus en temps réel, les messages d'information et les petits composants interactifs.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## API du contexte d'exécution (Utilisation courante)

- `ctx.element` : Le conteneur DOM (ElementProxy) de l'élément actuel, prenant en charge `innerHTML`, `querySelector`, `addEventListener`, etc.
- `ctx.form` : L'instance du formulaire AntD, permettant des opérations comme `getFieldValue / getFieldsValue / setFieldsValue / validateFields`, etc.
- `ctx.blockModel` : Le modèle du bloc de formulaire auquel il appartient, qui peut écouter `formValuesChange` pour implémenter la liaison.
- `ctx.record` / `ctx.collection` : L'enregistrement actuel et les métadonnées de la collection (disponibles dans certains scénarios).
- `ctx.requireAsync(url)` : Charge de manière asynchrone une bibliothèque AMD/UMD via une URL.
- `ctx.importAsync(url)` : Importe dynamiquement un module ESM via une URL.
- `ctx.openView(viewUid, options)` : Ouvre une vue configurée (tiroir/boîte de dialogue/page).
- `ctx.message` / `ctx.notification` : Messages et notifications globales.
- `ctx.t()` / `ctx.i18n.t()` : Internationalisation.
- `ctx.onRefReady(ctx.ref, cb)` : Rend l'élément une fois que le conteneur est prêt.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` : Bibliothèques intégrées React, ReactDOM, Ant Design, icônes Ant Design et dayjs, utilisées pour le rendu JSX et les utilitaires de date/heure. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` sont conservés pour des raisons de compatibilité.)
- `ctx.render(vnode)` : Rend un élément React/HTML/DOM dans le conteneur par défaut `ctx.element`. Plusieurs rendus réutiliseront le Root et écraseront le contenu existant du conteneur.

## Éditeur et extraits de code

- `Snippets` : Ouvre une liste d'extraits de code intégrés, vous permettant de les rechercher et de les insérer en un clic à la position actuelle du curseur.
- `Run` : Exécute directement le code actuel et affiche les journaux d'exécution dans le panneau `Logs` en bas. Il prend en charge `console.log/info/warn/error` et la mise en évidence des erreurs.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- Peut être utilisé avec l'Employé IA pour générer/modifier des scripts : [Employé IA · Nathan : Ingénieur Frontend](/ai-employees/built-in/ai-coding)

## Cas d'utilisation courants (Exemples simplifiés)

### 1) Aperçu en temps réel (Lecture des valeurs du formulaire)

```js
const render = () => {
  const { price = 0, quantity = 1, discount = 0 } = ctx.form.getFieldsValue();
  const total = Number(price) * Number(quantity);
  const final = total * (1 - Number(discount || 0));
  ctx.render(
    <div style={{ padding: 8, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
      <div style={{ fontWeight: 600, color: '#389e0d' }}>{ctx.t('Payable:')} ¥{(final || 0).toFixed(2)}</div>
    </div>
  );
};
render();
ctx.blockModel?.on?.('formValuesChange', () => render());
```

### 2) Ouvrir une vue (Tiroir)

```js
ctx.render(
  <a onClick={async () => {
    const popupUid = ctx.model.uid + '-preview';
    await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Preview'), size: 'large' });
  }}>
    {ctx.t('Open preview')}
  </a>
);
```

### 3) Charger et rendre des bibliothèques externes

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## Remarques

- Il est recommandé d'utiliser un CDN de confiance pour le chargement des bibliothèques externes et de prévoir un mécanisme de secours en cas d'échec (par exemple, `if (!lib) return;`).
- Il est conseillé de privilégier l'utilisation de `class` ou `[name=...]` pour les sélecteurs et d'éviter les `id` fixes afin de prévenir les doublons d' `id` dans plusieurs blocs/fenêtres contextuelles.
- Nettoyage des événements : Les changements fréquents des valeurs du formulaire déclencheront plusieurs rendus. Avant de lier un événement, il doit être nettoyé ou dédoublonné (par exemple, `remove` avant `add`, utiliser `{ once: true }`, ou un attribut `dataset` pour éviter les doublons).

## Documentation associée

- [Variables et contexte](/interface-builder/variables)
- [Règles de liaison](/interface-builder/linkage-rule)
- [Vues et fenêtres contextuelles](/interface-builder/actions/types/view)