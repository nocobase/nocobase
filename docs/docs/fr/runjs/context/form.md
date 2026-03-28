:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/form).
:::

# ctx.form

L'instance Ant Design Form au sein du bloc actuel, utilisée pour lire/écrire les champs du formulaire, déclencher la validation et la soumission. Équivalent à `ctx.blockModel?.form`, elle peut être utilisée directement dans les blocs liés aux formulaires (Formulaire, Formulaire d'édition, Sous-formulaire, etc.).

## Cas d'utilisation

| Scénario | Description |
|------|------|
| **JSField** | Lire/écrire d'autres champs de formulaire pour implémenter des liaisons, ou effectuer des calculs et des validations basés sur d'autres valeurs de champs. |
| **JSItem** | Lire/écrire des champs de la même ligne ou d'autres champs dans les éléments de sous-table pour réaliser des liaisons internes au tableau. |
| **JSColumn** | Lire la ligne actuelle ou les valeurs des champs associés dans une colonne de tableau pour le rendu. |
| **Actions de formulaire / Flux de travail** | Validation avant soumission, mise à jour groupée de champs, réinitialisation de formulaires, etc. |

> Remarque : `ctx.form` est uniquement disponible dans les contextes RunJS liés aux blocs de formulaire (Formulaire, Formulaire d'édition, Sous-formulaire, etc.). Il peut ne pas exister dans des scénarios hors formulaire (comme les JSBlocks indépendants ou les blocs de tableau). Il est recommandé d'effectuer une vérification de valeur nulle avant utilisation : `ctx.form?.getFieldsValue()`.

## Définition du type

```ts
form: FormInstance<any>;
```

`FormInstance` est le type d'instance d'Ant Design Form. Les méthodes courantes sont les suivantes.

## Méthodes courantes

### Lecture des valeurs du formulaire

```ts
// Lire les valeurs des champs actuellement enregistrés (uniquement les champs rendus par défaut)
const values = ctx.form.getFieldsValue();

// Lire les valeurs de tous les champs (y compris les champs enregistrés mais non rendus, par ex. cachés ou dans des sections repliées)
const allValues = ctx.form.getFieldsValue(true);

// Lire un seul champ
const email = ctx.form.getFieldValue('email');

// Lire des champs imbriqués (par ex. dans une sous-table)
const amount = ctx.form.getFieldValue(['orders', 0, 'amount']);
```

### Écriture des valeurs du formulaire

```ts
// Mise à jour groupée (couramment utilisée pour les liaisons)
ctx.form.setFieldsValue({
  status: 'active',
  updatedAt: new Date(),
});

// Mettre à jour un seul champ
ctx.form.setFieldValue('remark', 'Remarque mise à jour');
```

### Validation et soumission

```ts
// Déclencher la validation du formulaire
await ctx.form.validateFields();

// Déclencher la soumission du formulaire
ctx.form.submit();
```

### Réinitialisation

```ts
// Réinitialiser tous les champs
ctx.form.resetFields();

// Réinitialiser uniquement des champs spécifiques
ctx.form.resetFields(['status', 'remark']);
```

## Relation avec les contextes associés

### ctx.getValue / ctx.setValue

| Scénario | Utilisation recommandée |
|------|----------|
| **Lire/Écrire le champ actuel** | `ctx.getValue()` / `ctx.setValue(v)` |
| **Lire/Écrire d'autres champs** | `ctx.form.getFieldValue(name)` / `ctx.form.setFieldValue(name, v)` |

Au sein du champ JS actuel, privilégiez l'utilisation de `getValue`/`setValue` pour lire/écrire le champ lui-même ; utilisez `ctx.form` lorsque vous avez besoin d'accéder à d'autres champs.

### ctx.blockModel

| Besoin | Utilisation recommandée |
|------|----------|
| **Lire/Écrire des champs de formulaire** | `ctx.form` (Équivalent à `ctx.blockModel?.form`, plus pratique) |
| **Accéder au bloc parent** | `ctx.blockModel` (Contient `collection`, `resource`, etc.) |

### ctx.getVar('ctx.formValues')

Les valeurs du formulaire doivent être obtenues via `await ctx.getVar('ctx.formValues')` et ne sont pas directement exposées en tant que `ctx.formValues`. Dans un contexte de formulaire, il est préférable d'utiliser `ctx.form.getFieldsValue()` pour lire les dernières valeurs en temps réel.

## Précautions

- `getFieldsValue()` ne retourne par défaut que les champs rendus. Pour inclure les champs non rendus (par ex. dans des sections repliées ou masqués par des règles conditionnelles), passez `true` : `getFieldsValue(true)`.
- Les chemins pour les champs imbriqués comme les sous-tables sont des tableaux, par ex. `['orders', 0, 'amount']`. Vous pouvez utiliser `ctx.namePath` pour obtenir le chemin du champ actuel et construire des chemins pour d'autres colonnes de la même ligne.
- `validateFields()` lève un objet d'erreur contenant `errorFields` et d'autres informations. Si la validation échoue avant la soumission, vous pouvez utiliser `ctx.exit()` pour interrompre les étapes suivantes.
- Dans les scénarios asynchrones comme les flux de travail ou les règles de liaison, `ctx.form` pourrait ne pas être encore prêt. Il est recommandé d'utiliser le chaînage optionnel ou des vérifications de valeur nulle.

## Exemples

### Liaison de champs : Afficher un contenu différent selon le type

```ts
const type = ctx.form.getFieldValue('type');
if (type === 'vip') {
  ctx.form.setFieldsValue({ discount: 0.8 });
} else {
  ctx.form.setFieldsValue({ discount: 1 });
}
```

### Calculer le champ actuel en fonction d'autres champs

```ts
const quantity = ctx.form.getFieldValue('quantity') ?? 0;
const price = ctx.form.getFieldValue('price') ?? 0;
ctx.setValue(quantity * price);
```

### Lire/Écrire d'autres colonnes de la même ligne dans une sous-table

```ts
// ctx.namePath est le chemin du champ actuel dans le formulaire, par ex. ['orders', 0, 'amount']
// Lire 'status' sur la même ligne : ['orders', 0, 'status']
const rowIndex = ctx.namePath?.[1];
const status = ctx.form.getFieldValue(['orders', rowIndex, 'status']);
```

### Validation avant soumission

```ts
try {
  await ctx.form.validateFields();
  // Validation réussie, continuer la logique de soumission
} catch (e) {
  ctx.message.error('Veuillez vérifier les champs du formulaire');
  ctx.exit();
}
```

### Soumettre après confirmation

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Confirmer la soumission',
  content: 'Vous ne pourrez plus modifier ceci après la soumission. Continuer ?',
  okText: 'Confirmer',
  cancelText: 'Annuler',
});
if (confirmed) {
  await ctx.form.validateFields();
  ctx.form.submit();
} else {
  ctx.exit(); // Interrompre si l'utilisateur annule
}
```

## Voir aussi

- [ctx.getValue()](./get-value.md) / [ctx.setValue()](./set-value.md) : Lire et écrire la valeur du champ actuel.
- [ctx.blockModel](./block-model.md) : Modèle de bloc parent ; `ctx.form` est équivalent à `ctx.blockModel?.form`.
- [ctx.modal](./modal.md) : Boîtes de dialogue de confirmation, souvent utilisées avec `ctx.form.validateFields()` et `ctx.form.submit()`.
- [ctx.exit()](./exit.md) : Interrompre le processus en cas d'échec de validation ou d'annulation par l'utilisateur.
- `ctx.namePath` : Le chemin (tableau) du champ actuel dans le formulaire, utilisé pour construire les noms pour `getFieldValue` / `setFieldValue` dans les champs imbriqués.