:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/message).
:::

# ctx.message

API globale de message d'Ant Design, utilisée pour afficher des messages temporaires légers au centre en haut de la page. Les messages se ferment automatiquement après un certain temps ou peuvent être fermés manuellement par l'utilisateur.

## Scénarios d'utilisation

| Scénario | Description |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Retours d'opération, invites de validation, succès de copie et autres messages légers |
| **Opérations de formulaire / Flux de travail** | Retours pour succès de soumission, échec de sauvegarde, échec de validation, etc. |
| **Événements d'action (JSAction)** | Retours immédiats pour les clics, fin d'opérations groupées, etc. |

## Définition du type

```ts
message: MessageInstance;
```

`MessageInstance` est l'interface de message d'Ant Design, fournissant les méthodes suivantes.

## Méthodes courantes

| Méthode | Description |
|------|------|
| `success(content, duration?)` | Affiche un message de succès |
| `error(content, duration?)` | Affiche un message d'erreur |
| `warning(content, duration?)` | Affiche un message d'avertissement |
| `info(content, duration?)` | Affiche un message d'information |
| `loading(content, duration?)` | Affiche un message de chargement (doit être fermé manuellement) |
| `open(config)` | Ouvre un message en utilisant une configuration personnalisée |
| `destroy()` | Ferme tous les messages actuellement affichés |

**Paramètres :**

- `content` (`string` \| `ConfigOptions`) : Contenu du message ou objet de configuration
- `duration` (`number`, facultatif) : Délai de fermeture automatique (secondes), par défaut 3 secondes ; réglez sur 0 pour ne pas fermer automatiquement

**ConfigOptions** (lorsque `content` est un objet) :

```ts
interface ConfigOptions {
  content: React.ReactNode;  // Contenu du message
  duration?: number;        // Délai de fermeture automatique (secondes)
  onClose?: () => void;    // Rappel lors de la fermeture
  icon?: React.ReactNode;  // Icône personnalisée
}
```

## Exemples

### Utilisation de base

```ts
ctx.message.success('Opération réussie');
ctx.message.error('Opération échouée');
ctx.message.warning('Veuillez d\'abord sélectionner des données');
ctx.message.info('Traitement en cours...');
```

### Internationalisation avec ctx.t

```ts
ctx.message.success(ctx.t('Copied'));
ctx.message.warning(ctx.t('Please select at least one row'));
ctx.message.success(ctx.t('Exported {{count}} records', { count: rows.length }));
```

### Chargement et fermeture manuelle

```ts
const hide = ctx.message.loading(ctx.t('Saving...'));
// Exécuter une opération asynchrone
await saveData();
hide();  // Fermer manuellement le chargement
ctx.message.success(ctx.t('Saved'));
```

### Utilisation de open avec une configuration personnalisée

```ts
ctx.message.open({
  type: 'success',
  content: 'Invite de succès personnalisée',
  duration: 5,
  onClose: () => console.log('message fermé'),
});
```

### Fermer tous les messages

```ts
ctx.message.destroy();
```

## Différence entre ctx.message et ctx.notification

| Caractéristique | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Position** | Centre en haut de la page | Coin supérieur droit |
| **Usage** | Invite légère temporaire, disparaît automatiquement | Panneau de notification, peut inclure un titre et une description, adapté à un affichage plus long |
| **Scénarios typiques** | Retours d'opération, invites de validation, succès de copie | Notifications de fin de tâche, messages système, contenu long nécessitant l'attention de l'utilisateur |

## Articles connexes

- [ctx.notification](./notification.md) - Notifications en haut à droite, adaptées aux durées d'affichage plus longues
- [ctx.modal](./modal.md) - Fenêtre modale de confirmation, interaction bloquante
- [ctx.t()](./t.md) - Internationalisation, couramment utilisée avec message