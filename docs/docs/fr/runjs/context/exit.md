# ctx.exit()

Termine l'exécution du flux d'événements actuel ; les étapes suivantes ne seront pas exécutées. Il est couramment utilisé lorsque les conditions métier ne sont pas remplies, que l'utilisateur annule ou qu'une erreur irrécupérable survient.

## Scénarios d'utilisation

`ctx.exit()` est généralement utilisé dans les contextes suivants où du code JS peut être exécuté :

| Scénario | Description |
|------|------|
| **Flux d'événements** | Dans les flux d'événements déclenchés par des soumissions de formulaires, des clics sur des boutons, etc., interrompt les étapes suivantes lorsque les conditions ne sont pas remplies. |
| **Règles de liaison** | Dans les liaisons de champs, de filtres, etc., termine le flux d'événements actuel en cas d'échec de validation ou lorsqu'il est nécessaire d'ignorer l'exécution. |
| **Événements d'action** | Dans les actions personnalisées (ex : confirmation de suppression, validation avant enregistrement), quitte l'exécution lorsque l'utilisateur annule ou que la validation échoue. |

> `ctx.exit()` / `ctx.exitAll()` — Les deux appels terminent l’étape en cours et ignorent les flux séquentiels restants du même événement. Les flux déjà lancés en parallèle continuent.

## Définition du type

```ts
exit(): never;
```

L'appel à `ctx.exit()` lève une exception interne `FlowExitAllException`, qui est capturée par le moteur de flux pour arrêter l'exécution du flux d'événements actuel. Une fois appelé, les instructions restantes dans le code JS actuel ne seront pas exécutées.

## Exemples

### Quitter en cas d'annulation de l'utilisateur

```ts
// Dans une fenêtre de confirmation, termine le flux d'événements si l'utilisateur clique sur annuler
if (!confirmed) {
  ctx.message.info('Opération annulée');
  ctx.exit();
}
```

### Quitter en cas d'échec de validation des paramètres

```ts
// Affiche un message et termine l'exécution si la validation échoue
if (!params.value || params.value.length < 3) {
  ctx.message.error('Paramètres invalides, la longueur doit être d\'au moins 3');
  ctx.exit();
}
```

### Quitter lorsque les conditions métier ne sont pas remplies

```ts
// Termine si les conditions ne sont pas remplies ; les étapes suivantes ne s'exécuteront pas
const record = ctx.model?.getValue?.();
if (!record || record.status !== 'draft') {
  ctx.notification.warning({ message: 'Seuls les brouillons peuvent être soumis' });
  ctx.exit();
}
```

### Quitter selon le choix de l'utilisateur après une confirmation modale

```ts
const ok = await ctx.modal?.confirm?.({
  title: 'Confirmer la suppression',
  content: 'Cette action est irréversible. Voulez-vous continuer ?',
});
if (!ok) {
  ctx.message.info('Annulé');
  ctx.exit();
}
```

## Remarques

- Après l'appel à `ctx.exit()`, le code suivant dans le JS actuel ne sera pas exécuté ; il est recommandé d'expliquer la raison à l'utilisateur via `ctx.message`, `ctx.notification` ou une fenêtre modale avant l'appel.
- Il n'est généralement pas nécessaire de capturer `FlowExitAllException` dans votre code métier ; laissez le moteur de flux s'en charger.

## Voir aussi

- [ctx.exitAll()](./exit-all.md)
- [ctx.message](./message.md) : Messages d'information.
- [ctx.modal](./modal.md) : Fenêtres modales de confirmation.
