:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Auth

## Aperçu

La classe `Auth` est principalement utilisée côté client pour accéder aux informations utilisateur et pour effectuer des requêtes vers les API liées à l'authentification de l'utilisateur.

## Propriétés d'instance

### `locale`

La langue utilisée par l'utilisateur actuel.

### `role`

Le rôle de l'utilisateur actuel.

### `token`

Le `token` de l'API.

### `authenticator`

L'authentificateur utilisé pour l'authentification de l'utilisateur actuel. Référez-vous à [Authentification de l'utilisateur](/auth-verification/auth/).

## Méthodes de classe

### `signIn()`

Connexion de l'utilisateur.

#### Signature

- `async signIn(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Détails

| Nom du paramètre | Type     | Description                                        |
| :--------------- | :------- | :------------------------------------------------- |
| `values`         | `any`    | Les paramètres de la requête pour l'API de connexion. |
| `authenticator`  | `string` | L'identifiant de l'authentificateur utilisé pour la connexion. |

### `signUp()`

Inscription de l'utilisateur.

#### Signature

- `async signUp(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Détails

| Nom du paramètre | Type     | Description                                        |
| :--------------- | :------- | :------------------------------------------------- |
| `values`         | `any`    | Les paramètres de la requête pour l'API d'inscription. |
| `authenticator`  | `string` | L'identifiant de l'authentificateur utilisé pour l'inscription. |

### `signOut()`

Déconnexion.

#### Signature

- `async signOut(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Détails

| Nom du paramètre | Type     | Description                                        |
| :--------------- | :------- | :------------------------------------------------- |
| `values`         | `any`    | Les paramètres de la requête pour l'API de déconnexion. |
| `authenticator`  | `string` | L'identifiant de l'authentificateur utilisé pour la déconnexion. |