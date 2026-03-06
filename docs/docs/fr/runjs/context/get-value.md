:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/get-value).
:::

# ctx.getValue()

Dans les scénarios de champs modifiables tels que JSField et JSItem, utilisez cette méthode pour obtenir la valeur la plus récente du champ actuel. Associée à `ctx.setValue(v)`, elle permet une liaison bidirectionnelle avec le formulaire.

## Scénarios d'utilisation

| Scénario | Description |
|------|------|
| **JSField** | Lire la saisie de l'utilisateur ou la valeur actuelle du formulaire dans les champs personnalisés modifiables. |
| **JSItem** | Lire la valeur de la cellule actuelle dans les éléments modifiables des tableaux ou sous-tableaux. |
| **JSColumn** | Lire la valeur du champ de la ligne correspondante lors du rendu des colonnes de tableau. |

> **Remarque** : `ctx.getValue()` est uniquement disponible dans les contextes RunJS disposant d'une liaison avec un formulaire ; cette méthode n'existe pas dans les scénarios sans liaison de champ, tels que les flux de travail ou les règles de liaison.

## Définition du type

```ts
getValue<T = any>(): T | undefined;
```

- **Valeur de retour** : La valeur actuelle du champ, dont le type est déterminé par le type d'élément de formulaire du champ ; peut être `undefined` si le champ n'est pas enregistré ou n'est pas rempli.

## Ordre de récupération

`ctx.getValue()` récupère les valeurs dans l'ordre suivant :

1. **État du formulaire** : Priorité à la lecture de l'état actuel de l'Ant Design Form.
2. **Valeur de repli** : Si le champ n'est pas présent dans le formulaire, la méthode revient à la valeur initiale ou aux propriétés (props) du champ.

> Si le rendu du formulaire n'est pas encore terminé ou si le champ n'est pas enregistré, la méthode peut retourner `undefined`.

## Exemples

### Rendu basé sur la valeur actuelle

```ts
const current = ctx.getValue();
if (current == null || current === '') {
  ctx.render(<span>Veuillez d'abord saisir un contenu</span>);
} else {
  ctx.render(<span>Valeur actuelle : {current}</span>);
}
```

### Liaison bidirectionnelle avec setValue

```tsx
const { Input } = ctx.libs.antd;

// Lire la valeur actuelle comme valeur par défaut
const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

## Voir aussi

- [ctx.setValue()](./set-value.md) - Définir la valeur du champ actuel, utilisé avec `getValue` pour la liaison bidirectionnelle.
- [ctx.form](./form.md) - Instance Ant Design Form, pour lire ou écrire dans d'autres champs.
- `js-field:value-change` - Événement de conteneur déclenché lors du changement de valeurs externes, utilisé pour mettre à jour l'affichage.