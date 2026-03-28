:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/element).
:::

# ctx.element

Une instance `ElementProxy` pointant vers le conteneur DOM du bac à sable (sandbox), servant de cible de rendu par défaut pour `ctx.render()`. Elle est disponible dans les scénarios disposant d'un conteneur de rendu, tels que `JSBlock`, `JSField`, `JSItem` et `JSColumn`.

## Scénarios d'application

| Scénario | Description |
|------|------|
| **JSBlock** | Le conteneur DOM du bloc, utilisé pour rendre le contenu personnalisé du bloc. |
| **JSField / JSItem / FormJSFieldItem** | Le conteneur de rendu pour un champ ou un élément de formulaire (généralement un `<span>`). |
| **JSColumn** | Le conteneur DOM pour une cellule de tableau, utilisé pour rendre le contenu personnalisé d'une colonne. |

> Remarque : `ctx.element` est uniquement disponible dans les contextes RunJS possédant un conteneur de rendu. Dans les contextes sans interface utilisateur (UI), comme la logique purement backend, il peut être `undefined`. Il est recommandé d'effectuer une vérification de valeur nulle avant toute utilisation.

## Définition du type

```typescript
element: ElementProxy | undefined;

// ElementProxy est un proxy pour l'élément HTMLElement brut, exposant une API sécurisée
class ElementProxy {
  __el: HTMLElement;  // L'élément DOM brut interne (accessible uniquement dans des scénarios spécifiques)
  innerHTML: string;  // Nettoyé via DOMPurify lors de la lecture/écriture
  outerHTML: string; // Idem ci-dessus
  appendChild(child: HTMLElement | string): void;
  // Les autres méthodes HTMLElement sont transmises (l'utilisation directe n'est pas recommandée)
}
```

## Exigences de sécurité

**Recommandation : Tout rendu doit être effectué via `ctx.render()`.** Évitez d'utiliser directement les API DOM de `ctx.element` (par exemple, `innerHTML`, `appendChild`, `querySelector`, etc.).

### Pourquoi ctx.render() est recommandé

| Avantage | Description |
|------|------|
| **Sécurité** | Contrôle de sécurité centralisé pour éviter les failles XSS et les opérations DOM inappropriées. |
| **Support React** | Support complet du JSX, des composants React et de leurs cycles de vie. |
| **Héritage de contexte** | Hérite automatiquement du `ConfigProvider` de l'application, des thèmes, etc. |
| **Gestion des conflits** | Gère automatiquement la création et la suppression de la racine React pour éviter les conflits entre instances multiples. |

### ❌ Non recommandé : Manipulation directe de ctx.element

```ts
// ❌ Non recommandé : Utilisation directe des API de ctx.element
ctx.element.innerHTML = '<div>Contenu</div>';
ctx.element.appendChild(node);
ctx.element.querySelector('.class');
```

> `ctx.element.innerHTML` est obsolète. Veuillez utiliser `ctx.render()` à la place.

### ✅ Recommandé : Utilisation de ctx.render()

```ts
// ✅ Rendu d'un composant React
const { Button, Card } = ctx.libs.antd;
ctx.render(
  <Card title={ctx.t('Bienvenue')}>
    <Button type="primary">Cliquez ici</Button>
  </Card>
);

// ✅ Rendu d'une chaîne HTML
ctx.render('<div style="padding:16px;">' + ctx.t('Contenu') + '</div>');

// ✅ Rendu d'un nœud DOM
const div = document.createElement('div');
div.textContent = ctx.t('Bonjour');
ctx.render(div);
```

## Cas particulier : Comme ancre de popover

Lorsque vous devez ouvrir un Popover en utilisant l'élément actuel comme ancre, vous pouvez accéder à `ctx.element?.__el` pour obtenir le DOM brut comme cible (`target`) :

```ts
// ctx.viewer.popover nécessite un DOM brut comme cible (target)
await ctx.viewer.popover({
  target: ctx.element?.__el,
  content: <div>Contenu de la fenêtre surgissante</div>,
});
```

> Utilisez `__el` uniquement dans des scénarios tels que « l'utilisation du conteneur actuel comme ancre » ; ne manipulez pas le DOM directement dans les autres cas.

## Relation avec ctx.render

- Si `ctx.render(vnode)` est appelé sans argument `container`, le rendu s'effectue par défaut dans le conteneur `ctx.element`.
- Si `ctx.element` est manquant et qu'aucun `container` n'est fourni, une erreur sera générée.
- Vous pouvez spécifier explicitement un conteneur : `ctx.render(vnode, customContainer)`.

## Remarques

- `ctx.element` est destiné à un usage interne par `ctx.render()`. Il n'est pas recommandé d'accéder directement à ses propriétés ou méthodes, ni de les modifier.
- Dans les contextes sans conteneur de rendu, `ctx.element` sera `undefined`. Assurez-vous que le conteneur est disponible ou passez manuellement un `container` avant d'appeler `ctx.render()`.
- Bien que `innerHTML` / `outerHTML` dans `ElementProxy` soient nettoyés via DOMPurify, il est toujours recommandé d'utiliser `ctx.render()` pour une gestion unifiée du rendu.

## Voir aussi

- [ctx.render](./render.md) : Rendre du contenu dans un conteneur
- [ctx.view](./view.md) : Contrôleur de vue actuel
- [ctx.modal](./modal.md) : API rapide pour les fenêtres modales