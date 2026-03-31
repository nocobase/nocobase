:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# BaseAuth

## Aperçu

`BaseAuth` hérite de la classe abstraite [Auth](./auth) et constitue l'implémentation de base pour les types d'authentification utilisateur, utilisant JWT comme méthode d'authentification. Dans la plupart des cas, vous pouvez étendre les types d'authentification utilisateur en héritant de `BaseAuth`. Il n'est généralement pas nécessaire d'hériter directement de la classe abstraite `Auth`.

```ts
class BasicAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Définit la collection d'utilisateurs
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Logique d'authentification utilisateur, appelée par `auth.signIn`
  // Retourne les données de l'utilisateur
  async validate() {
    const ctx = this.ctx;
    const { values } = ctx.action.params;
    // ...
    return user;
  }
}
```

## Méthodes de classe

### `constructor()`

Constructeur, crée une instance de `BaseAuth`.

#### Signature

- `constructor(config: AuthConfig & { userCollection: Collection })`

#### Détails

| Paramètre        | Type         | Description                                                                                             |
| :--------------- | :----------- | :------------------------------------------------------------------------------------------------------ |
| `config`         | `AuthConfig` | Voir [Auth - AuthConfig](./auth#authconfig)                                                             |
| `userCollection` | `Collection` | Collection d'utilisateurs, par exemple : `db.getCollection('users')`. Voir [DataBase - Collection](../database/collection) |

### `user()`

Accesseur, permet de définir et d'obtenir les informations utilisateur. Par défaut, il utilise l'objet `ctx.state.currentUser` pour l'accès.

#### Signature

- `set user()`
- `get user()`

### `check()`

Authentifie via le jeton de la requête et retourne les informations utilisateur.

### `signIn()`

Connexion de l'utilisateur, génère un jeton.

### `signUp()`

Inscription de l'utilisateur.

### `signOut()`

Déconnexion de l'utilisateur, fait expirer le jeton.

### `validate()` \*

Logique d'authentification principale, appelée par l'interface `signIn`, pour déterminer si l'utilisateur peut se connecter avec succès.