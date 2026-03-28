:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/notification).
:::

# ctx.notification

Basée sur Ant Design Notification, cette API de notification globale est utilisée pour afficher des panneaux de notification dans le **coin supérieur droit** de la page. Par rapport à `ctx.message`, les notifications peuvent inclure un titre et une description, ce qui les rend adaptées aux contenus devant être affichés plus longtemps ou nécessitant l'attention de l'utilisateur.

## Scénarios d'utilisation

| Scénario | Description |
|------|------|
| **JSBlock / Événements d'action** | Notifications de fin de tâche, résultats d'opérations groupées, fin d'exportation, etc. |
| **Flux de travail** | Alertes au niveau du système après la fin de processus asynchrones. |
| **Contenu nécessitant un affichage prolongé** | Notifications complètes avec titres, descriptions et boutons d'action. |

## Définition du type

```ts
notification: NotificationInstance;
```

`NotificationInstance` est l'interface de notification d'Ant Design, fournissant les méthodes suivantes.

## Méthodes courantes

| Méthode | Description |
|------|------|
| `open(config)` | Ouvre une notification avec une configuration personnalisée |
| `success(config)` | Affiche une notification de type succès |
| `info(config)` | Affiche une notification de type information |
| `warning(config)` | Affiche une notification de type avertissement |
| `error(config)` | Affiche une notification de type erreur |
| `destroy(key?)` | Ferme la notification avec la clé spécifiée ; si aucune clé n'est fournie, ferme toutes les notifications |

**Paramètres de configuration** (Identiques à [Ant Design notification](https://ant.design/components/notification)) :

| Paramètre | Type | Description |
|------|------|------|
| `message` | `ReactNode` | Titre de la notification |
| `description` | `ReactNode` | Description de la notification |
| `duration` | `number` | Délai de fermeture automatique (en secondes). Par défaut 4,5 secondes ; réglez sur 0 pour désactiver la fermeture automatique |
| `key` | `string` | Identifiant unique de la notification, utilisé pour `destroy(key)` afin de fermer une notification spécifique |
| `onClose` | `() => void` | Fonction de rappel déclenchée lors de la fermeture |
| `placement` | `string` | Position : `topLeft` \| `topRight` \| `bottomLeft` \| `bottomRight` |

## Exemples

### Usage de base

```ts
ctx.notification.open({
  message: 'Opération réussie',
  description: 'Les données ont été enregistrées sur le serveur.',
});
```

### Appels rapides par type

```ts
ctx.notification.success({
  message: ctx.t('Export completed'),
  description: ctx.t('Exported {{count}} records', { count: 10 }),
});

ctx.notification.error({
  message: ctx.t('Export failed'),
  description: ctx.t('Please check the console for details'),
});

ctx.notification.warning({
  message: ctx.t('Warning'),
  description: ctx.t('Some data may be incomplete'),
});
```

### Durée et clé personnalisées

```ts
ctx.notification.open({
  key: 'task-123',
  message: ctx.t('Task in progress'),
  description: ctx.t('Please wait...'),
  duration: 0,  // Ne pas fermer automatiquement
});

// Fermeture manuelle après la fin de la tâche
ctx.notification.destroy('task-123');
```

### Fermer toutes les notifications

```ts
ctx.notification.destroy();
```

## Différence avec ctx.message

| Caractéristique | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Position** | Haut au centre de la page | Coin supérieur droit (configurable) |
| **Structure** | Indication légère sur une seule ligne | Peut inclure titre + description |
| **Usage** | Retour temporaire, disparaît automatiquement | Notification plus complète, peut être affichée longtemps |
| **Scénarios typiques** | Succès d'opération, échec de validation, copie réussie | Fin de tâche, messages système, contenu long nécessitant l'attention de l'utilisateur |

## Relatif

- [ctx.message](./message.md) - Indication légère en haut, adaptée aux retours rapides
- [ctx.modal](./modal.md) - Confirmation par fenêtre modale, interaction bloquante
- [ctx.t()](./t.md) - Internationalisation, souvent utilisée avec les notifications