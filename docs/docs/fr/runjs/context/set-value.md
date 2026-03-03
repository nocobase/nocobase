:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/set-value).
:::

# ctx.setValue()

Définit la valeur du champ actuel dans les scénarios de champs modifiables tels que JSField et JSItem. Combiné avec `ctx.getValue()`, il permet une liaison bidirectionnelle (two-way binding) avec le formulaire.

## Cas d'utilisation

| Scénario | Description |
|------|------|
| **JSField** | Écrire des valeurs sélectionnées par l'utilisateur ou calculées dans des champs personnalisés modifiables. |
| **JSItem** | Mettre à jour la valeur de la cellule actuelle dans les éléments modifiables des tableaux ou sous-tableaux. |
| **JSColumn** | Mettre à jour la valeur du champ de la ligne correspondante selon une logique lors du rendu des colonnes du tableau. |

> **Remarque** : `ctx.setValue(v)` est uniquement disponible dans les contextes RunJS avec liaison de formulaire. Cette méthode n'existe pas dans les scénarios sans liaison de champ, tels que les flux de travail (Workflow), les règles de liaison ou JSBlock. Il est recommandé d'utiliser le chaînage optionnel avant l'utilisation : `ctx.setValue?.(value)`.

## Définition du type

```ts
setValue<T = any>(value: T): void;
```

- **Paramètres** : `value` est la valeur du champ à écrire. Le type est déterminé par le type d'élément de formulaire du champ.

## Comportement

- `ctx.setValue(v)` met à jour la valeur du champ actuel dans le formulaire Ant Design et déclenche la logique de liaison et de validation du formulaire associée.
- Si le formulaire n'a pas fini de s'afficher ou si le champ n'est pas enregistré, l'appel peut être inefficace. Il est recommandé d'utiliser `ctx.getValue()` pour confirmer le résultat de l'écriture.

## Exemples

### Liaison bidirectionnelle avec getValue

```tsx
const { Input } = ctx.libs.antd;

const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

### Définir des valeurs par défaut selon des conditions

```ts
const status = ctx.getValue();
if (status == null || status === '') {
  ctx.setValue?.('draft');
}
```

### Réécriture dans le champ actuel lors de la liaison avec d'autres champs

```ts
// Mettre à jour de manière synchrone le champ actuel lorsqu'un autre champ change
const otherValue = ctx.form?.getFieldValue('type');
if (otherValue === 'custom') {
  ctx.setValue?.({ label: 'Personnalisé', value: 'custom' });
}
```

## Précautions

- Dans les champs non modifiables (par exemple, JSField en mode lecture seule, JSBlock), `ctx.setValue` peut être `undefined`. Il est recommandé d'utiliser `ctx.setValue?.(value)` pour éviter les erreurs.
- Lors de la définition de valeurs pour des champs d'association (M2O, O2M, etc.), vous devez passer une structure correspondant au type de champ (par exemple, `{ id, [titleField]: label }`), selon la configuration spécifique du champ.

## Articles connexes

- [ctx.getValue()](./get-value.md) - Récupère la valeur du champ actuel, utilisé avec setValue pour la liaison bidirectionnelle.
- [ctx.form](./form.md) - Instance de formulaire Ant Design, utilisée pour lire ou écrire dans d'autres champs.
- `js-field:value-change` - Un événement de conteneur déclenché lorsqu'une valeur externe change, utilisé pour mettre à jour l'affichage.