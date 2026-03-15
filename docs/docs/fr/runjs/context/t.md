:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/t).
:::

# ctx.t()

Une fonction de raccourci i18n utilisée dans RunJS pour traduire du texte en fonction des paramètres de langue du contexte actuel. Elle est adaptée à l'internationalisation des textes intégrés tels que les boutons, les titres et les messages d'alerte.

## Scénarios d'utilisation

Tous les environnements d'exécution RunJS peuvent utiliser `ctx.t()`.

## Définition du type

```ts
t(key: string, options?: Record<string, any>): string
```

## Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `key` | `string` | Clé de traduction ou modèle avec des espaces réservés (ex : `Hello {{name}}`, `{{count}} rows`). |
| `options` | `object` | Facultatif. Variables d'interpolation (ex : `{ name: 'Jean', count: 5 }`), ou options i18n (ex : `defaultValue`, `ns`). |

## Valeur de retour

- Retourne la chaîne traduite ; si aucune traduction n'existe pour la clé et qu'aucune `defaultValue` n'est fournie, elle peut retourner la clé elle-même ou la chaîne avec les variables interpolées.

## Espace de noms (ns)

L'**espace de noms par défaut pour l'environnement RunJS est `runjs`**. Lorsque `ns` n'est pas spécifié, `ctx.t(key)` recherchera la clé dans l'espace de noms `runjs`.

```ts
// Recherche par défaut la clé dans l'espace de noms 'runjs'
ctx.t('Submit'); // Équivalent à ctx.t('Submit', { ns: 'runjs' })

// Recherche la clé dans un espace de noms spécifique
ctx.t('Submit', { ns: 'myModule' });

// Recherche séquentiellement dans plusieurs espaces de noms (d'abord 'runjs', puis 'common')
ctx.t('Save', { ns: ['runjs', 'common'] });
```

## Exemples

### Clé simple

```ts
ctx.t('Submit');
ctx.t('No data');
```

### Avec variables d'interpolation

```ts
const text = ctx.t('Hello {{name}}', { name: ctx.user?.nickname || 'Guest' });
ctx.render(`<div>${text}</div>`);
```

```ts
ctx.message.success(ctx.t('Processed {{count}} rows', { count: rows.length }));
```

### Textes dynamiques (ex : temps relatif)

```ts
if (minutes < 60) return ctx.t('{{count}} minutes ago', { count: minutes });
if (hours < 24) return ctx.t('{{count}} hours ago', { count: hours });
```

### Spécifier un espace de noms

```ts
ctx.t('Hello {{name}}', { name: 'Guest', ns: 'myModule' });
```

## Précautions

- **Plugin de localisation** : Pour traduire du texte, le plugin de localisation doit être activé. Les entrées de traduction manquantes seront automatiquement extraites dans la liste de gestion de la localisation pour une maintenance et une traduction unifiées.
- Prend en charge l'interpolation de style i18next : utilisez `{{nomVariable}}` dans la clé et passez la variable correspondante dans `options` pour la remplacer.
- La langue est déterminée par le contexte actuel (ex : `ctx.i18n.language`, locale de l'utilisateur).

## Relatif

- [ctx.i18n](./i18n.md) : Lire ou changer de langue