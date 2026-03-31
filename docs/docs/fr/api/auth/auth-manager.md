:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# AuthManager

## Vue d'ensemble

`AuthManager` est le module de gestion de l'authentification utilisateur dans NocoBase. Il permet d'enregistrer différents types d'authentification utilisateur.

### Utilisation de base

```ts
const authManager = new AuthManager({
  // Utilisé pour récupérer l'identifiant de l'authentificateur actuel depuis l'en-tête de la requête
  authKey: 'X-Authenticator',
});

// Définit les méthodes pour AuthManager afin de stocker et récupérer les authentificateurs
authManager.setStorer({
  get: async (name: string) => {
    return db.getRepository('authenticators').find({ filter: { name } });
  },
});

// Enregistre un type d'authentification
authManager.registerTypes('basic', {
  auth: BasicAuth,
  title: 'Password',
});

// Utilise le middleware d'authentification
app.resourceManager.use(authManager.middleware());
```

### Concepts

- **Type d'authentification (`AuthType`)**: Les différentes méthodes d'authentification utilisateur, telles que : mot de passe, SMS, OIDC, SAML, etc.
- **Authentificateur (`Authenticator`)**: L'entité d'une méthode d'authentification, réellement stockée dans une collection de données. Elle correspond à un enregistrement de configuration d'un certain `AuthType`. Une méthode d'authentification peut avoir plusieurs authentificateurs, chacun correspondant à une configuration différente, offrant ainsi diverses méthodes d'authentification utilisateur.
- **Identifiant d'authentificateur (`Authenticator name`)**: L'identifiant unique d'un authentificateur, utilisé pour déterminer la méthode d'authentification à employer pour la requête actuelle.

## Méthodes de classe

### `constructor()`

Constructeur, il crée une instance de `AuthManager`.

#### Signature

- `constructor(options: AuthManagerOptions)`

#### Types

```ts
export interface JwtOptions {
  secret: string;
  expiresIn?: string;
}

export type AuthManagerOptions = {
  authKey: string;
  default?: string;
  jwt?: JwtOptions;
};
```

#### Détails

##### AuthManagerOptions

| Propriété | Type | Description | Valeur par défaut |
| --------- | --------------------------- | ------------------------------------------------------------------ | ----------------- |
| `authKey` | `string` | Optionnel, la clé dans l'en-tête de la requête qui contient l'identifiant de l'authentificateur actuel. | `X-Authenticator` |
| `default` | `string` | Optionnel, l'identifiant de l'authentificateur par défaut. | `basic` |
| `jwt` | [`JwtOptions`](#jwtoptions) | Optionnel, peut être configuré si vous utilisez JWT pour l'authentification. | - |

##### JwtOptions

| Propriété | Type | Description | Valeur par défaut |
| ----------- | -------- | -------------------------------- | ----------------- |
| `secret` | `string` | Clé secrète du token. | `X-Authenticator` |
| `expiresIn` | `string` | Optionnel, durée de validité du token. | `7d` |

### `setStorer()`

Définit les méthodes pour stocker et récupérer les données des authentificateurs.

#### Signature

- `setStorer(storer: Storer)`

#### Types

```ts
export interface Authenticator = {
  authType: string;
  options: Record<string, any>;
  [key: string]: any;
};

export interface Storer {
  get: (name: string) => Promise<Authenticator>;
}
```

#### Détails

##### Authenticator

| Propriété | Type | Description |
| ---------- | --------------------- | --------------------------------- |
| `authType` | `string` | Type d'authentification |
| `options` | `Record<string, any>` | Configuration liée à l'authentificateur |

##### Storer

`Storer` est l'interface pour le stockage des authentificateurs, elle contient une méthode.

- `get(name: string): Promise<Authenticator>` - Récupère un authentificateur par son identifiant. Dans NocoBase, le type réellement retourné est [AuthModel](/auth-verification/auth/dev/api#authmodel).

### `registerTypes()`

Enregistre un type d'authentification.

#### Signature

- `registerTypes(authType: string, authConfig: AuthConfig)`

#### Types

```ts
export type AuthExtend<T extends Auth> = new (config: Config) => T;

type AuthConfig = {
  auth: AuthExtend<Auth>; // La classe d'authentification.
  title?: string; // Le nom d'affichage du type d'authentification.
};
```

#### Détails

| Propriété | Type | Description |
| ------- | ------------------ | ----------------------------------------------------------- |
| `auth` | `AuthExtend<Auth>` | L'implémentation du type d'authentification, voir [Auth](./auth). |
| `title` | `string` | Optionnel. Le titre de ce type d'authentification affiché sur le frontend. |

### `listTypes()`

Récupère la liste des types d'authentification enregistrés.

#### Signature

- `listTypes(): { name: string; title: string }[]`

#### Détails

| Propriété | Type | Description |
| ------- | -------- | -------------------------------- |
| `name` | `string` | Identifiant du type d'authentification |
| `title` | `string` | Titre du type d'authentification |

### `get()`

Récupère un authentificateur.

#### Signature

- `get(name: string, ctx: Context)`

#### Détails

| Propriété | Type | Description |
| ------ | --------- | -------------------------------- |
| `name` | `string` | Identifiant de l'authentificateur |
| `ctx` | `Context` | Contexte de la requête |

### `middleware()`

Middleware d'authentification. Il récupère l'authentificateur actuel et effectue l'authentification de l'utilisateur.