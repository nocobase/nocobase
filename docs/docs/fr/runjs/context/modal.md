:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/modal).
:::

# ctx.modal

Une API de raccourci basée sur Ant Design Modal, utilisée pour ouvrir activement des boîtes modales (invites d'information, fenêtres de confirmation, etc.) dans RunJS. Elle est implémentée par `ctx.viewer` / le système de vue.

## Scénarios d'utilisation

| Scénario | Description |
|------|------|
| **JSBlock / JSField** | Afficher les résultats d'opération, les messages d'erreur ou les confirmations secondaires après l'interaction de l'utilisateur. |
| **Flux de travail / Événements d'action** | Fenêtre de confirmation avant la soumission ; interrompre les étapes suivantes via `ctx.exit()` si l'utilisateur annule. |
| **Règles de liaison** | Fenêtres d'invite pour l'utilisateur lorsque la validation échoue. |

> Remarque : `ctx.modal` est disponible dans les environnements RunJS disposant d'un contexte de vue (comme les JSBlocks dans une page, les flux de travail, etc.) ; il peut ne pas exister dans le backend ou les contextes sans interface utilisateur (UI). Il est recommandé d'utiliser le chaînage optionnel (`ctx.modal?.confirm?.()`) lors de l'appel.

## Définition des types

```ts
modal: {
  info: (config: ModalConfig) => Promise<void>;
  success: (config: ModalConfig) => Promise<void>;
  error: (config: ModalConfig) => Promise<void>;
  warning: (config: ModalConfig) => Promise<void>;
  confirm: (config: ModalConfig) => Promise<boolean>;  // Retourne true si l'utilisateur clique sur OK, false s'il annule
};
```

`ModalConfig` est conforme à la configuration des méthodes statiques de `Modal` d'Ant Design.

## Méthodes courantes

| Méthode | Valeur de retour | Description |
|------|--------|------|
| `info(config)` | `Promise<void>` | Fenêtre modale d'information |
| `success(config)` | `Promise<void>` | Fenêtre modale de succès |
| `error(config)` | `Promise<void>` | Fenêtre modale d'erreur |
| `warning(config)` | `Promise<void>` | Fenêtre modale d'avertissement |
| `confirm(config)` | `Promise<boolean>` | Fenêtre de confirmation ; retourne `true` si l'utilisateur clique sur OK, et `false` s'il annule |

## Paramètres de configuration

Conformément à `Modal` d'Ant Design, les champs courants incluent :

| Paramètre | Type | Description |
|------|------|------|
| `title` | `ReactNode` | Titre |
| `content` | `ReactNode` | Contenu |
| `okText` | `string` | Texte du bouton OK |
| `cancelText` | `string` | Texte du bouton Annuler (uniquement pour `confirm`) |
| `onOk` | `() => void \| Promise<void>` | Exécuté lors du clic sur OK |
| `onCancel` | `() => void` | Exécuté lors du clic sur Annuler |

## Relation avec ctx.message et ctx.openView

| Usage | Utilisation recommandée |
|------|----------|
| **Invite temporaire légère** | `ctx.message`, disparaît automatiquement |
| **Modale d'info/succès/erreur/avertissement** | `ctx.modal.info` / `success` / `error` / `warning` |
| **Confirmation secondaire (nécessite un choix utilisateur)** | `ctx.modal.confirm`, utilisé avec `ctx.exit()` pour contrôler le flux |
| **Interactions complexes (formulaires, listes, etc.)** | `ctx.openView` pour ouvrir une vue personnalisée (page/tiroir/modale) |

## Exemples

### Fenêtre d'information simple

```ts
ctx.modal.info({
  title: 'Indication',
  content: 'Opération terminée',
});
```

### Fenêtre de confirmation et contrôle du flux

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Confirmer la suppression',
  content: 'Êtes-vous sûr de vouloir supprimer cet enregistrement ?',
  okText: 'Confirmer',
  cancelText: 'Annuler',
});
if (!confirmed) {
  ctx.exit();  // Interrompt les étapes suivantes si l'utilisateur annule
  return;
}
await ctx.runAction('destroy', { filterByTk: ctx.record?.id });
```

### Fenêtre de confirmation avec onOk

```ts
await ctx.modal.confirm({
  title: 'Confirmer la soumission',
  content: 'Les modifications ne pourront plus être modifiées après la soumission. Voulez-vous continuer ?',
  async onOk() {
    await ctx.form.submit();
  },
});
```

### Affichage d'erreur

```ts
try {
  await someOperation();
  ctx.modal.success({ title: 'Succès', content: 'Opération terminée' });
} catch (e) {
  ctx.modal.error({ title: 'Erreur', content: e.message });
}
```

## Relatif

- [ctx.message](./message.md) : Invite temporaire légère, disparaît automatiquement
- [ctx.exit()](./exit.md) : Couramment utilisé sous la forme `if (!confirmed) ctx.exit()` pour interrompre le flux lorsqu'un utilisateur annule une confirmation
- [ctx.openView()](./open-view.md) : Ouvre une vue personnalisée, adaptée aux interactions complexes