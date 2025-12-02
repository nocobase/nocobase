:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Auth

## Vue d'ensemble

`Auth` est une classe abstraite pour les types d'authentification utilisateur. Elle définit les interfaces nécessaires pour réaliser l'authentification des utilisateurs. Pour étendre un nouveau type d'authentification utilisateur, vous devez hériter de la classe `Auth` et implémenter ses méthodes. Pour une implémentation de base, veuillez consulter : [BaseAuth](./base-auth.md).

```ts
interface IAuth {
  user: Model;
  // Vérifie l'état de l'authentification et renvoie l'utilisateur actuel.
  check(): Promise<Model>;
  signIn(): Promise<any>;
  signUp(): Promise<any>;
  signOut(): Promise<any>;
}

export abstract class Auth implements IAuth {
  abstract user: Model;
  abstract check(): Promise<Model>;
  // ...
}

class CustomAuth extends Auth {
  // check : authentification
  async check() {
    // ...
  }
}
```

## Propriétés d'instance

### `user`

Informations de l'utilisateur authentifié.

#### Signature

- `abstract user: Model`

## Méthodes de classe

### `constructor()`

Ce constructeur crée une instance `Auth`.

#### Signature

- `constructor(config: AuthConfig)`

#### Type

```ts
export type AuthConfig = {
  authenticator: Authenticator;
  options: {
    [key: string]: any;
  };
  ctx: Context;
};
```

#### Détails

##### AuthConfig

| Propriété       | Type                                            | Description                                                                                                   |
| --------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `authenticator` | [`Authenticator`](./auth-manager#authenticator) | Modèle de données de l'authentificateur. Le type réel dans une application NocoBase est [AuthModel](/auth-verification/auth/dev/api#authmodel). |
| `options`       | `Record<string, any>`                           | Configuration liée à l'authentificateur.                                                                          |
| `ctx`           | `Context`                                       | Contexte de la requête.                                                                                       |

### `check()`

Authentification de l'utilisateur. Elle renvoie les informations de l'utilisateur. C'est une méthode abstraite que tous les types d'authentification doivent implémenter.

#### Signature

- `abstract check(): Promise<Model>`

### `signIn()`

Connexion de l'utilisateur.

#### Signature

- `signIn(): Promise<any>`

### `signUp()`

Inscription de l'utilisateur.

#### Signature

- `signUp(): Promise<any>`

### `signOut()`

Déconnexion de l'utilisateur.

#### Signature

- `signOut(): Promise<any>`