:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/exit-all).
:::

# ctx.exitAll()

Termine le flux d'événements actuel ainsi que tous les flux d'événements subséquents déclenchés lors de la même répartition d'événements. Il est couramment utilisé lorsque tous les flux d'événements liés à l'événement actuel doivent être interrompus immédiatement en raison d'une erreur globale ou d'un échec de validation des permissions.

## Scénarios d'utilisation

`ctx.exitAll()` est généralement utilisé dans des contextes où du code JS est exécutable et lorsqu'il est nécessaire d'**interrompre simultanément le flux d'événements actuel et les flux d'événements subséquents déclenchés par cet événement** :

| Scénario | Description |
|------|------|
| **Flux d'événements** | La validation du flux d'événements principal échoue (ex: permissions insuffisantes), nécessitant l'arrêt du flux principal et de tous les flux suivants non encore exécutés pour le même événement. |
| **Règles de liaison** | Lorsqu'une validation de liaison échoue, la liaison actuelle et les liaisons suivantes déclenchées par le même événement doivent être terminées. |
| **Événements d'action** | La validation préalable à l'action échoue (ex: vérification des permissions avant suppression), nécessitant d'empêcher l'action principale et les étapes suivantes. |

> Différence avec `ctx.exit()` : `ctx.exit()` termine uniquement le flux d'événements actuel ; `ctx.exitAll()` termine le flux d'événements actuel et tous les flux d'événements subséquents **non encore exécutés** dans la même répartition d'événements.

## Définition du type

```ts
exitAll(): never;
```

L'appel à `ctx.exitAll()` lève une exception interne `FlowExitAllException`, qui est capturée par le moteur de flux pour arrêter l'instance du flux d'événements actuel et les flux d'événements suivants liés au même événement. Une fois appelé, les instructions restantes dans le code JS actuel ne seront pas exécutées.

## Comparaison avec ctx.exit()

| Méthode | Portée |
|------|----------|
| `ctx.exit()` | Termine uniquement le flux d'événements actuel ; les flux d'événements suivants ne sont pas affectés. |
| `ctx.exitAll()` | Termine le flux d'événements actuel et interrompt les flux d'événements suivants exécutés de manière **séquentielle** sous le même événement. |

## Modes d'exécution

- **Exécution séquentielle (sequential)** : Les flux d'événements sous le même événement sont exécutés dans l'ordre. Si un flux d'événements appelle `ctx.exitAll()`, les flux d'événements suivants ne seront pas exécutés.
- **Exécution parallèle (parallel)** : Les flux d'événements sous le même événement sont exécutés en parallèle. L'appel à `ctx.exitAll()` dans un flux d'événements n'interrompra pas les autres flux d'événements déjà lancés (car ils sont indépendants).

## Exemples

### Terminer tous les flux d'événements en cas d'échec de validation des permissions

```ts
// Interrompre le flux d'événements principal et les flux suivants si les permissions sont insuffisantes
if (!hasPermission(ctx)) {
  ctx.notification.error({ message: 'Aucune permission d\'opération' });
  ctx.exitAll();
}
```

### Terminer en cas d'échec de la pré-validation globale

```ts
// Exemple : Si des données associées ne peuvent pas être supprimées avant la suppression, empêcher le flux principal et les actions suivantes
const canDelete = await checkDeletable(ctx.model?.getValue?.());
if (!canDelete) {
  ctx.message.error('Impossible de supprimer : des données associées existent');
  ctx.exitAll();
}
```

### Choisir entre ctx.exit() et ctx.exitAll()

```ts
// Seul le flux d'événements actuel doit s'arrêter -> Utilisez ctx.exit()
if (!params.valid) {
  ctx.message.error('Paramètres invalides');
  ctx.exit();  // Les flux d'événements suivants ne sont pas affectés
}

// Nécessité de terminer tous les flux d'événements suivants sous l'événement actuel -> Utilisez ctx.exitAll()
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: 'Permissions insuffisantes' });
  ctx.exitAll();  // Le flux d'événements principal et les flux suivants sous le même événement sont terminés
}
```

### Afficher un message avant de terminer

```ts
if (!isValidInput(ctx.form?.getValues?.())) {
  ctx.message.warning('Veuillez d\'abord corriger les erreurs dans le formulaire');
  ctx.exitAll();
}
```

## Remarques

- Après l'appel à `ctx.exitAll()`, le code suivant dans le JS actuel ne sera pas exécuté. Il est recommandé d'expliquer la raison à l'utilisateur via `ctx.message`, `ctx.notification` ou une fenêtre modale avant l'appel.
- Le code métier n'a généralement pas besoin de capturer `FlowExitAllException` ; laissez le moteur de flux s'en charger.
- Si vous avez seulement besoin d'arrêter le flux d'événements actuel sans affecter les suivants, utilisez `ctx.exit()`.
- En mode parallèle, `ctx.exitAll()` termine uniquement le flux d'événements actuel et n'interrompt pas les autres flux d'événements déjà en cours.

## Voir aussi

- [ctx.exit()](./exit.md) : Termine uniquement le flux d'événements actuel
- [ctx.message](./message.md) : Messages d'alerte
- [ctx.modal](./modal.md) : Fenêtre modale de confirmation