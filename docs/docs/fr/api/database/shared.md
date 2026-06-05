:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

**Paramètres**

| Nom du paramètre       | Type          | Valeur par défaut | Description                                                                 |
| ---------------------- | ------------- | ----------------- | --------------------------------------------------------------------------- |
| `options.values`       | `M`           | `{}`              | L'objet de données à insérer.                                               |
| `options.whitelist?`   | `string[]`    | -                 | Liste blanche des champs pour `values`. Seuls les champs figurant dans cette liste seront stockés. |
| `options.blacklist?`   | `string[]`    | -                 | Liste noire des champs pour `values`. Les champs figurant dans cette liste ne seront pas stockés.   |
| `options.transaction?` | `Transaction` | -                 | Transaction                                                                 |